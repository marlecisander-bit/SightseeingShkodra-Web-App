begin;
-- Products own times and fares. Calendar owns dated closures and seat limits.
-- Old override JSON is retained for audit/rollback; it no longer supplies times/fares.
-- Preserve existing intentional time omissions as dated closures, once. Added or
-- removed product times thereafter inherit without copying a second timetable.
update public.schedule_exceptions e set calendar_settings=jsonb_set(e.calendar_settings,'{departures}',
 coalesce(e.calendar_settings->'departures','{}')||coalesce((select jsonb_object_agg(slot_entry->>'time',coalesce(e.calendar_settings->'departures'->(slot_entry->>'time'),'{}')||'{"closed":true}'::jsonb)
 from public.service_schedules s cross join lateral jsonb_array_elements(s.departure_times) slot_entry
 where s.id=e.schedule_id and not exists(select 1 from jsonb_array_elements(e.departure_times) x where x->>'time'=slot_entry->>'time')),'{}'));
update public.service_schedules s set calendar_ranges=coalesce((select jsonb_agg(case when r ? 'times' then jsonb_set(r,'{departures}',coalesce(r->'departures','{}')||coalesce((select jsonb_object_agg(slot_entry->>'time',coalesce(r->'departures'->(slot_entry->>'time'),'{}')||'{"closed":true}'::jsonb) from jsonb_array_elements(s.departure_times) slot_entry where not exists(select 1 from jsonb_array_elements(r->'times') x where x->>'time'=slot_entry->>'time')),'{}')) else r end order by n) from jsonb_array_elements(s.calendar_ranges) with ordinality x(r,n)),'[]');

create or replace function public.effective_schedule_times_v1(p_schedule_id uuid,p_date date)
returns table(start_time time,capacity integer,vehicle_id uuid) language sql stable set search_path='' as $$
 select (slot_entry->>'time')::time,coalesce((e.calendar_settings->'departures'->(slot_entry->>'time')->>'capacity')::int,(e.calendar_settings->>'capacity')::int,(r->>'capacity')::int,(select (legacy_slot->>'capacity')::int from jsonb_array_elements(case when e.id is not null then e.departure_times else coalesce(r->'times','[]'::jsonb) end) legacy_slot where legacy_slot->>'time'=slot_entry->>'time'),(slot_entry->>'capacity')::int,s.default_capacity),coalesce((slot_entry->>'vehicle_id')::uuid,s.vehicle_id)
 from public.service_schedules s left join public.schedule_exceptions e on e.schedule_id=s.id and e.service_date=p_date
 left join lateral public.calendar_range_v1(s.id,p_date) r on true
 cross join lateral jsonb_array_elements(s.departure_times) slot_entry
 where s.id=p_schedule_id and s.status='active' and p_date between s.start_date and s.end_date
 and not coalesce(e.closed,(r->>'closed')::boolean,false)
 and (e.id is not null or r is not null or extract(isodow from p_date)::int=any(s.weekdays))
 and not coalesce((e.calendar_settings->'departures'->(slot_entry->>'time')->>'closed')::boolean,(r->'departures'->(slot_entry->>'time')->>'closed')::boolean,false);
$$;

do $$ declare def text; old text;begin
 select pg_get_functiondef('public.passenger_quote_v1(uuid,date,time,jsonb)'::regprocedure) into def;
 old:=$s$layers:=jsonb_build_array(r,e.calendar_settings,e.calendar_settings->'departures'->to_char(p_time,'HH24:MI'));$s$;
 if position(old in def)=0 then raise exception 'Quote signature drift';end if;
 execute replace(def,old,$s$layers:='[]'::jsonb;$s$);
 -- Hide retired, empty inventory. Keep reserved history explicitly closed.
 select pg_get_functiondef('public.read_operations_calendar_v1(uuid,uuid,uuid,date)'::regprocedure) into def;
 old:='and not exists(select 1 from public.effective_schedule_times_v1(s.id,dt) z where z.start_time=x.start_time)';
 if position(old in def)=0 then raise exception 'Calendar signature drift';end if;
 def:=replace(def,old,old||$s$ and (exists(select 1 from public.booking_items i where i.departure_id=x.id and i.status='confirmed') or exists(select 1 from public.inventory_holds h where h.departure_id=x.id and h.status='active' and h.expires_at>clock_timestamp()))$s$);
 -- Physical schedule stays available if any active published offer uses it.
 def:=replace(def,'slots:=''[]'';', $s$slots:='[]';
  if not exists(select 1 from public.products p where p.operator_id=p_operator and coalesce(p.inventory_product_id,p.id)=s.product_id and p.active and p.status='published') then
   days:=days||jsonb_build_array(jsonb_build_object('date',dt,'slots','[]'::jsonb,'range',null,'exception',null));continue;
  end if;$s$);
 execute def;
