begin;
alter table public.notification_deliveries drop constraint notification_deliveries_operator_id_booking_id_key;
alter table public.notification_deliveries add column recipient_type text check(recipient_type in ('customer','owner')), add column event_type text check(event_type in ('BOOKING_CREATED','BOOKING_MODIFIED','BOOKING_CANCELLED')), add column manual boolean not null default false, add column booking_reference text, add column send_snapshot jsonb, add column envelope jsonb, add column first_send_at timestamptz;
create unique index notification_legacy_booking on public.notification_deliveries(operator_id,booking_id) where recipient_type is null;
create unique index notification_event_recipient on public.notification_deliveries(operator_id,event_id,recipient_type) where recipient_type is not null;

-- Changes capture only meaningful edits; no email/network call in a transaction.
create function public.capture_booking_email_change_v1() returns trigger language plpgsql set search_path='' as $$
declare b public.bookings;
begin
 if tg_table_name='customers' then
  if row(new.name,new.email,new.phone) is not distinct from row(old.name,old.email,old.phone) then return new; end if;
  for b in select bk.* from public.bookings bk join public.orders o on o.operator_id=bk.operator_id and o.id=bk.order_id where o.operator_id=new.operator_id and o.customer_id=new.id and bk.status='confirmed' loop
   perform public.enqueue_domain_event(b.operator_id,null,'booking-edit:'||b.id::text||':'||txid_current()::text,'booking',b.id,'booking.modified',jsonb_build_object('bookingId',b.id,'orderId',b.order_id));
  end loop;
 else
  if row(new.product_id,new.departure_id,new.quantity) is not distinct from row(old.product_id,old.departure_id,old.quantity) then return new; end if;
  select * into b from public.bookings where operator_id=new.operator_id and order_id=new.order_id and status='confirmed';
  if found then perform public.enqueue_domain_event(b.operator_id,null,'booking-edit:'||b.id::text||':'||txid_current()::text,'booking',b.id,'booking.modified',jsonb_build_object('bookingId',b.id,'orderId',b.order_id)); end if;
 end if;
 return new;
end $$;
create trigger email_customer_change after update of name,email,phone on public.customers for each row execute function public.capture_booking_email_change_v1();
create trigger email_item_change after update of product_id,departure_id,quantity on public.booking_items for each row execute function public.capture_booking_email_change_v1();
revoke all on function public.capture_booking_email_change_v1() from public,anon,authenticated;

create function public.enqueue_booking_emails_v2(p_operator_id uuid,p_since timestamptz) returns integer language plpgsql set search_path='' as $$
declare n integer;
begin
 if p_since is null or not isfinite(p_since) then raise exception 'Activation time required'; end if;
 insert into public.notification_deliveries(operator_id,event_id,booking_id,recipient_type,event_type,manual,channel,booking_reference)
 select e.operator_id,e.id,b.id,r.kind,case e.event_type when 'order.cancelled' then 'BOOKING_CANCELLED' when 'booking.modified' then 'BOOKING_MODIFIED' else 'BOOKING_CREATED' end,e.event_type='booking.email_resend_requested','email',b.booking_reference
 from public.domain_events e join public.bookings b on b.operator_id=e.operator_id and (b.id::text=e.payload->>'bookingId' or (e.event_type='order.cancelled' and b.order_id::text=e.payload->>'orderId')) cross join (values('customer'),('owner')) r(kind)
 where e.operator_id=p_operator_id and e.created_at>=p_since and e.schema_version=1 and e.event_type in ('booking.confirmed','booking.modified','order.cancelled','booking.email_resend_requested') and b.confirmed_at is not null
 and not exists(select 1 from public.notification_deliveries d where d.operator_id=e.operator_id and d.event_id=e.id and d.recipient_type=r.kind)
 order by e.created_at,e.id,r.kind limit 200 on conflict do nothing;
 get diagnostics n=row_count;return n;
end $$;

create function public.claim_booking_email_v2(p_operator_id uuid) returns setof public.notification_deliveries language plpgsql set search_path='' as $$
begin
 update public.notification_deliveries set status=case when attempt_count>=5 or first_send_at<clock_timestamp()-interval '23 hours' then 'uncertain' else 'retry' end,lease_token=null,lease_until=null,last_error_code='worker_lease_expired' where operator_id=p_operator_id and recipient_type is not null and status in ('leased','sending') and lease_until<=clock_timestamp();
 update public.notification_deliveries set status='uncertain',last_error_code='idempotency_window_expired' where operator_id=p_operator_id and recipient_type is not null and status='retry' and first_send_at<clock_timestamp()-interval '23 hours';
 return query with candidate as(select id from public.notification_deliveries where operator_id=p_operator_id and recipient_type is not null and status in ('pending','retry') and next_attempt_at<=clock_timestamp() and attempt_count<5 order by created_at,id for update skip locked limit 1)
 update public.notification_deliveries d set status='leased',attempt_count=attempt_count+1,lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',updated_at=clock_timestamp() from candidate c where d.id=c.id returning d.*;
