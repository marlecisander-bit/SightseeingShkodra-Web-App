# Admin booking alerts — local investigation and fixes, 7 November 2026

> Latest release verdict, exact notification-only artifact and rollback plan: [deployment readiness review](NOTIFICATION-DEPLOYMENT-READINESS-2026-11-07.md). Earlier test counts and acceptance statements below describe their original stage.
> Historical first investigation. Current canonical origin is **https://www.sightseeingshkodra.com/admin**. The final local revision has703 passing tests and fresh scheduler/provider/auth findings. Use [current release checklist and screenshots](NOTIFICATION-RELEASE-CHECKLIST-2026-11-07.md); .app setup instructions, manual device naming and unavailable-provider statements below describe the earlier stage, not current release guidance.

Local branch: `work/admin-booking-alerts-20261107`. No commit, push, deployment, hosted database/configuration change, real email, real push, scheduler invocation, key generation or rotation. Existing product-controls work and unrelated documentation/evidence remain in the shared worktree. The documented canonical folder is absent; this uses the previously authorized current folder. No clone/worktree was created. Independent Live Map unchanged.

## Findings established before implementation

| Area | Evidence and conclusion |
| --- | --- |
| Event source | Successful SQL booking confirmation writes `booking.confirmed`; meaningful modifications write `booking.modified`; cancellation writes `order.cancelled`. Committed `domain_events` are the source for both notification systems. There is no provider send inside the booking transaction. |
| Admin emails | `enqueue_booking_emails_v2` already queues separate `customer` and `owner` recipients for all three events. The Resend worker snapshots recipients/content, leases jobs, uses stable provider idempotency keys, records provider receipts and reconciles signed webhook/read-only provider outcomes. The configured owner mailbox is the admin email recipient. Sending an email does not cause a web push. |
| Importance/subjects | The email message contract had no custom-header field and the worker passed no importance headers. The compact new-owner-booking subject included time/seats/amount/name but omitted the booking reference. These are confirmed source defects, not proof that a phone was muted by the site. |
| Registration reuse | Existing registration reused any local subscription without comparing its application-server key or checking expiry. Rotated keys/dead endpoints could persist. Replacement did not retire the old server device; disabled devices also counted against the device cap. |
| Registration feedback | After saving, the old UI unconditionally said “Push enabled” even if re-reading the saved device returned no enabled registration. Errors were collapsed into generic feedback. The worker activation listener could miss an already-completed activation. Unit tests reproduce these cases. |
| Activation versus registration | The public registration key was withheld whenever automatic delivery was paused, and the UI treated this as missing configuration. Registration setup and worker activation are different states. The new code separates them without activating delivery. |
| PWA/auth | The installed manifest identity, standalone mode, icons and admin scope were already present. Both bootstrap files passed through session refresh; an auth/config outage could therefore return a non-script 503 for the service worker. Live public checks returned 200, so this is a confirmed dependency/resilience defect, not an observed production auth outage. Parent/root-scoped workers must also be allowed to coexist with the narrower admin worker. |
| Origins | Read-only HTTPS checks show `www.sightseeingshkodra.app` redirects to `sightseeingshkodra.app`; `sightseeingshkodra.com` redirects to `www.sightseeingshkodra.com`, which remains a separate final origin. All inspected final manifest/worker requests returned 200 with appropriate types. Identical manifest IDs do not merge installations across origins. Permission, sign-in and subscriptions do not transfer between those origins. |
| Phone-specific cause | No physical iPhone, its permission/installation state, its Mail-app settings, or original device error was available. The exact device-specific failure and silent-alert cause cannot honestly be identified from source alone. Code defects are repaired and safe diagnostic/recovery messages now expose the next actionable failure. |

Original architecture/policy notes are historical evidence. The earlier Hobby-disabled decision and later observed hosted scheduler/delivery discrepancy remain unresolved by this local task. Existing infrastructure has not been activated, disabled or reconfigured.

## Changes

### Admin operational email only

