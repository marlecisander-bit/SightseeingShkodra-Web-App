> Current hosting decision (5 October 2026): Vercel is the permanent main-app host. The owner chose Hobby with background delivery disabled. Netlify scheduling instructions below are historical/legacy only and must not be used for new activation. Follow [DEPLOYMENT.md](../DEPLOYMENT.md). Notification projection and push dispatch are paused on Vercel.

# Admin notification center and Web Push

5 October 2026. Local implementation; not deployed or enabled on hosted services.

## Architecture and implementation

Existing committed `domain_events` are the business-event source: confirmation,
modification, cancellation, meeting-point payment and check-in. Failed/uncertain
existing email deliveries also produce an attention notification. The separate,
bounded once-minute consumer projects one shared notification, personal read
receipts and one delivery per enabled device. No notification trigger or network
call was added to booking transactions. See [architecture audit](ADMIN-NOTIFICATIONS-ARCHITECTURE.md).

Summaries contain booking reference, passenger/occupied-seat count, departure and
amount; customer contact details and management tokens are excluded. They explicitly
describe current details at processing time. Existing events do not contain previous
departure snapshots, so before/after details are not invented.

Six tables are added: `admin_notifications`, `admin_notification_receipts`,
`admin_notification_preferences`, `admin_notification_sources`,
`admin_push_subscriptions` and `admin_push_deliveries`. Unique source/booking and
notification/device keys prevent duplicate work. Indexes cover latest/unread
receipts, ready deliveries, enabled memberships and supported event scanning.
All six have RLS; browser access is SELECT-only to own receipts/preferences and
their notifications, with active owner/admin/operations membership. Device keys,
source ledger and delivery leases have no browser grants. The three worker RPCs
are service-role-only. See [RLS inventory](ADMIN-RLS-INVENTORY.md).

Admin has a permission-filtered Notifications route, header bell, unread badge,
recent dropdown, event/unread filters, individual read/unread, mark-all-read and
25-item cursor pagination. Settings provide separate in-app/push preferences,
device naming, disable/remove and explicit enablement. Owners can open existing
Email & Notifications settings from this screen; no second email switch exists.

One shared workspace provider subscribes to the current user's receipt changes,
filters by operator and coalesces refreshes. Subscription recovery, returning to
the tab and coming online resynchronize state. Cleanup removes the channel,
authentication listener and browser listeners. There is no recurring UI polling.
The scheduled projector adds up to approximately one minute of normal latency;
Realtime then updates connected clients. Live Supabase delivery remains unverified.

One service worker at `/admin/sw.js`, scoped to `/admin/`, handles push and safe
booking clicks. It has no fetch handler or authenticated offline cache. Manifest
and PNG icons reuse the existing logo. Login preserves an allowlisted booking
destination, including after an invalid credential attempt. Every destination
still authorizes access. Browser permission is requested only by clicking Enable.

The `web-push` sender uses server-held VAPID credentials. Registration validates
HTTPS provider endpoints and key shape; raw endpoints/keys never appear in device
responses or logs. Dispatch rechecks active membership, preference and enabled
device. Claims use locking and lease tokens. Rejections retry with exponential
delay, at most five attempts. Expired subscriptions are disabled. Network ambiguity
or abandoned leases become `uncertain` and are not blindly resent. Provider
acceptance is recorded as `accepted`, never mislabelled as confirmed device delivery.