end $$;

create function public.prepare_booking_email_v2(p_operator_id uuid,p_id uuid,p_token uuid,p_envelope jsonb) returns public.notification_deliveries language plpgsql set search_path='' as $$
declare job public.notification_deliveries; snapshot jsonb;
begin
 select * into job from public.notification_deliveries where operator_id=p_operator_id and id=p_id and recipient_type is not null and status='leased' and lease_token=p_token and lease_until>clock_timestamp() for update;
 if not found then raise exception 'Lease unavailable'; end if;
 -- Never retry a stale confirmation once cancellation has committed.
 if job.event_type<>'BOOKING_CANCELLED' and not exists(select 1 from public.bookings where operator_id=p_operator_id and id=job.booking_id and status='confirmed') then
 update public.notification_deliveries set status='skipped',last_error_code='booking_not_confirmed',lease_token=null,lease_until=null,updated_at=clock_timestamp() where id=job.id returning * into job;return job;end if;
 if job.send_snapshot is null then
 select jsonb_build_object('reference',b.booking_reference,'status',b.status,'name',c.name,'email',c.email,'phone',c.phone,'createdAt',o.created_at,'cancelledAt',b.cancelled_at,'currency',o.currency,'total',o.total,'collectionMode',o.collection_mode,'paid',exists(select 1 from public.payments p where p.operator_id=o.operator_id and p.order_id=o.id and p.status='paid'),'paymentStatuses',(select coalesce(jsonb_agg(distinct p.status),'[]'::jsonb) from public.payments p where p.operator_id=o.operator_id and p.order_id=o.id),'refundStatuses',(select coalesce(jsonb_agg(distinct r.status),'[]'::jsonb) from public.refunds r join public.payments p on p.operator_id=r.operator_id and p.id=r.payment_id where p.operator_id=o.operator_id and p.order_id=o.id),'refundReview',exists(select 1 from public.domain_events e where e.operator_id=o.operator_id and e.event_type='refund.review_requested' and e.aggregate_id=o.id),'source',case when exists(select 1 from public.domain_events e where e.operator_id=o.operator_id and e.aggregate_id=b.id and e.event_type='booking.staff_created') then 'Staff' else 'Online' end,'initiatedBy',case when ev.actor_id is not null then 'Staff' else null end,'reason',(select metadata->>'reason' from public.audit_logs where operator_id=o.operator_id and entity_id=o.id and action='order.cancelled' order by created_at desc limit 1),'items',(select coalesce(jsonb_agg(jsonb_build_object('title',p.title,'date',d.service_date,'time',d.start_time,'timezone',op.timezone,'guests',i.quantity) order by i.id),'[]'::jsonb) from public.booking_items i join public.products p on p.operator_id=i.operator_id and p.id=i.product_id left join public.departures d on d.operator_id=i.operator_id and d.id=i.departure_id where i.operator_id=o.operator_id and i.order_id=o.id)) into snapshot
 from public.bookings b join public.orders o on o.operator_id=b.operator_id and o.id=b.order_id join public.customers c on c.operator_id=o.operator_id and c.id=o.customer_id join public.operators op on op.id=o.operator_id join public.domain_events ev on ev.id=job.event_id where b.operator_id=p_operator_id and b.id=job.booking_id;
 if snapshot is null then raise exception 'Booking unavailable'; end if;
 if job.event_type<>'BOOKING_CANCELLED' and snapshot->>'status'<>'confirmed' then
 update public.notification_deliveries set status='skipped',last_error_code='booking_not_confirmed',lease_token=null,lease_until=null where id=job.id returning * into job;return job;end if;
 update public.notification_deliveries set send_snapshot=snapshot,envelope=p_envelope where id=job.id returning * into job;
 end if;
 update public.notification_deliveries set status='sending',first_send_at=coalesce(first_send_at,clock_timestamp()),updated_at=clock_timestamp() where id=job.id returning * into job;
 return job;
end $$;

