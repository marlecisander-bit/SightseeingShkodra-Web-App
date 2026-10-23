# Booking email reliability release result

Date: 23 October 2026. Status: release preparation complete; controlled production cutover pending. This file will record final production evidence before handoff.

## Scope and authorization

The owner authorized the complete reliability release, conditional on all mandatory gates passing. The earlier strictly read-only audit remains the evidence baseline; this separate task explicitly authorizes implementation and controlled release. Work is isolated in `/private/tmp/shkodra-email-reliability`, branch `feature/booking-email-reliability`, based on production main `8d06627611e058e853538e66bc82a94e536796e9`. Unrelated dirty files in the original IDE workspace were not imported or modified.

The 5 October disabled-background-delivery decision differs from the 8 October and current observed active minute scheduler. This release preserves that observed scheduler and sending activation; it does not create a second schedule or reactivate delivery. The owner explicitly authorized adding outcomes/reconciliation within this existing workflow.

Separate approvals cover the monitoring-only DMARC record, removal of the verified owner-address suppression, and one separate Full-access server-only status key. No real bookings, test emails or historical resends were created.

## Implemented changes

- A Node.js Next.js Route Handler at `/api/webhooks/resend` verifies the exact raw request body with official Svix signature verification before parsing. Missing/invalid/stale/future signatures fail closed. Payload memory is capped at 256 KiB; persistence failure returns 503 for provider retry. Hosted Preview and Development refuse processing.
- Only provider event identity, message identity, event type, timestamp, safe reason code and source are persisted. No raw payload, recipient address, subject, HTML, booking token or secret is copied into the new event table. Operator comes from server configuration; event/provider ID association cannot cross operators.
- Unique event IDs, explicit conflict rejection, row locking, terminal-outcome precedence and complete minimized event history handle repeats and out-of-order delivery. Events received before provider acceptance are associated on finish; bounded existing-worker repair covers the concurrent commit race.
- Existing queue transport status remains unchanged. A separate provider outcome and generated delivery projection distinguish queued, processing, accepted, delivered, delayed, bounced, failed, suppressed, complained, uncertain and skipped. Delivered means receiving-server acceptance; inbox placement is never inferred.
- The existing minute worker adds at most one GET status lookup per invocation, with four checks/message, at least six hours apart, accepted at least 15 minutes ago and within 60 days. Newer unchecked messages are prioritized. Missing credentials, timeout, authorization errors and unavailable outcomes never cause an email resend. Lookup times are explicitly labeled as observations.
- Owner-only admin cards show customer/owner identity, exact outcome badges, provider IDs, attempts, safe reasons, update times and expandable event history. Booking, recipient and status filters use existing scoped data. Queue age, failed/suppressed/complained totals, delayed/missing evidence, signing/key readiness and existing heartbeat are visible. Logs use fixed `email_webhook` / `email_reconciliation` codes; no new scheduler or unbounded polling was added.
- Manual resend requires recipient-specific owner authorization and confirmation. Database guards block unresolved API acceptance, sent, delivered, delayed, uncertain, suppressed and complained messages. A reviewed failed/bounced recipient can use the existing cooldown/idempotent queue flow. Legacy booking-wide actions cannot bypass the guard. Removing a suppression does not resend old messages.
- Production build checks require both observation secrets when background email delivery is enabled. Existing sending credentials, sender, booking rules, capacity, payments, outbox, queue leases, retries, activation cutoff, link origin, domain routing, GPS and independent Netlify map remain unchanged.

## Migration and compatibility

Migration: `supabase/migrations/20261023000100_email_provider_outcomes.sql`. Application status: not yet applied to production.

The upgrade is transactional and additive to notification data. It adds provider evidence fields, a unique partial Resend message index, scoped `email_provider_events`, service-only persistence/reconciliation/health RPCs, owner read RLS, early-event linking and bounded cleanup of unmatched metadata. Retry RPC wrappers retain owner/current-booking/cooldown/idempotency checks while refusing unsafe retries. Browser roles cannot write or call service-only functions; private legacy RPCs have execute revoked.

