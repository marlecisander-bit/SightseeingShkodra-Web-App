# Vercel cutover checkpoint

5 October 2026. **VERCEL CUTOVER BLOCKED: hosted schema prerequisites.**

## Latest controlled-release checkpoint

The owner completed Production configuration. Authenticated scope cleanup preserved all Production values, removed Preview scopes from shared Supabase records and, with explicit confirmation, deleted seven separate Development-only copies. All sixteen Supabase integration variable names remain available in Production only. CHECKOUT_SESSION_SECRET and the five core application configuration variables are Production-only. No shared variables are linked. This supersedes the historical environment-missing blocker below.

The controlled-release brief explicitly defers isolated Preview acceptance for the initial release. It does not authorize deploying a candidate that fails a critical prerequisite.

Read-only preflight found the hosted schema incompatible with the current application candidate:

- Existing published CMS content passes `validate_website_content_v1`; the same content plus the candidate's six default WhatsApp fields returns false. No content was saved. The candidate adds these fields during every CMS save, so deployment would break saves until `20261005000200_whatsapp_contact.sql` is applied through an authorized migration process.
- `admin_notification_receipts`, `admin_push_subscriptions` and `admin_notification_preferences` return PGRST205 (table unavailable in the API schema cache). The candidate's Admin notification provider reads these even with background projection disabled. Resolve the hosted prerequisite for `20261005000100_admin_notifications.sql` before releasing this candidate.
- `email_worker_status` also returns PGRST205. Its owning migration is `20260925000500_email_worker_readiness.sql`; the email diagnostics currently tolerate its absence, and delivery remains deferred.

Fresh controlled-release checks: lint PASS, TypeScript PASS, complete test chain 325/325 PASS, isolated production build PASS. Logs are private/controlled-release-tests.log, private/controlled-release-lint.log, private/controlled-release-types.log and private/controlled-release-build.log. These local checks apply the candidate migrations to disposable databases; they do not cure the hosted schema mismatch.

No hosted schema or business-data mutation, commit, push, merge, deployment, scheduler activation or Netlify shutdown was performed. Existing owner SQL and private environment files remain untouched. Historical checkpoints follow.

The existing migration documents were used; no repeat migration audit or application redesign was performed. Authenticated Vercel inspection again found no Project environment variables under All Environments and no linked Shared variables. The owner confirmed that the existing workspace Supabase project is the Production target. No isolated Preview project was supplied/configured.

## Environment presence

Observed before import attempt; no Save was performed and no successful import was observed. VERCEL_ENV and NODE_ENV are host-managed, not user secrets. All optional delivery variables may remain absent while delivery is deferred; the eight core bindings are still required.

| Variable | Production | Preview | Development |
|---|---|---|---|
| `ADMIN_NOTIFICATIONS_ENABLED` | MISSING | MISSING | MISSING |
| `ADMIN_NOTIFICATIONS_START_AT` | MISSING | MISSING | MISSING |
| `ADMIN_PUSH_ENABLED` | MISSING | MISSING | MISSING |
| `APP_ENV` | MISSING | MISSING | MISSING |
| `BOOKING_OWNER_EMAIL` | MISSING | MISSING | MISSING |
| `BOOKING_REPLY_TO_EMAIL` | MISSING | MISSING | MISSING |
| `CHECKOUT_SESSION_SECRET` | MISSING | MISSING | MISSING |
| `CRON_SECRET` | MISSING | MISSING | MISSING |
| `EMAIL_ENABLED` | MISSING | MISSING | MISSING |
| `EMAIL_START_AT` | MISSING | MISSING | MISSING |
| `EMAIL_TEST_RECIPIENT` | MISSING | MISSING | MISSING |
| `LIVE_MAP_PROJECT_SLUG` | MISSING | MISSING | MISSING |
| `LIVE_MAP_PUBLISHABLE_KEY` | MISSING | MISSING | MISSING |
| `LIVE_MAP_SUPABASE_URL` | MISSING | MISSING | MISSING |
| `NEXT_PUBLIC_SITE_URL` | MISSING | MISSING | MISSING |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | MISSING | MISSING | MISSING |
| `NEXT_PUBLIC_SUPABASE_URL` | MISSING | MISSING | MISSING |
| `PREVIEW_SUPABASE_PROJECT_REF` | MISSING | MISSING | MISSING |
| `PRODUCTION_SUPABASE_PROJECT_REF` | MISSING | MISSING | MISSING |
| `PUBLIC_HOMEPAGE_PRODUCT_SLUG` | MISSING | MISSING | MISSING |
| `PUBLIC_OPERATOR_ID` | MISSING | MISSING | MISSING |
| `RESEND_API_KEY` | MISSING | MISSING | MISSING |
| `RESEND_FROM_EMAIL` | MISSING | MISSING | MISSING |
| `SITE_INDEXING_ENABLED` | MISSING | MISSING | MISSING |
| `SUPABASE_SECRET_KEY` | MISSING | MISSING | MISSING |
| `VAPID_PRIVATE_KEY` | MISSING | MISSING | MISSING |
| `VAPID_PUBLIC_KEY` | MISSING | MISSING | MISSING |
| `VAPID_SUBJECT` | MISSING | MISSING | MISSING |

