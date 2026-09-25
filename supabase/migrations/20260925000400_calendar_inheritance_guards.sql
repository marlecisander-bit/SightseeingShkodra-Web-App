begin;
create or replace function public.save_calendar_override_v1(p_operator uuid,p_actor uuid,p_schedule uuid,p_from date,p_to date,p_weekdays integer[],p_value jsonb,p_confirm_closure boolean,p_stamp timestamptz,p_restore boolean default false) returns void language plpgsql set search_path='' as $$
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
   times:=coalesce(p_value->'times',public.calendar_range_v1(s.id,p_from)->'times',s.departure_times);
   insert into public.schedule_exceptions(operator_id,schedule_id,service_date,closed,departure_times,calendar_settings,note) values(p_operator,s.id,p_from,coalesce((p_value->>'closed')::boolean,(public.calendar_range_v1(s.id,p_from)->>'closed')::boolean,case when public.calendar_range_v1(s.id,p_from) is not null then false else not(extract(isodow from p_from)::int=any(s.weekdays)) end),times,p_value,'Calendar override')
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
create function public.guard_category_price_authority_v1() returns trigger language plpgsql set search_path='' as $$
begin
 if new.passenger_pricing is not null and new.pricing_rules->'unit_price' is distinct from new.passenger_pricing#>'{adult,price}' then raise exception 'Manage prices through Calendar & Pricing' using errcode='22023';end if;
 return new;
end $$;
revoke all on function public.guard_category_price_authority_v1() from public,anon,authenticated;
create trigger category_price_authority before insert or update on public.products for each row execute function public.guard_category_price_authority_v1();

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
      values(p_operator_id,c.id,'EUR',coalesce((h.passenger_snapshot->>'subtotal')::bigint,total_amount),total_amount) returning * into o;
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
    if item.status<>'pending' or item.departure_id is distinct from h.departure_id or item.product_id<>d.product_id or item.quantity<>h.quantity or item.total_price<>o.total or o.subtotal<>coalesce((item.passenger_snapshot->>'subtotal')::bigint,o.total) or coalesce((item.passenger_snapshot->>'total')::numeric,item.unit_price::numeric*item.quantity)<>o.total then raise exception 'Invalid inventory' using errcode='P0001'; end if;
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

commit;
