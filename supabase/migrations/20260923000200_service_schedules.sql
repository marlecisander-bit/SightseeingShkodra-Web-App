begin;

-- One current operational schedule per product. Dated inventory remains the
-- stable, historical identity used by holds, orders and confirmations.
create table public.service_schedules (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  product_id uuid not null,
  start_date date not null,
  end_date date not null,
  weekdays integer[] not null,
  departure_times jsonb not null,
  default_capacity integer not null check(default_capacity > 0),
  vehicle_id uuid,
  status text not null check(status in ('active','paused')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(operator_id,product_id), unique(operator_id,id),
  foreign key(operator_id,product_id) references public.products(operator_id,id),
  foreign key(operator_id,vehicle_id) references public.vehicles(operator_id,id),
  check(isfinite(start_date) and isfinite(end_date) and start_date<=end_date and end_date-start_date<=730),
  check(cardinality(weekdays) between 1 and 7 and weekdays <@ array[1,2,3,4,5,6,7])
);
create table public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null,
  schedule_id uuid not null,
  service_date date not null check(isfinite(service_date)),
  closed boolean not null default false,
  departure_times jsonb not null default '[]',
  note text not null default '' check(length(note)<=500),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(schedule_id,service_date),
  foreign key(operator_id,schedule_id) references public.service_schedules(operator_id,id)
);
alter table public.departures add column schedule_id uuid;
alter table public.departures add constraint departure_schedule_fk foreign key(operator_id,schedule_id) references public.service_schedules(operator_id,id);
create unique index departure_schedule_slot on public.departures(schedule_id,service_date,start_time) where schedule_id is not null;

alter table public.service_schedules enable row level security;
alter table public.schedule_exceptions enable row level security;
revoke all on public.service_schedules,public.schedule_exceptions from public,anon,authenticated;
grant select on public.service_schedules,public.schedule_exceptions to authenticated;
grant select,insert,update,delete on public.service_schedules,public.schedule_exceptions to service_role;
create policy schedule_staff_read on public.service_schedules for select to authenticated using(private.has_staff_role(operator_id,array['owner','admin','operations']));
create policy exception_staff_read on public.schedule_exceptions for select to authenticated using(private.has_staff_role(operator_id,array['owner','admin','operations']));

create function public.validate_schedule_times_v1(p_operator_id uuid,p_times jsonb,p_allow_empty boolean default false)
returns jsonb language plpgsql set search_path='' as $$
declare entry jsonb; times text[] := '{}'; vehicle uuid;
begin
  if p_times is null or jsonb_typeof(p_times)<>'array' then raise exception 'Invalid times' using errcode='22023'; end if;
  if jsonb_array_length(p_times)>24 or (not p_allow_empty and jsonb_array_length(p_times)=0) then raise exception 'Select 1 to 24 times' using errcode='22023'; end if;
  for entry in select value from jsonb_array_elements(p_times) loop
    if jsonb_typeof(entry)<>'object' or entry->>'time' is null or (entry->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or entry->>'time'=any(times) or exists(select 1 from jsonb_object_keys(entry) k where k not in ('time','capacity','vehicle_id')) then
      raise exception 'Invalid or duplicate departure time' using errcode='22023'; end if;
    if entry->>'capacity' is not null and ((entry->>'capacity') !~ '^[1-9][0-9]{0,9}$' or (entry->>'capacity')::bigint>2147483647) then
      raise exception 'Invalid capacity' using errcode='22023'; end if;
    vehicle := (entry->>'vehicle_id')::uuid;
    if vehicle is not null and not exists(select 1 from public.vehicles where id=vehicle and operator_id=p_operator_id) then raise exception 'Vehicle unavailable' using errcode='22023'; end if;
    times := array_append(times,entry->>'time');
  end loop;
  return coalesce((select jsonb_agg(value order by value->>'time') from jsonb_array_elements(p_times)), '[]'::jsonb);
end;
$$;

create function public.effective_schedule_times_v1(p_schedule_id uuid,p_date date)
returns table(start_time time,capacity integer,vehicle_id uuid) language sql stable set search_path='' as $$
  select (t.value->>'time')::time,coalesce((t.value->>'capacity')::integer,s.default_capacity),coalesce((t.value->>'vehicle_id')::uuid,s.vehicle_id)
  from public.service_schedules s
  left join public.schedule_exceptions e on e.schedule_id=s.id and e.service_date=p_date
  cross join lateral jsonb_array_elements(case when e.id is not null then e.departure_times else s.departure_times end) t
  where s.id=p_schedule_id and s.status='active' and p_date between s.start_date and s.end_date
    and not coalesce(e.closed,false) and (e.id is not null or extract(isodow from p_date)::integer=any(s.weekdays));
$$;

-- Retain the existing guarded mutation as the only capacity edit implementation.
alter function public.save_departure_v1(uuid,uuid,uuid,uuid,uuid,date,time,integer,text,timestamptz) rename to save_dated_departure_v1;
create function public.save_departure_v1(p_operator_id uuid,p_actor_id uuid,p_id uuid,p_product_id uuid,p_vehicle_id uuid,p_date date,p_time time,p_capacity integer,p_status text,p_expected_updated_at timestamptz default null)
returns uuid language plpgsql set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('schedule:'||p_operator_id::text||p_product_id::text,0));
  if exists(select 1 from public.service_schedules where operator_id=p_operator_id and product_id=p_product_id)
    or exists(select 1 from public.departures where operator_id=p_operator_id and id=p_id and schedule_id is not null) then
    raise exception 'Use schedule exceptions for this product' using errcode='22023'; end if;
  return public.save_dated_departure_v1(p_operator_id,p_actor_id,p_id,p_product_id,p_vehicle_id,p_date,p_time,p_capacity,p_status,p_expected_updated_at);
