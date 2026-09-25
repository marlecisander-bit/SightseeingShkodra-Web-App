begin;
create function public.next_operational_date_v1(p_operator uuid,p_product uuid,p_after date) returns date language sql stable set search_path='' as $$
 select min(service_day) from (
  select (p_after+n)::date as service_day from generate_series(1,366) n where exists(
   select 1 from public.service_schedules s cross join lateral public.effective_schedule_times_v1(s.id,(p_after+n)::date) t
   where s.operator_id=p_operator and s.product_id=p_product and t.capacity>0)
  union all select service_date from public.departures where operator_id=p_operator and product_id=p_product and service_date>p_after and status='scheduled' and capacity>0 and schedule_id is null
 ) dates;
$$;
-- Add calendar guidance without changing/duplicating the pricing engine.
do $$ declare definition text;begin
 select pg_get_functiondef('public.read_passenger_availability_v1(uuid,uuid,date,jsonb)'::regprocedure) into definition;
 execute replace(definition,'return snapshot||jsonb_build_object(''departures'',deps,''categories'',public.passenger_categories_v1(p_product));',
 'return snapshot||jsonb_build_object(''departures'',deps,''categories'',public.passenger_categories_v1(p_product),''business_date'',(clock_timestamp() at time zone ''Europe/Tirane'')::date,''next_operational_date'',case when jsonb_array_length(deps)=0 then public.next_operational_date_v1(p_operator,p_product,greatest(p_date,(clock_timestamp() at time zone ''Europe/Tirane'')::date)) else null end);');
end $$;
revoke all on function public.next_operational_date_v1(uuid,uuid,date) from public,anon,authenticated;
grant execute on function public.next_operational_date_v1(uuid,uuid,date) to service_role;
commit;