Read-only production preflight observed **29 bookings, 18 notification deliveries, zero duplicate Resend provider IDs**, the required `(operator_id,id)` unique key, and no pre-existing target outcome table/columns. Five relevant live SQL function definitions were compared with the exact repository baseline. Two initial hash differences were CRLF line endings only; normalized source is equal. No production records were edited during preflight.

Synthetic migration recovery deliberately introduced duplicate provider IDs, proved the unique-index failure rolled back all new schema while preserving the booking, then applied the migration successfully after correcting only the disposable fixture. Both existing accepted notifications retained their transport state. PostgreSQL tests cover concurrent duplicate events and the receipt/acceptance commit race.

The authenticated Supabase backup page lists a physical backup from **23 October 2026 02:05:33 UTC**. It is disaster recovery, not the normal release rollback: restoring it would lose later business activity. No restore was executed. Normal recovery promotes the previous Ready Vercel application and retains additive provider schema/history. Full instructions: `docs/releases/BOOKING-EMAIL-RECOVERY.md`; aggregate preflight: `docs/releases/booking-email-preflight.sql`.

## Template audit

All six existing customer/owner created, modified and cancelled templates were retained. Existing v2 rendering uses escaped booking snapshots, a 600px responsive presentation table, fluid logo/QR, 16px text, wrapping cells, branded header/buttons and plain-text alternatives. Departure includes Europe/Tirane; amounts and canonical passenger/seat totals are derived from saved data. The actual production snapshot's generic meeting-point name/directions remain existing content, not invented replacement copy.

Customer QR PNGs are generated locally from the canonical credential, included inline for confirmed created/modified v2 tickets and omitted for cancellation/owner/v1 retries. Existing tests decode the PNG and compare the credential, verify modified before/after data and cancellation invalidation, check customer management links and confirm owner messages omit customer management credentials. Frozen v1/v2 retry content remains stable. Six synthetic previews are available in the existing admin; no preview sends mail.

## Provider configuration and owner suppression

Sender remains **Sightseeing Shkodra <tickets@sightseeingshkodra.app>**, with `.app` Verified in Resend. A `.com` booking origin does not require a `.com` sending domain while From remains `.app`. Reply-to and owner addresses are preserved and omitted here.

New webhook: `5fe27366-640b-4079-a088-8f4bb104e603`, endpoint `https://sightseeingshkodra.app/api/webhooks/resend`. Exactly seven email events are configured: sent, delivered, bounced, delivery_delayed, complained, failed and suppressed. It is **paused during preparation**, pending the Ready receiver. No historical provider event replay or test-send was invoked.

`RESEND_WEBHOOK_SECRET` and `RESEND_STATUS_API_KEY` were saved as **Production-only Vercel Secret variables**, with values transferred privately and never written into Git/reports. The separate status key has owner-approved Full access because the original Sending-access key cannot retrieve outcomes. Application use is limited to GET `/emails/{id}`. The existing `RESEND_API_KEY` was left unchanged. One unused newly created setup key was revoked before its replacement was created; only one new status key is retained.

**Owner suppression resolved for future sends:** the actual suppression recipient was compared privately with the exact owner message recipient and matched. The owner confirmed the mailbox exists, spelling is correct and ordinary mail works, then explicitly approved removal. The record was **Origin Manual, added 25 September 2026 15:07**. This corrects the audit's reliance on the message page's generic hard-bounce-history warning: no original SMTP hard-bounce cause was established. Only that owner suppression was removed. Resend subsequently showed **No suppressions yet**. No owner environment address changed; no historical notification was resent. Future inbox placement still needs genuine provider/recipient evidence.

## DNS evidence

Authoritative `.app` nameservers are Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). `.com` uses third-party Route53 nameservers and was not changed. Existing Resend DKIM and return-path SPF are present; Resend reports SPF/DKIM verified. No received-header alignment result is claimed.

The explicitly approved TXT record was added in Vercel DNS:

| Name | Type | Value | TTL |
|---|---|---|---|
| `_dmarc.sightseeingshkodra.app` | TXT | `v=DMARC1; p=none;` | 60 seconds |

