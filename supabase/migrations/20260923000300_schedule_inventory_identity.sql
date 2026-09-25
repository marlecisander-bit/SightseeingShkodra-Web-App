begin;
-- The inventory product must be the schedule product, including privileged writes.
alter table public.service_schedules add constraint schedule_product_identity unique(operator_id,product_id,id);
alter table public.departures drop constraint departure_schedule_fk;
alter table public.departures add constraint departure_schedule_fk foreign key(operator_id,product_id,schedule_id) references public.service_schedules(operator_id,product_id,id);

create or replace function public.save_departure_v1(p_operator_id uuid,p_actor_id uuid,p_id uuid,p_product_id uuid,p_vehicle_id uuid,p_date date,p_time time,p_capacity integer,p_status text,p_expected_updated_at timestamptz default null)
returns uuid language plpgsql set search_path='' as $$
declare old_product uuid; target_product uuid;
begin
  select product_id into old_product from public.departures where operator_id=p_operator_id and id=p_id;
  -- A legacy move and a schedule adoption must serialize for both products.
  for target_product in select distinct x from unnest(array[old_product,p_product_id]) x where x is not null order by x loop
    perform pg_advisory_xact_lock(hashtextextended('schedule:'||p_operator_id::text||target_product::text,0));
  end loop;
  if exists(select 1 from public.service_schedules where operator_id=p_operator_id and product_id in (old_product,p_product_id))
    or exists(select 1 from public.departures where operator_id=p_operator_id and id=p_id and schedule_id is not null) then
    raise exception 'Use schedule exceptions for this product' using errcode='22023'; end if;
  return public.save_dated_departure_v1(p_operator_id,p_actor_id,p_id,p_product_id,p_vehicle_id,p_date,p_time,p_capacity,p_status,p_expected_updated_at);
end;
$$;
revoke all on function public.save_departure_v1(uuid,uuid,uuid,uuid,uuid,date,time,integer,text,timestamptz) from public,anon,authenticated;
grant execute on function public.save_departure_v1(uuid,uuid,uuid,uuid,uuid,date,time,integer,text,timestamptz) to service_role;
commit;
