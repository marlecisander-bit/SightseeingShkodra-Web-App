# Booking email delivery audit

**Date:** 23 October 2026. Final customer-provider status observed at **17:39:55 UTC / 19:39:55 Europe/Tirane**.

**Scope:** strictly read-only investigation of booking **SS-2977d532-a74d-4251-9685-cd386b08fecf**, supplied by the owner. No production fix is authorized or implemented.

## Findings and root-cause assessment

**The customer confirmation was generated, queued, processed and accepted by Resend. The evidence does not support a booking-to-email generation failure.** The customer message was still **Sent**, without an observed **Delivered** or bounce/delay outcome at the final check. Its exact downstream non-arrival cause remains unproven.

A separate failure **is confirmed for the owner notification**: Resend suppressed that message because the owner recipient address has a recent history of hard bounces. This is not evidence that the customer message was suppressed.

A monitoring limitation is also confirmed: the application records successful Resend API acceptance as `accepted` and does not reconcile later provider delivery/suppression events. Consequently, both messages appear as “Sent (arrival not confirmed)” in admin, although Resend reports the owner message as suppressed. The admin wording warns that arrival is unconfirmed, but its failed/pending counters cannot detect this downstream suppression.

### Evidence chain for this booking

| Stage | Observed evidence | Conclusion |
|---|---|---|
| Booking creation | Authenticated production booking admin resolves the supplied reference and displays Confirmed | Booking exists and is confirmed; not proof of payment or email delivery |
| Email enqueue | Authenticated Email & Notifications view shows distinct customer and owner New booking records, dated 23 Oct 2026, 19:29 local | Both recipient jobs were created |
| Worker processing | Both records show one sending attempt, provider `resend`, no recorded application failure | Neither job is stuck unattempted |
| Provider acceptance | Matching Vercel `booking_email` logs show `BOOKING_CREATED`, `manual:false`, `status:accepted` for each recipient, with the exact provider IDs below | Automatic worker reached Resend successfully; this was not a manual resend |
| Customer provider outcome | Resend message `01a169cf-15c1-7dc0-a0a7-5b4f32aadc7f`, subject “Your Sightseeing Shkodra Ticket — [this booking reference]”, timestamp Oct 23, 7:29 PM, status **Sent** | Message accepted for sending; final delivery not established |
| Owner provider outcome | Resend message `01a169cf-194e-76f3-a360-510e512d311d`, subject “NEW BOOKING — [this booking reference] — 2026-10-25”, status **Suppressed** | Owner delivery intentionally prevented by the provider |
| Recipient consistency | Customer recipient in the booking admin privately compared with the Resend message recipient; equal | No observed application/provider recipient mismatch; intended mailbox ownership/spelling still requires private confirmation |

No customer name, address, phone number, booking-management token, QR credential, API key or worker secret is included here.

## 1. Complete workflow

1. The public booking interface uses `CheckoutFlow` and posts JSON to the relative `/api/public/checkout` URL with `credentials: same-origin`. It initializes a checkout session, obtains an inventory hold, then submits the customer details with action `order`.
2. The API validates browser Origin against the actual Host header, rejects cross-site requests, validates the body, verifies the signed checkout cookie and takes the operator from server configuration. It does not select an operator from the request domain.
3. The order action calls `createPendingOrder(..., true)`. Despite that helper's name, this path invokes the service-role Supabase RPC **`create_meeting_point_booking_v1`**.
4. The booking transaction confirms the order/booking/items, consumes the hold and records **`booking.confirmed`** in the existing domain-event outbox atomically. Confirmation is not contingent on a Resend call or an online-payment callback. A subsequent display-read failure is deliberately prevented from undoing/misreporting an already committed confirmation.
5. A later scheduled invocation of **`GET /api/internal/booking-emails`** authorizes the bearer secret and invokes `runBookingEmailWorker`. **The booking HTTP request does not synchronously send the confirmation email.**
6. The worker checks the delivery/environment gates and configuration, records heartbeat state, performs retention cleanup and invokes **`enqueue_booking_emails_v2`**. Eligible committed events at/after `EMAIL_START_AT` produce separate customer and owner `notification_deliveries` rows, deduplicated by operator/event/recipient. Queue rows are therefore materialized by the worker, not necessarily inside the initial booking transaction.
7. `claim_booking_email_v2` leases eligible jobs with concurrency protection. `prepare_booking_email_v2` saves immutable booking and sender/link snapshots, validates booking relevance and prepares the recipient. Invalid/stale cases can be skipped.
8. The worker renders the versioned template and, for an eligible customer confirmation, an inline PNG booking QR attachment. It sends HTML and plain text to Resend using the deterministic key `booking-email/<delivery ID>`.
9. `sendResendEmail` treats HTTP success **plus a valid returned message ID** as `accepted`; it classifies rate limits/server errors/network uncertainty for retry and other provider errors as failed. The queue owns retries, rather than an SDK retry loop.
10. The finish RPC records acceptance/reference or retry/failure state. A trigger records `sent_at` when status becomes accepted. **That timestamp is provider acceptance time, not receiving-server delivery time.** The worker completes its heartbeat independently of whether a customer later sees the email.

