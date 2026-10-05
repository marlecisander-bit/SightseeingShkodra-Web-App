begin;

-- Queue timestamps cannot prove a successful empty run. Bounded operational state,
-- one row per operator, avoids fake booking events and unbounded minute-by-minute logs.
create table public.email_worker_status (
 operator_id uuid primary key references public.operators(id),
 created_at timestamptz not null default now(),
 run_token uuid not null,
 started_at timestamptz not null,
 finished_at timestamptz,
 last_success_at timestamptz,
 status text not null check(status in ('running','live','test','disabled','failed')),
 processed integer not null default 0 check(processed between 0 and 4)
);
alter table public.email_worker_status enable row level security;
revoke all on public.email_worker_status from public,anon,authenticated;
grant select on public.email_worker_status to authenticated;
create policy owner_read on public.email_worker_status for select to authenticated
 using(private.has_staff_role(operator_id,array['owner']));
grant select,insert,update on public.email_worker_status to service_role;

create function public.begin_email_worker_run_v1(p_operator_id uuid) returns uuid
language plpgsql set search_path='' as $$
declare token uuid:=gen_random_uuid();
begin
 insert into public.email_worker_status(operator_id,run_token,started_at,status)
 values(p_operator_id,token,clock_timestamp(),'running')
 on conflict(operator_id) do update set run_token=excluded.run_token,started_at=excluded.started_at,
 finished_at=null,status='running',processed=0;
 return token;
end $$;
create function public.finish_email_worker_run_v1(p_operator_id uuid,p_token uuid,p_status text,p_processed integer) returns void
language plpgsql set search_path='' as $$
begin
 if p_status is null or p_status not in ('live','test','disabled','failed') or p_processed is null or p_processed not between 0 and 4 then raise exception 'Invalid worker result'; end if;
 update public.email_worker_status set finished_at=clock_timestamp(),status=p_status,processed=p_processed,
 last_success_at=case when p_status in ('live','test') then clock_timestamp() else last_success_at end
 where operator_id=p_operator_id and run_token=p_token;
end $$;
revoke all on function public.begin_email_worker_run_v1(uuid),public.finish_email_worker_run_v1(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.begin_email_worker_run_v1(uuid),public.finish_email_worker_run_v1(uuid,uuid,text,integer) to service_role;

-- The enqueue boundary alone does not cover jobs queued before a later cutover.
-- Retain the same claim implementation and leasing/retry rules, adding a boundary.
drop function public.claim_booking_email_v2(uuid);
create function public.claim_booking_email_v2(p_operator_id uuid,p_since timestamptz default '-infinity')
returns setof public.notification_deliveries language plpgsql set search_path='' as $$
begin
 if p_since is null then raise exception 'Activation time required'; end if;
 update public.notification_deliveries set status=case when attempt_count>=5 or first_send_at<clock_timestamp()-interval '23 hours' then 'uncertain' else 'retry' end,lease_token=null,lease_until=null,last_error_code='worker_lease_expired' where operator_id=p_operator_id and recipient_type is not null and status in ('leased','sending') and lease_until<=clock_timestamp();
 update public.notification_deliveries set status='uncertain',last_error_code='idempotency_window_expired' where operator_id=p_operator_id and recipient_type is not null and status='retry' and first_send_at<clock_timestamp()-interval '23 hours';
 update public.notification_deliveries d set status='skipped',last_error_code='before_activation_boundary',updated_at=clock_timestamp()
 where d.operator_id=p_operator_id and d.recipient_type is not null and d.status in ('pending','retry')
 and exists(select 1 from public.domain_events e where e.operator_id=d.operator_id and e.id=d.event_id and e.created_at<p_since);
 return query with candidate as(
 select d.id from public.notification_deliveries d join public.domain_events e on e.operator_id=d.operator_id and e.id=d.event_id
 where d.operator_id=p_operator_id and d.recipient_type is not null and d.status in ('pending','retry')
 and d.next_attempt_at<=clock_timestamp() and d.attempt_count<5 and e.created_at>=p_since
 order by d.created_at,d.id for update of d skip locked limit 1)
 update public.notification_deliveries d set status='leased',attempt_count=attempt_count+1,lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',updated_at=clock_timestamp() from candidate c where d.id=c.id returning d.*;
end $$;
revoke all on function public.claim_booking_email_v2(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.claim_booking_email_v2(uuid,timestamptz) to service_role;
commit;