end $$;
-- Older clients may still submit copied lists: translate omissions to closures,
-- never accept additional times as new inventory. New UI submits closures only.
do $$ declare def text;begin
 select pg_get_functiondef('public.save_calendar_override_v1(uuid,uuid,uuid,date,date,integer[],jsonb,boolean,timestamptz,boolean)'::regprocedure) into def;
 def:=replace(def,'perform public.validate_calendar_settings_v1(p_operator,p_value);',$s$perform public.validate_calendar_settings_v1(p_operator,p_value);
 if p_value ? 'times' then
  p_value:=jsonb_set(p_value,'{departures}',coalesce(p_value->'departures','{}')||coalesce((select jsonb_object_agg(slot_entry->>'time',coalesce(p_value->'departures'->(slot_entry->>'time'),'{}')||'{"closed":true}'::jsonb) from jsonb_array_elements(s.departure_times) slot_entry where not exists(select 1 from jsonb_array_elements(p_value->'times') x where x->>'time'=slot_entry->>'time')),'{}'));
 end if;$s$);
 execute def;
 select pg_get_functiondef('public.save_schedule_exception_v1(uuid,uuid,uuid,date,boolean,jsonb,text,boolean,timestamptz)'::regprocedure) into def;
 def:=replace(def,'perform public.reconcile_service_schedule_v1(s.id,p_actor_id);',$s$if not p_restore then
 update public.schedule_exceptions e set calendar_settings=jsonb_set(e.calendar_settings,'{departures}',coalesce((select jsonb_object_agg(slot_entry->>'time',jsonb_build_object('closed',not exists(select 1 from jsonb_array_elements(p_times) x where x->>'time'=slot_entry->>'time'))) from jsonb_array_elements(s.departure_times) slot_entry),'{}')) where e.schedule_id=s.id and e.service_date=p_date;
 end if;
 perform public.reconcile_service_schedule_v1(s.id,p_actor_id);$s$);
 execute def;
 -- Existing booking modification must not advertise a deactivated offer.
 select pg_get_functiondef('public.customer_booking_availability_v1(text,date,jsonb)'::regprocedure) into def;
 execute replace(def,$s$and status='published';$s$,$s$and status='published' and active;$s$);
end $$;
create function public.guard_product_schedule_slot_v1() returns trigger language plpgsql set search_path='' as $$
declare d public.departures;begin
 select * into d from public.departures where operator_id=new.operator_id and id=new.departure_id;
 if exists(select 1 from public.products p where p.id=coalesce(new.product_id,d.product_id) and p.operator_id=new.operator_id and not p.active) then
  raise exception 'Product unavailable' using errcode='P0002';
 end if;
 if d.schedule_id is not null and not exists(select 1 from public.effective_schedule_times_v1(d.schedule_id,d.service_date) slot_entry where slot_entry.start_time=d.start_time) then
  raise exception 'Departure unavailable. Reload product times.' using errcode='P0002';
 end if;
 return new;
end $$;
revoke all on function public.guard_product_schedule_slot_v1() from public,anon,authenticated;
create trigger product_schedule_hold_guard before insert on public.inventory_holds for each row execute function public.guard_product_schedule_slot_v1();
create trigger product_schedule_booking_guard before insert on public.booking_items for each row execute function public.guard_product_schedule_slot_v1();

-- Product edits reconcile future dated rows through the existing locked mutation.
-- Lazy reads must also retire stale pre-upgrade rows before returning availability.
do $$ declare def text;begin
 select pg_get_functiondef('public.ensure_schedule_date_v1(uuid,uuid,date)'::regprocedure) into def;
 def:=replace(def,'select timezone into zone', $s$update public.departures d set status='cancelled'
 where d.schedule_id=s.id and d.service_date=p_date and d.status='scheduled'
 and (d.service_date+d.start_time) at time zone (select timezone from public.operators where id=p_operator_id)>clock_timestamp()
 and not exists(select 1 from public.effective_schedule_times_v1(s.id,p_date) slot_entry where slot_entry.start_time=d.start_time);
 select timezone into zone$s$);
 execute def;
end $$;
commit;