The worker starts at most four jobs per invocation and stops starting new work after approximately 20 seconds, within a 60-second route limit. Leases expire after two minutes. Retry candidates are bounded to five attempts, with exponential backoff; uncertain sends stop automatic retry before the provider's idempotency window is exhausted (23-hour application cutoff). These limits were inspected in source, not exercised during this audit.

Source references:

- `src/components/public/checkout-flow.tsx:22` — relative public API transport.
- `src/app/api/public/checkout/route.ts:27` — origin/session/body checks and order dispatch.
- `src/modules/booking/orders-server.ts:112` — meeting-point RPC and committed-confirmation recovery.
- `supabase/migrations/20260925000400_calendar_inheritance_guards.sql:119` — atomic confirmation/outbox transaction; subsequent migrations extend this existing flow.
- `supabase/migrations/20260925000100_resend_booking_emails.sql:27` — per-event/per-recipient enqueue.
- `supabase/migrations/20260925000500_email_worker_readiness.sql:46` — current cutoff-aware claim/lease logic.
- `src/modules/integrations/booking-email-worker.ts:44` — bounded processing sequence.
- `src/modules/integrations/resend-provider.ts:5` — transport and acceptance classification.
- `supabase/migrations/20261005000400_transactional_email_completion.sql` — recipient/provider metadata and acceptance timestamp.

## 2. Resend, sender and templates

The live authenticated admin reports:

| Configuration | Read-only observation |
|---|---|
| Provider | Resend |
| Sender name | Sightseeing Shkodra |
| Sender address | `tickets@sightseeingshkodra.app` |
| Sender domain | `sightseeingshkodra.app` |
| Configuration / automatic setup | Ready |
| API key / cron secret / activation timestamp / workspace binding / public URL | Configured; values not revealed |
| Email sending | Enabled / On |
| Test recipient override | Not configured; this was not an observed redirected test-mode send |

Reply-to and owner addresses exist in the configuration, but their values are omitted for privacy. A verified sending domain does not itself create a monitored inbox for those addresses.

The authenticated Resend Domains dashboard lists **`sightseeingshkodra.app` as Verified**. No `.com` sending domain was shown in that team's current domain list. The sending domain is the domain of the configured From address, not the website on which the customer booked. Therefore, `.com` website bookings do not by themselves require adding `.com` to Resend when the From address remains `tickets@...app`. Changing the From address to a `.com` address would require appropriate provider verification/configuration first.

The repository uses `bookingEmailTemplate`, dispatching `envelope.version === 2` to `bookingEmailTemplateV2`. There are customer/owner variants for created, modified and cancelled bookings. Subjects, observed provider subjects and inline QR handling are consistent with v2. Email contents are based on saved booking snapshots; customer management links and QR credentials are sensitive and were not copied into this report. Immutable template/envelope versions are retained for in-flight retries.

