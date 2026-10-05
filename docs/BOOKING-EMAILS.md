> Current hosting decision (5 October 2026): Vercel is the permanent main-app host. The owner chose Hobby with background delivery disabled. Netlify scheduling instructions below are historical/legacy only and must not be used for new activation. Follow [DEPLOYMENT.md](../DEPLOYMENT.md). Notification projection and push dispatch are paused on Vercel.

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

## Production activation preparation — 25 September 2026

**Prepared locally only. No deployment, real email, environment change or hosted migration was performed. EMAIL_ENABLED remains off.**

### Detected host and scheduler

The main website is Netlify project **sightseeingapp**, `https://sightseeingapp.netlify.app`, linked to `marlecisander-bit/SightseeingShkodra-Web-App` (`main`). README and saved local Netlify site metadata identify this host; the independent map is a different project and is not involved.

`netlify/functions/booking-email-schedule.mjs` is a thin native Netlify Scheduled Function. It runs at `* * * * *` (once per minute, UTC) and calls the existing `GET /api/internal/booking-emails` with the existing CRON_SECRET bearer header. It does not import the email engine, access Supabase, create jobs, render emails or send to Resend itself. No new HTTP worker endpoint or external cron platform is introduced. `netlify.toml` preserves `npm run build` and `.next`, and identifies the custom functions directory. Next.js remains handled by Netlify's framework runtime.

The adapter refuses preview/unpublished contexts, non-production APP_ENV and disabled sending. It obtains the site's canonical URL from trusted Netlify context and requires NEXT_PUBLIC_SITE_URL to have the same HTTPS origin. Redirects are rejected so credentials cannot follow a redirect. No request bodies, headers or raw provider exceptions are logged.

Netlify Scheduled Functions have a 30-second execution limit. The adapter waits at most 25 seconds for the existing worker and makes no immediate retry. A timeout is **unconfirmed**, not successful; an already-started worker may still finish. The queue's leases and immutable Resend idempotency keys handle subsequent invocations. The worker retains its four-job batch and a 60-second route allowance; its start-next-job budget is 20 seconds, leaving room for the last delivery and heartbeat. Normal fast requests can process four messages (two customer/owner pairs) per minute. This is not a guaranteed delivery SLA; monitor backlog and failed jobs before changing throughput.

The cron is prepared, not active until a later approved deployment. Netlify's Functions screen should then show the Scheduled badge and next run. Approximately 1,440 invocations/day when scheduled; disabled calls exit before reaching the worker. No secrets belong in netlify.toml.

