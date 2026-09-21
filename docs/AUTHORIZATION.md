# Staff authentication and authorization

Phase 1D adds server-session integration and a central staff permission model. No login UI, user provisioning or usable RLS policy is added yet.

## Initial role policy

The roadmap's owner/admin and operations/staff labels map to four canonical values: owner, admin, operations, content_editor. Unknown values are rejected by the database and the authorization helper.

| Capability | Owner | Admin | Operations | Content editor |
| --- | --- | --- | --- | --- |
| Staff, operator settings, integrations | Yes | No | No | No |
| Read catalog | Yes | Yes | Yes | Yes |
| Manage products/pricing | Yes | Yes | No | No |
| Manage departures | Yes | Yes | Yes | No |
| Read/create/cancel bookings | Yes | Yes | Yes | No |
| Refund payments | Yes | Yes | No | No |
| Read customers | Yes | Yes | Yes | No |
| Manage content | Yes | Yes | No | Yes |
| Manage tracking | Yes | Yes | Yes | No |
| Read audit records | Yes | Yes | No | No |

The executable permission matrix lives in src/modules/identity/roles.ts. Future actions must reuse it. Permission to manage a departure or booking does not bypass capacity, payment or audit rules.

## Trust boundary

Protected Server Actions, Route Handlers and server data loaders must call requirePermission(operatorId, permission). This server-only wrapper creates a request-scoped cookie client, verifies identity with auth.getUser(), and queries staff_profiles using BOTH auth_user_id and operator_id. It validates ownership, canonical role, active flag and permission. Roles never come from user_metadata, caller-supplied role strings or an unverified session object.

Membership is reread on every call so a disabled/demoted profile does not retain privileges through cached roles. The immutable result contains IDs and role only. All later resource queries must scope themselves to context.operatorId; permissions alone do not prove resource ownership.

authorizeStaff is internal testable orchestration; its IdentitySource is a trusted server dependency, never browser input. hasPermission is a pure policy helper, not authentication. Navigation/layout checks do not replace checks at mutation and data-access boundaries. Errors are UNAUTHENTICATED, FORBIDDEN or UNAVAILABLE, for future routes to map to 401, 403 and 503 without leaking provider/database responses.

## Session integration

The server client uses @supabase/ssr, asynchronous Next.js cookies and uncached requests. src/proxy.ts refreshes sessions on /admin, /auth and /api/admin paths and forwards refreshed cookies to both the downstream request and response. Responses are private, no-store. The proxy maintains sessions; protected handlers still authorize each action.

This follows the [Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and [verified getUser guidance](https://supabase.com/docs/reference/javascript/auth-getuser). The public homepage is outside the matcher and builds without credentials. Future authenticated routes need matching refresh coverage and must not use ISR/shared caching. Login/callback/logout routes and UI belong to the later admin experience.

## Configuration and database

20260921000100_staff_roles.sql constrains roles and adds is_active with default true. It adds no grants or policies. Unknown existing roles fail migration rather than silently gain privileges. First-owner provisioning and later invitations must use trusted audited server operations; there is no public self-promotion path.

For a dedicated development project, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in ignored .env.local. Never place a privileged secret in the publishable-key field. SUPABASE_SECRET_KEY is unused by Phase 1D. No cloud project/credentials were supplied or modified.

**Real staff_profiles reads remain denied until Phase 1E adds the appropriate grant and RLS policy.** requirePermission fails closed in that situation. This phase deliberately does not bypass RLS with a secret client. Phase 1E must provide narrowly scoped membership reads and the remaining operator policies.

## Evidence and limits

npm run test:identity checks the policy and identity orchestration with injected sources. npm run test:db applies the full migration chain to embedded PostgreSQL, persists all four role fixtures and rejects client self-promotion. Synthetic fixture users have no passwords or live Auth accounts. npm test runs both suites.

These checks do not validate hosted Auth, real cookie refresh, session expiry/revocation or PostgREST policies. End-to-end sign-in and real operator isolation require local/development Supabase after Phase 1E and before the Phase 1 checkpoint.
