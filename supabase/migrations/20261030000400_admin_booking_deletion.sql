begin;
-- Keep backfill and trigger installation atomic with concurrent booking creation.
lock table public.bookings in share row exclusive mode;
-- Permanent reservation removal with a minimal retained identity for financial/delivery history.
create table public.booking_record_registry (
 id uuid primary key, operator_id uuid not null, order_id uuid not null,
 booking_reference text not null, created_at timestamptz not null default clock_timestamp(), deleted_at timestamptz, deleted_by uuid, deletion_reason text,
 unique(operator_id,id), unique(operator_id,order_id),
 foreign key(operator_id,order_id) references public.orders(operator_id,id),
 foreign key(operator_id,deleted_by) references public.staff_profiles(operator_id,id),
 check((deleted_at is null and deleted_by is null and deletion_reason is null) or
       (deleted_at is not null and deleted_by is not null and length(btrim(deletion_reason)) between 1 and 500))
);
alter table public.booking_record_registry enable row level security;
revoke all on public.booking_record_registry from public,anon,authenticated;
grant select,insert,update on public.booking_record_registry to service_role;
insert into public.booking_record_registry(id,operator_id,order_id,booking_reference,created_at)
 select id,operator_id,order_id,booking_reference,created_at from public.bookings;
create function public.guard_booking_registry_v1() returns trigger language plpgsql set search_path='' as $$
declare r public.booking_record_registry;
begin
 if tg_op='UPDATE' then
  if new.operator_id<>old.operator_id then raise exception 'Booking ownership is immutable' using errcode='23503'; end if;
  if row(new.id,new.order_id) is distinct from row(old.id,old.order_id) then raise exception 'Booking identity is immutable' using errcode='23514'; end if;
 end if;
 select * into r from public.booking_record_registry where operator_id=new.operator_id and order_id=new.order_id;
 if found then
  if r.deleted_at is not null then raise exception 'Deleted booking cannot be recreated' using errcode='PT409'; end if;
 else
  insert into public.booking_record_registry(id,operator_id,order_id,booking_reference) values(new.id,new.operator_id,new.order_id,new.booking_reference);
 end if;
 return new;
end $$;
create trigger zz_booking_registry_guard before insert or update of id,operator_id,order_id on public.bookings for each row execute function public.guard_booking_registry_v1();
revoke all on function public.guard_booking_registry_v1() from public,anon,authenticated;
-- Preserve exact tenant-scoped foreign keys; histories may reference live OR deleted identities.
do $$ declare c record; begin
 for c in select conrelid::regclass tbl,conname from pg_constraint
 where contype='f' and confrelid='public.bookings'::regclass loop
  if c.tbl::text not in ('notification_deliveries','admin_notifications','public.notification_deliveries','public.admin_notifications') then
   raise exception 'Unexpected booking dependency: %; migration stopped',c.tbl;
  end if;
  execute format('alter table %s drop constraint %I',c.tbl,c.conname);
  execute format('alter table %s add constraint %I foreign key(operator_id,booking_id) references public.booking_record_registry(operator_id,id)',c.tbl,c.conname);
 end loop;
end $$;

-- Queue insertions serialize with deletion, including projectors using an older snapshot.
create function public.guard_deleted_booking_delivery_v1() returns trigger language plpgsql set search_path='' as $$
declare bid uuid; removed timestamptz;
begin
 if tg_table_name='admin_push_deliveries' then
  select booking_id into bid from public.admin_notifications where operator_id=new.operator_id and id=new.notification_id;
 else bid:=new.booking_id; end if;
 select deleted_at into removed from public.booking_record_registry where operator_id=new.operator_id and id=bid for share;
 if found and removed is not null then return null; end if;
 return new;
end $$;
create trigger deleted_booking_delivery_guard before insert on public.notification_deliveries for each row execute function public.guard_deleted_booking_delivery_v1();
create trigger deleted_booking_notification_guard before insert on public.admin_notifications for each row execute function public.guard_deleted_booking_delivery_v1();
create trigger deleted_booking_push_guard before insert on public.admin_push_deliveries for each row execute function public.guard_deleted_booking_delivery_v1();
revoke all on function public.guard_deleted_booking_delivery_v1() from public,anon,authenticated;

