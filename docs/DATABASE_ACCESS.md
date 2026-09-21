# Phase 1E database access

Migration: supabase/migrations/20260921000200_operator_access_policies.sql. This adds read access without introducing booking/admin features or a public mutation endpoint.

## Client reads

Anonymous sessions have no direct table access yet. Authenticated customers without active staff membership see no staff data. Public product/content delivery is a later phase.

| Tables | Active roles allowed to read, within their operator |
| --- | --- |
| operators | All staff roles |
| staff_profiles | Own active memberships; owners also see their operator roster |
| suppliers, products, stops, departures, reviews | All staff roles |
| vehicles, vehicle_positions, customers, orders, booking_items, bookings, inventory_holds | owner, admin, operations |
| content_pages, redirects | owner, admin, content_editor |
| payments, refunds, audit_logs | owner, admin |
| payment_events, api_keys, domain_events | No client read access; server-only |

Each policy checks current active membership for the row's operator. There is no global highest-role shortcut for users with multiple memberships. Deactivation removes privileges on the next statement; revocation during an already-running transaction or operation still needs consideration in future sensitive mutation APIs.

## Client mutations

All INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER privileges remain revoked from PUBLIC, anon and authenticated, including staff owners. No mutation policies exist. Even an accidentally granted write privilege does not permit rows to be written through RLS.

The application permission matrix describes capabilities of future server actions, not permission to bypass those actions with direct table writes. Keeping mutations server-side preserves central booking validation, capacity locks, authorization and later audit hooks. This includes catalog/content mutations because price and content changes must be attributable.

## Nonrecursive membership lookup

private.has_staff_role(operator_id, roles) is a stable SECURITY DEFINER helper with an empty search_path and fully qualified references. It uses auth.uid(), accepts no target user ID, and only reports whether the current request user has an active allowed membership. Its definer rights avoid recursively evaluating staff_profiles policies when checking membership.

The migration must run as the normal Supabase postgres migration owner that owns the tables. Do not enable FORCE ROW LEVEL SECURITY on staff_profiles without redesigning the helper, or transfer function ownership to an unprivileged role. The private schema must remain outside Supabase's exposed API schemas. Authenticated users receive only schema usage/function execution, never schema creation. PUBLIC and anon cannot execute the helper.

This implements [Supabase's RLS and private security-definer guidance](https://supabase.com/docs/guides/database/postgres/row-level-security). SQL policy role sets implement the read portion of the TypeScript permission contract; tests check each role/table against hasPermission so changes cannot drift unnoticed.

## Privileged server access

withOperatorService in src/modules/identity/operator-service.ts is marked server-only. It calls requirePermission before reading privileged configuration or constructing a fresh Supabase client. This membership lookup uses the verified user session, not the privileged key. The privileged client uses SUPABASE_SECRET_KEY with session persistence, token refresh and URL-session detection disabled; it never consumes browser cookies. Requests are uncached.

The callback is trusted application code, not user-provided JavaScript. It receives the verified staff context and must scope every resource query/update to context.operatorId, validate requested entity ownership and call the shared booking domain for financial/capacity operations. **The raw privileged client bypasses RLS across all operators; the wrapper does not automatically add tenant filters or transactions.** Unit tests prove authorization-before-client ordering, not the correctness of future domain callbacks. No domain callback or mutation endpoint is implemented in Phase 1E.

The migration explicitly grants SELECT/INSERT/UPDATE/DELETE on the 22 application tables to service_role, while leaving schema/FK/check/trigger constraints intact. This follows [Supabase's distinction between publishable and secret/service-role keys](https://supabase.com/docs/guides/database/secure-data). Do not return the client, key or raw provider errors from a route. Future workers/webhooks need separate narrowly scoped, independently authenticated entry points; do not bypass staff checks by fabricating staff contexts.

## Verification and limits

npm test now covers all four role/read matrices, real RLS-filtered membership queries passed through authorizeStaff, two-operator isolation, guessed IDs, nonstaff/disabled users, metadata forgery, multiple memberships, denied writes for every role/table, defence against accidental write grants and the explicit service-role bypass boundary. Prior structural/lifecycle tests still run.

The PGlite harness supplies a minimal auth.uid() from a simulated JWT subject and an explicit BYPASSRLS service_role. Setting test JWT subject variables is test-only; in Supabase they must originate from the verified API request. The tests do not verify token signatures, hosted Auth/PostgREST configuration or concurrent sessions. No real secrets, deployed policies or production services were used. Full local/development Supabase integration validation remains required before the Phase 1 checkpoint.