end;
$$;

create function public.reconcile_service_schedule_v1(p_schedule_id uuid,p_actor_id uuid)
returns void language plpgsql set search_path='' as $$
declare s public.service_schedules; d public.departures; target record; zone text;
begin
  select * into strict s from public.service_schedules where id=p_schedule_id;
  select timezone into zone from public.operators where id=s.operator_id;
  -- No historical dates/times are rewritten. Lock in a deterministic order.
  for d in select * from public.departures where schedule_id=s.id and (service_date+start_time) at time zone zone>clock_timestamp() order by id for update loop
    select * into target from public.effective_schedule_times_v1(s.id,d.service_date) where start_time=d.start_time;
    if found then
      if row(d.capacity,d.vehicle_id,d.status) is distinct from row(target.capacity,target.vehicle_id,'scheduled'::text) then
        perform public.save_dated_departure_v1(s.operator_id,p_actor_id,d.id,d.product_id,target.vehicle_id,d.service_date,d.start_time,target.capacity,'scheduled',d.updated_at);
      end if;
    elsif d.status<>'cancelled' then
      perform public.save_dated_departure_v1(s.operator_id,p_actor_id,d.id,d.product_id,d.vehicle_id,d.service_date,d.start_time,d.capacity,'cancelled',d.updated_at);
    end if;
  end loop;
end;
$$;

create function public.save_service_schedule_v1(p_operator_id uuid,p_actor_id uuid,p_product_id uuid,p_start date,p_end date,p_weekdays integer[],p_times jsonb,p_capacity integer,p_vehicle_id uuid,p_status text,p_expected_updated_at timestamptz default null)
returns uuid language plpgsql set search_path='' as $$
declare s public.service_schedules; saved uuid; d public.departures; desired record; zone text;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then raise exception 'Schedule permission required' using errcode='42501'; end if;
  if not exists(select 1 from public.products where operator_id=p_operator_id and id=p_product_id and type='van_tour') then raise exception 'Product unavailable' using errcode='22023'; end if;
  if p_weekdays is null or array_position(p_weekdays,null) is not null or cardinality(p_weekdays)<>(select count(distinct x) from unnest(p_weekdays) x) then raise exception 'Invalid weekdays' using errcode='22023'; end if;
  p_times := public.validate_schedule_times_v1(p_operator_id,p_times);
  perform pg_advisory_xact_lock(hashtextextended('schedule:'||p_operator_id::text||p_product_id::text,0));
  select * into s from public.service_schedules where operator_id=p_operator_id and product_id=p_product_id for update;
  if found then
    if p_expected_updated_at is null or s.updated_at<>p_expected_updated_at then raise exception 'Schedule changed; reload' using errcode='PT409'; end if;
    if exists(select 1 from public.schedule_exceptions where schedule_id=s.id and service_date not between p_start and p_end) then raise exception 'Existing exceptions must remain within period' using errcode='22023'; end if;
    update public.service_schedules set start_date=p_start,end_date=p_end,weekdays=p_weekdays,departure_times=p_times,default_capacity=p_capacity,vehicle_id=p_vehicle_id,status=p_status,updated_at=clock_timestamp() where id=s.id returning id into saved;
  else
    if p_expected_updated_at is not null then raise exception 'Schedule changed; reload' using errcode='PT409'; end if;
    insert into public.service_schedules(operator_id,product_id,start_date,end_date,weekdays,departure_times,default_capacity,vehicle_id,status)
      values(p_operator_id,p_product_id,p_start,p_end,p_weekdays,p_times,p_capacity,p_vehicle_id,p_status) returning id into saved;
    select timezone into zone from public.operators where id=p_operator_id;
    -- Adopt only exact, unambiguous future manual inventory. IDs and history stay.
    for d in select * from public.departures where operator_id=p_operator_id and product_id=p_product_id and (service_date+start_time) at time zone zone>clock_timestamp() order by id for update loop
      select * into desired from public.effective_schedule_times_v1(saved,d.service_date) where start_time=d.start_time;
      if not found or d.status<>'scheduled' or row(d.capacity,d.vehicle_id) is distinct from row(desired.capacity,desired.vehicle_id)
        or (select count(*) from public.departures where operator_id=p_operator_id and product_id=p_product_id and service_date=d.service_date and start_time=d.start_time)>1 then
        raise exception 'Manual departures conflict; reconcile before creating schedule' using errcode='P0001'; end if;
      update public.departures set schedule_id=saved where id=d.id;
    end loop;
  end if;
  perform public.reconcile_service_schedule_v1(saved,p_actor_id);
  perform public.record_domain_activity(p_operator_id,p_actor_id,'schedule-edit:'||gen_random_uuid()::text,'service_schedule',saved,'schedule.changed',jsonb_build_object('scheduleId',saved),'schedule.changed',jsonb_build_object('productId',p_product_id,'previous',to_jsonb(s),'start',p_start,'end',p_end,'times',p_times,'weekdays',p_weekdays,'capacity',p_capacity,'status',p_status));
  return saved;