## Configuration attempt

Prepared an ignored private Production-only environment import using the owner-confirmed existing bindings, production canonical origin and all delivery/indexing flags false. No values printed. The Vercel form selected Production and Secret. Browser filechooser timed out before a successful import; no settings were saved. No CLI token or authenticated Vercel CLI configuration was available. The private file is at private/vercel-production-import.env; it contains credentials and must never be committed/shared outside the intended Vercel Production import. Enable the browser extension file-access capability or import this file directly in Vercel Project Settings, selecting Production only. Verify names/scopes after Save.

Preview database: **BLOCKED ? OWNER CONFIGURATION REQUIRED**. Configure an isolated project and matching credentials plus PREVIEW_SUPABASE_PROJECT_REF and PRODUCTION_SUPABASE_PROJECT_REF. No production bindings were copied to Preview and no guard was weakened.

## Read-only backend verification

| Check | Result | Scope |
|---|---|---|
| Supabase connection | PASS | Existing confirmed project, direct server read |
| CMS read | PASS | Published homepage record exists |
| Public settings read | PASS | Published content/settings object exists |
| Booking backend | PASS for product read only | Configured published product exists; no availability materialization or mutations |
| Admin Auth backend | PASS for endpoint reachability | Auth settings endpoint responds; authenticated session acceptance pending |

These are not Vercel-hosted connection passes. No schema or production booking/CMS data was changed.

## Verification and release gates

Fresh full chain: **325 passed, zero failed/skipped** (11 components, 17 identity, 119 integrations, 154 database, 24 PostgreSQL concurrency). Lint, TypeScript and isolated production build PASS. Logs: private/vercel-cutover-tests.log, -lint.log, -types.log, -build.log and private/vercel-cutover-backend.json.

| Requested cutover status | Result |
|---|---|
| Vercel Preview | FAIL ? not deployed; isolated configuration absent |
| Vercel Production | FAIL ? reviewed candidate not deployed |
| Homepage / CMS on new release | FAIL ? hosted acceptance not reached |
| Supabase on new release | FAIL ? Vercel variables absent; direct source reads pass |
| Booking | PENDING ? PREVIEW DATABASE REQUIRED |
| Admin / Admin Auth | FAIL ? hosted acceptance not reached |
| WhatsApp | FAIL ? hosted acceptance not reached |
| Live Map | PASS in preceding audit; no change this checkpoint |
| PWA | PHYSICAL TEST PENDING; hosted candidate acceptance also pending |
| Resend architecture | PASS ? existing portable protected worker retained |
| Background email delivery | DEFERRED |
| Notification projection | DEFERRED |
| Web Push delivery | DEFERRED |
| Vercel Cron | NOT ENABLED |
| Domain to Vercel | PASS in preceding audit; new reviewed release not assigned |
| Old main Netlify safe to disable | NO |
| Separate Live Map Netlify keep active | YES |

The brief explicitly says not to deploy until Production bindings exist and not to merge until critical hosted acceptance passes. Accordingly no branch was pushed, no merge/deployment occurred, and no unverified release commit was created. Existing unrelated local changes, including owner SQL edits, were preserved. Legacy scheduler settings were not changed; current hosted activity was not reverified, so duplicate-processing absence is not certified. No new scheduler or invocation was introduced.

Concrete blockers: complete/verify the Production environment import; provide isolated Preview Supabase bindings so hosted Preview and booking/admin acceptance can run. Production merge/deployment follows only after those release gates pass.


## Required Production migrations - 5 October 2026

**BOTH MIGRATIONS APPLIED; DATABASE CUTOVER PREREQUISITES FAIL.** This checkpoint supersedes the earlier missing-schema blocker. No commit, push or deployment performed.

Applied only 20261005000100_admin_notifications.sql and 20261005000200_whatsapp_contact.sql to the owner-confirmed Production project. Both were absent before execution. Dependencies existed; the migrations are independent and were applied in filename order. Reviewed file statements were applied transactionally through authenticated Supabase SQL Editor, with migration-history entries committed in the same transactions. Recorded statements match the reviewed files after line-ending normalization. No unrelated migration applied.

