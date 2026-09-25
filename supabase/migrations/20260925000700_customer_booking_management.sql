begin;
alter table public.bookings add column management_token text unique not null default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
alter table public.bookings add column management_version integer not null default 0;
alter table public.bookings add constraint management_token_shape check(management_token ~ '^[0-9a-f]{64}$');
drop function public.cancel_order_v1(uuid,uuid,uuid,text);
create function public.cancel_order_v1(p_operator_id uuid,p_order_id uuid,p_actor_id uuid,p_reason text,p_management_token text default null)
returns jsonb language plpgsql set search_path='' as $$
declare o public.orders; h public.inventory_holds; review_required boolean;
begin
  if p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
    raise exception 'Cancellation reason required' using errcode='22023';
  end if;
  if p_management_token is null and not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then
    raise exception 'Staff cancellation permission required' using errcode='42501';
  end if;
  -- Preserve the departure-first locking protocol used by allocation/confirmation.
  perform 1 from public.departures d where d.operator_id=p_operator_id and d.id in
    (select departure_id from public.inventory_holds where operator_id=p_operator_id and order_id=p_order_id union select departure_id from public.booking_items where operator_id=p_operator_id and order_id=p_order_id)
    order by d.id for update;
  select * into o from public.orders where operator_id=p_operator_id and id=p_order_id for update;
  if not found then raise exception 'Order unavailable' using errcode='P0002'; end if;
  if p_management_token is not null then
    if p_actor_id is not null or not exists(select 1 from public.bookings where operator_id=p_operator_id and order_id=p_order_id and management_token=p_management_token) then raise exception 'Booking unavailable' using errcode='P0002';end if;
    if o.status='cancelled' then return jsonb_build_object('version',1,'orderId',o.id,'status','cancelled','refundReviewRequired',false);end if;
    if exists(select 1 from public.bookings where order_id=o.id and checked_in_at is not null) or o.collection_mode<>'meeting_point' or exists(select 1 from public.payments where order_id=o.id and status not in ('failed')) then raise exception 'Contact the operator' using errcode='PT403';end if;
    if exists(select 1 from public.booking_items i join public.departures d on d.id=i.departure_id where i.order_id=o.id and i.status='confirmed' and public.booking_cutoff_v1(d.service_date,d.start_time)<=clock_timestamp()) then raise exception 'Online cancellation closed' using errcode='PT410';end if;
  end if;
  if o.status not in ('pending','awaiting_payment','paid','confirmed','cancelled') then
    raise exception 'Order requires manual reconciliation' using errcode='P0001';
  end if;
  -- Lock existing payment evidence without altering it; provider integration must use the order lock.
  perform 1 from public.payments where operator_id=p_operator_id and order_id=p_order_id order by id for update;
  select exists(select 1 from public.payments where operator_id=p_operator_id and order_id=p_order_id
    and status in ('paid','partially_refunded') and amount>0) into review_required;
  if o.status <> 'cancelled' then
    for h in select * from public.inventory_holds where operator_id=p_operator_id and order_id=p_order_id order by id for update loop
      if h.status='active' then
        update public.inventory_holds set status=case when expires_at<=clock_timestamp() then 'expired' else 'released' end where id=h.id;
      end if;
    end loop;
    update public.booking_items set status='cancelled' where operator_id=p_operator_id and order_id=p_order_id and status in ('pending','confirmed');
    update public.bookings set status='cancelled' where operator_id=p_operator_id and order_id=p_order_id and status in ('pending','confirmed');
    update public.orders set status='cancelled' where id=o.id;
    perform public.record_domain_activity(p_operator_id,p_actor_id,'order-cancelled:'||o.id::text,'order',o.id,
      'order.cancelled',jsonb_build_object('orderId',o.id),'order.cancelled',jsonb_build_object('reason',btrim(p_reason)));
  end if;
  if review_required then
    -- Stable payload/key: repeated cancellation cannot enqueue duplicate refund work.
    perform public.enqueue_domain_event(p_operator_id,null,'refund-review:'||o.id::text,'order',o.id,
      'refund.review_requested',jsonb_build_object('orderId',o.id));
  end if;
  return jsonb_build_object('version',1,'orderId',o.id,'status','cancelled','refundReviewRequired',review_required);
end;
$$;

