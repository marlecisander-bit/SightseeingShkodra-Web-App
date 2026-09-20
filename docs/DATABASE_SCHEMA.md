# Phase 1B database foundation

Core migration: `supabase/migrations/20260917000100_core_schema.sql`.

Phase 1C adds `20260920000100_inventory_holds_and_states.sql`, bringing the schema to 22 tables. See [Booking state model](BOOKING_STATE_MODEL.md) for current hold and lifecycle constraints. The Phase 1B notes below describe the original structural baseline; the state-related deferrals are now superseded by Phase 1C.

## Scope and relationships

The migration creates all 21 tables named in Prompt 1B. Inventory holds and lifecycle constraints belong to Phase 1C; staff role definitions to 1D; usable access policies to 1E; outbox/audit helpers to 1F. No booking API, payment processor, notification handler or seed deployment is included.

| Area | Tables |
| --- | --- |
| Ownership and staff | operators, staff_profiles |
| Catalog and schedules | suppliers, products, stops, vehicles, departures |
| Customers and booking | customers, orders, booking_items, bookings |
| Payment records | payments, payment_events, refunds |
| Tracking | vehicle_positions |
| Content | reviews, content_pages, redirects |
| Integration and audit records | api_keys, domain_events, audit_logs |

Every operator-owned table includes a non-null operator_id. Composite foreign keys bind children to parents in the same operator, including tables where the roadmap sketch omitted this column. A booking item with a departure must reference the same product as that departure. A single order supports several scheduled/unscheduled items and one booking reference. Records referenced by financial or audit data cannot be deleted implicitly; no cascading business deletes are configured.

staff_profiles.auth_user_id references the Supabase-managed auth.users primary key. One user may have a staff profile in multiple operators. audit_logs.actor_id references an operator's staff profile, or is null for a system action. Polymorphic event/audit entity IDs are not foreign keys; their domain validation belongs to later helpers.

## Representation decisions

- Money is bigint in minor units (EUR cents), never floating point. Currency is a three-letter uppercase code; payment currency must match its order. Refund currency is inherited from its payment. Amount reconciliation, pricing, refund ceilings and state transitions remain later domain work; this migration enforces non-negative amounts/positive refunds, not transactional financial correctness.
- Product types remain extensible text. State columns have initial defaults but no lifecycle vocabulary or transition enforcement yet, per Phase 1C.
- Departure dates/times are local to the operator timezone (default Europe/Tirane). Timezone validation and DST-aware conversion are future domain concerns. Audit timestamps use timestamptz. Mutable tables receive updated_at triggers; event/audit records use explicit processing/publication timestamps instead.
- vehicle_positions stores one latest row per vehicle. Speed is meters per second; heading is degrees in [0,360). Coordinates use latitude/longitude degrees. No second tracking source or history table is created.
- Slugs are unique per operator. Product/content OG images require nonempty alt text when present. Rich content bodies are JSON objects; full CMS image validation belongs to the CMS phase.
- Provider references/events are unique per operator and provider; payment attempts may have null references before provider creation. Event/refund provider must match the parent payment. Future webhook handlers must resolve operator/provider context from trusted configuration, not caller-controlled ownership. Multiple provider accounts per operator would require an explicit provider-account namespace migration.
- API keys store a lowercase hexadecimal SHA-256 digest, never the raw key; random key generation, scopes and authentication are future work.
- Redirects remain available for future URL changes despite the no-import decision. Route normalization/loop detection belongs to later domain validation.

## Safe baseline

All 21 tables have RLS enabled and privileges revoked from PUBLIC, anon and authenticated. No policies are created. This intentionally permits no direct browser access. The Phase 1E policies will selectively enable approved actions. Database owners/service-role infrastructure remain privileged; this is not a completed authorization implementation.

This follows [Supabase's requirement to enable RLS for SQL-created tables](https://supabase.com/docs/guides/database/postgres/row-level-security) and its [auth user reference guidance](https://supabase.com/docs/guides/auth/managing-user-data).

## Validation and application

Run `npm run test:db`. The suite applies the exact SQL migrations in filename order to fresh in-memory [PGlite PostgreSQL](https://pglite.dev/docs/), then checks valid inserts, cross-operator rejection, constraints, timestamps and default access denial. Test-only fixtures are disposable. The harness supplies minimal auth.users and anon/authenticated platform prerequisites, including permissive default grants to verify that the migration revokes them.

No Docker/PostgreSQL/Supabase CLI executable was available on PATH during this phase. PGlite tests validate actual PostgreSQL SQL behavior, but not Supabase Auth, PostgREST, hosted service-role configuration, extensions or concurrency. No Supabase project has been connected or changed. A full local/development Supabase reset and platform integration validation remain required before the Phase 1 checkpoint.

On Supabase, its platform already supplies auth.users and roles; never apply the test harness stubs there. Apply versioned migrations through the normal Supabase migration workflow once a local/development project is configured. Do not paste ad hoc schema edits into a production dashboard. Applied migrations are immutable; later changes must use new migration files.
