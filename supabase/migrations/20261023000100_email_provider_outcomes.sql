begin;
-- Queue status remains the transport/lease state. Provider evidence is orthogonal.
alter table public.notification_deliveries
 add column provider_check_count integer not null default 0 check(provider_check_count between 0 and 4),
 add column provider_checked_at timestamptz,
 add column provider_status text check(provider_status in ('sent','delivered','delivery_delayed','bounced','failed','suppressed','complained')),
 add column provider_updated_at timestamptz,
 add column provider_reason text check(provider_reason is null or provider_reason in ('hard_bounce','soft_bounce','bounce','provider_failed','suppressed_by_provider','recipient_complaint','delivery_delayed')),
 add column delivery_state text generated always as (
  case when provider_status is not null and provider_status<>'sent' then provider_status
   when status in ('leased','sending') then 'processing' else status end
 ) stored;
-- Abort rather than ambiguously map an existing provider ID across operators.
create unique index notification_resend_message_unique on public.notification_deliveries(provider_reference)
 where provider='resend' and provider_reference is not null;

create table public.email_provider_events (
 id bigint generated always as identity primary key,
 provider_event_id text not null unique check(length(provider_event_id) between 1 and 200),
 provider_message_id text not null check(length(provider_message_id) between 1 and 200),
 operator_id uuid not null references public.operators(id),
 delivery_id uuid references public.notification_deliveries(id),
 source text not null default 'webhook' check(source in ('webhook','reconciliation')),
 kind text not null check(kind in ('sent','delivered','delivery_delayed','bounced','failed','suppressed','complained')),
 event_at timestamptz not null,
 created_at timestamptz not null default clock_timestamp(),
 reason text check(reason is null or reason in ('hard_bounce','soft_bounce','bounce','provider_failed','suppressed_by_provider','recipient_complaint','delivery_delayed')),
 foreign key(operator_id,delivery_id) references public.notification_deliveries(operator_id,id)
);
create index email_provider_message_lookup on public.email_provider_events(provider_message_id,event_at);
alter table public.email_provider_events enable row level security;
revoke all on public.email_provider_events from public,anon,authenticated;
grant select on public.email_provider_events to authenticated;
create policy email_provider_owner_read on public.email_provider_events for select to authenticated
 using(private.has_staff_role(operator_id,array['owner']));
grant all on public.email_provider_events to service_role;
grant usage,select on sequence public.email_provider_events_id_seq to service_role;

create function public.apply_email_provider_events_v1(p_delivery_id uuid) returns void language plpgsql set search_path='' as $$
declare d public.notification_deliveries; e public.email_provider_events;
begin
 select * into d from public.notification_deliveries where id=p_delivery_id for update;
 if not found or d.provider<>'resend' or d.provider_reference is null then return; end if;
 update public.email_provider_events set operator_id=d.operator_id,delivery_id=d.id
 where provider_message_id=d.provider_reference and operator_id=d.operator_id and delivery_id is null;
 -- Deterministic, conservative precedence. Adverse terminal evidence is never erased
 -- by late sent/delay/delivered events; every conflicting event remains in history.
 select * into e from public.email_provider_events where delivery_id=d.id and operator_id=d.operator_id
 order by case kind when 'complained' then 70 when 'suppressed' then 60 when 'bounced' then 50
  when 'failed' then 40 when 'delivered' then 30 when 'delivery_delayed' then 20 else 10 end desc,event_at desc,id desc limit 1;
 if found then
  update public.notification_deliveries set provider_status=e.kind,provider_reason=e.reason,updated_at=clock_timestamp(),
   provider_updated_at=(select max(event_at) from public.email_provider_events where delivery_id=d.id and operator_id=d.operator_id)
  where id=d.id;
 end if;
end $$;

create function public.record_email_provider_event_v1(p_operator_id uuid,p_event_id text,p_message_id text,p_kind text,p_event_at timestamptz,p_reason text default null,p_source text default 'webhook')
 returns text language plpgsql set search_path='' as $$
