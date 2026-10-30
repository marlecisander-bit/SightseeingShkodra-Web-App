begin;
-- A product is an offer; its inventory source owns the only dated departures.
alter table public.products add column inventory_product_id uuid;
alter table public.products add constraint product_inventory_tenant foreign key(operator_id,inventory_product_id) references public.products(operator_id,id);
alter table public.products add constraint product_inventory_not_self check(inventory_product_id is distinct from id);
alter table public.products add column seat_reservation_mode text not null default 'selected_departure' check(seat_reservation_mode in ('selected_departure','whole_day'));
alter table public.products add column reservation_minutes integer not null default 120 check(reservation_minutes between 1 and 1440);
alter table public.inventory_holds add column product_id uuid;
alter table public.inventory_holds add constraint hold_product_tenant foreign key(operator_id,product_id) references public.products(operator_id,id);
alter table public.inventory_holds add column reservation_snapshot jsonb;
alter table public.booking_items add column reservation_snapshot jsonb;
-- The purchased offer and physical inventory owner are distinct, each tenant constrained.
alter table public.booking_items add column inventory_product_id uuid;
update public.booking_items i set inventory_product_id=d.product_id from public.departures d where d.id=i.departure_id;
alter table public.booking_items drop constraint booking_items_operator_id_product_id_departure_id_fkey;
alter table public.booking_items add constraint booking_items_inventory_required check(departure_id is null or inventory_product_id is not null);
alter table public.booking_items add constraint booking_items_inventory_departure_tenant foreign key(operator_id,inventory_product_id,departure_id) references public.departures(operator_id,product_id,id);

update public.inventory_holds h set product_id=d.product_id from public.departures d where d.id=h.departure_id;
alter table public.inventory_holds alter column product_id set not null;
create index holds_shared_resource_idx on public.inventory_holds(operator_id,((reservation_snapshot->>'resource'))) where status='active';
create index items_shared_resource_idx on public.booking_items(operator_id,((reservation_snapshot->>'resource'))) where status='confirmed';

create function public.inventory_product_v1(p_product uuid) returns uuid language sql stable set search_path='' as $$
 select coalesce(inventory_product_id,id) from public.products where id=p_product;
$$;
-- Coarse operator lock deliberately precedes departure/hold/order locks in every mutation RPC.
-- This small-van workload favors simple deadlock-free serialization over parallel allocators.
create function public.lock_seat_inventory_v1(p_operator uuid) returns void language sql volatile set search_path='' as $$
 select pg_advisory_xact_lock(hashtextextended('seat-inventory:'||p_operator::text,0));
$$;
create function public.reservation_window_v1(p_product uuid,p_departure uuid,p_previous jsonb default null) returns jsonb language plpgsql stable set search_path='' as $$
declare p public.products;d public.departures;zone text;mode text;minutes integer;starts timestamptz;ends timestamptz;
begin
 select * into strict p from public.products where id=p_product;
 select * into strict d from public.departures where id=p_departure and operator_id=p.operator_id;
 if public.inventory_product_v1(p.id)<>d.product_id then raise exception 'Product does not use this inventory' using errcode='P0002';end if;
 select timezone into zone from public.operators where id=p.operator_id;
 mode:=coalesce(p_previous->>'mode',p.seat_reservation_mode);minutes:=coalesce((p_previous->>'minutes')::integer,p.reservation_minutes);
 if mode='whole_day' then
  if d.vehicle_id is null or exists(select 1 from public.departures other where other.product_id=d.product_id and other.service_date=d.service_date and other.status='scheduled' and other.vehicle_id is distinct from d.vehicle_id) then raise exception 'All-day reservation requires one consistent vehicle for the service date' using errcode='22023';end if;
  starts:=d.service_date::timestamp at time zone zone;ends:=(d.service_date+1)::timestamp at time zone zone;
 else
  starts:=(d.service_date+d.start_time) at time zone zone;ends:=starts+make_interval(mins=>minutes);
 end if;
 return jsonb_build_object('version',1,'mode',mode,'minutes',minutes,'resource',coalesce(d.vehicle_id,d.id),'start',starts,'end',ends);
end $$;
-- Backfill snapshots once; later policy changes never reinterpret existing reservations.
update public.inventory_holds set reservation_snapshot=public.reservation_window_v1(product_id,departure_id);
update public.booking_items set reservation_snapshot=public.reservation_window_v1(product_id,departure_id) where departure_id is not null;

