begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Only answers a question about the verified request user; no user-id parameter.
-- Definer rights avoid recursive RLS on staff_profiles. The migration owner must
-- own staff_profiles (as postgres does in Supabase). Keep private out of exposed schemas.
create function private.has_staff_role(target_operator uuid, allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_profiles as staff
    where staff.operator_id = target_operator
      and staff.auth_user_id = (select auth.uid())
      and staff.is_active
      and staff.role = any(allowed_roles)
  );
$$;
revoke all on function private.has_staff_role(uuid, text[]) from public, anon, authenticated;
grant execute on function private.has_staff_role(uuid, text[]) to authenticated;

grant select on public.operators, public.staff_profiles, public.suppliers,
  public.products, public.stops, public.vehicles, public.departures,
  public.customers, public.orders, public.booking_items, public.bookings,
  public.payments, public.refunds, public.vehicle_positions, public.reviews,
  public.content_pages, public.redirects, public.audit_logs, public.inventory_holds
to authenticated;

create policy operators_staff_read on public.operators for select to authenticated
using (private.has_staff_role(id, array['owner','admin','operations','content_editor']));

create policy staff_profiles_self_or_owner_read on public.staff_profiles for select to authenticated
using (
  (auth_user_id = (select auth.uid()) and is_active)
  or private.has_staff_role(operator_id, array['owner'])
);

do $$
declare table_name text;
begin
  foreach table_name in array array['suppliers','products','stops','departures','reviews'] loop
    execute format('create policy staff_read on public.%I for select to authenticated using (private.has_staff_role(operator_id, array[''owner'',''admin'',''operations'',''content_editor'']))', table_name);
  end loop;
  foreach table_name in array array['vehicles','vehicle_positions','customers','orders','booking_items','bookings','inventory_holds'] loop
    execute format('create policy staff_read on public.%I for select to authenticated using (private.has_staff_role(operator_id, array[''owner'',''admin'',''operations'']))', table_name);
  end loop;
  foreach table_name in array array['content_pages','redirects'] loop
    execute format('create policy staff_read on public.%I for select to authenticated using (private.has_staff_role(operator_id, array[''owner'',''admin'',''content_editor'']))', table_name);
  end loop;
  foreach table_name in array array['payments','refunds','audit_logs'] loop
    execute format('create policy staff_read on public.%I for select to authenticated using (private.has_staff_role(operator_id, array[''owner'',''admin'']))', table_name);
  end loop;
end $$;

-- All mutations stay server-side so authorization, booking transactions and
-- future audit hooks cannot be bypassed with direct client writes.
-- Raw provider events, outbox payloads and API hashes remain server-only even to owners.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'operators','staff_profiles','suppliers','products','stops','vehicles','departures',
    'customers','orders','booking_items','bookings','payments','payment_events','refunds',
    'vehicle_positions','reviews','content_pages','redirects','api_keys','domain_events','audit_logs','inventory_holds'
  ] loop
    execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
  end loop;
end $$;

commit;
