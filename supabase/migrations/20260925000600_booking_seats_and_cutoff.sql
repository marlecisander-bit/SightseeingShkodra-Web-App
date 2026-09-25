begin;
-- Passenger quantity remains total people. Inventory uses a separate derived seat count.
alter table public.inventory_holds add column occupied_seats integer generated always as (quantity-coalesce((passenger_snapshot->'counts'->>'infant')::integer,0)) stored;
alter table public.booking_items add column occupied_seats integer generated always as (quantity-coalesce((passenger_snapshot->'counts'->>'infant')::integer,0)) stored;
alter table public.inventory_holds add constraint hold_seats_valid check(occupied_seats between 1 and quantity);
alter table public.booking_items add constraint item_seats_valid check(occupied_seats between 1 and quantity);
create function public.booking_cutoff_v1(p_date date,p_time time) returns timestamptz language sql immutable set search_path='' as $$ select (p_date+p_time) at time zone 'Europe/Tirane' - interval '15 minutes'; $$;
-- Amend the existing authoritative routines, retaining all validation, leases and locks.
do $$ declare f record; definition text; begin
 for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname in
 ('read_dated_availability_v1','create_passenger_hold_v1','create_meeting_point_booking_v1','confirm_booking_v1','save_dated_departure_v1','save_calendar_override_v1','read_operations_calendar_v1') loop
 definition:=pg_get_functiondef(f.oid);
 definition:=replace(replace(replace(definition,'sum(quantity)','sum(occupied_seats)'),'sum(i.quantity)','sum(i.occupied_seats)'),'sum(h.quantity)','sum(h.occupied_seats)');
 definition:=replace(definition,'used + p_quantity > d.capacity','used + (p_counts->>''adult'')::integer + (p_counts->>''child'')::integer > d.capacity');
 definition:=replace(definition,'(d.service_date + d.start_time) at time zone o.timezone > statement_timestamp()','public.booking_cutoff_v1(d.service_date,d.start_time) > statement_timestamp()');
 definition:=replace(definition,'(d.service_date+d.start_time) at time zone o.timezone','public.booking_cutoff_v1(d.service_date,d.start_time)');
 definition:=replace(definition,'(d.service_date+d.start_time) at time zone timezone','public.booking_cutoff_v1(d.service_date,d.start_time)');
 execute definition;
 end loop;
 select pg_get_functiondef('public.create_pending_order_v1(uuid,uuid,text,text,text,text)'::regprocedure) into definition;
 execute replace(definition,'(d.service_date+d.start_time) at time zone timezone','public.booking_cutoff_v1(d.service_date,d.start_time)');
end $$;
revoke all on function public.booking_cutoff_v1(date,time) from public,anon,authenticated;
grant execute on function public.booking_cutoff_v1(date,time) to service_role;
commit;