Recovery evidence: captured pre-migration catalog, original CMS validator definition and existing-data fingerprints under ignored private/. Transactional failure recovery was available; no full database backup was independently verified.

Notification schema PASS: all six tables match the locally reconstructed reviewed schema for columns, types, defaults, NOT NULL, constraints, indexes and RLS. Expected functions, service-only execution, three scoped authenticated SELECT policies, domain-event index and receipts Realtime publication verified. Anonymous API reads denied for all six tables; grants deny anonymous writes. Existing Owner role can read scoped notifications, receipts and preferences, but cannot read push credentials. All six new tables remain empty.

Integrity PASS: counts and fingerprints unchanged across 20 existing data tables, including CMS, products, bookings, customers, pricing/schedules, stops and settings. All existing policies unchanged. Of 72 existing functions, only the intended public CMS validator changed; its preserved private implementation matches the prior definition. Booking rules unchanged.

Read-only backend checks PASS: Supabase connection, CMS read, public settings, homepage/booking product and Auth endpoint. No availability materialization, booking mutations, content saves, fake records or deliveries performed.

**Concrete blocker: CMS WhatsApp validator FAIL for the application service role.** SQL Editor compatibility assertions succeeded under its elevated role, but the service-key PostgREST call to validate_website_content_v1 with existing published CMS data returned HTTP 403 / SQLSTATE 42501: permission denied for schema private. The reviewed migration grants function EXECUTE but the application service role cannot access the private schema containing the preserved validator. Disabled WhatsApp fields encounter the same permission failure. Invalid enabled/empty-number payload is rejected before reaching that helper. No additional permission change was attempted. A separately reviewed correction is required before deployment.

WhatsApp schema exists and existing CMS authorization is preserved, but authorized save compatibility is not ready because of this permission failure. Migration history PASS for both versions. Email delivery, notification projection and push remain disabled; Vercel Cron was not enabled. No worker was invoked.

Evidence: private/required-migrations-preflight.csv, private/website-validator-before-whatsapp.sql, private/required-migrations-baseline.csv, private/required-migrations-schema-after.json, private/required-migrations-data-after.csv, private/required-migrations-readonly-results.json.


## WhatsApp private permission correction - 5 October 2026

**DATABASE READY - RETURN TO VERCEL CUTOVER.** Supersedes the preceding permission blocker; no deployment, commit or push.

Applied and recorded 20261005000300_fix_whatsapp_private_permissions.sql transactionally. Its only permission change is GRANT USAGE ON SCHEMA private TO service_role. The already-applied WhatsApp migration remains unchanged. No CREATE, ALL, browser-role grants, owner changes, security-definer changes or data statements.

Exact chain: authorized Website Server Action checks content.manage before creating the privileged Supabase client and invoking save_website_content_v1; the invoker-rights public validator calls private.validate_website_before_whatsapp_v1(jsonb). Both validators are owned by postgres with empty search_path and explicit qualified dependencies. The private helper preserves the prior CMS contract and calls public.validate_hero_amenities_v1. Existing EXECUTE for service_role was sufficient at function level, but schema USAGE was absent. Application execution was verified with SET LOCAL ROLE service_role and with the actual Supabase server SDK/key over PostgREST. No credential values disclosed.

After correction, existing CMS and disabled WhatsApp payloads validate successfully through the application SDK; enabled/empty-number payload is rejected. HTTP 403 / 42501 is resolved. Local rolled-back tests verify an authorized content editor can save through the RPC under service_role. Existing tests verify unauthorized staff and browser roles cannot invoke the save path. No real hosted content was saved for testing.

Anon has no private USAGE or helper EXECUTE. Authenticated retains its pre-existing private USAGE and EXECUTE only on private.has_staff_role(uuid,text[]), required by existing RLS; it cannot execute the WhatsApp helper or CMS RPC. It would be inaccurate to claim the entire private schema is inaccessible to authenticated. No browser permission was broadened. service_role has no private CREATE and gained no EXECUTE on the staff-role helper.

Post-correction counts/fingerprints, existing function definitions and policies exactly match the pre-correction snapshot across the previously checked 20 data tables. Notification schema remains accessible server-side, all six tables empty, anonymous reads denied. CMS/settings, homepage/booking product and Auth reachability checks pass. Corrective history statements match the local file after line-ending normalization.

Targeted regression: 16/16 WhatsApp and notification database tests pass, including two new application-role regression tests. Production validation is non-persistent; local write tests use disposable PGlite only. Existing delivery/indexing flags and Vercel pause guards were not changed; email, projection, push and indexing remain disabled and no Cron enabled.

Evidence: private/whatsapp-permission-fix-api-results.json and prior required-migrations snapshots. No unrelated migration or booking/business-rule change.
