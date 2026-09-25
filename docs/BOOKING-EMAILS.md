# Resend booking emails

Implemented 2026-09-25. Delivery is **disabled** in the current development environment. No real emails were sent. Production enablement, DNS and the scheduler are still to be configured by the owner.

## Architecture

Successful booking transaction → existing `domain_events` outbox → protected scheduled Next.js worker → existing `notification_deliveries` queue → Resend HTTPS API.

Creation and cancellation reuse the existing atomic `booking.confirmed` and `order.cancelled` events. There is no general booking-edit endpoint in this project. Narrow database triggers capture meaningful updates to confirmed booking item product/departure/quantity and customer name/email/phone. They write outbox events only; they never call Resend. No-op updates produce no event; changes within a transaction coalesce by booking ID and transaction ID. Separate real modifications produce separate events. Failed/rolled-back changes cannot be consumed.

The worker runs outside the booking request and transaction. Provider downtime cannot roll back a valid booking. Each event creates independent customer and owner jobs, with a unique `(operator_id,event_id,recipient_type)` constraint. The worker obtains leases with `FOR UPDATE SKIP LOCKED`. Four jobs are processed per invocation. Run every minute initially; monitor backlog and increase invocation frequency/concurrency if needed.

No new booking architecture, payment provider, capacity rules or rescheduling feature was introduced. Reserved departure date/time edits remain protected. A booking status cancellation is handled by the cancellation service. Direct ad hoc SQL edits are not a replacement for authorized booking operations.

## Templates and truthfulness

One versioned HTML/plain-text renderer composes the three events for customer and owner. Uses the current platform raspberry brand (`#B91546`, darker `#9D103A` links/CTA), white card, text wordmark and inline table layout. Current logo files are SVG, so the emails use text branding for reliable image-independent rendering rather than embedding unsupported SVG. Version 1 colors/markup remain fixed to preserve retry payload identity; a future design should add another renderer version.

Includes actual reference, name, product, service date/time/timezone, passengers, amount/currency and payment evidence. Owner additionally sees available contact details, recorded booking timestamp/source and a protected booking-detail link. Cancellation includes actual cancellation time/reason and refund status/review evidence, without promising a refund. Current data is shown for modifications; previous values are not fabricated. Passenger age breakdown, notes and canonical meeting-point address are absent from the booking model and are omitted. Meeting-point payment instructions use the existing collection mode.

Preview without any sending: `npm run emails:preview` writes six HTML/text files under Git-ignored `private/email-preview/`. With `npm run dev`, open `/dev/booking-email-preview`; it returns 404 in production and reads no customer data.

## Delivery, retries and retention

Resend receives `Idempotency-Key: booking-email/<delivery UUID>`. Booking snapshot and non-secret sender/test configuration are saved before the first request, and reused byte-for-byte on retry. No HTML bodies or API keys are stored. A changed test/live mode fails the old job safely instead of redirecting an in-flight production job to real customers from development.

Timeouts/network ambiguity, 429, 5xx and concurrent-idempotency responses retry with backoff. Invalid requests and authentication errors fail visibly. Retries are limited to five attempts and stop before 23 hours from the first send. Expired ambiguous jobs become `uncertain`; never clear their key and blindly send again. Resend only guarantees deduplication for 24 hours. See [Resend idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys). Cancelled bookings suppress stale confirmation attempts.

`accepted` means Resend accepted the request, **not** delivered to an inbox. Delivery/bounce webhooks are not implemented. Use the Resend dashboard for provider delivery investigation. Structured application logs contain reference, event, recipient type, outcome, sanitized error code and provider ID. They never contain recipient addresses, names, message bodies, payment details or keys.

Each enabled worker run redacts snapshots, sender envelopes and error codes for terminal jobs older than 60 days. Compact event/recipient/job identity, status and provider IDs remain as deduplication tombstones. Do not delete these and rewind the activation timestamp: that can replay events. If the worker stays disabled, arrange a trusted scheduled call to `redact_booking_email_logs_v2(operator_id)` for continued retention cleanup. Review infrastructure log retention separately.

Admin booking details show the latest ten notifications for the booking (within a bounded 1,000-row query). Manual **Resend confirmation email** requires a confirmation checkbox, verified staff permission, confirmed booking, a stable request UUID and a five-minute per-booking cooldown. It queues current customer and owner confirmations and labels them manual. The message says *queued*, not *delivered*. Inspect uncertain attempts in Resend before intentionally requesting another confirmation.

## Exact configuration

All new settings below are server-only. Never prefix them with `NEXT_PUBLIC_`, commit real values, or paste keys into chat.