create function public.request_booking_email_v2(p_operator_id uuid,p_actor_id uuid,p_booking_id uuid,p_request_id uuid) returns uuid language plpgsql set search_path='' as $$
declare b public.bookings; existing uuid;
begin
 if p_request_id is null or not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then raise exception 'Permission required' using errcode='42501';end if;
 select * into b from public.bookings where operator_id=p_operator_id and id=p_booking_id for update;
 if not found or b.status<>'confirmed' then raise exception 'Confirmed booking required';end if;
 select id into existing from public.domain_events where operator_id=p_operator_id and idempotency_key='email-manual:'||b.id::text||':'||p_request_id::text;
 if found then return existing;end if;
 if exists(select 1 from public.domain_events where operator_id=p_operator_id and aggregate_id=b.id and event_type='booking.email_resend_requested' and created_at>clock_timestamp()-interval '5 minutes') then raise exception 'Wait five minutes before another resend';end if;
 select event_id into existing from public.record_domain_activity(p_operator_id,p_actor_id,'email-manual:'||b.id::text||':'||p_request_id::text,'booking',b.id,'booking.email_resend_requested',jsonb_build_object('bookingId',b.id,'orderId',b.order_id),'booking.email_resend_requested','{}'::jsonb);
 return existing;
end $$;

create function public.redact_booking_email_logs_v2(p_operator_id uuid) returns integer language plpgsql set search_path='' as $$
declare n integer;
begin
 update public.notification_deliveries set send_snapshot=null,envelope=null,last_error_code=null where operator_id=p_operator_id and recipient_type is not null and status in ('accepted','failed','skipped','uncertain') and updated_at<clock_timestamp()-interval '60 days' and (send_snapshot is not null or envelope is not null);
 get diagnostics n=row_count;return n;
end $$;
revoke all on function public.enqueue_booking_emails_v2(uuid,timestamptz),public.claim_booking_email_v2(uuid),public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb),public.request_booking_email_v2(uuid,uuid,uuid,uuid),public.redact_booking_email_logs_v2(uuid) from public,anon,authenticated;
grant execute on function public.enqueue_booking_emails_v2(uuid,timestamptz),public.claim_booking_email_v2(uuid),public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb),public.request_booking_email_v2(uuid,uuid,uuid,uuid),public.redact_booking_email_logs_v2(uuid) to service_role;
-- Isolate the original inactive WhatsApp/fallback worker from event emails.
create or replace function public.enqueue_booking_notifications_v1(p_operator_id uuid,p_since timestamptz) returns integer language plpgsql set search_path='' as $$
declare n integer;
begin
 if p_operator_id is null or p_since is null or not isfinite(p_since) then raise exception 'Operator and start time required' using errcode='22023'; end if;
 insert into public.notification_deliveries(operator_id,event_id,booking_id)
 select e.operator_id,e.id,b.id from public.domain_events e join public.bookings b on b.operator_id=e.operator_id and b.id::text=e.payload->>'bookingId'
 where e.operator_id=p_operator_id and e.created_at>=p_since and e.schema_version=1 and e.event_type in ('booking.confirmed','customer.notification.requested')
 and e.payload->>'orderId'=b.order_id::text and b.status='confirmed'
 and not exists(select 1 from public.notification_deliveries n where n.operator_id=e.operator_id and n.booking_id=b.id)
 order by e.created_at,e.id limit 200 on conflict(operator_id,booking_id) where recipient_type is null do nothing;
 get diagnostics n=row_count;return n;
end;
$$;
create or replace function public.claim_booking_notification_v1(p_operator_id uuid) returns setof public.notification_deliveries language plpgsql set search_path='' as $$
begin
 -- A crashed sender may already have reached the provider. Never blindly resend it.
 update public.notification_deliveries set status='uncertain',last_error_code='sender_lease_expired',lease_token=null,lease_until=null,updated_at=clock_timestamp() where operator_id=p_operator_id and recipient_type is null and status='sending' and lease_until<=clock_timestamp();
 update public.notification_deliveries set status=case when attempt_count>=5 then 'failed' else 'retry' end,last_error_code='worker_lease_expired',lease_token=null,lease_until=null,updated_at=clock_timestamp() where operator_id=p_operator_id and recipient_type is null and status='leased' and lease_until<=clock_timestamp();
 return query with candidate as(select id from public.notification_deliveries where operator_id=p_operator_id and recipient_type is null and status in ('pending','retry') and next_attempt_at<=clock_timestamp() and attempt_count<5 order by next_attempt_at,id for update skip locked limit 1)
 update public.notification_deliveries n set status='leased',attempt_count=n.attempt_count+1,lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',updated_at=clock_timestamp() from candidate c where n.id=c.id returning n.*;
end;
$$;

commit;
