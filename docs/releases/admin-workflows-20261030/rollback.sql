-- Roll back the application to 5ce8564 BEFORE removing this additive RPC.
-- No booking/customer/content records are modified. Do not add CASCADE.
begin;
set local lock_timeout='2s';
do $guard$
begin
 if exists(select 1 from pg_proc where oid=to_regprocedure('public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer)') and md5(prosrc)<>'2bc0a210cc5d48c369156e97e21ce171') then
  raise exception 'Search function differs from reviewed release; rollback stopped';
 end if;
end $guard$;
drop function if exists public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer) restrict;
delete from supabase_migrations.schema_migrations where version='20261030000300' and name='admin_booking_search';
commit;
