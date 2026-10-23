# Booking email release and recovery procedure

Prepared 23 October 2026. This is an execution checklist, not evidence of production application. See the root release-result report for actual actions and gates.

## Deployment boundary

Vercel project `sightseeing-shkodra-web-app`, production branch `main`. Observed Ignored Build Step:

```sh
if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi
```

A main push/merge triggers production. Nonproduction builds are skipped; there is no validated Preview database. Do not change this rule or enable Preview communications to get a staging environment. GitHub Project CI runs on PRs and main pushes with communications disabled and disposable databases. A feature-branch push/PR does not authorize merging before all gates pass.

## Preflight

1. Confirm current main remains the reviewed baseline; repeat the read-only SQL in `booking-email-preflight.sql`. Require zero duplicate Resend message IDs, the composite operator/delivery key, no pre-existing target columns/table, and reviewed function definitions. On 23 October the five relevant live functions match the baseline; two differ only in CRLF line endings. Never repair a fingerprint difference blindly.
2. Validate all migrations, atomic failure, queue concurrency, signature/replay rejection, operator isolation and both domain guards on synthetic local databases. Run `npm run check`, `npm test`, `npm audit --omit=dev --audit-level=low` and desktop/mobile UI verification. No real booking or email is needed.
3. Verify previous production deployment and current credentials. Baseline source: `8d06627611e058e853538e66bc82a94e536796e9`; deployment: `https://sightseeing-shkodra-web-c9dlnqm1q-aleksander-marleci.vercel.app`. Direct deployment access is protected by Vercel SSO. Confirm Ready in authenticated deployment details before relying on promotion.
4. Supabase dashboard lists a physical scheduled backup from 23 October 2026 02:05:33 UTC. This is disaster recovery only; restoring it would discard later business activity. No restore was invoked or rehearsed against production. The normal recovery below retains all live booking data.
5. Preserve current sender, credentials, activation cutoff, operator binding and existing minute scheduler. Configure the approved separate Full-access Resend key as Production-only secret `RESEND_STATUS_API_KEY`; code uses only GET `/emails/{id}`. Keep the Sending-access `RESEND_API_KEY` unchanged. Configure `RESEND_WEBHOOK_SECRET` from the exact new endpoint; never copy secret values into reports or Git.
6. Register `https://sightseeingshkodra.app/api/webhooks/resend` for exactly sent, delivered, delivery_delayed, bounced, complained, failed and suppressed email events. Keep it disabled while preparing a receiver that is not deployed. Confirm the registration, signing secret and selected events before merge. Enable only as part of the validated release. No test-send or historical-email replay is required.

## Controlled cutover

Only after every mandatory gate passes: apply `20261023000100_email_provider_outcomes.sql` to the existing project as one transaction, with a short lock timeout and bounded statement timeout. Capture aggregate booking/delivery counts and migration success without customer data. The migration aborts on duplicate IDs; never delete or rewrite live records to force it through. Record its version/checksum using the project's controlled migration process.

The upgrade adds independent provider evidence fields/history. Existing transport statuses, lease tokens, attempt counts, snapshots, outbox identities and provider idempotency keys remain intact. Old automatic sender RPCs continue operating with the expanded row type. Manual retries are deliberately tightened; older UI retry requests fail safely rather than create duplicates.

After successful schema/configuration verification and passing release CI, merge the exact reviewed candidate to main. Verify the Vercel deployment is Ready and both public hosts return the existing public pages. Activate the registered webhook; verify its configuration. Use only bounded reads for smoke checks: authenticated admin evidence, automatic heartbeat progress, queue health and existing provider outcomes. Do not invoke workers, create bookings, send test emails or resend historical messages. An HTTP shell response alone does not prove webhook persistence or inbox delivery.

The existing minute worker performs at most one provider GET per invocation, four attempts/message, six hours apart, for accepted records within 60 days and at least 15 minutes old. A failed lookup never sends a message or requeues a booking job. Its observed timestamps are marked as lookup observations rather than SMTP event timestamps.

## Recovery after a failed application release

1. Disable only the newly registered Resend webhook to stop traffic to an unavailable receiver; retain its configuration and secret. Preserve its provider event history/retries for investigation. Do not resend emails.
2. Promote the validated previous Ready production deployment through Vercel Rollback, or deploy the exact baseline with **current** production credentials if promotion is unavailable. Keep both domain assignments and existing minute scheduler intact. Do not restore an old environment export or old sending credentials.
3. **Retain the additive schema and event records.** The prior sender uses its unchanged transport fields and RPCs; this is the tested recovery path. The bounded pending-event repair remains callable from the existing enqueue RPC and does not send. Older booking-wide/unsafe resend actions remain blocked at the database boundary. No booking, payment, inventory, outbox or notification row is reverted.
4. Verify both hosts, automatic worker heartbeat, queue health and booking counts with read-only checks. Preserve accepted/uncertain messages and existing idempotency identities. Diagnose and roll forward with a reviewed fix. Do not rerun the migration blindly after a committed installation.
5. Keep approved monitoring-only DMARC and the corrected owner suppression state unless there is concrete evidence they caused a problem. Neither requires a database restore or app deployment. The status key may remain securely configured for the corrected release; revoke only that separate key if abandoned or compromised, without touching the original sending key.

## Recovery during migration failure

DDL runs inside BEGIN/COMMIT. On any error issue ROLLBACK, verify the target table/columns are absent and original RPCs remain, and compare aggregate booking/delivery counts. Resolve the diagnosed compatibility issue through a reviewed migration; do not bypass constraints or broaden grants. The synthetic recovery test proves a duplicate-provider-ID failure leaves the baseline schema and booking intact, then verifies an additive upgrade retains both accepted notifications.

A destructive schema downgrade is intentionally not an automatic rollback: dropping event history loses delivery evidence and restoring historical data could erase bookings. If catastrophic database recovery is required, pause the release and obtain an incident-specific plan that accounts for all bookings after the backup. No production restore was tested or authorized by this runbook.
