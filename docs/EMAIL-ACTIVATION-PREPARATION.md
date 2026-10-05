> Current hosting decision (5 October 2026): Vercel is the permanent main-app host. The owner chose Hobby with background delivery disabled. Netlify scheduling instructions below are historical/legacy only and must not be used for new activation. Follow [DEPLOYMENT.md](../DEPLOYMENT.md). Notification projection and push dispatch are paused on Vercel.

﻿# Email activation preparation — 25 September 2026

## Outcome and scope
Prepared locally around the existing Resend provider, notification_deliveries queue and protected GET /api/internal/booking-emails worker. No second sender, queue, Edge Function or worker endpoint. Booking logic and independent live map unchanged. No emails sent, hosted configuration changed, migrations applied remotely or deployment performed.

## Hosting and scheduling
Detected existing main-site host: Netlify (sightseeingapp.netlify.app). New native Scheduled Function invokes the existing authenticated endpoint once per minute. Production/published context, APP_ENV, EMAIL_ENABLED, matching HTTPS canonical origin and CRON_SECRET are checked. Redirects are rejected. A 25-second timeout reports an unconfirmed invocation; it does not immediately retry. Existing leases and provider idempotency remain authoritative.

## Configuration and manual activation
See [BOOKING-EMAILS.md](BOOKING-EMAILS.md#exact-configuration-contract) for the exact required/secret/purpose/example table and its 15 numbered setup steps. Sender name belongs in RESEND_FROM_EMAIL. Resend requires a verified sending domain and its supplied DNS records. Gmail can receive owner notifications/replies; no Gmail SMTP or credentials are needed.

Automatic sending defaults off. EMAIL_TEST_RECIPIENT redirects both recipient variants to one inbox. EMAIL_START_AT is an inclusive event-created timestamp, not travel date. New claim filtering also skips previously queued historical events. Mode transitions require disabling and allowing in-flight work to settle; already-started sends cannot be recalled. Intentional manual resend produces a new event under existing safeguards.

## Heartbeat and database
New local migration: supabase/migrations/20260925000500_email_worker_readiness.sql.
Adds email_worker_status, one bounded row/operator, owner-only reads and service-only start/finish RPCs. Queue history cannot prove an empty invocation, hence this minimal separate operational table. Superseded run completions cannot overwrite newer evidence. Admin only reports Operational for a recent completed run; acceptance is not inbox delivery. Migration also replaces claim_booking_email_v2 with a backward-compatible optional activation-boundary argument. Apply migration before enabling the updated worker, during a separately authorized release.

## Security and verification
Server-only provider/configuration boundaries retained; no key passed into admin props or scheduler output. Existing timing-safe bearer authentication retained. Unauthorized actual route calls return 401; authorized disabled calls return 200 without side effects. Test transport mocked; no real Resend calls. Database tests used only local PGlite/embedded PostgreSQL.

- 83 focused tests passed: core schema/RLS, notification delivery, booking emails (17), email admin (8), scheduler/heartbeat (5).
- 21 embedded PostgreSQL concurrency tests passed, including overlapping email enqueue/claim operations.
- TypeScript, lint and production build passed.
- Coverage includes historical/prequeued events, exact-boundary events, customer/owner redirection, retries, immutable provider keys, manual resend, rollback, heartbeat empty runs, overlapping completion and stale evidence.
- Hosted cron execution, DNS verification, inbox delivery and production heartbeat remain unverified until the later approved release/configuration. No live operational claim.

## Files changed for this preparation
- netlify.toml (new): existing build settings/custom function directory.
- netlify/functions/booking-email-schedule.mjs (new): native scheduling adapter.
- supabase/migrations/20260925000500_email_worker_readiness.sql (new): heartbeat and historical-claim exclusion.
- src/modules/integrations/email-worker-heartbeat.ts (new): evidence persistence/health calculation.
- src/modules/integrations/booking-email-server.ts: heartbeat around existing worker.
- src/modules/integrations/booking-email-worker.ts: activation boundary passed to claims; bounded batch start budget.
- src/modules/integrations/email-admin-server.ts and src/app/admin/email-panel.tsx: safe heartbeat read/display (extend pending admin work).
- tests/integrations/email-scheduler.test.mjs (new), booking-emails.test.mjs, email-admin.test.mjs, tests/database/core-schema.test.mjs: regression coverage/schema inventory.
- .env.example, docs/BOOKING-EMAILS.md, docs/PHASE_STATUS.md, this report: setup and evidence.

Previously pending Email & Notifications admin files remain uncommitted and are preserved. No claim that all working-tree changes originated in this preparation.

LOCAL ONLY — NOTHING DEPLOYED
