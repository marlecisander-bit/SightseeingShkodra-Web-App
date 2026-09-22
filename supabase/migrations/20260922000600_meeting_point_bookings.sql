begin;
alter table public.orders add column collection_mode text not null default 'online' check(collection_mode in ('online','meeting_point'));
create function public.guard_collection_mode() returns trigger language plpgsql set search_path='' as $$
begin
  if new.collection_mode is distinct from old.collection_mode and (old.status<>'pending' or old.collection_mode<>'online' or exists(select 1 from public.payments where operator_id=old.operator_id and order_id=old.id)) then
    raise exception 'Collection mode is immutable after checkout' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_collection_mode() from public,anon,authenticated;
create trigger guard_collection_mode before update on public.orders for each row execute function public.guard_collection_mode();
create or replace function public.guard_booking_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare allowed boolean := false;
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'pending' then
      raise exception 'New % records must start pending', tg_table_name using errcode = '23514';
    end if;
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  case tg_table_name
    when 'orders' then
      allowed := case old.status
        when 'pending' then new.status in ('awaiting_payment', 'cancelled', 'expired') or (new.status='confirmed' and new.collection_mode='meeting_point')
        when 'awaiting_payment' then new.status in ('paid', 'cancelled', 'expired')
        when 'paid' then new.status in ('confirmed', 'cancelled', 'partially_refunded', 'refunded')
        when 'confirmed' then new.status in ('cancelled', 'partially_refunded', 'refunded')
        when 'cancelled' then new.status in ('partially_refunded', 'refunded')
        when 'partially_refunded' then new.status = 'refunded'
        else false end;
    when 'payments' then
      allowed := case old.status
        when 'pending' then new.status in ('processing', 'paid', 'failed')
        when 'processing' then new.status in ('paid', 'failed')
        -- A provider attempt can be retried or later report a verified success.
        when 'failed' then new.status in ('processing', 'paid')
        when 'paid' then new.status in ('partially_refunded', 'refunded')
        when 'partially_refunded' then new.status = 'refunded'
        else false end;
    when 'bookings', 'booking_items' then
      allowed := case old.status
        when 'pending' then new.status in ('confirmed', 'cancelled', 'expired')
        when 'confirmed' then new.status = 'cancelled'
        else false end;
    else
      raise exception 'Unexpected lifecycle table' using errcode = '23514';
  end case;

  if not coalesce(allowed, false) then
    raise exception 'Invalid % transition: % -> %', tg_table_name, old.status, new.status using errcode = '23514';
  end if;
  return new;
end;
$$;

create function public.create_meeting_point_booking_v1(p_operator_id uuid,p_hold_id uuid,p_session_key text,p_customer_name text,p_customer_email text,p_customer_phone text default null)
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
    if item.status<>'pending' or item.departure_id is distinct from h.departure_id or item.product_id<>d.product_id or item.quantity<>h.quantity or item.total_price<>o.total or o.subtotal<>o.total or item.unit_price::numeric*item.quantity<>o.total then raise exception 'Invalid inventory' using errcode='P0001'; end if;
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
    'items',(select jsonb_agg(jsonb_build_object('id',i.id,'productId',i.product_id,'departureId',i.departure_id,'quantity',i.quantity,'unitPrice',i.unit_price,'total',i.total_price,'status',i.status) order by i.id) from public.booking_items i where i.operator_id=p_operator_id and i.order_id=o.id));
end;
$$;
revoke all on function public.create_meeting_point_booking_v1(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.create_meeting_point_booking_v1(uuid,uuid,text,text,text,text) to service_role;

create unique index one_meeting_point_receipt_per_order on public.payments(operator_id,order_id) where provider='meeting_point';
create function public.collect_meeting_point_payment_v1(p_operator_id uuid,p_order_id uuid,p_actor_id uuid)
returns uuid language plpgsql set search_path='' as $$
declare o public.orders; pay public.payments;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then raise exception 'Collection permission required' using errcode='42501'; end if;
  select * into o from public.orders where operator_id=p_operator_id and id=p_order_id for update;
  if not found then raise exception 'Order unavailable' using errcode='P0002'; end if;
  if o.status<>'confirmed' or o.collection_mode<>'meeting_point' then raise exception 'Confirmed meeting-point booking required' using errcode='P0001'; end if;
  select * into pay from public.payments where operator_id=p_operator_id and order_id=o.id and provider='meeting_point' for update;
  if found then
    if pay.status='paid' and pay.amount=o.total and pay.currency=o.currency then return pay.id; end if;
    raise exception 'Payment requires reconciliation' using errcode='P0001';
  end if;
  if exists(select 1 from public.payments where operator_id=p_operator_id and order_id=o.id) then raise exception 'Payment requires reconciliation' using errcode='P0001'; end if;
  insert into public.payments(operator_id,order_id,provider,provider_ref,amount,currency) values(p_operator_id,o.id,'meeting_point','collection:'||o.id::text,o.total,o.currency) returning * into pay;
  update public.payments set status='paid' where id=pay.id;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'meeting-point-collected:'||o.id::text,'payment',pay.id,'payment.collected',jsonb_build_object('orderId',o.id,'paymentId',pay.id),'payment.collected',jsonb_build_object('amount',o.total,'currency',o.currency));
  return pay.id;
end;
$$;
revoke all on function public.collect_meeting_point_payment_v1(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.collect_meeting_point_payment_v1(uuid,uuid,uuid) to service_role;
create policy meeting_point_operations_read on public.payments for select to authenticated using(provider='meeting_point' and private.has_staff_role(operator_id,array['operations']));
create or replace function public.create_staff_booking_v1(p_operator_id uuid,p_actor_id uuid,p_departure_id uuid,p_request_id uuid,
  p_quantity integer,p_name text,p_email text,p_phone text default null)
returns jsonb language plpgsql set search_path='' as $$
declare h public.inventory_holds; o jsonb; b public.bookings; session_key text;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then
    raise exception 'Booking creation permission required' using errcode='42501'; end if;
  -- Internal session capability is never supplied by a browser.
  session_key := 'staff:'||p_actor_id::text||':'||p_request_id::text;
  select * into h from public.create_hold_v1(p_operator_id,p_departure_id,session_key,p_request_id,p_quantity);
  o := public.create_meeting_point_booking_v1(p_operator_id,h.id,session_key,p_name,p_email,p_phone);
  select * into b from public.bookings where operator_id=p_operator_id and order_id=(o->>'orderId')::uuid;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'staff-booking:'||b.id::text,'booking',b.id,
    'booking.staff_created',jsonb_build_object('bookingId',b.id),'booking.staff_created',jsonb_build_object('orderId',b.order_id));
  return jsonb_build_object('version',1,'bookingId',b.id,'orderId',b.order_id,'reference',b.booking_reference,
    'status',b.status,'total',o->'total','currency',o->'currency','expiresAt',h.expires_at);
end;
$$;

commit;