create function public.seat_usage_v1(p_operator uuid,p_window jsonb,p_exclude_hold uuid default null,p_exclude_item uuid default null)
returns table(committed bigint,held bigint) language sql volatile set search_path='' as $$
 with allocations as (
  select reservation_snapshot w,occupied_seats n,true confirmed from public.booking_items
   where operator_id=p_operator and status='confirmed' and id is distinct from p_exclude_item
  union all
  select reservation_snapshot,occupied_seats,false from public.inventory_holds
   where operator_id=p_operator and status='active' and expires_at>clock_timestamp() and id is distinct from p_exclude_hold
 ), relevant as (
  select * from allocations where w->>'resource'=p_window->>'resource'
   and (w->>'start')::timestamptz<(p_window->>'end')::timestamptz and (w->>'end')::timestamptz>(p_window->>'start')::timestamptz
 ), points as (
  select (p_window->>'start')::timestamptz at_time union select greatest((w->>'start')::timestamptz,(p_window->>'start')::timestamptz) from relevant
 ), usage as (
  select coalesce(sum(n) filter(where confirmed),0)::bigint c,coalesce(sum(n) filter(where not confirmed),0)::bigint h
  from points left join relevant on (w->>'start')::timestamptz<=at_time and (w->>'end')::timestamptz>at_time group by at_time
 ) select c,h from usage order by c+h desc,c desc limit 1;
$$;
create function public.guard_reservation_snapshot_v1() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_table_name='booking_items' then
  select product_id into new.inventory_product_id from public.departures where id=new.departure_id and operator_id=new.operator_id;
  if not found and new.departure_id is not null then raise exception 'Departure tenant mismatch' using errcode='23503';end if;
  if new.departure_id is null then return new;end if;
 end if;
 if tg_op='UPDATE' and (new.departure_id is distinct from old.departure_id or new.quantity<>old.quantity or new.reservation_snapshot is distinct from old.reservation_snapshot or new.product_id is distinct from old.product_id) then
  if tg_table_name<>'booking_items' or coalesce(current_setting('app.booking_modification',true),'')<>'on' or new.product_id<>old.product_id then raise exception 'Reservation snapshot is immutable' using errcode='23514';end if;
  new.reservation_snapshot:=public.reservation_window_v1(new.product_id,new.departure_id,old.reservation_snapshot);
 elsif tg_op='INSERT' then
  if tg_table_name='inventory_holds' and new.product_id is null then select product_id into new.product_id from public.departures where id=new.departure_id;end if;
  if not exists(select 1 from public.products p join public.departures d on d.operator_id=p.operator_id and d.product_id=coalesce(p.inventory_product_id,p.id) where p.id=new.product_id and p.operator_id=new.operator_id and d.id=new.departure_id) then raise exception 'Product and departure inventory mismatch' using errcode='23503';end if;
  if new.reservation_snapshot is null then new.reservation_snapshot:=public.reservation_window_v1(new.product_id,new.departure_id);end if;
 end if;
 return new;
end $$;
create trigger reservation_snapshot_guard before insert or update on public.inventory_holds for each row execute function public.guard_reservation_snapshot_v1();
create trigger reservation_snapshot_guard before insert or update on public.booking_items for each row execute function public.guard_reservation_snapshot_v1();

-- Evaluate peak occupancy in each physical slot intersecting the requested reservation.
-- Non-overlapping morning/afternoon allocations must not be summed for an all-day ticket.
create function public.shared_capacity_v1(p_operator uuid,p_window jsonb,p_exclude_hold uuid default null,p_exclude_item uuid default null)
returns table(capacity integer,committed bigint,held bigint) language plpgsql volatile set search_path='' as $$
declare d record;u record;w jsonb;best bigint:=null;remaining bigint;begin
 for d in select * from public.departures where operator_id=p_operator and coalesce(vehicle_id,id)::text=p_window->>'resource' and service_date between (((p_window->>'start')::timestamptz at time zone (select timezone from public.operators where id=p_operator))::date-1) and (((p_window->>'end')::timestamptz at time zone (select timezone from public.operators where id=p_operator))::date) and (status='scheduled' or exists(select 1 from public.booking_items where departure_id=departures.id and status='confirmed')) loop
  w:=public.reservation_window_v1(d.product_id,d.id,'{"mode":"selected_departure"}');
  if (w->>'start')::timestamptz<(p_window->>'end')::timestamptz and (w->>'end')::timestamptz>(p_window->>'start')::timestamptz then
   w:=w||jsonb_build_object('start',greatest((w->>'start')::timestamptz,(p_window->>'start')::timestamptz),'end',least((w->>'end')::timestamptz,(p_window->>'end')::timestamptz));
   select * into u from public.seat_usage_v1(p_operator,w,p_exclude_hold,p_exclude_item);
   remaining:=d.capacity-u.committed-u.held;
   if best is null or remaining<best then best:=remaining;capacity:=d.capacity;committed:=u.committed;held:=u.held;end if;
  end if;
 end loop;
 if best is null then capacity:=0;committed:=0;held:=0;end if;
 return next;