revoke all on function public.cancel_order_v1(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.cancel_order_v1(uuid,uuid,uuid,text,text) to service_role;
-- Allocation snapshots remain immutable except within the service-only atomic modification RPC.
do $$ declare definition text; begin
 select pg_get_functiondef('public.guard_passenger_snapshot_v1()'::regprocedure) into definition;
 execute replace(definition,'if tg_op=''UPDATE'' and old.passenger_snapshot is not null', 'if tg_op=''UPDATE'' and not (tg_table_name=''booking_items'' and coalesce(current_setting(''app.booking_modification'',true),'''')=''on'') and old.passenger_snapshot is not null');
end $$;
create function public.customer_booking_v1(p_token text) returns jsonb language plpgsql set search_path='' as $$
declare b public.bookings; o public.orders; i public.booking_items; d public.departures; allowed boolean;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Booking unavailable' using errcode='P0002';end if;
 select * into b from public.bookings where management_token=p_token;
 if not found then raise exception 'Booking unavailable' using errcode='P0002';end if;
 select * into o from public.orders where id=b.order_id;
 if (select count(*) from public.booking_items where order_id=o.id)<>1 then raise exception 'Contact the operator' using errcode='PT403';end if;
 select * into i from public.booking_items where order_id=o.id;
 select * into d from public.departures where id=i.departure_id;
 allowed:=b.status='confirmed' and b.checked_in_at is null and o.collection_mode='meeting_point' and not exists(select 1 from public.payments where order_id=o.id and status<>'failed');
 return jsonb_build_object('reference',b.booking_reference,'status',b.status,'version',b.management_version,'date',d.service_date,'time',d.start_time,'departureId',d.id,'productId',i.product_id,'counts',coalesce(i.passenger_snapshot->'counts',jsonb_build_object('adult',i.quantity,'child',0,'infant',0)),'occupiedSeats',i.occupied_seats,'total',o.total,'currency',o.currency,'cutoff',public.booking_cutoff_v1(d.service_date,d.start_time),'serverNow',clock_timestamp(),'canManage',coalesce(allowed and public.booking_cutoff_v1(d.service_date,d.start_time)>clock_timestamp(),false),'requiresStaff',not coalesce(allowed,false));
end $$;
create function public.customer_booking_availability_v1(p_token text,p_date date,p_counts jsonb) returns jsonb language plpgsql set search_path='' as $$
declare b public.bookings;i public.booking_items;snapshot jsonb;deps jsonb;begin
 perform public.customer_booking_v1(p_token);
 select * into b from public.bookings where management_token=p_token;
 select * into i from public.booking_items where order_id=b.order_id;
 snapshot:=public.read_passenger_availability_v1(b.operator_id,i.product_id,p_date,p_counts);
 select coalesce(jsonb_agg(d||jsonb_build_object('committed',greatest(0,(d->>'committed')::integer-case when d->>'id'=i.departure_id::text and i.status='confirmed' then i.occupied_seats else 0 end))),'[]') into deps from jsonb_array_elements(snapshot->'departures') d;
 return snapshot||jsonb_build_object('departures',deps);
end $$;
create function public.modify_customer_booking_v1(p_token text,p_version integer,p_departure uuid,p_counts jsonb,p_expected_total bigint,p_request uuid) returns jsonb language plpgsql set search_path='' as $$
declare b public.bookings;o public.orders;i public.booking_items;d public.departures;old_departure uuid;used bigint;snapshot jsonb;qty integer; prior jsonb;
begin
 if p_request is null or p_version is null then raise exception 'Invalid request' using errcode='22023';end if;
 perform public.customer_booking_v1(p_token);
 select * into b from public.bookings where management_token=p_token;
 select * into i from public.booking_items where order_id=b.order_id;
 old_departure:=i.departure_id;
 -- Global sorted departure order matches allocation/cancellation; never release before target validation.
 perform 1 from public.departures where id in (old_departure,p_departure) order by id for update;
 select * into o from public.orders where id=b.order_id for update;
 select * into b from public.bookings where id=b.id for update;
 select payload into prior from public.domain_events where operator_id=b.operator_id and idempotency_key='customer-modify:'||b.id::text||':'||p_request::text;
 if found then
  if prior->>'departureId' is distinct from p_departure::text or prior->'counts' is distinct from p_counts or (prior->>'expectedTotal')::bigint is distinct from p_expected_total then raise exception 'Conflicting retry' using errcode='PT409';end if;
  return public.customer_booking_v1(p_token);
 end if;
 select * into i from public.booking_items where order_id=o.id for update;
 if i.departure_id<>old_departure or b.management_version<>p_version then raise exception 'Booking changed' using errcode='PT409';end if;
 if b.status<>'confirmed' or b.checked_in_at is not null or o.collection_mode<>'meeting_point' or exists(select 1 from public.payments where order_id=o.id and status<>'failed') then raise exception 'Contact the operator' using errcode='PT403';end if;
 if (select public.booking_cutoff_v1(service_date,start_time) from public.departures where id=old_departure)<=clock_timestamp() then raise exception 'Online modifications closed' using errcode='PT410';end if;
 select * into d from public.departures where id=p_departure and operator_id=b.operator_id and product_id=i.product_id and status='scheduled';
 if not found or public.booking_cutoff_v1(d.service_date,d.start_time)<=clock_timestamp() then raise exception 'Target booking closed' using errcode='PT410';end if;
 qty:=public.validate_passengers_v1(p_counts);
 select (select coalesce(sum(occupied_seats),0) from public.booking_items where departure_id=d.id and status='confirmed' and id<>i.id)+(select coalesce(sum(occupied_seats),0) from public.inventory_holds where departure_id=d.id and status='active' and expires_at>clock_timestamp()) into used;
 if used+(p_counts->>'adult')::integer+(p_counts->>'child')::integer>d.capacity then raise exception 'Insufficient capacity' using errcode='P0001';end if;
 snapshot:=public.passenger_quote_v1(i.product_id,d.service_date,d.start_time,p_counts);
 if (snapshot->>'total')::bigint is distinct from p_expected_total then raise exception 'Price changed' using errcode='PT409';end if;
 perform set_config('app.booking_modification','on',true);
 update public.booking_items set departure_id=d.id,quantity=qty,passenger_snapshot=snapshot,total_price=(snapshot->>'total')::bigint where id=i.id;
 perform set_config('app.booking_modification','',true);
 update public.orders set subtotal=(snapshot->>'subtotal')::bigint,total=(snapshot->>'total')::bigint where id=o.id;
 update public.bookings set management_version=management_version+1 where id=b.id;
 -- Use the same transaction key as the existing item-change trigger; no duplicate event.
 perform public.enqueue_domain_event(b.operator_id,null,'booking-edit:'||b.id::text||':'||txid_current()::text,'booking',b.id,'booking.modified',jsonb_build_object('bookingId',b.id,'orderId',o.id));
 perform public.record_domain_activity(b.operator_id,null,'customer-modify:'||b.id::text||':'||p_request::text,'booking',b.id,'booking.customer_change_applied',jsonb_build_object('departureId',d.id,'counts',p_counts,'expectedTotal',p_expected_total),'booking.customer_modified',jsonb_build_object('oldDeparture',i.departure_id,'oldSnapshot',i.passenger_snapshot,'newDeparture',d.id,'newSnapshot',snapshot));
 return public.customer_booking_v1(p_token);
end $$;
create function public.cancel_customer_booking_v1(p_token text) returns jsonb language plpgsql set search_path='' as $$
declare b public.bookings;begin
 perform public.customer_booking_v1(p_token);
 select * into b from public.bookings where management_token=p_token;
 perform public.cancel_order_v1(b.operator_id,b.order_id,null,'Cancelled by customer',p_token);
 return public.customer_booking_v1(p_token);
end $$;
revoke all on function public.customer_booking_v1(text),public.customer_booking_availability_v1(text,date,jsonb),public.modify_customer_booking_v1(text,integer,uuid,jsonb,bigint,uuid),public.cancel_customer_booking_v1(text) from public,anon,authenticated;
grant execute on function public.customer_booking_v1(text),public.customer_booking_availability_v1(text,date,jsonb),public.modify_customer_booking_v1(text,integer,uuid,jsonb,bigint,uuid),public.cancel_customer_booking_v1(text) to service_role;
do $$ declare definition text;begin
 select pg_get_functiondef('public.create_meeting_point_booking_v1(uuid,uuid,text,text,text,text)'::regprocedure) into definition;
 execute replace(definition,'''bookingReference'',b.booking_reference','''managementToken'',b.management_token,''bookingReference'',b.booking_reference');
 select pg_get_functiondef('public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb)'::regprocedure) into definition;
 execute replace(definition,'''reference'',b.booking_reference','''managementToken'',b.management_token,''reference'',b.booking_reference');
end $$;
commit;