Relevant files: `booking-email-template.ts`, `booking-email-template-v2.ts`, `booking-email-attachments.ts`, `booking-email-config.ts` and `resend-provider.ts` under `src/modules/integrations/`.

### Environment variable names, without secrets

| Names | Role / evidence boundary |
|---|---|
| `EMAIL_ENABLED` | Explicit sending switch; live admin says On |
| `BACKGROUND_DELIVERY_ENABLED`, `APP_ENV`, `VERCEL_ENV` | Hosted worker boundary: production + production app environment + explicit background enablement; successful automatic live processing proves the effective path passed these guards |
| `NODE_ENV` | Production validation behavior |
| `RESEND_API_KEY` | Server-only provider credential; presence reported by admin, successful provider IDs prove this send used a working credential |
| `RESEND_FROM_EMAIL` | Observed sender above |
| `BOOKING_OWNER_EMAIL`, `BOOKING_REPLY_TO_EMAIL` | Separate owner recipient and reply destination; values withheld |
| `PUBLIC_OPERATOR_ID` | Fixed workspace binding; live admin reports configured |
| `EMAIL_START_AT` | Event enqueue/claim activation boundary; configured, exact value not revealed; this booking was eligible and processed |
| `EMAIL_TEST_RECIPIENT` | Optional recipient override; required outside production; not configured in observed live settings |
| `NEXT_PUBLIC_SITE_URL` | Validated base origin snapshotted into outgoing links/images; not read from the checkout request Host |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Server database binding/credential; no secret values opened |
| `CHECKOUT_SESSION_SECRET` | Signs checkout session cookie; independent of email transport |
| `CRON_SECRET` | Worker bearer authorization; configured; no value opened |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/SSR authentication used by admin; not the email transport key |

Raw Vercel environment values were not opened. Runtime readiness, observed sender and successful automatic processing are evidence of effective configuration, not an export of every environment assignment.

## 3. Domain, origin and callback comparison

Read-only public GET observations on 23 October:

| Requested host | Observed behavior |
|---|---|
| `sightseeingshkodra.com` | Vercel HTTP 308 with Location `https://www.sightseeingshkodra.com/` |
| `www.sightseeingshkodra.com` | Vercel HTTP 200, Next.js assets and local booking link; canonical metadata points to `https://sightseeingshkodra.app/` |
| `sightseeingshkodra.app` | Vercel HTTP 200, Next.js assets and local booking link; same `.app` canonical metadata |
| `www.sightseeingshkodra.app` | Resolves through redirect to the `.app` apex homepage |

A search/browser-service cached `.com` result showed older site content, but that was stale historical evidence and was **not** used to characterize the current deployment. Fresh HTTPS responses and the current authenticated `.com` admin were used instead.

Expected checkout behavior is the same on `.app` and `www....com` when each page posts to its own relative API on the same host. There is no hardcoded `.app`-only checkout Origin allowlist in this flow. Host-only checkout cookies are not shared across the domains; switching hosts during an unfinished checkout could require a new session, but it does not explain this confirmed booking with accepted email jobs.

Email processing takes the fixed operator and sender from server configuration and does not receive the booking request hostname. Supabase's observed scheduler calls the **`.app` worker**, which processes database events regardless of which public hostname created them. The API transport does not require a browser callback or a payment webhook to send this meeting-point confirmation.

The rendered customer message links were inspected **by hostname only**: `sightseeingshkodra.app` and `maps.app.goo.gl`, plus a mailto link. No booking tokens were exposed. Thus the `.com` booking origin did not automatically make this email's management links `.com`. The two website domains and canonical metadata should be reconciled deliberately for branding/session consistency, but no evidence establishes that mismatch as this email's non-arrival cause.

Source: `checkout-flow.tsx:22`, `checkout/route.ts:27`, `booking-email-config.ts:25`, `booking-email-template-v2.ts:43` and the worker's saved envelope.

## 4. Scheduler, queue and production logs

Current authenticated read-only evidence:

- **Supabase Cron:** one job, `sightseeing-booking-notifications`, active, schedule `* * * * *`. Its visible configuration includes both `/api/internal/booking-emails` and `/api/internal/admin-notifications`, the `sightseeingshkodra.app` host, and Vault use. Protected command/secret contents were not copied. No job was run, toggled, edited or created.
- **Scheduler history limit:** the jobs UI says its last-run summary is omitted due to query cost. This audit did not issue a separate raw SQL history query. An active schedule alone would not prove execution; the following heartbeat and log evidence do.
- **Admin heartbeat:** Email worker Operational; last start, completion and successful run **23 Oct 2026, 19:33 Europe/Tirane** when read. Pending queue 0; failed/uncertain 0. This is a snapshot, not a guarantee of future runs.
- **Vercel runtime logs:** actual automatic `BOOKING_CREATED` acceptance entries for both recipients and the exact two Resend message IDs in the findings table. No worker invocation was made by the auditor.
- **Supabase booking/delivery evidence:** inspected via the existing authenticated admin projections, whose server readers select scoped `bookings`, `notification_deliveries` and `email_worker_status` data. No arbitrary SQL, mutation RPC, service-key request, database write or migration was executed. The raw `domain_events` row was not independently queried; outbox/enqueue success follows from the observed automatic recipient jobs and worker logs.
- **Resend:** direct authenticated message records and Domains page inspected. Customer Sent; owner Suppressed. No test-send, resend, suppression removal or domain-verification action performed.

Historical repository documentation contains older disabled/unconfigured statements and an 8 October correction observing enabled delivery with a Supabase minute scheduler. Current live evidence supports the corrected active state. This audit neither authorizes activation policy changes nor alters that infrastructure.

Source inspected against production main **`8d06627611e058e853538e66bc82a94e536796e9`**, independently confirmed by a read-only GitHub request. The clean release checkout `/private/tmp/shkodra-partner-release-20261023` contains the equivalent production booking/email implementation; the relevant original-workspace files were byte-compared with that source. Unrelated existing workspace changes were left untouched.

## 5. What is failing, and what remains unproven

### Confirmed: owner address suppression

Resend's owner-message detail explicitly reports suppression because the recipient address has a recent hard-bounce history. The provider accepted the API request but prevented owner delivery. Correcting the owner's actual recipient/mailbox and underlying bounce issue must precede any separately approved suppression removal or resend. This does **not** explain the customer's independent Sent message.

### Confirmed: no downstream delivery reconciliation in the app

The provider adapter returns only accepted/retry/failed. `finish_booking_notification_v1` persists the synchronous result. No Resend delivery/bounce/suppression webhook Route Handler or provider-status reconciliation job was found in the audited application. The internal scheduled worker is an outbound processor, not a provider-event receiver.

The owner suppression is therefore not reflected in application failure counters. This is a visibility gap, not proof that the initial send path failed. No claim is made about webhook integrations in unrelated external systems.

### Confirmed risk indicators, not established customer root cause

Resend's customer-message Insights flags **“Ensure link URLs match sending domain”** and **“Include valid DMARC record”**. The message includes an external Google Maps link alongside `.app` links; the warning does not establish an unintended `.com` callback.

Read-only public DNS TXT lookups found no DMARC record at `_dmarc.sightseeingshkodra.app` or `_dmarc.sightseeingshkodra.com`. An SPF record is present at `send.sightseeingshkodra.app`; no apex SPF was returned at `.app`. The absence of apex SPF alone is not proof of failure because envelope/return-path SPF may correctly use the sending subdomain. Resend marks the sending domain verified. DKIM records, actual recipient-side SPF/DKIM/DMARC alignment and full SMTP delivery diagnostics were not independently reconstructed.

Missing DMARC is a deliverability concern, **not evidence that Gmail rejected this particular message**. No customer bounce, suppression, SMTP error or final delivery event was observed. No inbox/spam/quarantine access was used. The customer recipient matches the stored booking address, but the owner's intended test address/spelling has not been independently confirmed.

## 6. Prioritized remediation plan — not implemented

