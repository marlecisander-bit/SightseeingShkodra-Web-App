# Phase 7C — production readiness audit

Date: 2026-09-23. Audited application baseline: `d50ea3c`, branch `main`.

**Decision: NO-GO for production.** Local regression and build pass, but operational evidence below is missing. This is a completed local readiness assessment, not completed launch acceptance. Phase 7B staging acceptance remains pending. No deployment, DNS change, hosted migration, provider activation or production data access was performed.

## Evidence and remaining gates

| Area | Evidence | Result / required action |
| --- | --- | --- |
| Regression | Fresh `npm test`: 15 identity, 32 integration, 74 database and 18 native PostgreSQL tests, 139 total | PASS locally; covers role/tenant boundaries, capacity contention, idempotency and meeting-point confirmation/collection |
| Build | Fresh optimized build in ignored `private/build-phase7c` | PASS; temporary configuration restored. Existing OneDrive `.next` cleanup limitation remains |
| Static checks | Fresh `npm run lint` and `npm run typecheck` | PASS; no retained build configuration changes |
| Admin security | `PHASE_3_AUDIT.md` accepts development admin workflows and browser role denial; proxy refreshes sessions, protected handlers reauthorize | Development evidence accepted; repeat against deployment and real staff assignments before launch |
| Mobile booking | `MEETING_POINT_BOOKINGS.md` records confirmation/reload at 390px with hosted development RPC checks | Prior evidence only; production-equivalent mobile booking and staff collection UI still need final rehearsal |
| Payment decision | Approved amendment: reserve seats now, pay at meeting point | Stripe mode/webhooks are not launch requirements. Validate collection, cancellation and due/collected reconciliation; do not release confirmed seats just because a form expires |
| SEO and content | Phase 7B local crawl passed; real catalog previously left empty for owner entry | BLOCKER: approved content and staging crawl, including visible prices, departures, meeting point, contact and cancellation terms |
| Environment | `.env.example`, identity configuration and SEO gate inspected; only `.env.example` tracked, no private files tracked | BLOCKER: staging/production bindings, keys, Auth URLs and indexing reviewed in hosting environment; actual secret values not inspected |
| Backup and restore | No completed restore-drill evidence found | BLOCKER: restore into an isolated target and verify data/security before accepting recovery capability |
| Observability | Domain audit/event persistence has tests; no application error-monitoring integration found in `src` search | BLOCKER: named alert recipient, redacted error monitoring, booking-failure and availability checks demonstrated on staging |
| Notifications | Local queue and simulated delivery tests; Phase 5E hosted migration/provider/scheduler deferred | BLOCKER to promised automatic confirmations: complete delivery setup and fallback tests, or explicitly approve a launch scope without automatic delivery. Current local-only decision is not launch acceptance |
| Tracking | Phase 6 accepts independent iframe at four public placements and recovery control | Host integration accepted locally; rehearse current tiles, GPS freshness, offline behavior and direct-link fallback. Original tracking backend remains authoritative and independent |
| Rollback | Rehearsal procedure below | BLOCKER: actual previous deployment, recovery point and restoration evidence not yet recorded |

## Environment review for the deployment rehearsal

Use the existing configuration names, without putting values in this report:

- `APP_ENV`: keep staging non-production; the production value is a later launch action.
- `NEXT_PUBLIC_SITE_URL`: exact intended origin for that environment. Check generated canonicals on deployed pages.
- `SITE_INDEXING_ENABLED`: false throughout staging; enable only at an approved production launch after the indexing review.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: matching intended project. These are the only browser-facing Supabase credentials.
- `SUPABASE_SECRET_KEY`: hosting secret, server-only. Never expose through a `NEXT_PUBLIC_` variable or browser bundle.
- `PUBLIC_OPERATOR_ID` and `PUBLIC_HOMEPAGE_PRODUCT_SLUG`: bind to the approved operational catalog, not synthetic QA fixtures.
- `CHECKOUT_SESSION_SECRET`: server-only random secret of at least 32 characters; keep stable across rollback-compatible deployments so existing booking recovery sessions remain usable.

Verify Auth redirect/site URLs for that deployment, least-privilege staff membership, and migration history before any release. The notification migration `20260922000800` was previously recorded as local-only; this audit did not query or change hosted migration state. No new variables were added.

## Backup and rollback rehearsal

This is a procedure to execute in a separately prepared staging environment, not a claim that recovery has been tested.

1. Record release commit, migration versions, environment configuration version, responsible operator and recovery objectives. Choose a recoverable deployment artifact; a Git tag alone is not a database backup.
2. Have the database administrator create a protected backup using the project's supported backup/export method. Document database, Auth and Storage coverage separately, including anything excluded. Keep secrets and customer exports outside Git and reports.
3. Restore to a new isolated target with outbound messaging disabled. Never restore over the live database for a rehearsal. Record backup time, restore start/end, achieved recovery point and missing dependencies.
4. Verify migration versions, tenant/RLS boundaries, staff access and representative catalog/order/item/payment/audit relationships. In the restored test environment, rehearse a synthetic last-seat reservation, retry, meeting-point collection and cancellation. Confirm capacity and audit/event consistency.
5. Rehearse switching the staging app back to the recorded compatible deployment. Check Auth, private booking recovery, availability, admin access and iframe fallback. Preserve the independent map service.
6. If a future release has incompatible schema changes, stop and choose a reviewed forward fix or coordinated restore; do not blindly run down-migrations. A restore can discard reservations made after the backup, so record and reconcile that window before reopening booking.
7. Record actual artifact IDs, evidence, timing and sign-off here before changing NO-GO. Any production cutover belongs to Phase 7D and requires explicit authorization.

## Owner's next actions

1. Enter the real tour, prices, stops, departures, contact details and cancellation terms in the admin panel.
2. Provide the intended staging hosting project when ready to deploy a test site. No hosting project or production domain is assumed.
3. Complete the staging booking, backup/restore, monitoring and map rehearsal with the developer; decide whether to activate customer notifications before launch.

No application architecture or roadmap baseline changed. Existing amendments remain authoritative. Phase 7D is not ready to start.
