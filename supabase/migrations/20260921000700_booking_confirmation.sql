begin;
create function public.prepare_booking_v1(p_operator_id uuid,p_order_id uuid,p_session_key text)
returns public.bookings language plpgsql set search_path='' as $$
declare h public.inventory_holds; o public.orders; b public.bookings;
begin
  select * into h from public.inventory_holds where operator_id=p_operator_id and order_id=p_order_id and session_key=p_session_key;
  if not found then raise exception 'Checkout unavailable' using errcode='P0002'; end if;
  perform 1 from public.departures where operator_id=p_operator_id and id=h.departure_id for update;
  select * into o from public.orders where operator_id=p_operator_id and id=p_order_id for update;
  select * into h from public.inventory_holds where id=h.id for update;
  select * into b from public.bookings where operator_id=p_operator_id and order_id=p_order_id;
  if found then return b; end if;
  if o.status<>'pending' or h.status<>'active' or h.expires_at<=clock_timestamp() then
    raise exception 'Checkout inactive' using errcode='P0001';
  end if;
  insert into public.bookings(operator_id,order_id,booking_reference)
    values(p_operator_id,p_order_id,'SS-'||gen_random_uuid()::text) returning * into b;
  update public.orders set status='awaiting_payment' where id=o.id;
  return b;
end;
$$;

-- Trusted payment processing only: consumes persisted paid evidence, never marks a payment paid.
create function public.confirm_booking_v1(p_operator_id uuid,p_order_id uuid,p_payment_id uuid)
returns public.bookings language plpgsql set search_path='' as $$
declare h public.inventory_holds; o public.orders; b public.bookings; pay public.payments;
  d public.departures; item public.booking_items; used bigint;
begin
  if (select count(*) from public.inventory_holds where operator_id=p_operator_id and order_id=p_order_id)<>1 then
    raise exception 'Unsupported checkout inventory' using errcode='P0001';
  end if;
  select * into h from public.inventory_holds where operator_id=p_operator_id and order_id=p_order_id;
  select * into d from public.departures where operator_id=p_operator_id and id=h.departure_id for update;
  select * into o from public.orders where operator_id=p_operator_id and id=p_order_id for update;
  select * into h from public.inventory_holds where id=h.id for update;
  select * into pay from public.payments where operator_id=p_operator_id and id=p_payment_id and order_id=p_order_id for update;
  if not found or pay.status<>'paid' or pay.provider_ref is null or pay.amount<>o.total or pay.currency<>o.currency then
    raise exception 'Settled payment required' using errcode='P0001';
  end if;
  select * into b from public.bookings where operator_id=p_operator_id and order_id=p_order_id for update;
  if not found then raise exception 'Booking unavailable' using errcode='P0002'; end if;
  if o.status='confirmed' and b.status='confirmed' and h.status='consumed' then return b; end if;
  if o.status<>'awaiting_payment' or b.status<>'pending' or h.status<>'active' or h.expires_at<=clock_timestamp() then
    raise exception 'Booking cannot be confirmed' using errcode='P0001';
  end if;
  if (select count(*) from public.booking_items where operator_id=p_operator_id and order_id=p_order_id)<>1 then
    raise exception 'Unsupported checkout items' using errcode='P0001';
  end if;
  select * into item from public.booking_items where operator_id=p_operator_id and order_id=p_order_id for update;
  if item.status<>'pending' or item.departure_id is distinct from h.departure_id or item.quantity<>h.quantity
    or item.product_id<>d.product_id or item.total_price<>o.total or o.subtotal<>o.total
    or item.unit_price::numeric*item.quantity<>o.total or d.status<>'scheduled'
    or (select (d.service_date+d.start_time) at time zone timezone from public.operators where id=p_operator_id)<=clock_timestamp() then
    raise exception 'Invalid checkout inventory or totals' using errcode='P0001';
  end if;
  select (select coalesce(sum(quantity),0) from public.booking_items where operator_id=p_operator_id and departure_id=d.id and status='confirmed')
    +(select coalesce(sum(quantity),0) from public.inventory_holds where operator_id=p_operator_id and departure_id=d.id and status='active' and expires_at>clock_timestamp()) into used;
  if used>d.capacity then raise exception 'Capacity reconciliation required' using errcode='P0001'; end if;
  update public.inventory_holds set status='consumed' where id=h.id;
  update public.booking_items set status='confirmed' where id=item.id;
  update public.orders set status='paid' where id=o.id;
  update public.orders set status='confirmed' where id=o.id;
  update public.bookings set status='confirmed' where id=b.id returning * into b;
  perform public.record_domain_activity(p_operator_id,null,'booking-confirmed:'||b.id::text,'booking',b.id,
    'booking.confirmed',jsonb_build_object('bookingId',b.id,'orderId',o.id),'booking.confirmed',jsonb_build_object('paymentId',pay.id));
  return b;
end;
$$;
revoke all on function public.prepare_booking_v1(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.confirm_booking_v1(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.prepare_booking_v1(uuid,uuid,text) to service_role;
grant execute on function public.confirm_booking_v1(uuid,uuid,uuid) to service_role;
commit;