Official references: [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/), [function runtime environment variables](https://docs.netlify.com/build/functions/environment-variables/), [trusted deploy/site context](https://docs.netlify.com/build/functions/api/). These documents were checked during preparation. Function environment changes require a new deploy to take effect.

### Exact configuration contract

Examples below are formats/placeholders, not real credentials. Set values on the **main website project**, not the standalone map. In Netlify use **Production** context and **Functions** scope; existing NEXT_PUBLIC values also need **Builds** scope. Keep previews/development on APP_ENV=development, EMAIL_ENABLED=false, with no live sending credentials. Do not rely on build-only CONTEXT being present in a function. Existing VERCEL_ENV checks remain compatibility safeguards, not a new hosting dependency.

| Variable | Required? | Secret? | Purpose | Example format |
|---|---|---|---|---|
| EMAIL_ENABLED | For automatic processing; defaults off | No | Exact `true` enables the worker; leave `false` during preparation | `false` |
| RESEND_API_KEY | For real provider calls | **Yes** | Resend sending API key, server only | Copy privately from Resend; never paste into source/chat |
| RESEND_FROM_EMAIL | For tests/live delivery | No | Combined sender name and verified-domain address | `Sightseeing Shkodra <booking@sightseeingshkodra.com>` |
| BOOKING_REPLY_TO_EMAIL | For tests/live delivery | No, but private contact setting | Mailbox receiving guest replies | `your-monitored-inbox@gmail.com` or custom-domain mailbox |
| BOOKING_OWNER_EMAIL | For tests/live delivery | No, but private contact setting | Owner booking notifications | `your-owner-inbox@gmail.com` |
| EMAIL_TEST_RECIPIENT | Required outside production and for admin test send; keep set during production testing | No, but private contact setting | Redirects both customer/owner messages to one controlled inbox | `your-test-inbox@gmail.com` |
| EMAIL_START_AT | For enabled processing and validated test configuration | No | Inclusive UTC event activation boundary | ISO 8601 UTC: `YYYY-MM-DDTHH:mm:ss.sssZ` (choose actual cutover time, never this placeholder) |
| CRON_SECRET | For scheduler/worker authentication | **Yes** | Random bearer secret, minimum 32 characters | Generate 32 random bytes as 64 hex characters in a password manager |
| APP_ENV | For live mode / scheduled adapter | No | Existing deployment environment guard | `production` on production only |
| NODE_ENV | Required runtime condition; Next sets it | No | Live mode also requires production runtime | `production` (do not override Next locally) |
| NEXT_PUBLIC_SITE_URL | Existing setting required by config and scheduler | No; public | Canonical public origin and protected admin links | `https://sightseeingapp.netlify.app` (update together with Netlify canonical domain if changed) |
| PUBLIC_OPERATOR_ID | Existing setting required | No | The actual operator/workspace UUID | Existing production UUID, not a synthetic test operator |
| NEXT_PUBLIC_SUPABASE_URL | Existing setting required | No; public | Main booking database URL | `https://<project-ref>.supabase.co` |
| SUPABASE_SECRET_KEY | Existing setting required by worker | **Yes** | Privileged database access from server only | Existing Supabase server secret |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Existing setting required for admin sign-in | No; publishable | Existing session/auth client | Existing publishable key |
| VERCEL_ENV | Not required on Netlify | No | Existing compatibility guard when present | Leave unset on Netlify |

There is no separate sender-name variable. Configure the name exactly **Sightseeing Shkodra** inside RESEND_FROM_EMAIL. Either booking@ or info@ on a verified domain works; choose one address once in this setting. The API key is read only by server-only modules; the browser invokes authenticated server actions, never Resend. Gmail is only a recipient/reply mailbox, not the sending service. No Gmail SMTP, app password or Google credentials are needed or added.

### Activation boundary and test/live transition

EMAIL_START_AT filters **event creation time**, not booking date or travel date. `created_at >= EMAIL_START_AT` is eligible, including an event exactly on the boundary. A new, legitimate modification/cancellation of an older booking can still notify if that event occurs after activation. A deliberate manual resend creates a new event and remains allowed by the existing permission/cooldown policy.

The new local migration also applies the boundary when claiming jobs: old pending/retry jobs become skipped with `before_activation_boundary`. This fixes the previous gap where a later activation timestamp stopped enqueueing old events but did not exclude jobs already queued. Accepted/failed/uncertain history is retained; no sent record or idempotency tombstone is deleted. Never move the timestamp backwards to clear a warning.

**In-flight sends cannot be recalled.** Before changing test recipient, live mode or activation boundary, disable automatic sending, publish that disabled configuration when authorized, and allow at least three minutes for previous invocations/leases to settle; verify logs/queue. Only then set the new boundary and mode. Do not manually clear leases. Jobs with a frozen envelope from a different test/live mode fail safely instead of changing recipients on retry.

While EMAIL_TEST_RECIPIENT is set, all deliverable guest and owner messages go to that one address. Test subjects are marked TEST. Missing/invalid customer addresses may still be skipped, as in the existing engine. Admin's synthetic test can run while EMAIL_ENABLED=false, but it requires complete configuration and accepts only the configured test address. It uses no booking queue rows, so its result is shown in the admin form/Resend dashboard, **not** as a booking delivery-history row.

### Worker heartbeat and migration

Apply `supabase/migrations/20260925000500_email_worker_readiness.sql` only during a separately approved release, after the existing notification migrations. It is **not applied remotely by this task**.

Existing queue timestamps cannot prove an empty worker run, and writing fake booking events or an audit row every minute would be misleading/unbounded. The migration adds the smallest separate operational record: **email_worker_status, one row per operator**. No new queue. Columns hold start/completion/last-success time, run token, mode/outcome and processed count; no credentials, message body or customer information. Owner-scoped read RLS; start/finish RPCs are service-role only. A superseded overlapping invocation cannot overwrite the newest invocation's result.

The worker starts this heartbeat before processing and completes it only after processing returns, including an empty queue. Unhandled failure records failed when storage is reachable; a crash/database outage remains running and then overdue. Disabled worker calls remain side-effect-free and do not create a heartbeat.

Admin shows Operational only for a completed live/test run within three minutes; test mode is labelled. It shows Running, Run overdue, Last run failed, No recent successful run, Disabled or Unverified otherwise. This is evidence of worker execution, not proof of inbox delivery or a promise about future cron execution. An authorized manual invocation produces equivalent execution evidence. Configuration errors before worker start may leave old evidence until it becomes stale; the separate readiness card reports configuration failure immediately. Pending and failed/uncertain totals still come from notification_deliveries.

### Aleksander — setup steps (perform later, after review)

1. **Find/create your Resend API key.** Open Resend > API Keys. Prefer sending-only access restricted to your sending domain. Save it privately; do not send it in chat.
2. **Add the sending domain.** In Resend > Domains, add the domain used after @ in your chosen sender. Wait for verified status before sending from it.
3. **Copy DNS records.** At your domain's DNS provider, enter exactly the DKIM/SPF/return-path records Resend supplies, including their names/types/values/priorities. Do not invent DNS values or replace your existing Gmail/business-mail MX records. Review DMARC separately. Resend verification does not create a mailbox.
4. **Choose your sender.** Set RESEND_FROM_EMAIL to `Sightseeing Shkodra <your-chosen-address@your-verified-domain>`.
5. **Choose Reply-To.** Put a real monitored inbox in BOOKING_REPLY_TO_EMAIL. A Gmail inbox is allowed.
6. **Choose your owner inbox.** Put the address for booking notifications in BOOKING_OWNER_EMAIL. It can be the same monitored Gmail inbox.
7. **Choose one test inbox.** Put it in EMAIL_TEST_RECIPIENT. Keep this populated until controlled booking tests are complete.
8. **Create the cron secret.** Use your password manager's random generator for at least 32 random characters (64 hex characters is suitable). Save it privately as CRON_SECRET. Do not put it in a URL.
9. **Configure Netlify.** Open the **sightseeingapp** project > Project configuration > Environment variables. Enter the table's values in Production/Functions; public variables also need Builds. Keep EMAIL_ENABLED=false. Keep the existing Supabase values/operator ID. Set EMAIL_START_AT to the actual current UTC setup time. Leave preview/branch environments disabled and without live credentials.
10. **Arrange the approved release.** Ask for the pending migration and code to be applied/deployed after review. This includes the admin page and prepared scheduler; it has not happened yet. Once released, Netlify > Functions should show booking-email-schedule with a Scheduled badge. No separate cron URL or another service is needed. Disabled sending will simply skip each tick. Verify the existing worker has no extra site-password/SSO interception; do not disable site protection indiscriminately.
11. **Send a synthetic test.** Sign in as owner > Settings > Email & Notifications. Check readiness, enter the configured test inbox and press Send test email. Automatic sending stays off. If it fails, check sender verification/server configuration; do not paste keys into screenshots.
12. **Check the inbox.** Confirm arrival, including spam, and inspect the message in Resend. Provider acceptance alone is not proof it arrived. Confirm Reply-To reaches your intended inbox.
13. **Verify booking history safely.** When you are ready for controlled tests, keep EMAIL_TEST_RECIPIENT set, choose a fresh EMAIL_START_AT, then enable EMAIL_ENABLED=true and redeploy that configuration. Create a clearly identified test booking using the normal app (it reserves seats); verify customer and owner jobs in admin, both arriving only at the test inbox. Test cancellation and manual resend; cancel the test booking to release seats. The worker heartbeat should report Operational (test mode). Synthetic tests from step 11 do not appear in booking history.
14. **Enable live automatic emails only after tests.** Set EMAIL_ENABLED=false and publish the disabled configuration. Wait at least three minutes and inspect pending/in-flight/test jobs. Set EMAIL_START_AT to your chosen live UTC activation time, clear EMAIL_TEST_RECIPIENT in Production only, verify APP_ENV=production and correct HTTPS URL, then explicitly enable EMAIL_ENABLED=true and redeploy. This is a manual future action, not performed now. Keep previews disabled. Do not rewind the boundary or delete delivery history.
15. **Create one real controlled booking.** Use your own contact address, confirm both guest and owner notifications and payment-at-meeting-point wording, then cancel if it was only a test. Check cancellation email, provider results, pending queue and recent heartbeat. Monitor failed/uncertain jobs; investigate provider results before using intentional resend.

Official Resend guidance: [domain verification](https://resend.com/docs/dashboard/domains/introduction), [API keys](https://resend.com/docs/dashboard/api-keys/introduction), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys). Resend's 24-hour provider idempotency window remains respected by the existing 23-hour/five-attempt retry policy.

### Preparation verification

All provider calls in tests were mocked. In-memory PostgreSQL-compatible and local embedded PostgreSQL databases only; no hosted database changes. Tests cover actual route 401 rejection/authorized disabled response, test redirection, event-recipient pairs, retry, manual resend, enqueue/claim concurrency, activation boundary equality/new/old events, prequeued historical jobs, heartbeat permissions/overlap/empty completion and stale status. No deployment or real email is claimed. See EMAIL-ACTIVATION-PREPARATION.md for the final test/file inventory.

## Transactional email completion — 5 October 2026

**IMPLEMENTATION GATE: PASS. LIVE DELIVERY: DISABLED. REAL RESEND ACCEPTANCE: BLOCKED / NOT RUN.** The owner explicitly chose “Complete implementation; keep live delivery disabled.” This continuation does not activate delivery, cron, notification projection or push. No commit, push, deployment, hosted migration, production booking, or real email send was performed.

This section supersedes historical template/configuration descriptions above. The intended sender is `Sightseeing Shkodra <tickets@sightseeingshkodra.app>` configured through `RESEND_FROM_EMAIL`; the intended domain is **sightseeingshkodra.app**, not the historical .com example. It is not a hardcoded delivery fallback. No provider/domain verification is claimed from configuration presence alone.

### Existing architecture audited and reused

- `booking-email-config.ts`, `resend-provider.ts`, `booking-email-worker.ts`, `booking-email-server.ts`: server-only configuration, protected worker and existing Resend adapter.
- `booking-email-template.ts`, `booking-email-preview.ts`, Admin Email panel/actions/test form: existing versioned templates and owner diagnostics.
- Existing `domain_events` and `notification_deliveries`, including creation, modification and cancellation producers, leases, activation boundary, retention and recipient deduplication. No second queue or notification architecture.
- Existing `bookings.qr_token`, `bookingQrMatrix`, staff `resolve_booking_pass_v1`, booking management token and `/booking/manage#token=...`; `/route`, `/book` and existing admin booking detail links.
- The shared booking `meetingPoint` remains the approved boarding link. No copied operational stop list or invented start-stop name was added.

### Completed implementation

New queue deliveries use template version 2; already prepared version-1 jobs retain the original rendering and payload. Six branded HTML/plain-text variants include the existing product title/description/inclusions, service date/time/timezone, customer, reference, payment status, adults/children/infants where recorded, total passengers and authoritative occupied seats. Legacy records without a category snapshot do not invent age categories. Product inclusions supply configured daily-ticket/hop-on-hop-off wording; no new entitlement or capacity rule is inferred from marketing text.

A PNG derivative of the existing logo supports mail clients without SVG support. Customer confirmed/updated messages include an inline PNG QR containing the same opaque booking credential as the public pass, generated locally. Owner emails contain no customer management bearer token or QR. Cancellation emails have no QR, explicitly invalidate the ticket, show released seats/timestamp and offer Book Again. Previous/new values appear only when the existing customer-modification audit snapshot matches the same event and current allocation; unavailable or superseded history is omitted.

The migration extends the existing queue with recipient email, provider and accepted timestamp; existing provider reference, failure code, attempt count and status remain authoritative. No HTML/email bodies are stored. Existing 60-day snapshot/envelope redaction also removes recipient addresses. Each selected-recipient manual resend is authenticated, owner-only, operator-scoped, audited, rate-limited and idempotent. It preserves the original canonical event type, cannot fan out to the other recipient, rejects pending duplicates and refuses an event incompatible with the current booking status. Cancellation resends are supported. Existing confirmation resend remains available where already used, with the same Vercel pause guard.

Admin now shows provider/message ID, recipient address, acceptance time and sanitized failure details. It offers separate customer/owner resend controls only when effective sending is enabled. Effective status respects the Vercel Hobby pause even if EMAIL_ENABLED were accidentally true. The safe configured-recipient test is explicitly labelled `Sightseeing Shkodra — Email System Test`; it creates no booking and does not drain the queue. Production sandbox senders under resend.dev are rejected. No secret values are displayed.

Resend references used: [inline CID images](https://resend.com/changelog/embed-images-using-cid), [idempotency keys](https://resend.com/changelog/idempotency-keys). The existing retry policy stops before the provider's 24-hour idempotency window expires. The new QR attachment uses `content_id` and deterministic local PNG rendering, with no remote QR service.

### Migration and activation boundary

`supabase/migrations/20261005000400_transactional_email_completion.sql` was applied only to disposable automated-test databases. Apply it through a separately authorized hosted release before deploying the changed Email admin query/worker. Historical migrations were not edited. Booking, pricing, inventory, modification/cancellation, Auth and RLS logic remain unchanged.

The inspected local `.env.local` has no configured RESEND_API_KEY, RESEND_FROM_EMAIL, BOOKING_OWNER_EMAIL, BOOKING_REPLY_TO_EMAIL, EMAIL_TEST_RECIPIENT or EMAIL_START_AT. EMAIL_ENABLED is absent and defaults false. This is local evidence; Vercel/Resend account configuration was not independently verified in this task.

Before any later real acceptance, configure a verified Resend sending domain and server-only key, the sender and monitored reply-to, the owner and approved controlled test recipient, canonical site/operator bindings and explicit activation timestamp. Review one supported scheduler and the Vercel pause guard under a new activation decision; do not bypass the guard or enable an old Netlify worker. The current Hobby decision remains unchanged.

### Verification

Full chain: **348 passed, zero failed/skipped** (27 components, 17 identity, 124 integrations, 156 database, 24 PostgreSQL concurrency). After the final preview-origin adjustment, **34 targeted email/admin/scheduler tests**, lint, TypeScript and isolated production build all passed. Build copied the candidate source without environment credentials; it verifies compilation, not hosted configuration. Whitespace check passed.

New isolated lifecycle evidence: creation emits exactly one customer and one owner message; decoded email PNG equals the canonical QR token; four passengers including one infant occupy three seats; modification changes departure/counts/price and preserves QR identity; reliable previous/new snapshot is displayed; repeated modification does not duplicate; cancellation releases occupied capacity and makes the scanner return CANCELLED; cancellation messages omit QR. Selected-owner cancellation resend emits exactly one message; duplicate request, cross-operator/public-role attempts and stale confirmation after cancellation are rejected. Version-one retry content is unchanged. Existing failure tests prove provider failure preserves the reservation and retry payload/key; all provider sends here are simulated.

All six generated variants were inspected for overflow/images at 320px and 600px in Chrome, plus customer/owner checks at 390px. Logo and customer QR loaded; cancellation contains no QR. Customer ticket and update layouts were visually inspected. This does not certify Gmail, Apple Mail or Outlook rendering/inbox arrival. No actual Resend API request was sent or accepted. Private evidence: `private/email-completion-{full,final-targeted,lint,types,build}.log`; synthetic HTML in `private/email-preview-v2`.

### Requested final acceptance matrix

| Item | Status | Scope / remaining requirement |
|---|---|---|
| Resend configuration | BLOCKED | Local provider configuration absent; no authenticated provider acceptance test. |
| Domain | BLOCKED | Intended sightseeingshkodra.app; verified sending status not independently checked here. |
| Sender | BLOCKED | Configure/verify RESEND_FROM_EMAIL with the verified domain. |
| Owner email | BLOCKED | BOOKING_OWNER_EMAIL absent locally; controlled recipient required for live acceptance. |
| Customer booking email | BLOCKED | Implemented and simulated PASS; real provider acceptance intentionally not run. |
| Owner booking notification | BLOCKED | Implemented and simulated PASS; real provider acceptance intentionally not run. |
| Customer modification email | BLOCKED | Implemented and simulated PASS; real provider acceptance intentionally not run. |
| Owner modification notification | BLOCKED | Implemented and simulated PASS; real provider acceptance intentionally not run. |
| Customer cancellation email | BLOCKED | Implemented and simulated PASS; real provider acceptance intentionally not run. |
| Owner cancellation notification | BLOCKED | Implemented and simulated PASS; real provider acceptance intentionally not run. |
| QR integration | PASS | Canonical credential decoded from email PNG; cancellation rejected by existing resolver in isolated DB. |
| Email logging | PASS | Existing queue metadata/acceptance/failure history and retention verified locally. |
| Admin resend | PASS | Recipient-specific server/database authorization, deduplication, state and rate checks passed; live delivery disabled. |
| Test email | BLOCKED | Safe function implemented/tested with fake provider; no actual Resend acceptance. |
| Duplicate protection | PASS | Event/recipient uniqueness, leases, frozen retry payloads and manual request identity verified. |
| Security | PASS | Server-only provider calls, existing booking authorization, owner/operator checks, no secret output; local scoped validation. |
| End-to-end test | BLOCKED | Isolated simulated A–E lifecycle passed. Real Resend and mail-client acceptance intentionally deferred by owner decision. |