| Variable | Purpose |
|---|---|
| `EMAIL_ENABLED` | Defaults to false; only exact `true` enables processing. |
| `RESEND_API_KEY` | Resend sending key, stored in server secret settings. |
| `RESEND_FROM_EMAIL` | `Sightseeing Shkodra <bookings@sightseeingshkodra.com>` after domain verification. |
| `BOOKING_OWNER_EMAIL` | Business recipient for owner notifications. |
| `BOOKING_REPLY_TO_EMAIL` | Monitored business mailbox for guest replies. |
| `EMAIL_TEST_RECIPIENT` | Redirects both recipient types to this explicit test address; subjects/bodies clearly say TEST. Mandatory outside production. |
| `EMAIL_START_AT` | ISO 8601 UTC activation timestamp, e.g. the instant you enable the worker. Older events are not enqueued. Do not move backwards casually. |
| `CRON_SECRET` | Random secret of at least 32 characters for the scheduler's bearer header. |

Existing settings also required: `APP_ENV`, `NODE_ENV`, `NEXT_PUBLIC_SITE_URL`, `PUBLIC_OPERATOR_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`. Production delivery requires both `APP_ENV=production` and `NODE_ENV=production`, a production deployment when `VERCEL_ENV` is present, and an HTTPS site URL. Local/preview environments fail closed without a valid test recipient. The Supabase privileged key stays server-side.

Schedule an HTTPS `GET /api/internal/booking-emails` every minute, with header `Authorization: Bearer <CRON_SECRET>` supplied from the scheduler's secret store. Do not put the secret in the URL. Configure a 60-second function allowance. The handler accepts no operator/recipient/message parameters; it uses `PUBLIC_OPERATOR_ID`. A missing/incorrect secret returns 401, unavailable configuration/database returns a sanitized 503, and disabled delivery returns `{status:"disabled",processed:0}`. The endpoint is implemented; no hosted scheduler or public deployment was created by this task. With delivery disabled, booking events remain safely in the outbox.

