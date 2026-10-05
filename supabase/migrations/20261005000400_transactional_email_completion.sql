begin;
-- Extend the existing queue. No booking/capacity function is replaced.
alter table public.notification_deliveries add column recipient_email text, add column provider text, add column sent_at timestamptz;

alter function public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb) rename to prepare_booking_email_legacy_v2;
create function public.prepare_booking_email_v2(p_operator_id uuid,p_id uuid,p_token uuid,p_envelope jsonb) returns public.notification_deliveries language plpgsql set search_path='' as $$
declare job public.notification_deliveries; fresh boolean; details jsonb; previous jsonb;
begin
 select * into job from public.notification_deliveries where operator_id=p_operator_id and id=p_id and status='leased' and lease_token=p_token and lease_until>clock_timestamp() for update;
 if not found then raise exception 'Lease unavailable'; end if;
 fresh:=job.send_snapshot is null;
 job:=public.prepare_booking_email_legacy_v2(p_operator_id,p_id,p_token,p_envelope);
 if job.status='skipped' then return job; end if;
 if fresh and p_envelope->>'version'='2' then
  select jsonb_build_object('qrToken',case when b.status='confirmed' then b.qr_token else null end,'items',
   (select jsonb_agg(jsonb_build_object('title',p.title,'description',p.meta_description,'inclusions',p.inclusions,'date',d.service_date,'time',d.start_time,'timezone',op.timezone,'guests',i.quantity,'seats',i.occupied_seats,'counts',i.passenger_snapshot->'counts') order by i.id)
    from public.booking_items i join public.products p on p.operator_id=i.operator_id and p.id=i.product_id left join public.departures d on d.operator_id=i.operator_id and d.id=i.departure_id where i.operator_id=b.operator_id and i.order_id=b.order_id)) into details
  from public.bookings b join public.operators op on op.id=b.operator_id where b.operator_id=p_operator_id and b.id=job.booking_id;
  -- Only use the reliable old snapshot recorded by the same modification transaction.
  select jsonb_build_object('date',d.service_date,'time',d.start_time,'counts',a.metadata->'oldSnapshot'->'counts','total',a.metadata->'oldSnapshot'->'total') into previous
  from public.domain_events ev join public.audit_logs a on a.operator_id=ev.operator_id and a.entity_id=job.booking_id and a.action='booking.customer_modified' and a.created_at=ev.created_at
  join public.departures d on d.operator_id=a.operator_id and d.id::text=a.metadata->>'oldDeparture'
  where ev.id=job.event_id and ev.event_type='booking.modified' and jsonb_typeof(a.metadata->'oldSnapshot'->'counts')='object'
   and exists(select 1 from public.booking_items i join public.bookings b on b.operator_id=i.operator_id and b.order_id=i.order_id where b.id=job.booking_id and b.operator_id=p_operator_id and i.departure_id::text=a.metadata->>'newDeparture' and i.passenger_snapshot=a.metadata->'newSnapshot')
   and not exists(select 1 from public.domain_events later where later.operator_id=ev.operator_id and later.aggregate_id=ev.aggregate_id and later.event_type='booking.modified' and later.created_at>ev.created_at)
  limit 1;
  update public.notification_deliveries set send_snapshot=send_snapshot||details||jsonb_build_object('previous',previous) where id=job.id returning * into job;
 end if;
 update public.notification_deliveries set provider='resend',recipient_email=coalesce(job.envelope->>'testRecipient',case when job.recipient_type='owner' then job.envelope->>'owner' else job.send_snapshot->>'email' end) where id=job.id returning * into job;
 return job;
end $$;
revoke all on function public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb) to service_role;

create function public.capture_email_acceptance_v1() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='accepted' and old.status is distinct from 'accepted' then new.sent_at:=clock_timestamp(); end if;
 return new;
end $$;
create trigger email_acceptance_time before update of status on public.notification_deliveries for each row execute function public.capture_email_acceptance_v1();
revoke all on function public.capture_email_acceptance_v1() from public,anon,authenticated;

-- A recipient-specific resend is a new audited attempt, not a retry with a changed payload.
create function public.request_booking_email_recipient_v1(p_operator_id uuid,p_actor_id uuid,p_delivery_id uuid,p_request_id uuid) returns uuid language plpgsql set search_path='' as $$
declare source public.notification_deliveries; b public.bookings; eid uuid; existing uuid;
begin
 if p_request_id is null or not exists(select 1 from public.staff_profiles where id=p_actor_id and operator_id=p_operator_id and is_active and role='owner') then raise exception 'Permission required' using errcode='42501'; end if;
 select * into source from public.notification_deliveries where operator_id=p_operator_id and id=p_delivery_id and recipient_type is not null;
 if not found then raise exception 'Delivery unavailable'; end if;
 select * into b from public.bookings where id=source.booking_id and operator_id=p_operator_id for update;
 select id into existing from public.domain_events where operator_id=p_operator_id and idempotency_key='email-recipient:'||p_request_id::text;
 if found then
  if not exists(select 1 from public.domain_events where id=existing and payload->>'deliveryId'=p_delivery_id::text) then raise exception 'Conflicting retry'; end if;
  return existing;
 end if;
 if source.status not in ('accepted','failed','uncertain') or (source.event_type='BOOKING_CANCELLED') is distinct from (b.status='cancelled') or b.status not in ('confirmed','cancelled') then raise exception 'Message does not match current booking'; end if;
 if exists(select 1 from public.domain_events where operator_id=p_operator_id and aggregate_id=b.id and event_type='booking.email_resend_requested' and (payload->>'recipientType'=source.recipient_type or not payload ? 'recipientType') and created_at>clock_timestamp()-interval '5 minutes') then raise exception 'Wait five minutes before another resend'; end if;
 if exists(select 1 from public.notification_deliveries where operator_id=p_operator_id and booking_id=b.id and recipient_type=source.recipient_type and status in ('pending','leased','sending','retry')) then raise exception 'An email is already pending'; end if;
 select event_id into eid from public.record_domain_activity(p_operator_id,p_actor_id,'email-recipient:'||p_request_id::text,'booking',b.id,'booking.email_resend_requested',jsonb_build_object('bookingId',b.id,'orderId',b.order_id,'deliveryId',source.id,'recipientType',source.recipient_type),'booking.email_resend_requested',jsonb_build_object('recipientType',source.recipient_type));
 insert into public.notification_deliveries(operator_id,event_id,booking_id,recipient_type,event_type,manual,channel,booking_reference) values(p_operator_id,eid,b.id,source.recipient_type,source.event_type,true,'email',b.booking_reference);
 return eid;
end $$;
revoke all on function public.request_booking_email_recipient_v1(uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.request_booking_email_recipient_v1(uuid,uuid,uuid,uuid) to service_role;

do $$ declare definition text; begin
 select pg_get_functiondef('public.enqueue_booking_emails_v2(uuid,timestamptz)'::regprocedure) into definition;
 if position('and b.confirmed_at is not null' in definition)=0 then raise exception 'Unexpected email enqueue definition'; end if;
 execute replace(definition,'and b.confirmed_at is not null','and b.confirmed_at is not null and not (e.event_type=''booking.email_resend_requested'' and e.payload ? ''recipientType'')');
end $$;

do $$ declare definition text; begin
 select pg_get_functiondef('public.redact_booking_email_logs_v2(uuid)'::regprocedure) into definition;
 execute replace(definition,'set send_snapshot=null,envelope=null,last_error_code=null','set recipient_email=null,send_snapshot=null,envelope=null,last_error_code=null');
end $$;
commit;