end $$;
create function public.assert_seat_capacity_v1(p_operator uuid,p_window jsonb) returns void language plpgsql set search_path='' as $$
declare u record;begin
 select * into u from public.shared_capacity_v1(p_operator,p_window);
 if u.committed+u.held>u.capacity then raise exception 'Insufficient shared van capacity' using errcode='P0001';end if;
end $$;
create function public.guard_shared_seats_v1() returns trigger language plpgsql set search_path='' as $$
begin
 if (tg_table_name='inventory_holds' and new.status='active') or (tg_table_name='booking_items' and new.status='confirmed') then
  perform public.lock_seat_inventory_v1(new.operator_id);
  perform public.assert_seat_capacity_v1(new.operator_id,new.reservation_snapshot);
 end if;
 return new;
end $$;
create trigger shared_seats_guard after insert or update on public.inventory_holds for each row execute function public.guard_shared_seats_v1();
create trigger shared_seats_guard after insert or update on public.booking_items for each row execute function public.guard_shared_seats_v1();

-- Product-specific pricing over the existing inventory allocator, never another engine.
do $$ declare def text;begin
 select pg_get_functiondef('public.create_passenger_hold_v1(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure) into def;
 def:=replace(def,'create_passenger_hold_v1(p_operator_id uuid, p_departure_id uuid, p_session_key text, p_request_id uuid, p_quantity integer, p_counts jsonb)','create_product_hold_v1(p_operator_id uuid, p_departure_id uuid, p_session_key text, p_request_id uuid, p_quantity integer, p_counts jsonb, p_product uuid)');
 def:=replace(def,'if h.departure_id <> p_departure_id','if h.product_id <> p_product or h.departure_id <> p_departure_id');
 def:=replace(def,'snapshot:=public.passenger_quote_v1(d.product_id,d.service_date,d.start_time,p_counts);',
 'if not exists(select 1 from public.products p where p.id=p_product and p.operator_id=p_operator_id and p.status=''published'' and p.type=''van_tour'' and public.inventory_product_v1(p.id)=d.product_id) then raise exception ''Product unavailable'' using errcode=''P0002'';end if;
 snapshot:=public.passenger_quote_v1(p_product,d.service_date,d.start_time,p_counts);');
 def:=replace(def,'quantity,created_at,expires_at,passenger_snapshot)','quantity,created_at,expires_at,passenger_snapshot,product_id)');
 def:=replace(def,'departure_instant),snapshot)','departure_instant),snapshot,p_product)');
 if position('create_product_hold_v1' in def)=0 then raise exception 'Hold signature drift';end if;
 execute def;
end $$;
create or replace function public.create_passenger_hold_v1(p_operator_id uuid,p_departure_id uuid,p_session_key text,p_request_id uuid,p_quantity integer,p_counts jsonb)
returns public.inventory_holds language plpgsql set search_path='' as $$
declare product uuid;begin
 select product_id into product from public.departures where id=p_departure_id and operator_id=p_operator_id;
 return public.create_product_hold_v1(p_operator_id,p_departure_id,p_session_key,p_request_id,p_quantity,p_counts,product);
end $$;
-- Preserve the original pending-order/confirmation/event implementation; select the held offer.
do $$ declare def text;f record;begin
 select pg_get_functiondef('public.create_pending_order_v1(uuid,uuid,text,text,text,text)'::regprocedure) into def;
 def:=replace(def,'''passengerSnapshot'',i.passenger_snapshot','''reservationSnapshot'',i.reservation_snapshot-''resource'',''passengerSnapshot'',i.passenger_snapshot');
 def:=replace(def,'id=d.product_id for share','id=h.product_id for share');
 def:=replace(def,'total_price,passenger_snapshot)','total_price,passenger_snapshot,reservation_snapshot)');
 def:=replace(def,'price,total_amount,h.passenger_snapshot)','price,total_amount,h.passenger_snapshot,h.reservation_snapshot)');
 execute def;
 for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname in ('create_meeting_point_booking_v1','confirm_booking_v1') loop
  select pg_get_functiondef(f.oid) into def;
  def:=replace(def,'item.product_id<>d.product_id','item.product_id<>h.product_id');
  def:=replace(def,'''passengerSnapshot'',i.passenger_snapshot','''reservationSnapshot'',i.reservation_snapshot-''resource'',''passengerSnapshot'',i.passenger_snapshot');
  execute def;
 end loop;
end $$;

do $$ declare def text;begin
 select pg_get_functiondef('public.create_staff_passenger_booking_v1(uuid,uuid,uuid,uuid,integer,text,text,text,jsonb)'::regprocedure) into def;
 def:=replace(def,'create_staff_passenger_booking_v1(p_operator_id uuid, p_actor_id uuid, p_departure_id uuid, p_request_id uuid, p_quantity integer, p_name text, p_email text, p_phone text, p_counts jsonb)','create_staff_product_booking_v1(p_operator_id uuid, p_actor_id uuid, p_departure_id uuid, p_request_id uuid, p_quantity integer, p_name text, p_email text, p_phone text, p_counts jsonb, p_product uuid)');
 def:=replace(def,'public.create_passenger_hold_v1(p_operator_id,p_departure_id,session_key,p_request_id,p_quantity,p_counts)','public.create_product_hold_v1(p_operator_id,p_departure_id,session_key,p_request_id,p_quantity,p_counts,p_product)');
 if position('create_staff_product_booking_v1' in def)=0 then raise exception 'Staff signature drift';end if;
 execute def;
end $$;
revoke all on function public.create_staff_product_booking_v1(uuid,uuid,uuid,uuid,integer,text,text,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.create_staff_product_booking_v1(uuid,uuid,uuid,uuid,integer,text,text,text,jsonb,uuid) to service_role;

-- The legacy dated/read API projects the same occupancy instead of retaining an alternate count.
alter function public.read_dated_availability_v1(uuid,uuid,date) rename to read_legacy_dated_availability_v1;
create function public.read_dated_availability_v1(p_operator_id uuid,p_product_id uuid,p_date date) returns jsonb language plpgsql set search_path='' as $$
declare p public.products;snapshot jsonb;deps jsonb:='[]';d jsonb;u record;begin
 select * into p from public.products where operator_id=p_operator_id and id=p_product_id and status='published' and type='van_tour' and capacity_rules='{"version":1,"model":"departure_seats"}';
 if not found then return null;end if;
 snapshot:=public.read_legacy_dated_availability_v1(p_operator_id,public.inventory_product_v1(p.id),p_date);
 if snapshot is null then return null;end if;
 for d in select value from jsonb_array_elements(snapshot->'departures') loop
  select * into u from public.shared_capacity_v1(p_operator_id,public.reservation_window_v1(p.id,(d->>'id')::uuid));
  deps:=deps||jsonb_build_array(d||jsonb_build_object('capacity',u.capacity,'committed',u.committed,'held',u.held));
 end loop;
 return snapshot||jsonb_build_object('product_id',p.id,'pricing_rules',p.pricing_rules,'departures',deps);
end $$;
do $$ declare def text;begin
 select pg_get_functiondef('public.read_availability_v1(uuid,uuid,date)'::regprocedure) into def;
 execute replace(def,'ensure_schedule_date_v1(p_operator_id,p_product_id,p_date)','ensure_schedule_date_v1(p_operator_id,public.inventory_product_v1(p_product_id),p_date)');
end $$;
revoke all on function public.read_dated_availability_v1(uuid,uuid,date) from public,anon,authenticated;
grant execute on function public.read_dated_availability_v1(uuid,uuid,date) to service_role;

-- Existing read projection retains cutoff/date guidance, now with shared occupancy and offer pricing.
alter function public.read_passenger_availability_v1(uuid,uuid,date,jsonb) rename to read_legacy_passenger_availability_v1;
create function public.read_passenger_availability_v1(p_operator uuid,p_product uuid,p_date date,p_counts jsonb) returns jsonb language plpgsql set search_path='' as $$
declare p public.products;snapshot jsonb;deps jsonb:='[]';d jsonb;w jsonb;u record;begin
 perform public.validate_passengers_v1(p_counts);
 select * into p from public.products where operator_id=p_operator and id=p_product and status='published' and type='van_tour';
 if not found then return null;end if;
 snapshot:=public.read_availability_v1(p_operator,public.inventory_product_v1(p_product),p_date);
 if snapshot is null then return null;end if;
 for d in select value from jsonb_array_elements(snapshot->'departures') loop
  w:=public.reservation_window_v1(p_product,(d->>'id')::uuid);
  select * into u from public.shared_capacity_v1(p_operator,w);
  deps:=deps||jsonb_build_array(d||jsonb_build_object('capacity',u.capacity,'committed',u.committed,'held',u.held,'passenger_quote',public.passenger_quote_v1(p_product,p_date,(d->>'start_time')::time,p_counts),'reservation',w));
 end loop;
 return snapshot||jsonb_build_object('product_id',p.id,'pricing_rules',p.pricing_rules,'departures',deps,'categories',public.passenger_categories_v1(p.id),'business_date',(clock_timestamp() at time zone 'Europe/Tirane')::date,'next_operational_date',case when jsonb_array_length(deps)=0 then public.next_operational_date_v1(p_operator,public.inventory_product_v1(p_product),greatest(p_date,(clock_timestamp() at time zone 'Europe/Tirane')::date)) else null end);
end $$;
-- A linked offer uses its own standard prices and the source schedule's dated price layers only
-- when it owns that schedule; shared timing never silently copies another product's fare.

-- Modifications preserve the original policy snapshot; availability excludes the full original allocation.
do $$ declare def text;begin
 select pg_get_functiondef('public.modify_customer_booking_v1(text,integer,uuid,jsonb,bigint,uuid)'::regprocedure) into def;
 def:=replace(def,'and product_id=i.product_id and status=', 'and product_id=public.inventory_product_v1(i.product_id) and status=');
 execute def;
end $$;
create or replace function public.customer_booking_availability_v1(p_token text,p_date date,p_counts jsonb) returns jsonb language plpgsql set search_path='' as $$
declare b public.bookings;i public.booking_items;p public.products;snapshot jsonb;deps jsonb:='[]';d jsonb;u record;begin
 perform public.customer_booking_v1(p_token);perform public.validate_passengers_v1(p_counts);
 select * into b from public.bookings where management_token=p_token;
 select * into i from public.booking_items where order_id=b.order_id;
 select * into p from public.products where id=i.product_id and operator_id=b.operator_id and status='published';
 if not found then return null;end if;
 perform public.ensure_schedule_date_v1(b.operator_id,i.inventory_product_id,p_date);
 -- Read dated slots without interpreting the product's *current* reservation policy.
 -- An existing selected-trip booking must remain modifiable after future sales switch to whole-day.
 snapshot:=public.read_legacy_dated_availability_v1(b.operator_id,i.inventory_product_id,p_date);
 if snapshot is null then return null;end if;
 for d in select value from jsonb_array_elements(snapshot->'departures') loop
  select * into u from public.shared_capacity_v1(b.operator_id,public.reservation_window_v1(i.product_id,(d->>'id')::uuid,i.reservation_snapshot),null,i.id);
  deps:=deps||jsonb_build_array(d||jsonb_build_object('capacity',u.capacity,'committed',u.committed,'held',u.held,'passenger_quote',public.passenger_quote_v1(i.product_id,p_date,(d->>'start_time')::time,p_counts)));
 end loop;
 return snapshot||jsonb_build_object('product_id',i.product_id,'pricing_rules',p.pricing_rules,'departures',deps,'categories',public.passenger_categories_v1(i.product_id),'business_date',(clock_timestamp() at time zone 'Europe/Tirane')::date,'next_operational_date',case when jsonb_array_length(deps)=0 then public.next_operational_date_v1(b.operator_id,i.inventory_product_id,greatest(p_date,(clock_timestamp() at time zone 'Europe/Tirane')::date)) else null end);
end $$;

-- Reuse shared occupancy in the operational calendar, including newly added unmaterialized slots.
do $$ declare def text;begin
 select pg_get_functiondef('public.read_operations_calendar_v1(uuid,uuid,uuid,date)'::regprocedure) into def;
 def:=replace(def,'select x.start_time,x.capacity,true as open','select x.start_time,x.capacity,x.vehicle_id,true as open');
 def:=replace(def,'select x.start_time,x.capacity,false','select x.start_time,x.capacity,x.vehicle_id,false');
 def:=replace(def,'select coalesce(sum(occupied_seats),0) into committed from public.booking_items where departure_id=d.id and status=''confirmed'';','select u.committed,u.held into committed,held from public.seat_usage_v1(p_operator,jsonb_build_object(''resource'',coalesce(t.vehicle_id,d.id),''start'',(dt+t.start_time) at time zone (select timezone from public.operators where id=p_operator),''end'',((dt+t.start_time) at time zone (select timezone from public.operators where id=p_operator))+make_interval(mins=>(select reservation_minutes from public.products where id=s.product_id)))) u;');
 def:=replace(def,'select coalesce(sum(occupied_seats),0) into held from public.inventory_holds where departure_id=d.id and status=''active'' and expires_at>clock_timestamp();','');
 execute def;
end $$;

do $$ declare def text;begin
 select pg_get_functiondef('public.customer_booking_v1(text)'::regprocedure) into def;
 execute replace(def,'''occupiedSeats'',i.occupied_seats','''reservationSnapshot'',i.reservation_snapshot-''resource'',''occupiedSeats'',i.occupied_seats');
end $$;
-- Safe inventory edits cannot move existing reservations to a different van/time.
create function public.guard_departure_reservations_v1() returns trigger language plpgsql set search_path='' as $$
declare w jsonb;u record;begin
 if tg_op='UPDATE' and (new.vehicle_id is distinct from old.vehicle_id or new.service_date<>old.service_date or new.start_time<>old.start_time) and
  (exists(select 1 from public.booking_items where departure_id=old.id and status='confirmed') or exists(select 1 from public.inventory_holds where departure_id=old.id and status='active' and expires_at>clock_timestamp())) then
  raise exception 'Existing reservations prevent moving this departure' using errcode='PT422';
 end if;
 if new.status='scheduled' and (exists(select 1 from public.inventory_holds where operator_id=new.operator_id and status='active' and expires_at>clock_timestamp() and reservation_snapshot->>'mode'='whole_day' and (reservation_snapshot->>'start')::timestamptz<=public.booking_cutoff_v1(new.service_date,new.start_time)+interval '15 minutes' and (reservation_snapshot->>'end')::timestamptz>public.booking_cutoff_v1(new.service_date,new.start_time)+interval '15 minutes' and public.inventory_product_v1(product_id)=new.product_id and reservation_snapshot->>'resource' is distinct from new.vehicle_id::text) or exists(select 1 from public.booking_items where operator_id=new.operator_id and status='confirmed' and reservation_snapshot->>'mode'='whole_day' and (reservation_snapshot->>'start')::timestamptz<=public.booking_cutoff_v1(new.service_date,new.start_time)+interval '15 minutes' and (reservation_snapshot->>'end')::timestamptz>public.booking_cutoff_v1(new.service_date,new.start_time)+interval '15 minutes' and inventory_product_id=new.product_id and reservation_snapshot->>'resource' is distinct from new.vehicle_id::text)) then raise exception 'All-day reservations require preserving the service vehicle' using errcode='PT422';end if;
 w:=public.reservation_window_v1(new.product_id,new.id,'{"mode":"selected_departure"}');
 if w is not null and (new.status='scheduled' or exists(select 1 from public.booking_items where departure_id=new.id and status='confirmed') or exists(select 1 from public.inventory_holds where departure_id=new.id and status='active' and expires_at>clock_timestamp())) then select * into u from public.seat_usage_v1(new.operator_id,w);if u.committed+u.held>new.capacity then raise exception 'Capacity below shared reservations' using errcode='PT422';end if;end if;
 return new;
end $$;
create trigger departure_reservations_guard after insert or update on public.departures for each row execute function public.guard_departure_reservations_v1();

-- Closing/reducing a shared slot must see reservations anchored to other departures too.
do $$ declare f record;def text;begin
 for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname in ('save_dated_departure_v1','save_calendar_override_v1','reconcile_service_schedule_v1','save_schedule_exception_v1') loop
  select pg_get_functiondef(f.oid) into def;
  def:=regexp_replace(def,'select \(select coalesce\(sum\(occupied_seats\),0\) from public.booking_items[^;]+into used;',
   'select u.committed+u.held into used from public.seat_usage_v1(d.operator_id,public.reservation_window_v1(d.product_id,d.id,''{"mode":"selected_departure"}'')) u;','gi');
  execute def;
 end loop;
end $$;

-- Serialize *before* existing locks, including reads that lazily materialize dated slots.
do $$ declare f record;def text;param text;begin
 for f in select oid,proargnames from pg_proc where pronamespace='public'::regnamespace and prokind='f' and prolang=(select oid from pg_language where lanname='plpgsql')
  and proname in ('create_product_hold_v1','create_pending_order_v1','create_meeting_point_booking_v1','confirm_booking_v1','prepare_booking_v1','manage_hold_v1','expire_holds_v1','cancel_order_v1','save_dated_departure_v1','save_departure_v1','save_service_schedule_v1','save_schedule_exception_v1','ensure_schedule_date_v1','save_calendar_override_v1','save_passenger_pricing_v1','read_availability_v1') loop
  select pg_get_functiondef(f.oid) into def;
  param:=case when 'p_operator_id'=any(f.proargnames) then 'p_operator_id' else 'p_operator' end;
  def:=regexp_replace(def,'\mbegin\M','begin perform public.lock_seat_inventory_v1('||param||');','i');execute def;
 end loop;
 -- Token-scoped changes derive the operator before acquiring any row lock.
 select pg_get_functiondef('public.modify_customer_booking_v1(text,integer,uuid,jsonb,bigint,uuid)'::regprocedure) into def;
 def:=regexp_replace(def,'\mbegin\M','begin perform public.lock_seat_inventory_v1((select operator_id from public.bookings where management_token=p_token));','i');execute def;
end $$;

-- Admin config: one-level inventory links only, no duplicate schedules or hidden cross-tenant resources.
create function public.save_product_booking_v1(p_operator uuid,p_actor uuid,p_product uuid,p_source uuid,p_mode text,p_minutes integer,p_stamp timestamptz) returns void language plpgsql set search_path='' as $$
declare p public.products;begin
 if not exists(select 1 from public.staff_profiles where operator_id=p_operator and id=p_actor and is_active and role in ('owner','admin')) then raise exception 'Permission required' using errcode='42501';end if;
 perform public.lock_seat_inventory_v1(p_operator);
 select * into p from public.products where operator_id=p_operator and id=p_product for update;
 if not found or p.type<>'van_tour' then raise exception 'Van product required' using errcode='22023';end if;
 if p.updated_at is distinct from p_stamp then raise exception 'Product changed' using errcode='PT409';end if;
 if p_mode is null or p_mode not in ('selected_departure','whole_day') or p_minutes is null or p_minutes not between 1 and 1440 then raise exception 'Invalid reservation policy' using errcode='22023';end if;
 if p_source is not null and (p_source=p_product or not exists(select 1 from public.products source join public.service_schedules s on s.product_id=source.id where source.operator_id=p_operator and source.id=p_source and source.type='van_tour' and source.inventory_product_id is null and s.vehicle_id is not null) or exists(select 1 from public.service_schedules where product_id=p_product) or exists(select 1 from public.products where inventory_product_id=p_product)) then raise exception 'Choose an existing vehicle schedule; linked products cannot own schedules or inventory links' using errcode='22023';end if;
 if p_source is distinct from p.inventory_product_id and (exists(select 1 from public.booking_items where product_id=p_product and status='confirmed') or exists(select 1 from public.inventory_holds where product_id=p_product and status='active' and expires_at>clock_timestamp())) then raise exception 'Existing reservations prevent inventory relinking' using errcode='PT422';end if;
 if p_mode='whole_day' and not exists(select 1 from public.service_schedules where product_id=coalesce(p_source,p_product) and vehicle_id is not null) then raise exception 'All-day reservations require a vehicle schedule' using errcode='22023';end if;
 update public.products set inventory_product_id=p_source,seat_reservation_mode=p_mode,reservation_minutes=p_minutes,capacity_rules='{"version":1,"model":"departure_seats"}' where id=p_product;
 perform public.record_domain_activity(p_operator,p_actor,'product-booking:'||gen_random_uuid()::text,'product',p_product,'product.booking_changed',jsonb_build_object('productId',p_product),'product.booking_changed',jsonb_build_object('previousSource',p.inventory_product_id,'source',p_source,'previousMode',p.seat_reservation_mode,'mode',p_mode,'minutes',p_minutes));
end $$;
-- Prevent a second inventory being created for an offer through older clients.
create function public.guard_linked_product_schedule_v1() returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select 1 from public.products where id=new.product_id and inventory_product_id is not null) then raise exception 'Use the linked inventory schedule' using errcode='22023';end if;return new;
end $$;
create trigger linked_product_schedule_guard before insert or update on public.service_schedules for each row execute function public.guard_linked_product_schedule_v1();

-- Public directory exposes only published offers under the fixed server operator binding.
create function public.read_public_products_v1(p_operator uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'slug',p.slug,'mode',p.seat_reservation_mode,'minutes',p.reservation_minutes) order by p.title,p.id),'[]') from public.products p
 where p.operator_id=p_operator and p.status='published' and p.type='van_tour' and p.capacity_rules='{"version":1,"model":"departure_seats"}' and exists(select 1 from public.products source where source.id=coalesce(p.inventory_product_id,p.id) and source.operator_id=p_operator and source.status='published' and source.type='van_tour' and source.capacity_rules='{"version":1,"model":"departure_seats"}') and (exists(select 1 from public.service_schedules where product_id=coalesce(p.inventory_product_id,p.id) and status='active') or exists(select 1 from public.departures where operator_id=p_operator and product_id=coalesce(p.inventory_product_id,p.id) and status='scheduled' and public.booking_cutoff_v1(service_date,start_time)>statement_timestamp()));
$$;
-- Every new helper is service-only, matching the existing booking API boundary.
do $$ declare f record;begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in ('inventory_product_v1','lock_seat_inventory_v1','reservation_window_v1','seat_usage_v1','shared_capacity_v1','guard_reservation_snapshot_v1','assert_seat_capacity_v1','guard_shared_seats_v1','create_product_hold_v1','read_passenger_availability_v1','guard_departure_reservations_v1','save_product_booking_v1','guard_linked_product_schedule_v1','read_public_products_v1') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;

-- Editorial presentation has one Website owner; draft edits do not immediately alter public cards.
alter table public.products add column card_draft jsonb not null default '{}';
alter table public.products add column card_published jsonb;
create function public.save_product_card_v1(p_operator uuid,p_actor uuid,p_product uuid,p_stamp timestamptz,p_card jsonb,p_publish boolean default false) returns void language plpgsql set search_path='' as $$
declare p public.products;role text;begin
 select s.role into role from public.staff_profiles s where s.operator_id=p_operator and s.id=p_actor and s.is_active;
 if role is null or role not in ('owner','admin','content_editor') or (p_publish and role='content_editor') then raise exception 'Content permission required' using errcode='42501';end if;
 if p_card is null or jsonb_typeof(p_card)<>'object' or not (p_card ?& array['description','image','alt','enabled','order']) or jsonb_typeof(p_card->'description') is distinct from 'string' or jsonb_typeof(p_card->'image') is distinct from 'string' or jsonb_typeof(p_card->'alt') is distinct from 'string' or jsonb_typeof(p_card->'order') is distinct from 'number' or p_card-array['description','image','alt','enabled','order']<>'{}' or length(coalesce(p_card->>'description',''))>700 or length(coalesce(p_card->>'alt',''))>200 or jsonb_typeof(p_card->'enabled') is distinct from 'boolean' or coalesce(p_card->>'order','')!~ '^[0-9]{1,5}$' then raise exception 'Invalid product card' using errcode='22023';end if;
 if nullif(p_card->>'image','') is not null and (length(p_card->>'image')>2000 or (p_card->>'image' !~ '^/images/[a-zA-Z0-9/_-]+\.(webp|png|jpg|jpeg|avif)$' and p_card->>'image' !~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/website-media/'||p_operator::text||'/[a-f0-9-]+\.(webp|png|jpg|avif)$'))) then raise exception 'Invalid image' using errcode='22023';end if;
 if (p_card->>'enabled')::boolean and (nullif(btrim(p_card->>'image'),'') is null or nullif(btrim(p_card->>'alt'),'') is null) then raise exception 'Image and alternative text required to show a card' using errcode='22023';end if;
 select * into p from public.products where id=p_product and operator_id=p_operator for update;
 if not found then raise exception 'Product unavailable' using errcode='P0002';end if;
 if p.updated_at is distinct from p_stamp then raise exception 'Product changed; reload before saving' using errcode='PT409';end if;
 update public.products set card_draft=p_card,card_published=case when p_publish then p_card else card_published end where id=p_product;
 perform public.record_domain_activity(p_operator,p_actor,'product-card:'||gen_random_uuid()::text,'product',p_product,'product.card_saved',jsonb_build_object('productId',p_product),'product.card_saved',jsonb_build_object('published',p_publish));
end $$;
create or replace function public.read_public_products_v1(p_operator uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'slug',p.slug,'mode',p.seat_reservation_mode,'minutes',p.reservation_minutes,'card',p.card_published) order by coalesce((p.card_published->>'order')::integer,0),p.title,p.id),'[]') from public.products p
 where p.operator_id=p_operator and p.status='published' and p.type='van_tour' and p.capacity_rules='{"version":1,"model":"departure_seats"}' and exists(select 1 from public.products source where source.id=coalesce(p.inventory_product_id,p.id) and source.operator_id=p_operator and source.status='published' and source.type='van_tour' and source.capacity_rules='{"version":1,"model":"departure_seats"}') and (exists(select 1 from public.service_schedules where product_id=coalesce(p.inventory_product_id,p.id) and status='active') or exists(select 1 from public.departures where operator_id=p_operator and product_id=coalesce(p.inventory_product_id,p.id) and status='scheduled' and public.booking_cutoff_v1(service_date,start_time)>statement_timestamp()));
$$;
revoke all on function public.save_product_card_v1(uuid,uuid,uuid,timestamptz,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_product_card_v1(uuid,uuid,uuid,timestamptz,jsonb,boolean) to service_role;
commit;