The implementation uses Node's built-in `fetch` for Resend's [send-email API](https://resend.com/docs/api-reference/emails/send-email), with an eight-second timeout and no hidden SDK retries. No additional provider dependency is needed; the durable queue owns retries.

## Resend and DNS setup

1. In Resend **Domains**, add `sightseeingshkodra.com` and select a sending region. This matches the requested root-domain sender.
2. Copy the **exact generated** DNS names, types, values and priorities from its Records tab to your DNS provider: DKIM plus SPF/return-path records, using TXT/MX or CNAME as displayed. Values are account/region-specific and cannot be invented. Use DNS-only for any CNAME.
3. Preserve existing business-mail MX/SPF configuration; add Resend's records at the hostnames it specifies. Wait for Resend to show verified sending. Review/add DMARC without overwriting an existing policy.
4. Create a sending-access API key restricted to this verified domain where available. Put it in `RESEND_API_KEY` server secrets.
5. Set the sender above and configure `BOOKING_REPLY_TO_EMAIL` to an existing monitored mailbox. Verifying a sending domain does not create that mailbox.

Official references: [domain verification](https://resend.com/docs/add-a-domain), [API-key permissions](https://resend.com/docs/dashboard/api-keys/introduction). No DNS records, Resend account settings or keys were changed during this implementation.

## Supabase changes

- Existing prerequisite `20260922000800_notification_delivery_queue.sql` was absent from the development database and is now applied, unchanged. It creates the queue, its scoped read policy and service-only v1 lease functions.
- New `20260925000100_resend_booking_emails.sql` extends that table with recipient/event/manual/reference, snapshot/envelope and first-send metadata. Replaces booking-only uniqueness with separate legacy-booking and event-recipient partial unique indexes.
- Adds `capture_booking_email_change_v1`, `enqueue_booking_emails_v2`, `claim_booking_email_v2`, `prepare_booking_email_v2`, `request_booking_email_v2`, `redact_booking_email_logs_v2`; customer and booking-item change triggers.
- Replaces legacy enqueue/claim definitions to isolate legacy jobs. Reuses the existing finish RPC.
- No new business table, Edge Function or public mutation policy. Existing operator/role read policy remains; all worker/manual RPCs deny anon/authenticated execution and allow service role only. Server manual requests authenticate and authorize before obtaining the service client; the RPC also checks staff membership.
- Both notification migration versions were applied and recorded in development project `ybngoppqqiohcduojfyg`. Remote permission smoke checks passed and delivery count remained zero. Other pre-existing migration-history discrepancies were not repaired or replayed.

## Security review

Server-only configuration/provider/worker modules; secret authenticated cron; fixed operator binding; verified scoped staff action; trusted database-derived guest recipient; environment-derived owner; no caller-supplied body/recipient; HTML escaping and subject control-character removal; address validation; bounded batches; unique job keys; leased claims; manual cooldown; redacted exceptions/logs. Existing booking/customer RLS is unchanged. The development preview contains only synthetic data.

## Verification

- Database regression: 106 passed.
- Identity/permissions: 15 passed.
- Integration suite: 57 passed, including 15 new email tests using actual local PGlite migrations/booking transactions and a mocked provider.
- PostgreSQL concurrency suite: 21 passed, including concurrent email enqueue/claims and rollback. Total across suites: 199 passed.
- Lint, typecheck and final isolated optimized production build passed. The 15 email integration tests were rerun successfully after the final worker/configuration changes.
- Six email variants checked at 320, 375, 768 and 1280px in Chrome: no horizontal overflow. Desktop/mobile screenshots inspected. Actual admin resend control and disabled-mode feedback verified; no mail queued.
- Provider cases: acceptance, outage, rate limit, timeout, invalid/auth errors, concurrent and conflicting idempotency responses. Data cases: creation replay, multiple modifications/no-op retries, transaction rollback, cancellation replay, stale confirmations, invalid/missing guest address, optional absent fields, HTML injection, manual cooldown, operator/role denial, test mode and retention tombstones.
- Gmail, Outlook and Apple Mail inbox rendering/delivery are not claimed: no real delivery was attempted. Confirm these with controlled test addresses after domain verification.

## Files changed for this task

| File | Change |
|---|---|
| `.env.example` | Safe-off configuration and sender placeholders. |
| `package.json` | `emails:preview` command. |
| `src/modules/integrations/booking-email-config.ts` | Server-only validated configuration and email addresses. |
| `src/modules/integrations/booking-email-template.ts` | Central versioned six-variant HTML/text renderer. |
| `src/modules/integrations/resend-provider.ts` | Bounded HTTPS adapter and safe outcome classification. |
| `src/modules/integrations/booking-email-worker.ts` | Durable queue adapter, per-recipient delivery and structured logging. |
| `src/modules/integrations/booking-email-server.ts` | Trusted worker bootstrap, cron authorization and scoped manual resend. |
| `src/app/api/internal/booking-emails/route.ts` | Protected scheduler endpoint. |
| `src/app/admin/booking-actions.ts` | Resend action and clear feedback. |
| `src/app/admin/bookings-panel.tsx` | Per-event/recipient status, confirmed resend UI, selected-booking filtering. |
| `src/app/admin/[operatorId]/[section]/page.tsx` | Typed selected-booking query parameter. |
| `supabase/migrations/20260925000100_resend_booking_emails.sql` | Outbox capture, queue extension, leasing, manual request and retention. |
| `src/modules/integrations/booking-email-preview.ts` | Shared synthetic preview fixture. |
| `src/app/dev/booking-email-preview/page.tsx` | Development-only preview page. |
| `scripts/preview-booking-emails.mjs` | Offline HTML/plain-text exports. |
| `tests/integrations/booking-emails.test.mjs` | Email integration, safety, templates and provider tests. |
| `tests/postgres/concurrency.test.mjs` | Real PostgreSQL event-email concurrency regression. |
| `docs/RESEND-AUDIT.md` | Pre-implementation architecture audit. |
| `docs/BOOKING-EMAILS.md` | This implementation/configuration report. |
| `docs/DECISIONS.md`, `docs/PHASE_STATUS.md`, `README.md` | Record this user amendment, evidence and setup entry point. |

Ignored `private/` contains generated previews, test/build logs and temporary verification helpers. No private account files or environment secrets were changed. Existing unrelated workspace changes were preserved.

## Production checklist

- [ ] Verify Resend DNS/domain and set the sending key, sender, owner and reply-to.
- [ ] Deploy the application and required notification migrations; confirm intended operator and public HTTPS URL.
- [ ] Configure the authenticated scheduler and retention; alert on repeated 503s, backlog and failed/uncertain jobs.
- [ ] Enable with `EMAIL_TEST_RECIPIENT` first and a fresh `EMAIL_START_AT`. Exercise create/modify/cancel/manual resend on controlled test bookings and inspect both variants in target mail clients.
- [ ] Finish/inspect test jobs before switching mode. Set production environment flags, clear `EMAIL_TEST_RECIPIENT`, and set the intended live activation timestamp without replaying old events.
- [ ] Monitor initial provider acceptance/delivery. Disable with `EMAIL_ENABLED=false` if needed; bookings remain valid.
