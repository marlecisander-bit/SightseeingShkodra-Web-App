-- Narrow follow-up. Function source is code, not booking/customer records.
-- Export privately to private/hosted-schema-followup.json; do not paste into chat.
-- Only aggregate booking invariant counts are returned, never QR/token values.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SELECT jsonb_build_object(
 'server_version', current_setting('server_version'),
 'email_function', (SELECT jsonb_build_object('name',n.nspname||'.'||p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'body',p.prosrc,'definition',pg_get_functiondef(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.oid='public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb)'::regprocedure),
 'trigger_function_grants', (SELECT jsonb_agg(jsonb_build_object('name',n.nspname||'.'||p.proname,'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text,'service_role_execute',has_function_privilege('service_role',p.oid,'EXECUTE'),'service_role_inherits_owner',pg_has_role('service_role',p.proowner,'USAGE')) ORDER BY p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prorettype='trigger'::regtype),
 'qr_invariants', (SELECT jsonb_build_object(
   'historically_confirmed_without_qr',count(*) FILTER (WHERE (status='confirmed' OR confirmed_at IS NOT NULL) AND (qr_token IS NULL OR qr_created_at IS NULL)),
   'invalid_qr_shape',count(*) FILTER (WHERE NOT ((qr_token IS NULL AND qr_created_at IS NULL) OR (qr_token IS NOT NULL AND qr_token ~ '^[0-9a-f]{64}$' AND qr_created_at IS NOT NULL))),
   'invalid_checkin_shape',count(*) FILTER (WHERE NOT ((checked_in_at IS NULL AND checked_in_by IS NULL) OR (checked_in_at IS NOT NULL AND checked_in_by IS NOT NULL AND qr_token IS NOT NULL))),
   'checkin_actor_outside_operator',count(*) FILTER (WHERE checked_in_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.staff_profiles s WHERE s.operator_id=b.operator_id AND s.id=b.checked_in_by))
 ) FROM public.bookings b)
) AS schema_followup;
ROLLBACK;
