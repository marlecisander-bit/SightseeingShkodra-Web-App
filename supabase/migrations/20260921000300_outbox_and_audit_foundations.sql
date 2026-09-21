begin;

alter table public.domain_events
  add column actor_id uuid,
  add column idempotency_key text not null default gen_random_uuid()::text,
  add column schema_version integer not null default 1 check (schema_version > 0),
  add column attempt_count integer not null default 0 check (attempt_count >= 0),
  add column next_attempt_at timestamptz not null default now(),
  add column last_error_code text check (last_error_code ~ '^[a-z0-9_.:-]{1,80}$'),
  add constraint domain_events_actor_fk foreign key (operator_id, actor_id)
    references public.staff_profiles(operator_id, id),
  add constraint domain_events_idempotency_unique unique (operator_id, idempotency_key),
  add constraint domain_events_key_valid check (length(btrim(idempotency_key)) between 1 and 200),
  add constraint domain_events_delivery_times check (
    isfinite(created_at) and isfinite(next_attempt_at) and next_attempt_at >= created_at
    and (published_at is null or (isfinite(published_at) and published_at >= created_at))
  );

alter table public.audit_logs
  add column idempotency_key text not null default gen_random_uuid()::text,
  add constraint audit_logs_idempotency_unique unique (operator_id, idempotency_key),
  add constraint audit_logs_key_valid check (length(btrim(idempotency_key)) between 1 and 200);

create index domain_events_ready_idx on public.domain_events(next_attempt_at, created_at, id)
  where published_at is null;
create index domain_events_actor_idx on public.domain_events(operator_id, actor_id);

create function public.protect_activity_history()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' or tg_table_name = 'audit_logs' then
    raise exception 'Activity history cannot be changed or deleted' using errcode = '23514';
  end if;
  if row(new.id, new.operator_id, new.actor_id, new.aggregate_type, new.aggregate_id,
    new.event_type, new.payload, new.created_at, new.idempotency_key, new.schema_version)
    is distinct from row(old.id, old.operator_id, old.actor_id, old.aggregate_type, old.aggregate_id,
    old.event_type, old.payload, old.created_at, old.idempotency_key, old.schema_version) then
    raise exception 'Event envelope is immutable' using errcode = '23514';
  end if;
  if new.attempt_count < old.attempt_count then
    raise exception 'Attempt count cannot decrease' using errcode = '23514';
  end if;
  if old.published_at is not null and new is distinct from old then
    raise exception 'Published event is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_activity_history() from public, anon, authenticated;
create trigger protect_history before update or delete on public.domain_events
  for each row execute function public.protect_activity_history();
create trigger protect_history before update or delete on public.audit_logs
  for each row execute function public.protect_activity_history();
revoke update, delete on public.audit_logs from service_role;
revoke delete on public.domain_events from service_role;

-- Invoker rights: only the privileged server role can call these persistence helpers.
-- They do not infer authority from caller-provided IDs: authorize in the server domain first.
create function public.enqueue_domain_event(
  p_operator_id uuid, p_actor_id uuid, p_idempotency_key text,
  p_aggregate_type text, p_aggregate_id uuid, p_event_type text, p_payload jsonb,
  p_schema_version integer default 1
) returns uuid language plpgsql set search_path = '' as $$
declare
  result_id uuid;
  existing public.domain_events%rowtype;
begin
  insert into public.domain_events(operator_id, actor_id, idempotency_key,
    aggregate_type, aggregate_id, event_type, payload, schema_version)
  values (p_operator_id, p_actor_id, p_idempotency_key,
    p_aggregate_type, p_aggregate_id, p_event_type, p_payload, p_schema_version)
  on conflict (operator_id, idempotency_key) do nothing returning id into result_id;

  if result_id is not null then return result_id; end if;
  select * into strict existing from public.domain_events
    where operator_id = p_operator_id and idempotency_key = p_idempotency_key;
  if row(existing.actor_id, existing.aggregate_type, existing.aggregate_id,
    existing.event_type, existing.payload, existing.schema_version)
    is distinct from row(p_actor_id, p_aggregate_type, p_aggregate_id,
    p_event_type, p_payload, p_schema_version) then
    raise exception 'Event idempotency key reused with different data' using errcode = '23505';
  end if;
  return existing.id;
end;
$$;

create function public.append_audit_log(
  p_operator_id uuid, p_actor_id uuid, p_idempotency_key text,
  p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb
) returns uuid language plpgsql set search_path = '' as $$
declare
  result_id uuid;
  existing public.audit_logs%rowtype;
begin
  insert into public.audit_logs(operator_id, actor_id, idempotency_key,
    action, entity_type, entity_id, metadata)
  values (p_operator_id, p_actor_id, p_idempotency_key,
    p_action, p_entity_type, p_entity_id, p_metadata)
  on conflict (operator_id, idempotency_key) do nothing returning id into result_id;

  if result_id is not null then return result_id; end if;
  select * into strict existing from public.audit_logs
    where operator_id = p_operator_id and idempotency_key = p_idempotency_key;
  if row(existing.actor_id, existing.action, existing.entity_type, existing.entity_id, existing.metadata)
    is distinct from row(p_actor_id, p_action, p_entity_type, p_entity_id, p_metadata) then
    raise exception 'Audit idempotency key reused with different data' using errcode = '23505';
  end if;
  return existing.id;
end;
$$;

-- A single RPC is one transaction for the event/audit pair. Later domain SQL can
-- call the individual helpers within its own transaction that also changes business data.
create function public.record_domain_activity(
  p_operator_id uuid, p_actor_id uuid, p_idempotency_key text,
  p_entity_type text, p_entity_id uuid, p_event_type text, p_payload jsonb,
  p_action text, p_metadata jsonb, p_schema_version integer default 1
) returns table(event_id uuid, audit_id uuid)
language plpgsql set search_path = '' as $$
begin
  event_id := public.enqueue_domain_event(p_operator_id, p_actor_id, p_idempotency_key,
    p_entity_type, p_entity_id, p_event_type, p_payload, p_schema_version);
  audit_id := public.append_audit_log(p_operator_id, p_actor_id, p_idempotency_key,
    p_action, p_entity_type, p_entity_id, p_metadata);
  return next;
end;
$$;

revoke all on function public.enqueue_domain_event(uuid,uuid,text,text,uuid,text,jsonb,integer) from public, anon, authenticated;
revoke all on function public.append_audit_log(uuid,uuid,text,text,text,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.record_domain_activity(uuid,uuid,text,text,uuid,text,jsonb,text,jsonb,integer) from public, anon, authenticated;
grant execute on function public.enqueue_domain_event(uuid,uuid,text,text,uuid,text,jsonb,integer) to service_role;
grant execute on function public.append_audit_log(uuid,uuid,text,text,text,uuid,jsonb) to service_role;
grant execute on function public.record_domain_activity(uuid,uuid,text,text,uuid,text,jsonb,text,jsonb,integer) to service_role;

commit;
