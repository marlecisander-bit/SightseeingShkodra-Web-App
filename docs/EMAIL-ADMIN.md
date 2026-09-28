# Email & Notifications admin

Implemented locally on 25 September 2026. No deployment, remote database writes, migration, scheduler setup or real email send.

## Access and ownership

Owner: Admin > Settings > Email & Notifications, `/admin/{operatorId}/email`.
Uses existing `integrations.manage` permission; admin/operations/content-editor roles do not have that permission. No role privileges were broadened. Both the route and data service authorize access; test sends independently authorize again. Bookings keeps its existing resend authorization.

## Features

- Explicit safe configuration projection: provider, enabled flag, readiness, key/cron presence, workspace/site/start/test prerequisites, sender name/email/domain, reply-to and owner mailbox.
- Sender settings stay read-only environment configuration. Keys never enter database, React props or browser responses. Domain presence is not domain verification.
- Existing three event types with customer/owner sending readiness and totals from retained queue rows.
- Up to 100 newest matching deliveries, operator scoped, current customer/owner jobs only; legacy jobs excluded. All/Pending/Sent/Failed and Customer/Owner filters. Skipped under All; uncertain under Failed with review warning. Accepted means provider acceptance, never inbox delivery.
- Last accepted and failed/uncertain timestamps from queue records. Pending count is an exact database count. Worker readiness comes from configuration; last run is not recorded and scheduler is explicitly unverified.
- Failed/uncertain entries for confirmed bookings reuse `resendConfirmation` through existing MutationForm/SubmitButton. This requests customer+owner confirmation, not replay of a cancellation/modification event. Confirmation checkbox, existing authorization, stable request ID and five-minute database cooldown preserved. No second resend mechanism.
- Six sandboxed inline synthetic template previews reuse bookingEmailPreview and bookingEmailTemplate.
- Owner-only synthetic test action uses the existing Resend adapter and preview renderer, restricted to the server-configured EMAIL_TEST_RECIPIENT. It can test while automatic sending is disabled; it never consumes or adds booking jobs. Identical payloads within a fixed five-minute window reuse the provider idempotency key. This is deduplication, not a rolling rate limiter. Test attempts are not shown as booking queue records. Results are sanitized and provider acceptance is clearly distinguished from inbox delivery.
- Legacy provider abstraction retained with explicit do-not-activate-alongside-Resend comments.

## Local configuration and manual prerequisites

Local email enabled flag is unset (disabled). Resend key, sender, reply-to, owner address, test recipient, activation timestamp and cron secret were absent during the preceding audit; this task did not change them. Set these server-side using docs/BOOKING-EMAILS.md. Verify Resend domain separately. Configure an authenticated scheduler for the existing worker before automatic delivery. No secrets can be edited in this admin UI.

## Verification

- Existing email regression suite: 15 passed, including manual resend, event capture, retry/idempotency, authorization and provider failures.
- New email admin suite: 8 passed; safe status projection, owner-only navigation, authorization-before-secret access, test recipient/operator binding, provider failure, synthetic idempotency, scoped/filtered history, legacy exclusion and resend eligibility.
- Identity suite: 15 passed.
- TypeScript, ESLint and optimized production build passed.
- Real unauthenticated admin route redirected to staff sign-in. Unauthorized resend through the existing action returned its sanitized error without sending.
- Actual panel and shared admin shell rendered with synthetic data in a temporary development-only fixture. Viewports 360, 390, 430, 768, 1024, 1440px had no horizontal overflow. Mobile/desktop screenshots opened and inspected; long mailbox wrapping and inline preview checked. Fixture route removed before production build.
- No authenticated production-owner session was automated. No real provider delivery or live queue mutation was attempted. Provider tests use injected mocks; rendering fixtures do not claim live database activity.

## Files changed

New:
- src/app/admin/email-actions.ts
- src/app/admin/email-panel.module.css
- src/app/admin/email-panel.tsx
- src/app/admin/email-test-form.tsx
- src/modules/integrations/email-admin-server.ts
- src/modules/integrations/email-admin-status.ts
- src/modules/integrations/email-admin-test.ts
- tests/integrations/email-admin.test.mjs
- docs/EMAIL-ADMIN.md

Modified:
- src/app/admin/[operatorId]/[section]/page.tsx
- src/app/admin/admin-shell.tsx
- src/modules/identity/admin-navigation.ts
- src/modules/integrations/booking-notifications.ts (comment only)
- src/modules/integrations/notification-store.ts (comment only)
- tests/identity/admin-navigation.test.mjs
- docs/PHASE_STATUS.md

No database changes. No existing booking transaction or worker delivery logic changed.

LOCAL ONLY — NOTHING DEPLOYED
