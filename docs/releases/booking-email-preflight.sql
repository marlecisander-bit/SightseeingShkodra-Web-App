-- READ ONLY. Target the existing production project; returns no recipient data.
begin read only;
select jsonb_build_object(
 'duplicate_provider_ids',(select count(*) from (select provider_reference from public.notification_deliveries where provider='resend' and provider_reference is not null group by provider_reference having count(*)>1) duplicates),
 'deliveries',(select count(*) from public.notification_deliveries),
 'bookings',(select count(*) from public.bookings),
 'existing_outcome_table',to_regclass('public.email_provider_events') is not null,
 'existing_provider_columns',(select count(*) from information_schema.columns where table_schema='public' and table_name='notification_deliveries' and column_name in ('provider_status','provider_check_count','delivery_state')),
 'email_function_fingerprints',(select jsonb_object_agg(p.proname,md5(pg_get_functiondef(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('enqueue_booking_emails_v2','request_booking_email_v2','request_booking_email_recipient_v1','claim_booking_email_v2','finish_booking_notification_v1')),
 'delivery_operator_key',exists(select 1 from pg_constraint where conrelid='public.notification_deliveries'::regclass and contype='u' and pg_get_constraintdef(oid)='UNIQUE (operator_id, id)')
) as release_preflight;
rollback;