declare d public.notification_deliveries; existing public.email_provider_events;
begin
 if p_source is null or p_source not in ('webhook','reconciliation') or p_operator_id is null or p_event_id is null or p_event_id !~ '^[A-Za-z0-9_-]{1,200}$' or p_message_id is null or p_message_id !~ '^[A-Za-z0-9_-]{1,200}$'
 or p_kind is null or p_kind not in ('sent','delivered','delivery_delayed','bounced','failed','suppressed','complained')
 or p_event_at is null or not isfinite(p_event_at) or p_event_at>clock_timestamp()+interval '5 minutes'
 or p_event_at<'2020-01-01'::timestamptz then raise exception 'Invalid provider event'; end if;
 select * into existing from public.email_provider_events where provider_event_id=p_event_id;
 if found then
  if existing.source<>p_source or existing.operator_id<>p_operator_id or existing.provider_message_id<>p_message_id or existing.kind<>p_kind or existing.event_at<>p_event_at or existing.reason is distinct from p_reason then
   raise exception 'Conflicting provider event';
  end if;
  return 'duplicate';
 end if;
 select * into d from public.notification_deliveries where provider='resend' and provider_reference=p_message_id for update;
 if d.id is not null and d.operator_id<>p_operator_id then raise exception 'Provider workspace mismatch'; end if;
 insert into public.email_provider_events(provider_event_id,provider_message_id,kind,event_at,reason,operator_id,delivery_id,source)
 values(p_event_id,p_message_id,p_kind,p_event_at,p_reason,p_operator_id,d.id,p_source) on conflict(provider_event_id) do nothing;
 if not found then
  select * into existing from public.email_provider_events where provider_event_id=p_event_id;
  if existing.source<>p_source or existing.operator_id<>p_operator_id or existing.provider_message_id<>p_message_id or existing.kind<>p_kind or existing.event_at<>p_event_at or existing.reason is distinct from p_reason then raise exception 'Conflicting provider event'; end if;
  return 'duplicate';
 end if;
 if d.id is not null then perform public.apply_email_provider_events_v1(d.id); end if;
 return case when d.id is null then 'unmatched' else 'recorded' end;
end $$;

create function public.link_email_provider_events_v1() returns trigger language plpgsql set search_path='' as $$
begin
 if new.provider='resend' and new.provider_reference is not null then
  perform public.apply_email_provider_events_v1(new.id);
 end if;
 return new;
end $$;
create trigger link_email_provider_events after update of provider_reference on public.notification_deliveries
 for each row when(new.provider_reference is not null and old.provider_reference is distinct from new.provider_reference)
 execute function public.link_email_provider_events_v1();

-- A webhook can commit just after the provider-reference trigger has scanned. The
-- existing minute worker repairs that bounded race; it never resends a message.
create function public.link_pending_email_provider_events_v1(p_operator_id uuid) returns void language plpgsql set search_path='' as $$
declare delivery uuid;
begin
 for delivery in select distinct d.id from public.notification_deliveries d join public.email_provider_events e
 on e.provider_message_id=d.provider_reference where d.operator_id=p_operator_id and d.provider='resend' and e.operator_id=p_operator_id and e.delivery_id is null limit 100
 loop perform public.apply_email_provider_events_v1(delivery); end loop;
 -- Retain unmatched metadata for 7 days; bounded cleanup, never raw payloads.
 delete from public.email_provider_events where id in
 (select id from public.email_provider_events where operator_id=p_operator_id and delivery_id is null and created_at<clock_timestamp()-interval '7 days' order by id limit 200);
end $$;
revoke all on function public.link_pending_email_provider_events_v1(uuid) from public,anon,authenticated;
grant execute on function public.link_pending_email_provider_events_v1(uuid) to service_role;
do $$ declare definition text; begin
 select pg_get_functiondef('public.enqueue_booking_emails_v2(uuid,timestamptz)'::regprocedure) into definition;
 if position('begin' in definition)=0 then raise exception 'Unexpected enqueue definition'; end if;
 execute replace(definition,'begin','begin perform public.link_pending_email_provider_events_v1(p_operator_id);');
end $$;

