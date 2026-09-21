begin;
create function public.cancel_order_v1(p_operator_id uuid,p_order_id uuid,p_actor_id uuid,p_reason text)
returns jsonb language plpgsql set search_path='' as $$
declare o public.orders; h public.inventory_holds; review_required boolean;
begin
  if p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
    raise exception 'Cancellation reason required' using errcode='22023';
  end if;
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then
    raise exception 'Staff cancellation permission required' using errcode='42501';
  end if;
  -- Preserve the departure-first locking protocol used by allocation/confirmation.
  perform 1 from public.departures d where d.operator_id=p_operator_id and d.id in
    (select departure_id from public.inventory_holds where operator_id=p_operator_id and order_id=p_order_id)
    order by d.id for update;
  select * into o from public.orders where operator_id=p_operator_id and id=p_order_id for update;
  if not found then raise exception 'Order unavailable' using errcode='P0002'; end if;
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
revoke all on function public.cancel_order_v1(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.cancel_order_v1(uuid,uuid,uuid,text) to service_role;
commit;
