begin;
create function public.create_staff_booking_v1(p_operator_id uuid,p_actor_id uuid,p_departure_id uuid,p_request_id uuid,
  p_quantity integer,p_name text,p_email text,p_phone text default null)
returns jsonb language plpgsql set search_path='' as $$
declare h public.inventory_holds; o jsonb; b public.bookings; session_key text;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then
    raise exception 'Booking creation permission required' using errcode='42501'; end if;
  -- Internal session capability is never supplied by a browser.
  session_key := 'staff:'||p_actor_id::text||':'||p_request_id::text;
  select * into h from public.create_hold_v1(p_operator_id,p_departure_id,session_key,p_request_id,p_quantity);
  o := public.create_pending_order_v1(p_operator_id,h.id,session_key,p_name,p_email,p_phone);
  select * into b from public.prepare_booking_v1(p_operator_id,(o->>'orderId')::uuid,session_key);
  perform public.record_domain_activity(p_operator_id,p_actor_id,'staff-booking:'||b.id::text,'booking',b.id,
    'booking.staff_created',jsonb_build_object('bookingId',b.id),'booking.staff_created',jsonb_build_object('orderId',b.order_id));
  return jsonb_build_object('version',1,'bookingId',b.id,'orderId',b.order_id,'reference',b.booking_reference,
    'status',b.status,'total',o->'total','currency',o->'currency','expiresAt',h.expires_at);
end;
$$;
revoke all on function public.create_staff_booking_v1(uuid,uuid,uuid,uuid,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.create_staff_booking_v1(uuid,uuid,uuid,uuid,integer,text,text,text) to service_role;
commit;