end;
$$;

create function public.save_schedule_exception_v1(p_operator_id uuid,p_actor_id uuid,p_schedule_id uuid,p_date date,p_closed boolean,p_times jsonb,p_note text,p_restore boolean,p_expected_updated_at timestamptz)
returns void language plpgsql set search_path='' as $$
declare s public.service_schedules;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then raise exception 'Schedule permission required' using errcode='42501'; end if;
  select * into strict s from public.service_schedules where operator_id=p_operator_id and id=p_schedule_id;
  perform pg_advisory_xact_lock(hashtextextended('schedule:'||p_operator_id::text||s.product_id::text,0));
  select * into strict s from public.service_schedules where id=s.id for update;
  if p_expected_updated_at is null or s.updated_at<>p_expected_updated_at then raise exception 'Schedule changed; reload' using errcode='PT409'; end if;
  if p_date is null or p_date not between s.start_date and s.end_date or p_date<(select (clock_timestamp() at time zone timezone)::date from public.operators where id=p_operator_id) or p_restore is null or p_closed is null then raise exception 'Invalid exception date' using errcode='22023'; end if;
  if p_restore then delete from public.schedule_exceptions where schedule_id=s.id and service_date=p_date;
  else
    p_times := public.validate_schedule_times_v1(p_operator_id,p_times,p_closed);
    if p_closed then p_times := '[]'; end if;
    insert into public.schedule_exceptions(operator_id,schedule_id,service_date,closed,departure_times,note)
      values(p_operator_id,s.id,p_date,p_closed,p_times,p_note)
      on conflict(schedule_id,service_date) do update set closed=excluded.closed,departure_times=excluded.departure_times,note=excluded.note,updated_at=clock_timestamp();
  end if;
  perform public.reconcile_service_schedule_v1(s.id,p_actor_id);
  update public.service_schedules set updated_at=clock_timestamp() where id=s.id;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'schedule-exception:'||gen_random_uuid()::text,'service_schedule',s.id,'schedule.exception_changed',jsonb_build_object('scheduleId',s.id),'schedule.exception_changed',jsonb_build_object('date',p_date,'closed',p_closed,'times',p_times,'restore',p_restore,'note',p_note));
end;
$$;

-- Bounded lazy materialization: only the requested date, maximum 24 instances.
-- All consumers still use read_availability_v1 and its original seat accounting.
create function public.ensure_schedule_date_v1(p_operator_id uuid,p_product_id uuid,p_date date)
returns void language plpgsql set search_path='' as $$
declare s public.service_schedules; zone text;
begin
  perform pg_advisory_xact_lock(hashtextextended('schedule:'||p_operator_id::text||p_product_id::text,0));
  select * into s from public.service_schedules where operator_id=p_operator_id and product_id=p_product_id;
  if not found then return; end if;
  select timezone into zone from public.operators where id=p_operator_id;
  insert into public.departures(operator_id,product_id,schedule_id,vehicle_id,service_date,start_time,capacity,status)
    select p_operator_id,p_product_id,s.id,t.vehicle_id,p_date,t.start_time,t.capacity,'scheduled'
      from public.effective_schedule_times_v1(s.id,p_date) t
      where (p_date+t.start_time) at time zone zone>clock_timestamp()
    on conflict(schedule_id,service_date,start_time) where schedule_id is not null do nothing;
end;
$$;
alter function public.read_availability_v1(uuid,uuid,date) rename to read_dated_availability_v1;
create function public.read_availability_v1(p_operator_id uuid,p_product_id uuid,p_date date)
returns jsonb language plpgsql set search_path='' as $$
begin
  if exists(select 1 from public.products where id=p_product_id and operator_id=p_operator_id and status='published' and type='van_tour' and capacity_rules='{"version":1,"model":"departure_seats"}'::jsonb) then
    perform public.ensure_schedule_date_v1(p_operator_id,p_product_id,p_date);
  end if;
  return public.read_dated_availability_v1(p_operator_id,p_product_id,p_date);
end;
$$;

-- Internal helpers and renamed legacy entry points are not browser-callable.
do $$ declare signature regprocedure; begin
  for signature in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in
    ('validate_schedule_times_v1','effective_schedule_times_v1','save_dated_departure_v1','save_departure_v1','reconcile_service_schedule_v1','save_service_schedule_v1','save_schedule_exception_v1','ensure_schedule_date_v1','read_dated_availability_v1','read_availability_v1') loop
    execute format('revoke all on function %s from public,anon,authenticated',signature);
    execute format('grant execute on function %s to service_role',signature);
  end loop;
end $$;
commit;