-- Read-only provider lookups are reserved atomically, never queue another email.
create function public.claim_email_provider_check_v1(p_operator_id uuid) returns table(id uuid,provider_reference text,provider_check_count integer) language plpgsql set search_path='' as $$
begin
 return query with candidate as (
 select d.id from public.notification_deliveries d where d.operator_id=p_operator_id and d.provider='resend'
 and d.provider_reference is not null and d.status='accepted' and (d.provider_status is null or d.provider_status in ('sent','delivery_delayed'))
 and coalesce(d.sent_at,d.updated_at)>clock_timestamp()-interval '60 days'
 and coalesce(d.sent_at,d.updated_at)<clock_timestamp()-interval '15 minutes'
 and d.provider_check_count<4 and (d.provider_checked_at is null or d.provider_checked_at<clock_timestamp()-interval '6 hours')
 order by d.provider_checked_at nulls first,d.created_at desc for update skip locked limit 1)
 update public.notification_deliveries d set provider_check_count=d.provider_check_count+1,provider_checked_at=clock_timestamp()
 from candidate c where d.id=c.id returning d.id,d.provider_reference,d.provider_check_count;
end $$;
revoke all on function public.claim_email_provider_check_v1(uuid) from public,anon,authenticated;
grant execute on function public.claim_email_provider_check_v1(uuid) to service_role;

create function public.email_delivery_health_v1(p_operator_id uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object(
  'providerFailures',count(*) filter(where provider_status in ('bounced','failed','suppressed','complained')),
  'delayed',count(*) filter(where provider_status='delivery_delayed'),
  'missingOutcome',count(*) filter(where status='accepted' and (provider_status is null or provider_status='sent') and coalesce(sent_at,updated_at,created_at)<now()-interval '15 minutes'),
  'oldestPending',min(created_at) filter(where status in ('pending','leased','sending','retry')),
  'lastProviderEvent',max(provider_updated_at))
 from public.notification_deliveries where operator_id=p_operator_id and recipient_type in ('customer','owner');
$$;
revoke all on function public.email_delivery_health_v1(uuid) from public,anon,authenticated;
grant execute on function public.email_delivery_health_v1(uuid) to service_role;

-- Block unresolved acceptance, delivered mail, complaints and unresolved suppression
-- at the database boundary too, including the old booking-wide resend action.
alter function public.request_booking_email_v2(uuid,uuid,uuid,uuid) rename to request_booking_email_legacy_v2;
create function public.request_booking_email_v2(p_operator_id uuid,p_actor_id uuid,p_booking_id uuid,p_request_id uuid)
 returns uuid language plpgsql set search_path='' as $$
begin
 raise exception 'Use recipient-specific retry after reviewing a failed delivery';
end $$;
alter function public.request_booking_email_recipient_v1(uuid,uuid,uuid,uuid) rename to request_booking_email_recipient_legacy_v1;
create function public.request_booking_email_recipient_v1(p_operator_id uuid,p_actor_id uuid,p_delivery_id uuid,p_request_id uuid)
 returns uuid language plpgsql set search_path='' as $$
declare d public.notification_deliveries; result uuid;
begin
 if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role='owner') then raise exception 'Permission required' using errcode='42501'; end if;
 select * into d from public.notification_deliveries where operator_id=p_operator_id and id=p_delivery_id for update;
 if not found or d.provider_status in ('sent','delivered','delivery_delayed','suppressed','complained')
 or (d.status not in ('failed','uncertain') and coalesce(d.provider_status,'') not in ('bounced','failed'))
 or d.status='uncertain' then raise exception 'Review unresolved delivery before retrying'; end if;
 result:=public.request_booking_email_recipient_legacy_v1(p_operator_id,p_actor_id,p_delivery_id,p_request_id);
 return result;
end $$;
-- Legacy RPCs must not provide a bypass to the tightened wrappers.
revoke all on function public.request_booking_email_legacy_v2(uuid,uuid,uuid,uuid),public.request_booking_email_recipient_legacy_v1(uuid,uuid,uuid,uuid) from public,anon,authenticated,service_role;
-- Wrappers need definer rights for the now-private legacy function, with fixed path.
alter function public.request_booking_email_recipient_v1(uuid,uuid,uuid,uuid) security definer;
revoke all on function public.apply_email_provider_events_v1(uuid),public.record_email_provider_event_v1(uuid,text,text,text,timestamptz,text,text),public.link_email_provider_events_v1(),public.request_booking_email_v2(uuid,uuid,uuid,uuid),public.request_booking_email_recipient_v1(uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.apply_email_provider_events_v1(uuid),public.record_email_provider_event_v1(uuid,text,text,text,timestamptz,text,text),public.request_booking_email_v2(uuid,uuid,uuid,uuid),public.request_booking_email_recipient_v1(uuid,uuid,uuid,uuid) to service_role;
commit;
