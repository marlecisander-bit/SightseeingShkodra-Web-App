select jsonb_build_object(
 'latest_migration',(select max(version) from supabase_migrations.schema_migrations),
 'registry_exists',to_regclass('public.booking_record_registry') is not null,
 'delete_exists',to_regprocedure('public.delete_admin_booking_v1(uuid,uuid,uuid,text,text)') is not null,
 'search_source_md5',(select md5(prosrc) from pg_proc where oid='public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer)'::regprocedure),
 'cancel_source_md5',(select md5(prosrc) from pg_proc where oid='public.cancel_order_v1(uuid,uuid,uuid,text,text)'::regprocedure),
 'booking_fks',(select jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'name',conname,'definition',pg_get_constraintdef(oid))) from pg_constraint where contype='f' and confrelid='public.bookings'::regclass),
 'bookings',(select count(*) from public.bookings),'orders',(select count(*) from public.orders),'payments',(select count(*) from public.payments),
 'service_booking_delete',has_table_privilege('service_role','public.bookings','DELETE'),
 'service_queue_update',has_table_privilege('service_role','public.notification_deliveries','SELECT,UPDATE'),
 'active_email_senders',(select count(*) from public.notification_deliveries where status in ('leased','sending')),
 'active_push_senders',(select count(*) from public.admin_push_deliveries where status='sending'),
 'backfill_valid',not exists(select 1 from public.bookings b left join public.orders o on o.id=b.order_id and o.operator_id=b.operator_id where o.id is null),
 'booking_fingerprint',(select md5(coalesce(string_agg(to_jsonb(b)::text,',' order by id),'')) from public.bookings b),
 'payment_fingerprint',(select md5(coalesce(string_agg(to_jsonb(p)::text,',' order by id),'')) from public.payments p)
) as release_preflight;