Both authoritative DNS and public resolver 1.1.1.1 returned this exact value after creation. This monitoring-only record has no reporting mailbox and does not enforce quarantine/reject. No MX, existing SPF/DKIM, nameserver, routing, website domain or `.com` DNS record was edited. DMARC hygiene alone is not proof of delivery for the earlier customer message.

## Validation

| Check | Result |
|---|---|
| Full synthetic suite | **475 passed, 0 failed**: 79 component, 23 identity, 158 integration, 182 database, 26 real PostgreSQL, 7 CMS verification |
| Final focused migration/event checks | 10 passed; atomic failure, bounded lookup, signatures, conflicts and RLS |
| Final admin projection/secret redaction checks | 9 passed |
| ESLint / TypeScript / optimized production build | Passed; final link permission check also passed lint/types |
| Production dependency audit | 0 vulnerabilities |
| Mobile browser | Actual 390px viewport, no page/control overflow; stacked filters/cards and expanded details inspected |
| Desktop browser | Actual 1710px viewport, no page/control overflow; two equal 699px delivery columns, three event summary cards and horizontal filters inspected |
| Both public domains | Synthetic same-origin guard tests pass for `.app` and `www..com`; mismatched origins rejected, webhook signatures required on both, Preview disabled |
| Real email / booking creation | None; synthetic fixtures and mocked provider responses only |

Local log evidence is under `/private/tmp/email-reliability-final-tests.log`, `/private/tmp/email-reliability-release-check.log`, `/private/tmp/email-migration-final.log` and `/private/tmp/email-reliability-audit.log`. No production secrets or recipient data are needed for these tests.

## Release gates and deployment record

Vercel dashboard confirms current production **Ready**, deployment `nGp6XuKzVVTpANeKdq1JMEqDcRAb`, source **8d06627611e058e853538e66bc82a94e536796e9**. This is the validated recovery application. Direct deployment URL requires Vercel SSO; an anonymous 302 is not an app failure. Main pushes/merges trigger production. The exact current Ignored Build Step skips nonproduction builds; safe staging/Preview is not assumed. GitHub Project CI has communications disabled and disposable database tests.

Current preparation: code checks pass; compatibility reviewed; mailbox/suppression and DNS prerequisites resolved; webhook registration and Production secret names confirmed; recovery procedure documented/tested locally. Production schema application, feature PR/CI, final merge/deployment and bounded non-mutating production smoke checks are pending. **No publication success or inbox delivery is claimed yet.**

Implementation commit: to be recorded. Production release commit: unchanged baseline until verified cutover.

## Changed files

Runtime: `src/app/api/webhooks/resend/route.ts`; `src/modules/integrations/{resend-webhook,email-provider-reconciliation,email-delivery-status}.ts`; `booking-email-{config,server}.ts`; `email-admin-{server,status}.ts`; `src/app/admin/{email-panel.tsx,email-panel.module.css,bookings-panel.tsx,admin-status.tsx}`.

Schema/configuration: the migration above; `.env.example`; `scripts/check-deployment-env.mjs`; `package.json` / lockfile (exact new dependency `svix@2.8.0`).

Verification/documentation: development-only synthetic preview; new event/domain/recovery integration tests; updated email/admin/deployment/schema/PostgreSQL regression tests; release runbook/preflight; phase status and this report. No destination photographs, CMS records, pricing, booking lifecycle, public presentation or tracking functionality was modified.

## Remaining acceptance evidence

After release, observe the existing worker and bounded status reads rather than creating a booking or sending mail. Confirm actual historical suppression appears separately from acceptance in the new admin. Future genuine provider events will establish end-to-end webhook receipt without synthetic production writes. Lack of a provider event during a bounded observation period must be reported honestly, not replaced by an inbox-delivery claim. The earlier customer's exact downstream non-arrival cause remains unproven unless new provider diagnostics establish it.

Official references: [Resend retrieval API](https://resend.com/docs/api-reference/emails/retrieve-email), [Resend webhook setup](https://resend.com/docs/webhooks/introduction), [Supabase status](https://status.supabase.com/). The platform status page reported a management-API incident under monitoring; this audit does not assume that every project operation is affected. Successful project reads are recorded above; any failed migration/configuration operation must stop cutover.