Newly prepared owner/admin alerts now use event-and-reference subjects, for example `Booking modified — SS-… — Sightseeing Shkodra`, and Resend's message-level custom headers:

- `Importance: high`
- `X-Priority: 1`
- `X-MSMail-Priority: High`

An `adminOperationalAlerts: 1` marker is saved in the existing immutable envelope. Previously prepared retries keep their original subject/body/headers and Resend idempotency key; customer emails retain their existing templates, subjects, attachments and priority behavior. The explicit owner test email uses the same importance headers and includes them in its test idempotency identity. No historical jobs are rewritten or automatically resent.

These are mail-client importance hints. They cannot force a notification, sound, inbox placement, timely Fetch, or bypass Focus/Silent/Scheduled Summary. Resend acceptance also does not prove inbox delivery.

### Device registration and admin UI

Booking notifications now shows current origin, device permission, service-worker state, verified subscription state, server-key configuration and automatic-delivery configuration independently. It provides **Enable notifications**, **Repair registration**, **Send test notification**, device revocation/removal, per-event preferences and safe diagnostic codes. Preferences are correctly labeled as applying to all the user's devices, not only the current phone.

Permission is requested only from the explicit enable/repair tap, before unrelated asynchronous setup. iPhone/iPad regular tabs receive Home Screen instructions; unsupported/insecure environments and denied/dismissed permissions have different feedback. Registration compares the subscription's application-server key, checks expiry and server-disabled state, retires the user's old server device when replacing it, and verifies the persisted enabled device before reporting registration success. Failed persistence cannot produce “Registered.” Account/workspace conflicts, session expiry, device limits and storage failures have distinct safe messages. No endpoint or private key is displayed or logged to the browser console.

Permission and registration are rechecked on app focus/visibility and after settings/device changes. Server configuration now verifies that the VAPID public/private keys are an actual matching P-256 pair, not merely strings of the expected length. Keep the existing pair stable; do not rotate it as a first troubleshooting step. Valid production registration may be prepared while delivery remains paused; Preview/hosted Development registration remains disabled and sending guards are preserved.

The two public PWA bootstrap assets bypass session refresh; every protected page/API still authorizes its own operations. Existing manifest ID `/admin`, scope/start URL and icons are preserved. A parent/root worker can coexist; an unexpected worker occupying the exact admin scope is not silently removed. Activation handles the state-listener race. The push-only service worker activates updates promptly, has no fetch/offline data cache, validates booking click destinations and falls back to opening a new window if an old client cannot navigate/focus.

### Booking push

Retained the existing independent server-side projector/leased delivery queue. Unique event/booking/recipient/device identities, access checks, per-event preferences and bounded retry/uncertain handling remain authoritative. Every authorized registered device can receive its own delivery; 404/410 subscriptions are disabled. Repair retires an old device rather than multiplying active stale devices. Push processing validates configuration before claiming sends.

Push titles identify creation/modification/cancellation. Lock-screen bodies now allow only the projector's reference, passenger/seat counts and date/time grammar; arbitrary text, contact details, management tokens and totals are omitted. Details represent processing-time state, as in the existing projector. Clicks use the same-origin authenticated booking URL, with its existing allowlisted sign-in return path. Web Push urgency is high for operational delivery; this remains a transport hint, not a sound/Focus override.

Provider failures remain outside booking transactions and cannot undo reservations or capacity changes. No parallel booking engine, new scheduler or email-to-push coupling was added.

## Sender authentication and provider inspection

Fresh public DNS evidence is retained in `evidence/admin-booking-alerts-20261107/public-origin-dns.json`:

- `.app`: `send` SPF includes Amazon SES, `resend._domainkey` has a public DKIM key, and DMARC is present with `p=none`.
- `.com`: public `send` SPF and `resend._domainkey` records resolve; no `_dmarc` TXT resolved in this check.