Each worker run starts at most eight push jobs within a six-second start budget;
individual database/provider requests have three-second timeouts. The scheduled
adapter times out at 28 seconds to fit Netlify's documented
[30-second scheduled-function limit](https://docs.netlify.com/build/functions/scheduled-functions/).
Remaining jobs stay queued for the next run. Concurrent PostgreSQL claim tests
check that separate workers can claim separate deliveries without locking a whole
batch. Slow or interrupted operations still use the uncertain-lease safeguard.

Registered devices intentionally remain active after logout, as explained in the
UI. Disable a shared device before leaving it. Revoked staff lose access and pending
dispatch eligibility. A browser subscription belongs to one account/workspace;
remove its previous registration before reassigning that browser to another one.

## Verification evidence

- Final complete regression chain: **311 passed, 0 failed**, including 24 real
  PostgreSQL concurrency tests and existing Resend/booking/capacity contracts.
- Expanded notification tests: **15 passed, 0 failed**. These include a committed
  booking → real local SQL projection → two device claims → mock provider → real
  SQL completion path, no duplicate dispatch, independent receipts, tenant/role
  RLS, cancellation seat release, payment/email events, revoked membership,
  five-attempt limit, stale leases, endpoint validation and worker click handling.
  The 15-test run overlaps the complete chain; totals must not be added together.
  Final chain breakdown: components 11, identity 17, integrations 111, database
  148 and PostgreSQL concurrency 24. The added concurrent test exposed overly
  broad row locking; the claim now locks one candidate at a time. Both independent
  claims and rollback recovery pass against real PostgreSQL.
- Local API checks: unauthenticated inbox **403**, cross-origin mutation **403**,
  unauthenticated worker **401**.
- Browser fixture uses the actual bell, center and settings with synthetic local
  transport. Per-item read, mark-all, empty unread view, incoming alert count,
  preference change and Escape dismissal passed. It does not simulate Supabase
  transport or claim real push delivery.
- No document overflow at **320, 375, 390, 430, 768, 1024, 1440 and 1920px**;
  desktop and 390px screenshots inspected. Mobile dropdown fits and scrolls inside
  the viewport. Browser emulation does not establish physical-device acceptance.
- TypeScript **PASS**, full lint **PASS**, isolated production build **PASS**
  (30 pages generated). Application source/config were copied unchanged; installed
  dependencies were reused through a junction. The only build warning was root
  inference from the nested candidate's lockfile. Browser fixture console had no
  captured warnings/errors. The running development server was preserved.

Existing Resend sending implementation and booking handlers were not modified by
this feature. Existing uncommitted email-readiness work was preserved. Automated
email regression passes; no real email was sent in this task.

Local evidence logs are under ignored `private/admin-notifications-*`. No hosted
migration, deployment, VAPID generation, permission grant, subscription or real
push send was performed.

Dependency audit: npm reports **one critical and five high** findings in the
existing Next.js/ESLint dependency tree. The critical finding is
[GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), reported for
installed Next 16.3.5; npm suggests 16.3.8 as an available fix. Source search found
no `next/og`/`ImageResponse` use, but that is not a complete exploitability audit.
No finding was reported against the newly added `web-push` dependency. Framework
and tooling upgrades were not mixed into this feature. Review and patch the
dependency findings before production release; automatic forced/downgrade fixes
were not applied. Raw audit output remains local in
`private/admin-notifications-dependency-audit.json`.

## Owner action required

1. Review and deploy this code through the normal release process. Apply
   `supabase/migrations/20261005000100_admin_notifications.sql` after the existing
   migrations. Keep both notification enable flags false during setup.
2. Confirm `admin_notification_receipts` is in the existing `supabase_realtime`
   publication. The migration adds it if that publication exists. Do not publish
   device or credential tables. Verify two authorized sessions receive inserts
   and read-state changes, reconnect correctly and remain operator/user isolated.
3. Generate the VAPID pair once with `node scripts/generate-admin-vapid.mjs`.
   It writes `private/admin-push-vapid.env` with exclusive creation and prints no
   key. The directory is Git-ignored. Protect it with your Windows account's file
   permissions; POSIX mode alone does not configure Windows ACLs. Copy values
   directly into protected hosting environment settings, not chat, code or logs.
   Preserve the pair securely; rotation requires device resubscription.
4. Set server environment values: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and
   `VAPID_SUBJECT` (a controlled `mailto:` contact or HTTPS contact URL).
   Set `ADMIN_NOTIFICATIONS_START_AT` to an explicit UTC activation instant,
   e.g. `2026-10-05T12:00:00Z`, chosen at activation, not copied blindly from here.
   Older events are excluded. Existing `PUBLIC_OPERATOR_ID`,
   `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`,
   `CRON_SECRET` (at least 32 characters) and `APP_ENV=production` must be correct.
   The Supabase browser publishable key remains the existing public configuration.
5. Netlify uses `netlify/functions/admin-notifications-schedule.mjs`, every minute,
   only for the published production context. Configure runtime secrets in
   Functions scope and redeploy as required by hosting. Its site origin must match
   `NEXT_PUBLIC_SITE_URL`. Enable `ADMIN_NOTIFICATIONS_ENABLED=true` first to test
   inbox projection, then `ADMIN_PUSH_ENABLED=true` after VAPID setup. Email remains
   separately gated. Missing configuration is not a successful delivery test.
6. On each authorized device, open Notifications, name it, click Enable Push
   Notifications and grant permission. For iOS/iPadOS 16.4+, install the app on the
   Home Screen and open it there first. This platform requirement is documented by
   [WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
7. With two controlled devices, create/modify/cancel a disposable booking; verify
   one alert per event/device, unread/read synchronization, background/closed-tab
   delivery and exact booking navigation after login. Test denied permission,
   offline/reconnect, device removal, staff revocation and expiry. Verify Android
   Chrome and physical iPhone/iPad separately. Real device delivery and hosted
   Realtime are release acceptance work still pending.

## Explicit status

- **ADMIN NOTIFICATION CENTER: PASS** — local UI, API access boundary and database tests.
- **SUPABASE REALTIME: PENDING** — implemented; hosted publication/session acceptance remains.
- **MOBILE WEB PUSH: PENDING** — complete sending/worker path implemented and mocked;
  configured provider and physical-device acceptance remain.
- **MULTI-DEVICE PUSH: PASS** — two-device local end-to-end dispatch test with mock
  provider. Actual multi-phone delivery remains pending; this is not a production certification.
