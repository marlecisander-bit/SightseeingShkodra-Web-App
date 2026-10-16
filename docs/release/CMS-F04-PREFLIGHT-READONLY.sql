-- Future approved operator pre/post check only. Not executed against hosted Supabase here.
-- Save actual results privately with backup evidence; do not commit data or credentials.
begin read only;
set local statement_timeout = '15s';
select current_database() as database_name,current_user as database_role,
  current_setting('server_version') as server_version,current_setting('transaction_read_only') as read_only;
select p.oid::regprocedure::text as routine,pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,p.proconfig,p.proacl::text as acl,
  md5(pg_get_functiondef(p.oid)) as definition_md5,pg_get_functiondef(p.oid) as recovery_definition
from pg_proc p where p.oid=to_regprocedure('public.save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean)');
select role_name,has_function_privilege(role_name,'public.save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean)','EXECUTE') as can_execute
from (values ('anon'),('authenticated'),('service_role')) roles(role_name);
-- Fingerprint all current product values, including prices/eligibility/legacy metadata, without returning values.
-- Compare only across an agreed no-Catalog/no-Calendar-edit window. Booking traffic need not stop.
select count(*) as product_count,md5(coalesce(jsonb_agg(to_jsonb(p) order by p.id)::text,'[]')) as product_rows_md5
from public.products p;
-- All other routine bodies must match; only save_catalog_v1 is expected to change.
select p.oid::regprocedure::text as routine,md5(pg_get_functiondef(p.oid)) as definition_md5
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind='f' order by routine;
select to_regclass('supabase_migrations.schema_migrations') as migration_history_relation;
commit;
