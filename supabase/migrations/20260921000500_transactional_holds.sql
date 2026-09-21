begin;
alter table public.inventory_holds add column request_id uuid;
create unique index inventory_holds_request_idx on public.inventory_holds(operator_id, request_id) where request_id is not null;
create function public.guard_hold_request_id() returns trigger language plpgsql set search_path='' as $$
begin
  if new.request_id is distinct from old.request_id then raise exception 'Hold request identity is immutable' using errcode='23514'; end if;
  return new;
end;
$$;
revoke all on function public.guard_hold_request_id() from public,anon,authenticated;
create trigger guard_request_id before update on public.inventory_holds for each row execute function public.guard_hold_request_id();

create function public.create_hold_v1(p_operator_id uuid, p_departure_id uuid, p_session_key text, p_request_id uuid, p_quantity integer)
returns public.inventory_holds language plpgsql set search_path = '' as $$
declare d public.departures; h public.inventory_holds; used bigint; instant timestamptz; departure_instant timestamptz;
begin
  if p_operator_id is null or p_departure_id is null or p_request_id is null
    or p_session_key is null or length(p_session_key) < 32 or length(p_session_key) > 256
    or p_quantity is null or p_quantity < 1 then
    raise exception 'Invalid hold request' using errcode = '22023';
  end if;
  -- Same operator/request retries serialize even if their departure differs.
  perform pg_advisory_xact_lock(hashtextextended(p_operator_id::text || p_request_id::text, 0));
  select * into h from public.inventory_holds where operator_id=p_operator_id and request_id=p_request_id;
  if found then
    if h.departure_id <> p_departure_id or h.session_key <> p_session_key or h.quantity <> p_quantity then
      raise exception 'Conflicting hold request' using errcode = '23505';
    end if;
    if h.status='active' and h.expires_at <= clock_timestamp() then
      update public.inventory_holds set status='expired' where id=h.id returning * into h;
    end if;
    return h;
  end if;
  select * into d from public.departures where operator_id=p_operator_id and id=p_departure_id for update;
  if not found then raise exception 'Departure unavailable' using errcode='P0002'; end if;
  instant := clock_timestamp();
  select (d.service_date+d.start_time) at time zone o.timezone into departure_instant
    from public.operators o join public.products p on p.operator_id=o.id
    where o.id=p_operator_id and p.id=d.product_id and p.status='published' and p.type='van_tour'
      and p.capacity_rules='{"version":1,"model":"departure_seats"}'::jsonb;
  if departure_instant is null or departure_instant <= instant or d.status <> 'scheduled' then
    raise exception 'Departure unavailable' using errcode='P0002';
  end if;
  update public.inventory_holds set status='expired'
    where operator_id=p_operator_id and departure_id=d.id and status='active' and expires_at <= instant;
  select (select coalesce(sum(quantity),0) from public.booking_items
      where operator_id=p_operator_id and departure_id=d.id and status='confirmed')
    + (select coalesce(sum(quantity),0) from public.inventory_holds
      where operator_id=p_operator_id and departure_id=d.id and status='active' and expires_at > instant) into used;
  if used + p_quantity > d.capacity then raise exception 'Insufficient capacity' using errcode='P0001'; end if;
  insert into public.inventory_holds(operator_id,departure_id,session_key,request_id,quantity,created_at,expires_at)
    values(p_operator_id,d.id,p_session_key,p_request_id,p_quantity,instant,least(instant+interval '10 minutes',departure_instant)) returning * into h;
  return h;
end;
$$;

create function public.manage_hold_v1(p_operator_id uuid, p_hold_id uuid, p_session_key text, p_release boolean default false)
returns public.inventory_holds language plpgsql set search_path='' as $$
declare h public.inventory_holds;
begin
  select * into h from public.inventory_holds where operator_id=p_operator_id and id=p_hold_id and session_key=p_session_key for update;
  if not found then raise exception 'Hold unavailable' using errcode='P0002'; end if;
  if h.status='active' then
    if h.expires_at <= clock_timestamp() then
      update public.inventory_holds set status='expired' where id=h.id returning * into h;
    elsif p_release then
      update public.inventory_holds set status='released' where id=h.id returning * into h;
    end if;
  end if;
  return h;
end;
$$;

create function public.expire_holds_v1(p_operator_id uuid, p_limit integer default 100)
returns integer language plpgsql set search_path='' as $$
declare affected integer;
begin
  if p_operator_id is null or p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception 'Invalid expiry batch' using errcode='22023';
  end if;
  with due as (select id from public.inventory_holds where operator_id=p_operator_id
    and status='active' and expires_at <= clock_timestamp() order by expires_at,id limit p_limit for update skip locked)
    update public.inventory_holds set status='expired' where id in (select id from due);
  get diagnostics affected = row_count;
  return affected;
end;
$$;
revoke all on function public.create_hold_v1(uuid,uuid,text,uuid,integer) from public,anon,authenticated;
revoke all on function public.manage_hold_v1(uuid,uuid,text,boolean) from public,anon,authenticated;
revoke all on function public.expire_holds_v1(uuid,integer) from public,anon,authenticated;
grant execute on function public.create_hold_v1(uuid,uuid,text,uuid,integer) to service_role;
grant execute on function public.manage_hold_v1(uuid,uuid,text,boolean) to service_role;
grant execute on function public.expire_holds_v1(uuid,integer) to service_role;
commit;