create function public.delete_admin_booking_v1(p_operator uuid,p_actor uuid,p_booking uuid,p_reference text,p_reason text)
returns jsonb language plpgsql set search_path='' as $$
declare r public.booking_record_registry; o public.orders;
begin
 if not exists(select 1 from public.staff_profiles where operator_id=p_operator and id=p_actor and is_active and role='owner') then
  raise exception 'Owner access required' using errcode='42501';
 end if;
 if p_reference is null or length(p_reference) not between 1 and 200 or p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
  raise exception 'Reference and deletion reason required' using errcode='22023';
 end if;
 perform public.lock_seat_inventory_v1(p_operator);
 select * into r from public.booking_record_registry where operator_id=p_operator and id=p_booking for update;
 if not found or r.booking_reference<>p_reference then raise exception 'Booking reference does not match' using errcode='P0002'; end if;
 if r.deleted_at is not null then return jsonb_build_object('version',1,'bookingId',r.id,'deleted',true); end if;
 perform 1 from public.departures d where d.operator_id=p_operator and d.id in
  (select departure_id from public.inventory_holds where operator_id=p_operator and order_id=r.order_id union select departure_id from public.booking_items where operator_id=p_operator and order_id=r.order_id)
  order by d.id for update;
 select * into o from public.orders where operator_id=p_operator and id=r.order_id for update;
 perform 1 from public.bookings where operator_id=p_operator and id=p_booking for update;
 -- Lock payment and outbound work before checking; a claim either completes first or sees skipped work.
 perform 1 from public.payments where operator_id=p_operator and order_id=o.id order by id for update;
 perform 1 from public.notification_deliveries where operator_id=p_operator and booking_id=p_booking order by id for update;
 perform 1 from public.admin_push_deliveries where operator_id=p_operator and notification_id in
  (select id from public.admin_notifications where operator_id=p_operator and booking_id=p_booking) order by id for update;
 if exists(select 1 from public.payments where operator_id=p_operator and order_id=o.id and status in ('pending','processing')) or
    exists(select 1 from public.notification_deliveries where operator_id=p_operator and booking_id=p_booking and status in ('leased','sending')) or
    exists(select 1 from public.admin_push_deliveries d join public.admin_notifications n on n.operator_id=d.operator_id and n.id=d.notification_id where n.operator_id=p_operator and n.booking_id=p_booking and d.status='sending') then
  raise exception 'Payment or delivery in progress; retry after it finishes' using errcode='PT409';
 end if;
 if o.status in ('pending','awaiting_payment','paid','confirmed','cancelled') then
  perform public.cancel_order_v1(p_operator,o.id,p_actor,'Permanent deletion: '||left(btrim(p_reason),470));
 else
  update public.inventory_holds set status=case when expires_at<=clock_timestamp() then 'expired' else 'released' end
   where operator_id=p_operator and order_id=o.id and status='active';
  update public.booking_items set status='cancelled' where operator_id=p_operator and order_id=o.id and status in ('pending','confirmed');
 end if;
 if exists(select 1 from public.payments where operator_id=p_operator and order_id=o.id and status in ('paid','partially_refunded') and amount>0) then
  perform public.enqueue_domain_event(p_operator,null,'refund-review:'||o.id::text,'order',o.id,'refund.review_requested',jsonb_build_object('orderId',o.id));
 end if;
 update public.notification_deliveries set status='skipped',last_error_code='booking_deleted',lease_token=null,lease_until=null
  where operator_id=p_operator and booking_id=p_booking and status in ('pending','retry');
 update public.admin_push_deliveries set status='skipped',error_code='booking_deleted'
  where operator_id=p_operator and status='pending' and notification_id in(select id from public.admin_notifications where operator_id=p_operator and booking_id=p_booking);
 update public.admin_notification_receipts set visible=false where operator_id=p_operator and notification_id in
  (select id from public.admin_notifications where operator_id=p_operator and booking_id=p_booking);
 perform public.record_domain_activity(p_operator,p_actor,'booking-deleted:'||p_booking::text,'booking',p_booking,
  'booking.deleted',jsonb_build_object('bookingId',p_booking,'orderId',o.id),'booking.deleted',jsonb_build_object('bookingReference',p_reference,'reason',btrim(p_reason),'financialHistoryRetained',true));
 update public.booking_record_registry set deleted_at=clock_timestamp(),deleted_by=p_actor,deletion_reason=btrim(p_reason)
  where operator_id=p_operator and id=p_booking;
 delete from public.bookings where operator_id=p_operator and id=p_booking;
 return jsonb_build_object('version',1,'bookingId',p_booking,'deleted',true);
end $$;
revoke all on function public.delete_admin_booking_v1(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.delete_admin_booking_v1(uuid,uuid,uuid,text,text) to service_role;
-- Keep retained financial orders out of the reservation list, before counting/pagination.
do $$ declare def text;begin
 select pg_get_functiondef('public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer)'::regprocedure) into def;
 if strpos(def,'where o.operator_id=p_operator')=0 then raise exception 'Booking search differs; migration stopped'; end if;
 execute replace(def,'where o.operator_id=p_operator','where o.operator_id=p_operator and not exists(select 1 from public.booking_record_registry deleted where deleted.operator_id=o.operator_id and deleted.order_id=o.id and deleted.deleted_at is not null)');
end $$;
commit;
