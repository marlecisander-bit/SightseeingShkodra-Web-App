# Phase 5 audit: meeting-point payment and local notifications

2026-09-22. Overall **PARTIAL**. The implemented local scope passes automated checks; live messaging is explicitly deferred. No full Phase 5 checkpoint is appropriate. Stripe requirements are not applicable under the recorded pay-at-meeting-point amendment.

| Requirement | Result | Repository evidence |
| --- | --- | --- |
| Atomic reservation confirmation and retained seat capacity without online payment | PASS | `20260922000600_meeting_point_bookings.sql`; native PostgreSQL tests cover concurrent confirmation, rollback, replay, overselling denial and hold expiry after confirmation. |
| Authorized, duplicate-safe recording of meeting-point collection | PASS | `collection-server.ts` uses `payments.collect`; migration validates the staff actor; native tests verify one payment after concurrent collection, tenant-scoped reads and direct-write denial. |
| Cancellation releases inventory and flags collected refunds for review | PASS | `cancel_order_v1`; native tests distinguish unpaid cancellation from collected-payment refund review and reject collection after cancellation. |
| Independent notification queue and bounded retries | PASS locally | `20260922000800_notification_delivery_queue.sql`, `booking-notifications.ts`, database and integration tests. Notification failure leaves the reservation confirmed. |
| Duplicate and delayed worker handling | PASS locally | Database tests verify duplicate enqueue, lease rotation, rejection of stale tokens, five-claim exhaustion and uncertain sending leases; native concurrency test verifies `SKIP LOCKED`. |
| Simulated WhatsApp and email fallback | PASS locally | Integration tests cover consent gating, accepted/rejected/unknown results, timeout, fallback and channel-preserving retry. |
| Real WhatsApp/email delivery, receipts and consent | PARTIAL | Provider ports exist; no live adapters, scheduler or consent capture. Database defaults WhatsApp permission to false. Hosted queue migration remains unapplied. |
| Notification status visible to staff | PARTIAL | `bookings-panel.tsx` displays queue states with a graceful unavailable state; live data/browser notification-state QA is pending. |
| Stripe setup, webhook delivery and provider refunds | NOT APPLICABLE | User amendment in `DECISIONS.md`; no Stripe implementation or verification claimed. |

## Defects fixed during audit

The worker previously returned `retry` at its fifth claim even though persistence finalized the job as failed. It now reports and persists `failed`. A WhatsApp-only transient retry also previously chose an absent email adapter; it now keeps WhatsApp when no email adapter exists. Regression tests cover both cases.

Additional database tests prove that retry exhaustion leaves the booking confirmed and expired preparation leases rotate tokens, preventing delayed workers from updating the newly claimed job.

## Verification and review

Full test suite passed: **132 tests** (15 identity, 25 integration, 74 database, 18 native PostgreSQL), zero failures. Lint and TypeScript checks passed. Isolated production build passed; the existing default build-directory cleanup issue was avoided without deleting files.

Reviewed public checkout origin/session boundaries, staff collection authorization, notification RPC grants/RLS, queue lease transitions and server-only persistence. Core booking rules remain in the shared domain/database; notification code cannot mutate bookings through its ports. No new dependencies, credentials, migrations, environment variables, hosted writes or messages were introduced by this audit. Existing user edits to AGENTS.md and README.md were left untouched.

## Remaining work and next scope

Keep messaging disabled until providers, WhatsApp consent/templates, delivery receipts, reconciliation and scheduled worker activation are explicitly configured and tested. Production readiness and the full Phase 5 checkpoint remain pending. No tracking work was included in this audit. The next separately scoped build phase is 6B shared map, using a new single tracking source under the fresh-project amendment; 6A legacy reuse is not applicable.
