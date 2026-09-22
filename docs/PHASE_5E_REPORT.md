# Phase 5E: local booking confirmations

2026-09-22. Local foundation implemented; live delivery remains pending. The user requested local testing before setting up providers. No messages sent, provider accounts configured or hosted migration applied. The original V4 roadmap remains unchanged.

## Implementation

- Independent queue consumes `booking.confirmed` and `customer.notification.requested` without marking shared events published. One confirmation job per operator/booking prevents duplicate ingestion.
- Worker claims use leases and `SKIP LOCKED`. Staff can read status within their operator; public/authenticated callers cannot invoke delivery RPCs or modify jobs.
- Confirmation text includes booking reference, tour, departure, guests and EUR total. Meeting-point reservations say payment is due unless collection was recorded. Notification failures never change bookings or payments.
- Sending is disabled by default. Simulated provider ports receive stable per-job/channel idempotency keys.
- Definitive WhatsApp rejection schedules email fallback. Known retryable failures use exponential backoff, with five claims maximum. Unknown results, timeouts and expired sending leases become `uncertain` for staff review instead of automatically resending.
- Provider acceptance is distinct from delivery. Contacts are read during processing, not copied into queue rows or error logs.
- Admin booking status tolerates an unavailable queue, preserving booking management before migration application.

## Database and configuration

`20260922000800_notification_delivery_queue.sql` adds the queue, RLS and five service-role-only RPCs. Tested in local PGlite and native PostgreSQL; intentionally pending on hosted Supabase. No automatic enqueue trigger, scheduler, public worker endpoint or new environment variables.

The database snapshot returns `whatsappAllowed: false` until explicit consent storage and an approved WhatsApp template exist. Tests simulate consent only to exercise channel selection.

## Verification

All 129 tests passed: 15 identity, 24 integration, 72 database and 18 native PostgreSQL. Coverage includes duplicate ingestion, operator isolation, invalid leases, cancellation before sending, retries, uncertain outcomes, email fallback and competing worker locks. Lint, TypeScript checks and an isolated production build passed. The isolated build avoids the existing Windows cleanup issue in the default build directory. Browser visual verification of notification states remains pending.

Run `npm run notifications:preview` for fictional confirmation text in the terminal. Verified without network or database access; no booking or message is created.

## Remaining work

Before live delivery: select/configure providers, implement explicit WhatsApp consent and approved templates, test actual provider adapters, apply the migration and connect an authenticated scheduled worker with an explicit event start time. Add delivery receipts and a reconciliation procedure for uncertain sends. There is no automated delivery or manual retry control in the admin UI yet. No Phase 5 checkpoint or later-phase work is claimed.