| Priority | Action requiring separate implementation approval where applicable | Success evidence |
|---|---|---|
| P0 — establish customer outcome | Recheck the existing customer message's provider event history; obtain SMTP/receiving-server result and Message-ID through Resend read-only details/support if it remains Sent. Privately verify the intended recipient and have the mailbox owner search All Mail, spam and quarantine by subject/reference. Do not automatically resend an unresolved accepted message. | Delivered/failed/delayed event or provider diagnostic correlated to this exact message, plus recipient-side search result |
| P0 — owner delivery | Privately verify the configured owner address, mailbox existence and original hard-bounce reason. After the underlying issue is resolved and authorization is obtained, correct configuration if needed and handle the suppression/resend in a controlled way. | No suppression for a later separately approved delivery; receiving-server acceptance and owner inbox confirmation |
| P1 — observe actual delivery | Design authenticated, signature-verified Resend event ingestion or read-only reconciliation within the existing queue model. Keep API acceptance separate from delivered, bounced, suppressed, delayed and complained. Deduplicate provider events and preserve operator scope and booking rules. | Accepted owner message later appears as suppressed; customer final delivery outcome is visible without claiming inbox placement |
| P1 — authentication hygiene | Review Resend's actual sending/return-path records and establish an appropriate DMARC policy and reporting plan for the active From domain, with DNS changes approved separately. Validate SPF/DKIM alignment using real received headers when available. | Published valid DMARC plus provider/header alignment checks; no blind guarantee that DNS alone fixes this message |
| P2 — domain consistency | Decide the canonical `.com`/`.app` experience, then review redirects, canonical metadata and configured email URLs deliberately. Keep checkout same-origin and avoid mid-checkout host switches. Do not change sender domains just because a customer booked on another hostname. | Agreed canonical origin, consistent intended links, working same-origin booking/session behavior |
| P2 — operational monitoring | Alert on stale/failed heartbeats, growing queue age, application failures and downstream provider suppressions. Preserve one scheduler and bounded/idempotent sending. | Alerts distinguish queue failure, provider rejection and recipient delivery failure |

**Exact customer root cause is not yet established.** Remaining decisive evidence is the provider's final/SMTP outcome for customer message `01a169cf-15c1-7dc0-a0a7-5b4f32aadc7f`, intended-recipient confirmation and recipient mailbox search. Existing evidence already establishes successful automatic generation/acceptance and rules out a disabled worker or missing verified `.app` sender as the explanation for this booking.

## 7. Read-only safety record

Only source reads, public HTTPS/DNS reads, authenticated dashboard reads, message previews/status inspection and a read-only GitHub revision lookup were used. No code, application configuration, database records, DNS, queue entries, scheduled jobs or provider settings were changed. No bookings or emails were created; no worker, test email, resend or suppression-removal control was invoked. No push, merge, deployment, test suite or migration was run. The only requested workspace deliverable is this report; pre-existing dirty files remain unchanged by this audit.

Screenshots were not captured because the authenticated views include customer contact data and sensitive booking credentials. Findings are recorded above in redacted form.

## Provider references

- [Resend: Email Threading with Message-ID](https://resend.com/changelog/message-id-for-sent-emails) — distinguishes the initial sent/accepted event and retrieval of Message-ID for delivery investigations.
- [Resend: Introducing Email Suppression Visibility](https://resend.com/changelog/email-suppression-visibility) — suppression prevents sending and is a distinct downstream outcome.
- [Resend: Email Suppressions](https://www.resend.com/changelog/suppression-list-support) — bounce/complaint/manual causes and the need to resolve the underlying issue before removal.
- [Resend: Domain Verification Events](https://resend.com/changelog/domain-verification-events) — sending/receiving verification and DNS authentication records.
- [Resend: Improved Bounced and Delivery Details](https://resend.com/changelog/improved-bounced-and-delivery-details) — provider/receiving-server delivery diagnostics.

These references explain status semantics and possible follow-up checks. They are not substitutes for the authenticated observations of this booking recorded above.
