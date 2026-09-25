begin;
alter table public.products add column passenger_pricing jsonb;
alter table public.service_schedules add column calendar_ranges jsonb not null default '[]';
alter table public.schedule_exceptions add column calendar_settings jsonb not null default '{}';
alter table public.inventory_holds add column passenger_snapshot jsonb;
alter table public.booking_items add column passenger_snapshot jsonb;
-- Historical prices are not reinterpreted. Until configured, legacy guests are adults.
create function public.passenger_categories_v1(p_product uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce(passenger_pricing,jsonb_build_object('adult',jsonb_build_object('min',13,'max',null,'price',pricing_rules->'unit_price'),'child',jsonb_build_object('min',3,'max',12,'price',null),'infant',jsonb_build_object('min',0,'max',2,'price',null))) from public.products where id=p_product;
$$;
create function public.validate_passengers_v1(p_counts jsonb) returns integer language plpgsql immutable set search_path='' as $$
declare k text;n bigint:=0;begin
 if p_counts is null or jsonb_typeof(p_counts)<>'object' or p_counts-array['adult','child','infant']<>'{}' then raise exception 'Invalid passengers' using errcode='22023';end if;
 foreach k in array array['adult','child','infant'] loop
  if coalesce(p_counts->>k,'')!~ '^[0-9]{1,6}$' then raise exception 'Invalid passengers' using errcode='22023';end if;
  n:=n+(p_counts->>k)::int;
 end loop;
 if (p_counts->>'adult')::int<1 and ((p_counts->>'child')::int>0 or (p_counts->>'infant')::int>0) then raise exception 'At least one adult is required when booking for children or infants.' using errcode='PT422';end if;
 if n<1 or n>100000 then raise exception 'Invalid passenger total' using errcode='22023';end if;return n::int;
end $$;
create function public.save_passenger_pricing_v1(p_operator uuid,p_actor uuid,p_product uuid,p_config jsonb,p_stamp timestamptz) returns void language plpgsql set search_path='' as $$
declare k text;c jsonb;p public.products;begin
 if not exists(select 1 from public.staff_profiles where operator_id=p_operator and id=p_actor and is_active and role in ('owner','admin','operations')) then raise exception 'Permission required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('schedule:'||p_operator::text||p_product::text,0));
 select * into p from public.products where id=p_product and operator_id=p_operator for update;
 if not found then raise exception 'Product unavailable';end if;
 if p_stamp is distinct from p.updated_at then raise exception 'Product changed; reload' using errcode='PT409';end if;
 if jsonb_typeof(p_config)<>'object' or p_config-array['adult','child','infant']<>'{}' then raise exception 'Invalid categories' using errcode='22023';end if;
 foreach k in array array['adult','child','infant'] loop
  c:=p_config->k;
  if jsonb_typeof(c) is distinct from 'object' or coalesce(c->>'min','')!~ '^[0-9]{1,3}$' or coalesce(c->>'price','')!~ '^[0-9]{1,9}$' then raise exception 'Set each category price; zero is allowed' using errcode='22023';end if;
 end loop;
 if (p_config#>>'{infant,min}')::int<>0 or coalesce(p_config#>>'{infant,max}','')!~ '^[0-9]{1,3}$' or coalesce(p_config#>>'{child,max}','')!~ '^[0-9]{1,3}$' or p_config#>>'{adult,max}' is not null
 or (p_config#>>'{infant,max}')::int+1<>(p_config#>>'{child,min}')::int or (p_config#>>'{child,max}')::int+1<>(p_config#>>'{adult,min}')::int or (p_config#>>'{child,max}')::int<(p_config#>>'{child,min}')::int then raise exception 'Age ranges must be continuous and must not overlap' using errcode='22023';end if;
 update public.products set passenger_pricing=p_config,pricing_rules=jsonb_build_object('version',1,'model','per_guest','currency','EUR','unit_price',p_config#>'{adult,price}') where id=p_product;
 perform public.record_domain_activity(p_operator,p_actor,'category-pricing:'||gen_random_uuid()::text,'product',p_product,'pricing.changed',jsonb_build_object('productId',p_product),'pricing.changed',jsonb_build_object('previous',p.passenger_pricing,'current',p_config));
end $$;
-- One deterministic range wins: latest saved matching range. Day/departure overrides apply next.
create function public.calendar_range_v1(p_schedule uuid,p_date date) returns jsonb language sql stable set search_path='' as $$
 select r from public.service_schedules s cross join lateral jsonb_array_elements(s.calendar_ranges) with ordinality x(r,n) where s.id=p_schedule and p_date between (r->>'from')::date and (r->>'to')::date and (r->'weekdays') @> to_jsonb(array[extract(isodow from p_date)::int]) order by n desc limit 1;
$$;
create or replace function public.effective_schedule_times_v1(p_schedule_id uuid,p_date date)
returns table(start_time time,capacity integer,vehicle_id uuid) language sql stable set search_path='' as $$
 select (t->>'time')::time,coalesce((e.calendar_settings->'departures'->(t->>'time')->>'capacity')::int,(e.calendar_settings->>'capacity')::int,(r->>'capacity')::int,(t->>'capacity')::int,s.default_capacity),coalesce((t->>'vehicle_id')::uuid,s.vehicle_id)
 from public.service_schedules s left join public.schedule_exceptions e on e.schedule_id=s.id and e.service_date=p_date
 left join lateral public.calendar_range_v1(s.id,p_date) r on true
 cross join lateral jsonb_array_elements(case when e.id is not null then e.departure_times else coalesce(r->'times',s.departure_times) end) t
 where s.id=p_schedule_id and s.status='active' and p_date between s.start_date and s.end_date and not coalesce(e.closed,(r->>'closed')::boolean,false)
 and (e.id is not null or r is not null or extract(isodow from p_date)::int=any(s.weekdays)) and not coalesce((e.calendar_settings->'departures'->(t->>'time')->>'closed')::boolean,false);
$$;
create function public.passenger_quote_v1(p_product uuid,p_date date,p_time time,p_counts jsonb) returns jsonb language plpgsql stable set search_path='' as $$
declare categories jsonb:=public.passenger_categories_v1(p_product);s public.service_schedules;e public.schedule_exceptions;r jsonb;layers jsonb;layer jsonb;k text;price bigint;base bigint;offer jsonb;line jsonb;lines jsonb:='[]';total bigint:=0;subtotal bigint:=0;qty int;used_offer jsonb;begin
 perform public.validate_passengers_v1(p_counts);
 select * into s from public.service_schedules where product_id=p_product;
 select * into e from public.schedule_exceptions where schedule_id=s.id and service_date=p_date;
 r:=public.calendar_range_v1(s.id,p_date);
 layers:=jsonb_build_array(r,e.calendar_settings,e.calendar_settings->'departures'->to_char(p_time,'HH24:MI'));
 foreach k in array array['adult','child','infant'] loop
  qty:=(p_counts->>k)::int;price:=(categories->k->>'price')::bigint;base:=price;used_offer:=null;
  for layer in select value from jsonb_array_elements(layers) loop
   if layer->'prices'->>k is not null then price:=(layer->'prices'->>k)::bigint;base:=price;used_offer:=null;end if;
   offer:=layer->'offer';
   if offer->'values'->>k is not null and (offer->'times' is null or offer->'times' @> to_jsonb(array[to_char(p_time,'HH24:MI')])) then
    base:=price;
    price:=case offer->>'type' when 'fixed' then (offer->'values'->>k)::bigint when 'percent' then round(price*(100-(offer->'values'->>k)::numeric)/100)::bigint when 'amount' then greatest(0,price-(offer->'values'->>k)::bigint) else price end;used_offer:=offer;
   end if;
  end loop;
  if qty>0 then
   if price is null then raise exception 'Category price has not been configured' using errcode='22023';end if;
   line:=jsonb_build_object('category',k,'quantity',qty,'unitPrice',price,'basePrice',coalesce(base,price),'total',price*qty,'offer',used_offer,'minAge',categories->k->'min','maxAge',categories->k->'max');lines:=lines||jsonb_build_array(line);total:=total+price*qty;subtotal:=subtotal+coalesce(base,price)*qty;
  end if;
 end loop;
 return jsonb_build_object('version',1,'counts',p_counts,'categories',categories,'lines',lines,'currency','EUR','subtotal',subtotal,'total',total);
end $$;
create function public.create_passenger_hold_v1(p_operator_id uuid, p_departure_id uuid, p_session_key text, p_request_id uuid, p_quantity integer,p_counts jsonb)
returns public.inventory_holds language plpgsql set search_path = '' as $$
declare d public.departures; h public.inventory_holds; used bigint; instant timestamptz; departure_instant timestamptz; snapshot jsonb;
begin
  if p_quantity is distinct from public.validate_passengers_v1(p_counts) then raise exception 'Passenger total mismatch' using errcode='22023';end if;
  if p_operator_id is null or p_departure_id is null or p_request_id is null
    or p_session_key is null or length(p_session_key) < 32 or length(p_session_key) > 256
    or p_quantity is null or p_quantity < 1 then
    raise exception 'Invalid hold request' using errcode = '22023';
  end if;
  -- Same operator/request retries serialize even if their departure differs.
  perform pg_advisory_xact_lock(hashtextextended(p_operator_id::text || p_request_id::text, 0));
  select * into h from public.inventory_holds where operator_id=p_operator_id and request_id=p_request_id;
  if found then
    if h.departure_id <> p_departure_id or h.session_key <> p_session_key or h.quantity <> p_quantity or coalesce(h.passenger_snapshot->'counts',jsonb_build_object('adult',h.quantity,'child',0,'infant',0))<>p_counts then
      raise exception 'Conflicting hold request' using errcode = '23505';
    end if;
    if h.status='active' and h.expires_at <= clock_timestamp() then
      update public.inventory_holds set status='expired' where id=h.id returning * into h;
    end if;
    return h;
  end if;
  select * into d from public.departures where operator_id=p_operator_id and id=p_departure_id for update;
  if not found then raise exception 'Departure unavailable' using errcode='P0002'; end if;
  instant := clock_timestamp();
  select (d.service_date+d.start_time) at time zone o.timezone into departure_instant
    from public.operators o join public.products p on p.operator_id=o.id
    where o.id=p_operator_id and p.id=d.product_id and p.status='published' and p.type='van_tour'
      and p.capacity_rules='{"version":1,"model":"departure_seats"}'::jsonb;
  if departure_instant is null or departure_instant <= instant or d.status <> 'scheduled' then
    raise exception 'Departure unavailable' using errcode='P0002';
  end if;
  update public.inventory_holds set status='expired'
    where operator_id=p_operator_id and departure_id=d.id and status='active' and expires_at <= instant;
  select (select coalesce(sum(quantity),0) from public.booking_items
      where operator_id=p_operator_id and departure_id=d.id and status='confirmed')
    + (select coalesce(sum(quantity),0) from public.inventory_holds
      where operator_id=p_operator_id and departure_id=d.id and status='active' and expires_at > instant) into used;
  if used + p_quantity > d.capacity then raise exception 'Insufficient capacity' using errcode='P0001'; end if;
  snapshot:=public.passenger_quote_v1(d.product_id,d.service_date,d.start_time,p_counts);
  insert into public.inventory_holds(operator_id,departure_id,session_key,request_id,quantity,created_at,expires_at,passenger_snapshot)
    values(p_operator_id,d.id,p_session_key,p_request_id,p_quantity,instant,least(instant+interval '10 minutes',departure_instant),snapshot) returning * into h;
  return h;
end;
$$;

create or replace function public.create_hold_v1(p_operator_id uuid,p_departure_id uuid,p_session_key text,p_request_id uuid,p_quantity integer) returns public.inventory_holds language sql set search_path='' as $$
 select public.create_passenger_hold_v1(p_operator_id,p_departure_id,p_session_key,p_request_id,p_quantity,jsonb_build_object('adult',p_quantity,'child',0,'infant',0)); $$;
create or replace function public.create_pending_order_v1(p_operator_id uuid,p_hold_id uuid,p_session_key text,
  p_customer_name text,p_customer_email text,p_customer_phone text default null)
returns jsonb language plpgsql set search_path='' as $$
declare h public.inventory_holds; d public.departures; p public.products; c public.customers;
  o public.orders; price bigint; total_amount numeric; departure_time timestamptz;
begin
  if p_operator_id is null or p_hold_id is null or p_session_key is null
    or p_customer_name is null or length(btrim(p_customer_name)) not between 1 and 200
    or p_customer_email is null or length(p_customer_email)>254 or btrim(p_customer_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(coalesce(p_customer_phone,''))>50 then
    raise exception 'Invalid checkout request' using errcode='22023';
  end if;
  select * into h from public.inventory_holds where operator_id=p_operator_id and id=p_hold_id and session_key=p_session_key;
  if not found then raise exception 'Hold unavailable' using errcode='P0002'; end if;
  -- Same lock order as allocation: departure, then hold. Revalidate after waiting.
  select * into d from public.departures where operator_id=p_operator_id and id=h.departure_id for update;
  select * into h from public.inventory_holds where operator_id=p_operator_id and id=p_hold_id and session_key=p_session_key for update;
  if h.order_id is not null then
    select * into o from public.orders where operator_id=p_operator_id and id=h.order_id;
    select * into c from public.customers where operator_id=p_operator_id and id=o.customer_id;
    if c.name is distinct from btrim(p_customer_name) or c.email is distinct from lower(btrim(p_customer_email))
      or c.phone is distinct from nullif(btrim(p_customer_phone),'') then
      raise exception 'Conflicting checkout retry' using errcode='23505';
    end if;
  else
    if h.status<>'active' or h.expires_at <= clock_timestamp() then raise exception 'Hold inactive' using errcode='P0001'; end if;
    select * into p from public.products where operator_id=p_operator_id and id=d.product_id for share;
    select (d.service_date+d.start_time) at time zone timezone into departure_time from public.operators where id=p_operator_id;
    if d.status<>'scheduled' or departure_time<=clock_timestamp() or p.status<>'published'
      or p.type<>'van_tour' or p.capacity_rules <> '{"version":1,"model":"departure_seats"}'::jsonb then
      raise exception 'Product unavailable' using errcode='P0002';
    end if;
    price := public.unit_price_v1(p.pricing_rules);
    total_amount := coalesce((h.passenger_snapshot->>'total')::numeric,price::numeric*h.quantity);
    if h.passenger_snapshot is not null then perform public.validate_passengers_v1(h.passenger_snapshot->'counts');end if;
    if total_amount > 9007199254740991 then raise exception 'Unsafe order total' using errcode='22023'; end if;
    insert into public.customers(operator_id,name,email,phone) values(p_operator_id,btrim(p_customer_name),lower(btrim(p_customer_email)),nullif(btrim(p_customer_phone),'')) returning * into c;
    insert into public.orders(operator_id,customer_id,currency,subtotal,total)
      values(p_operator_id,c.id,'EUR',total_amount,total_amount) returning * into o;
    insert into public.booking_items(operator_id,order_id,product_id,departure_id,quantity,unit_price,total_price,passenger_snapshot)
      values(p_operator_id,o.id,p.id,d.id,h.quantity,price,total_amount,h.passenger_snapshot);
    if h.expires_at <= clock_timestamp() then raise exception 'Hold expired during checkout' using errcode='P0001'; end if;
    update public.inventory_holds set order_id=o.id where id=h.id;
    perform public.record_domain_activity(p_operator_id,null,'order-created:'||o.id::text,
      'order',o.id,'order.created',jsonb_build_object('orderId',o.id,'currency','EUR','total',o.total),
      'order.created',jsonb_build_object('holdId',h.id));
  end if;
  return jsonb_build_object('version',1,'orderId',o.id,'status',o.status,'currency',o.currency,'total',o.total,
    'holdId',h.id,'expiresAt',h.expires_at,'items',(select jsonb_agg(jsonb_build_object('id',i.id,'productId',i.product_id,
      'departureId',i.departure_id,'quantity',i.quantity,'unitPrice',i.unit_price,'total',i.total_price,'passengerSnapshot',i.passenger_snapshot,'status',i.status) order by i.id)
      from public.booking_items i where i.operator_id=p_operator_id and i.order_id=o.id));
end;
$$;
create or replace function public.create_meeting_point_booking_v1(p_operator_id uuid,p_hold_id uuid,p_session_key text,p_customer_name text,p_customer_email text,p_customer_phone text default null)
returns jsonb language plpgsql set search_path='' as $$
declare result jsonb; h public.inventory_holds; o public.orders; b public.bookings; d public.departures; item public.booking_items; used bigint;
begin
  -- Existing checkout validates the customer and locks departure then hold for the entire transaction.
  result := public.create_pending_order_v1(p_operator_id,p_hold_id,p_session_key,p_customer_name,p_customer_email,p_customer_phone);
  select * into h from public.inventory_holds where operator_id=p_operator_id and id=p_hold_id and session_key=p_session_key for update;
  select * into o from public.orders where operator_id=p_operator_id and id=h.order_id for update;
  select * into b from public.bookings where operator_id=p_operator_id and order_id=o.id for update;
  if b.id is null then
    if o.status<>'pending' or h.status<>'active' or h.expires_at<=clock_timestamp() then raise exception 'Checkout inactive' using errcode='P0001'; end if;
    select * into d from public.departures where operator_id=p_operator_id and id=h.departure_id;
    if d.status<>'scheduled' or (select (d.service_date+d.start_time) at time zone timezone from public.operators where id=p_operator_id)<=clock_timestamp() then raise exception 'Departure unavailable' using errcode='P0001'; end if;
    if (select count(*) from public.booking_items where operator_id=p_operator_id and order_id=o.id)<>1 then raise exception 'Unsupported inventory' using errcode='P0001'; end if;
    select * into item from public.booking_items where operator_id=p_operator_id and order_id=o.id for update;
    if item.status<>'pending' or item.departure_id is distinct from h.departure_id or item.product_id<>d.product_id or item.quantity<>h.quantity or item.total_price<>o.total or o.subtotal<>o.total or coalesce((item.passenger_snapshot->>'total')::numeric,item.unit_price::numeric*item.quantity)<>o.total then raise exception 'Invalid inventory' using errcode='P0001'; end if;
    select (select coalesce(sum(quantity),0) from public.booking_items where operator_id=p_operator_id and departure_id=d.id and status='confirmed')+(select coalesce(sum(quantity),0) from public.inventory_holds where operator_id=p_operator_id and departure_id=d.id and status='active' and expires_at>clock_timestamp()) into used;
    if used>d.capacity then raise exception 'Capacity reconciliation required' using errcode='P0001'; end if;
    insert into public.bookings(operator_id,order_id,booking_reference) values(p_operator_id,o.id,'SS-'||gen_random_uuid()::text) returning * into b;
    update public.orders set collection_mode='meeting_point',status='confirmed' where id=o.id returning * into o;
    update public.inventory_holds set status='consumed' where id=h.id;
    update public.booking_items set status='confirmed' where id=item.id;
    update public.bookings set status='confirmed' where id=b.id returning * into b;
    perform public.record_domain_activity(p_operator_id,null,'booking-confirmed:'||b.id::text,'booking',b.id,'booking.confirmed',jsonb_build_object('bookingId',b.id,'orderId',o.id),'booking.confirmed',jsonb_build_object('collectionMode','meeting_point'));
  elsif o.collection_mode<>'meeting_point' then
    raise exception 'Existing checkout uses another collection mode' using errcode='23505';
  end if;
  return result || jsonb_build_object('status',o.status,'collectionMode','meeting_point','bookingReference',b.booking_reference,'bookingStatus',b.status,
    'paymentStatus',case when exists(select 1 from public.payments where operator_id=p_operator_id and order_id=o.id and provider='meeting_point' and status='paid') then 'paid' else 'due' end,
    'items',(select jsonb_agg(jsonb_build_object('id',i.id,'productId',i.product_id,'departureId',i.departure_id,'quantity',i.quantity,'unitPrice',i.unit_price,'total',i.total_price,'passengerSnapshot',i.passenger_snapshot,'status',i.status) order by i.id) from public.booking_items i where i.operator_id=p_operator_id and i.order_id=o.id));
end;
$$;
create function public.guard_passenger_snapshot_v1() returns trigger language plpgsql set search_path='' as $$
declare line jsonb;n integer:=0;total bigint:=0;counts jsonb;begin
 if tg_op='UPDATE' and old.passenger_snapshot is not null and (new.passenger_snapshot is distinct from old.passenger_snapshot or new.quantity<>old.quantity) then raise exception 'Passenger and price snapshots are immutable; cancel and rebook to change passengers' using errcode='23514';end if;
 if new.passenger_snapshot is null then return new;end if;
 counts:=new.passenger_snapshot->'counts';
 if new.quantity<>public.validate_passengers_v1(counts) then raise exception 'Passenger quantity mismatch' using errcode='23514';end if;
 for line in select value from jsonb_array_elements(new.passenger_snapshot->'lines') loop
  if (line->>'quantity')::int<>(counts->>(line->>'category'))::int or (line->>'unitPrice')::bigint<0 or (line->>'total')::bigint<>(line->>'quantity')::bigint*(line->>'unitPrice')::bigint then raise exception 'Invalid passenger snapshot' using errcode='23514';end if;
  n:=n+(line->>'quantity')::int;total:=total+(line->>'total')::bigint;
 end loop;
 if (select count(*)<>count(distinct value->>'category') from jsonb_array_elements(new.passenger_snapshot->'lines')) then raise exception 'Duplicate passenger categories' using errcode='23514';end if;
 if n<>new.quantity or total<>(new.passenger_snapshot->>'total')::bigint then raise exception 'Passenger total mismatch' using errcode='23514';end if;
 if tg_table_name='booking_items' then if total<>new.total_price then raise exception 'Booking total mismatch' using errcode='23514';end if;end if;
 return new;end $$;
create trigger passenger_snapshot_guard before insert or update on public.inventory_holds for each row execute function public.guard_passenger_snapshot_v1();
create trigger passenger_snapshot_guard before insert or update on public.booking_items for each row execute function public.guard_passenger_snapshot_v1();

create function public.validate_calendar_settings_v1(p_operator uuid,p_value jsonb) returns void language plpgsql set search_path='' as $$
declare k text;c jsonb;v jsonb;begin
 if jsonb_typeof(p_value)<>'object' then raise exception 'Invalid settings' using errcode='22023';end if;
 if p_value->>'capacity' is not null and (coalesce(p_value->>'capacity','')!~ '^[1-9][0-9]{0,5}$') then raise exception 'Invalid capacity' using errcode='22023';end if;
 if p_value ? 'closed' and jsonb_typeof(p_value->'closed')<>'boolean' then raise exception 'Invalid open/closed state' using errcode='22023';end if;
 if p_value ? 'times' then perform public.validate_schedule_times_v1(p_operator,p_value->'times',true);end if;
 foreach k in array array['adult','child','infant'] loop
  if p_value->'prices'->>k is not null and (p_value->'prices'->>k)!~ '^[0-9]{1,9}$' then raise exception 'Invalid category price' using errcode='22023';end if;
 end loop;
 if p_value ? 'offer' and p_value->'offer'<>'null' then
  c:=p_value->'offer';
  if coalesce(c->>'type','') not in ('fixed','percent','amount') or length(coalesce(c->>'name','')) not between 1 and 100 or length(coalesce(c->>'label',''))>100 then raise exception 'Invalid offer' using errcode='22023';end if;
  foreach k in array array['adult','child','infant'] loop
   if c->'values'->>k is not null then
    if (c->'values'->>k)!~ '^[0-9]{1,9}$' or (c->>'type'='percent' and (c->'values'->>k)::numeric>100) then raise exception 'Invalid offer amount' using errcode='22023';end if;
   end if;
  end loop;
  if c ? 'times' then for v in select value from jsonb_array_elements(c->'times') loop if (v#>>'{}')!~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid offer time' using errcode='22023';end if;end loop;end if;
 end if;
 if p_value ? 'departures' then
  for k,v in select * from jsonb_each(p_value->'departures') loop
   if k!~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or v ? 'departures' then raise exception 'Invalid departure override' using errcode='22023';end if;
   perform public.validate_calendar_settings_v1(p_operator,v);
  end loop;
 end if;
end $$;
create function public.save_calendar_override_v1(p_operator uuid,p_actor uuid,p_schedule uuid,p_from date,p_to date,p_weekdays integer[],p_value jsonb,p_confirm_closure boolean,p_stamp timestamptz,p_restore boolean default false) returns void language plpgsql set search_path='' as $$
declare s public.service_schedules;d public.departures;t record;used bigint;zone text;range jsonb;times jsonb;begin
 if not exists(select 1 from public.staff_profiles where operator_id=p_operator and id=p_actor and is_active and role in ('owner','admin','operations')) then raise exception 'Permission required' using errcode='42501';end if;
 select * into strict s from public.service_schedules where id=p_schedule and operator_id=p_operator;
 perform pg_advisory_xact_lock(hashtextextended('schedule:'||p_operator::text||s.product_id::text,0));
 select * into s from public.service_schedules where id=p_schedule for update;
 if p_stamp is distinct from s.updated_at then raise exception 'Schedule changed; reload' using errcode='PT409';end if;
 select timezone into zone from public.operators where id=p_operator;
 if p_from is null or p_to is null or not isfinite(p_from) or not isfinite(p_to) or p_from>p_to or p_from<s.start_date or p_to>s.end_date or p_from<(clock_timestamp() at time zone zone)::date or cardinality(p_weekdays) not between 1 and 7 or not(p_weekdays<@array[1,2,3,4,5,6,7]) or array_position(p_weekdays,null) is not null then raise exception 'Choose dates within the operating period' using errcode='22023';end if;
 perform public.validate_calendar_settings_v1(p_operator,p_value);
 if p_from=p_to then
  if p_restore then delete from public.schedule_exceptions where schedule_id=s.id and service_date=p_from;
  else
   select coalesce(jsonb_agg(jsonb_build_object('time',to_char(start_time,'HH24:MI'),'capacity',capacity,'vehicle_id',vehicle_id)),'[]') into times from public.effective_schedule_times_v1(s.id,p_from);
   times:=coalesce(p_value->'times',times);
   insert into public.schedule_exceptions(operator_id,schedule_id,service_date,closed,departure_times,calendar_settings,note) values(p_operator,s.id,p_from,coalesce((p_value->>'closed')::boolean,false),times,p_value,'Calendar override')
   on conflict(schedule_id,service_date) do update set closed=excluded.closed,departure_times=excluded.departure_times,calendar_settings=excluded.calendar_settings,updated_at=clock_timestamp();
  end if;
 else
  select coalesce(jsonb_agg(x),'[]') into range from jsonb_array_elements(s.calendar_ranges) x where not(x->>'from'=p_from::text and x->>'to'=p_to::text);
  if not p_restore then range:=range||jsonb_build_array(p_value||jsonb_build_object('from',p_from,'to',p_to,'weekdays',p_weekdays));end if;
  if jsonb_array_length(range)>200 then raise exception 'Too many range overrides' using errcode='22023';end if;
  update public.service_schedules set calendar_ranges=range where id=s.id;
 end if;
 -- Lock the same dated inventory as hold allocation. Existing bookings are never cancelled.
 for d in select * from public.departures where schedule_id=s.id and service_date between p_from and p_to and (service_date+start_time) at time zone zone>clock_timestamp() order by id for update loop
  select * into t from public.effective_schedule_times_v1(s.id,d.service_date) where start_time=d.start_time;
  select (select coalesce(sum(quantity),0) from public.booking_items where departure_id=d.id and status='confirmed')+(select coalesce(sum(quantity),0) from public.inventory_holds where departure_id=d.id and status='active' and expires_at>clock_timestamp()) into used;
  if t.start_time is null then
   if d.status='scheduled' and used>0 and not coalesce(p_confirm_closure,false) then raise exception 'This date has reserved passengers. Confirm closure; existing bookings will remain.' using errcode='PT428';end if;
   update public.departures set status='cancelled' where id=d.id;
  else
   if t.capacity<used then raise exception 'Capacity cannot be below confirmed passengers and active holds' using errcode='PT422';end if;
   update public.departures set status='scheduled',capacity=t.capacity,vehicle_id=t.vehicle_id where id=d.id;
  end if;
 end loop;
 update public.service_schedules set updated_at=clock_timestamp() where id=s.id;
 perform public.record_domain_activity(p_operator,p_actor,'calendar:'||gen_random_uuid()::text,'service_schedule',s.id,'schedule.changed',jsonb_build_object('scheduleId',s.id),'calendar.changed',jsonb_build_object('from',p_from,'to',p_to,'settings',p_value,'confirmedClosure',p_confirm_closure,'restore',p_restore));
end $$;
-- Category quantities and authoritative quotes accompany the existing availability projection.
create function public.read_passenger_availability_v1(p_operator uuid,p_product uuid,p_date date,p_counts jsonb) returns jsonb language plpgsql set search_path='' as $$
declare snapshot jsonb;deps jsonb;begin
 perform public.validate_passengers_v1(p_counts);
 snapshot:=public.read_availability_v1(p_operator,p_product,p_date);
 if snapshot is null then return null;end if;
 select coalesce(jsonb_agg(d||jsonb_build_object('passenger_quote',public.passenger_quote_v1(p_product,p_date,(d->>'start_time')::time,p_counts))),'[]') into deps from jsonb_array_elements(snapshot->'departures') d;
 return snapshot||jsonb_build_object('departures',deps,'categories',public.passenger_categories_v1(p_product));
end $$;
do $$ declare signature regprocedure;begin
 for signature in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in ('passenger_categories_v1','validate_passengers_v1','save_passenger_pricing_v1','calendar_range_v1','passenger_quote_v1','create_passenger_hold_v1','guard_passenger_snapshot_v1','validate_calendar_settings_v1','save_calendar_override_v1','read_passenger_availability_v1') loop
 execute format('revoke all on function %s from public,anon,authenticated',signature);execute format('grant execute on function %s to service_role',signature);end loop;
end $$;

create function public.read_operations_calendar_v1(p_operator uuid,p_actor uuid,p_schedule uuid,p_month date) returns jsonb language plpgsql set search_path='' as $$
declare s public.service_schedules;dt date;days jsonb:='[]';slots jsonb;t record;d public.departures;committed bigint;held bigint;q jsonb;begin
 if not exists(select 1 from public.staff_profiles where operator_id=p_operator and id=p_actor and is_active and role in ('owner','admin','operations')) then raise exception 'Permission required' using errcode='42501';end if;
 select * into strict s from public.service_schedules where operator_id=p_operator and id=p_schedule;
 if p_month is null or not isfinite(p_month) then raise exception 'Invalid month';end if;
 p_month:=date_trunc('month',p_month)::date;
 for dt in select generate_series(p_month,p_month+interval '1 month'-interval '1 day',interval '1 day')::date loop
  slots:='[]';
  for t in select x.start_time,x.capacity,true as open from public.effective_schedule_times_v1(s.id,dt) x union all select x.start_time,x.capacity,false from public.departures x where x.schedule_id=s.id and x.service_date=dt and not exists(select 1 from public.effective_schedule_times_v1(s.id,dt) z where z.start_time=x.start_time) order by start_time loop
   select * into d from public.departures where schedule_id=s.id and service_date=dt and start_time=t.start_time;
   select coalesce(sum(quantity),0) into committed from public.booking_items where departure_id=d.id and status='confirmed';
   select coalesce(sum(quantity),0) into held from public.inventory_holds where departure_id=d.id and status='active' and expires_at>clock_timestamp();
   begin q:=public.passenger_quote_v1(s.product_id,dt,t.start_time,'{"adult":1,"child":0,"infant":0}');exception when sqlstate '22023' then q:=null;end;
   slots:=slots||jsonb_build_array(jsonb_build_object('id',d.id,'time',to_char(t.start_time,'HH24:MI'),'capacity',t.capacity,'open',t.open,'booked',committed,'held',held,'remaining',greatest(0,t.capacity-committed-held),'quote',q));
  end loop;
  days:=days||jsonb_build_array(jsonb_build_object('date',dt,'slots',slots,'range',public.calendar_range_v1(s.id,dt),'exception',(select to_jsonb(e) from public.schedule_exceptions e where e.schedule_id=s.id and e.service_date=dt)));
 end loop;
 return jsonb_build_object('days',days,'categories',public.passenger_categories_v1(s.product_id));
end $$;
revoke all on function public.read_operations_calendar_v1(uuid,uuid,uuid,date) from public,anon,authenticated;
grant execute on function public.read_operations_calendar_v1(uuid,uuid,uuid,date) to service_role;

create or replace function public.create_staff_passenger_booking_v1(p_operator_id uuid,p_actor_id uuid,p_departure_id uuid,p_request_id uuid,
  p_quantity integer,p_name text,p_email text,p_phone text,p_counts jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare h public.inventory_holds; o jsonb; b public.bookings; session_key text;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then
    raise exception 'Booking creation permission required' using errcode='42501'; end if;
  -- Internal session capability is never supplied by a browser.
  session_key := 'staff:'||p_actor_id::text||':'||p_request_id::text;
  select * into h from public.create_passenger_hold_v1(p_operator_id,p_departure_id,session_key,p_request_id,p_quantity,p_counts);
  o := public.create_meeting_point_booking_v1(p_operator_id,h.id,session_key,p_name,p_email,p_phone);
  select * into b from public.bookings where operator_id=p_operator_id and order_id=(o->>'orderId')::uuid;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'staff-booking:'||b.id::text,'booking',b.id,
    'booking.staff_created',jsonb_build_object('bookingId',b.id),'booking.staff_created',jsonb_build_object('orderId',b.order_id));
  return jsonb_build_object('version',1,'bookingId',b.id,'orderId',b.order_id,'reference',b.booking_reference,
    'status',b.status,'total',o->'total','currency',o->'currency','expiresAt',h.expires_at);
end;
$$;

revoke all on function public.create_staff_passenger_booking_v1(uuid,uuid,uuid,uuid,integer,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_staff_passenger_booking_v1(uuid,uuid,uuid,uuid,integer,text,text,text,jsonb) to service_role;
commit;
