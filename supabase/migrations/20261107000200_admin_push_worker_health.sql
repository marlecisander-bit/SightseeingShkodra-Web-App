begin;
-- Bounded operational heartbeat, no payloads/endpoints and no new scheduler.
create table public.admin_push_worker_status (
 operator_id uuid primary key references public.operators(id),
 created_at timestamptz not null default now(),
 run_token uuid not null,
 started_at timestamptz not null,
 finished_at timestamptz,
 last_success_at timestamptz,
 status text not null check(status in ('running','live','failed'))
);
alter table public.admin_push_worker_status enable row level security;
revoke all on public.admin_push_worker_status from public,anon,authenticated;
grant select,insert,update on public.admin_push_worker_status to service_role;
commit;
