begin read only;
set local statement_timeout='5s';
select jsonb_build_object(
 'function_exists',to_regprocedure('public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer)') is not null,
 'latest_migration',(select max(version) from supabase_migrations.schema_migrations),
 'migration_columns',(select jsonb_agg(column_name order by ordinal_position) from information_schema.columns where table_schema='supabase_migrations' and table_name='schema_migrations'),
 'required_columns_ok',not exists(select 1 from (values ('staff_profiles','operator_id'),('staff_profiles','id'),('staff_profiles','is_active'),('staff_profiles','role'),('orders','id'),('orders','operator_id'),('orders','created_at'),('orders','customer_id'),('orders','status'),('customers','id'),('customers','operator_id'),('customers','name'),('customers','email'),('customers','phone'),('bookings','id'),('bookings','operator_id'),('bookings','order_id'),('bookings','booking_reference'),('bookings','status'),('booking_items','operator_id'),('booking_items','order_id'),('booking_items','departure_id'),('departures','operator_id'),('departures','id'),('departures','service_date')) r(t,c) where not exists(select 1 from information_schema.columns x where x.table_schema='public' and x.table_name=r.t and x.column_name=r.c)),
 'service_select_ok',(select bool_and(has_table_privilege('service_role','public.'||t,'select')) from unnest(array['staff_profiles','orders','customers','bookings','booking_items','departures'])t),
 'counts',jsonb_build_object('orders',(select count(*) from public.orders),'bookings',(select count(*) from public.bookings),'customers',(select count(*) from public.customers)),
 'booking_constraints',(select jsonb_agg(pg_get_constraintdef(oid)) from pg_constraint where conrelid='public.bookings'::regclass and contype='u'),
 'search_actor',(select jsonb_build_object('operator',operator_id,'staff',id) from public.staff_profiles where is_active and role='owner' order by id limit 1)
) as admin_release_preflight;
commit;