This confirms published records only. It does not prove that the actual configured production sender uses either domain, that Resend currently marks that domain verified, or that a received message passed SPF/DKIM/DMARC alignment. The current folder has only `.env.example`, with no local provider/production credentials. Resend plugin discovery returned no connector. The existing owner-only Email delivery screen, authenticated provider webhook and read-only reconciliation are preserved, but **fresh authenticated Resend delivery results and received-message authentication were unavailable**.

Before real acceptance, the owner should inspect the actual configured sender's domain in Resend, verify its generated records, and inspect the provider IDs for the three controlled test messages independently of push. Distinguish accepted/sent from delivered, delayed, bounced, suppressed or complained; inspect received raw `Authentication-Results` for SPF/DKIM/DMARC pass and alignment. Do not change DNS from the observations above alone or resend uncertain messages blindly. No real test message was sent in this task.

## Validation

- Full `npm test`: **695 passed, zero failed**: 177 component, 24 identity, 240 integration, 219 database, 28 PostgreSQL and 7 CMS-verification tests. Existing product-controls tests remain included.
- Final focused notification/integration run: **48 passed**, including all final registration/scope changes. Final device-UI test: **1 passed**, with actual component interactions using mocked browser APIs.
- Final `npm run check`: lint, route generation/TypeScript and normal optimized Next.js/Turbopack production build passed. `git diff --check` passed.
- Real disposable SQL saves/projectors/claims/completion stores plus fake email/push providers exercise successful **creation, modification and cancellation**: exactly one owner and one customer email, two independent device pushes per event, correct subjects/references, admin-only importance headers, customer preservation, private lock-screen payloads and booking URLs. Repeated processing produces no duplicates. Email failure does not prevent push, and push failure does not prevent email or undo booking. Existing tests cover rollback, RLS, revoked memberships, retries, stale leases, old-template/byte-identical retry payloads and provider-status reconciliation.
- Registration tests cover explicit-tap ordering, Home Screen requirement, unsupported browsers, denied/dismissed permissions, invalid/mismatched VAPID keys, expired/disabled subscriptions, repair, unsaved persistence, activation race, coexistence with root workers, and errors without leaking provider details.
- Service-worker/click tests cover same-origin booking destinations, safe login return URLs, stale clients, traversal/external URLs, malformed payloads, activation and absence of a fetch cache. No physical account login round-trip is claimed.
- Chrome synthetic admin fixture at **320×740, 390×844, 768×1024, 1440×1000**: no horizontal overflow; readable device/setup/origin states and disabled controls when not configured; no false registration success. Emulated iPhone-tab detection shows installation guidance. Final browser console has no errors/warnings. The fixture's pre-existing variable timestamp hydration issue was made deterministic. Screenshots and layout observations are retained in the evidence folder.
- No physical iPhone was available. Chromium with an iPhone user agent is not Safari/iOS acceptance. Real APNs registration, background/locked-screen display and sound, real email inbox delivery, live provider verification and physical notification-tap/authentication remain **pending**.

Evidence: `evidence/admin-booking-alerts-20261107/{tests.log,focused-tests.log,device-ui-tests.log,check.log,layout-results.json,layout-390.jpg,layout-1440.jpg,public-origin-dns.json}`. Read-only audit can be repeated with `node scripts/audit-notification-public.mjs`.

## Required configuration and release boundary

No new environment variable or database migration is required for these notification fixes. Existing notification/email schema and permissions must already be present. The earlier product-availability migration is separate and remains unapplied hosted.

Before a separately authorized release/acceptance, review these **existing** server-only settings without exposing their values:

| Channel | Existing requirements |
| --- | --- |
| Common | Correct `PUBLIC_OPERATOR_ID`, `NEXT_PUBLIC_SITE_URL`, Supabase URL/publishable/server credentials, active authorized staff membership. Prefer `https://sightseeingshkodra.app` consistently for Admin installation. |
| Admin email | `EMAIL_ENABLED`, `EMAIL_START_AT`, `RESEND_API_KEY`, actual verified-domain `RESEND_FROM_EMAIL`, `BOOKING_OWNER_EMAIL`, monitored `BOOKING_REPLY_TO_EMAIL`; controlled `EMAIL_TEST_RECIPIENT` for non-production tests. |
| Email outcomes | Existing `RESEND_WEBHOOK_SECRET`, configured authenticated provider webhook and/or `RESEND_STATUS_API_KEY` for read-only lookups; inspect owner-only Email delivery history. |
| Push | Stable matching `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`, valid `VAPID_SUBJECT`, `ADMIN_PUSH_ENABLED`, `ADMIN_NOTIFICATIONS_ENABLED`, valid `ADMIN_NOTIFICATIONS_START_AT`, user/event preferences and per-device registration. |
| Processing | Existing single authorized minute scheduler invoking `/api/internal/booking-emails` and `/api/internal/admin-notifications` with `CRON_SECRET`; Vercel production/background guards must match the explicitly approved delivery decision. Registration does not activate any of these. Do not add another scheduler. |

This checklist is not authorization to change hosted flags, schedules, domains, DNS, keys or webhook configuration. Current observed infrastructure is preserved.

## Exact iPhone acceptance steps, after an authorized release

1. Use **iOS/iPadOS 16.4 or later**, with current available updates. In Safari open `https://sightseeingshkodra.app/admin` and confirm that final origin.
2. Tap **Share → Add to Home Screen**. If offered, enable **Open as Web App**, then Add. Open **Shkodra Admin from its Home Screen icon**, rather than a regular tab or an old `.com`/`www` installation.
3. Sign in in that installed app. Open **More → Preferences & devices**, then **Booking notifications**. Give this phone a recognizable device name.
4. Tap **Enable notifications**, then **Allow** on Apple's permission prompt. Expect **Registered on this device** only after persistence succeeds. Enable New bookings, Modifications and Cancellations under Push on my devices. If denied, use **Settings → Notifications → Shkodra Admin → Allow Notifications**, reopen the installed app and retry. Use Repair registration for stale/server-key/account registration errors; remove the old phone in Your devices when replacing it.
5. Tap **Send test notification**. “Accepted” means only that the push service accepted it. Verify it appears, close/background the app, lock the phone and repeat a controlled test after its one-minute cooldown. Tap the alert and verify the correct booking opens after sign-in if needed. Separately verify creation, modification and cancellation from controlled saved bookings; retain event/provider IDs and observed times.
6. For sounds, use **Settings → Notifications → Shkodra Admin** to allow alerts, Lock Screen and Sounds. Check **Sounds & Haptics**, Silent mode, **Focus** allowed apps, and **Scheduled Summary**. Paired Apple Watch routing can also affect where an alert appears. These are device choices, not website permissions to override.
7. For **Apple Mail**: **Settings → Apps → Mail → Notifications → Customize Notifications → the receiving booking account → Alerts**, and select a sound. Check account **Fetch New Data** (Push where supported, otherwise Fetch can delay alerts). For Gmail/Outlook apps, enable the correct account's incoming-mail alerts inside that app as well as iPhone notification permission. Older iOS menu placement can differ. Verify email and push independently; neither channel proves the other worked.

## References

- [WebKit: Home Screen Web Push, iOS/iPadOS 16.4, tap-triggered permission and Focus](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
- [Apple: Mail account alerts, sounds and Silent mode](https://support.apple.com/en-us/108412).
- [Resend Send Email API: custom message headers and provider receipts](https://resend.com/docs/api-reference/emails/send-email).

## Changed implementation areas

New `admin-operational-email.ts`, `push-registration.ts`, `registration-errors.ts`, `lock-screen-message.ts`, and `booking-push-device.tsx`; existing email envelope/worker/provider/test diagnostic; notification settings/API/server/key validation/test push/worker/provider; push-only service worker and precise public bootstrap bypass; synthetic admin preview and read-only public audit script. New registration/device-UI/event-pipeline tests and expanded existing activation/click/email tests. Documentation records this requested local amendment without rewriting original Roadmap V4.
