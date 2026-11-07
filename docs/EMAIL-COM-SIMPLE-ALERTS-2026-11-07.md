# Email domain audit and simplified booking alerts — 7 November 2026

> Latest release verdict, exact notification-only artifact and rollback plan: [deployment readiness review](NOTIFICATION-DEPLOYMENT-READINESS-2026-11-07.md). Earlier test counts and acceptance statements below describe their original stage.
> Superseded release guidance: [final candidate, scheduler findings and screenshots](NOTIFICATION-RELEASE-CHECKLIST-2026-11-07.md). The final revision preserves saved preferences, separates registered status from processing health and adds an unapplied push-heartbeat migration; the no-migration and enable-all statements below describe this earlier stage.

Local only on `work/email-com-simple-alerts-20261107`. No commit, push, deployment, DNS, hosted environment, subscription or scheduler change. Earlier product/notification work and the independent Live Map remain intact.

## Production observations

Read authenticated production admin and Resend UI on 7 November. These observations supersede the earlier report's lack of provider access.

| Check | Observed result |
| --- | --- |
| Desired domain | Resend lists sightseeingshkodra.com Verified; sending enabled, Ireland, Forge enabled |
| DKIM | resend._domainkey TXT Verified in Resend; public DNS agrees |
| SPF / bounce routing | Verified send and rsend CNAME records; public targets expose SPF and feedback MX records; see evidence |
| DMARC | No TXT answer at _dmarc.sightseeingshkodra.com; optional p=none suggestion in Resend is not a published/verified record |
| Actual deployed From | Sightseeing Shkodra <tickets@sightseeingshkodra.app>, not the newly verified .com domain |
| Actual Reply-To / configured admin | sightseeingshkodra@gmail.com |
| Latest admin email | 7 Nov 13:27 local, provider accepted and delivered; raw provider JSON confirms .app From and Gmail Reply-To |
| Latest customer confirmation | Same-time ticket listed Delivered; received headers not accessible |
| Cancellations | Historical cancellation/customer-admin pairs listed delivered |
| Modifications | Production operational counters show zero sends; no real delivery acceptance evidence |
| Historical health | 11 historical failure/suppression/complaint records; latest pair delivered, no pending or delayed items observed. Historical bounces/suppressions must not be described as current domain failures |

Visible From is the author address; Reply-To controls replies and may legitimately be Gmail. Return-Path is the provider's SMTP envelope/bounce address, not Reply-To. The verified send/rsend delegated records support provider routing; exact selected Return-Path and SPF/DKIM/DMARC alignment for a received .com message remain unverified. No received MIME Authentication-Results or mailbox access was obtained. Verified DNS alone does not establish acceptance, delivery, inbox placement or audible alerts.

All six fresh email paths (new/modified/cancelled, admin/customer) share server-side bookingEmailConfig.from. There is no separate hardcoded .app sender for a fresh path; the hosted RESEND_FROM_EMAIL binding is the confirmed mismatch. Existing immutable queued/retry envelopes intentionally retain their original sender and content. Public customer links remain governed by the existing site URL rather than being silently moved with the admin origin.

## Local changes

- Example sender now uses tickets@sightseeingshkodra.com; admin email status warns if the actual configured domain differs. No runtime forced override of a working sender.
- A separate **Test delivery to admin** action sends a clearly labelled diagnostic only to the server-configured admin address. No booking, fake reference, customer lookup, queue drain or customer contact. Permission and tenant checks, preview refusal, local recipient restriction and five-minute idempotency prevent unsafe/repeated sends. UI reports provider acceptance and ID only. No real diagnostic was sent in this audit; the currently deployed older test was disabled by its missing recipient configuration.
- One **Booking alerts on this device** card presents the next action: install instructions, Enable booking alerts, confirmed saved-device success plus Send test alert, blocked-permission recovery, or an error with Retry. No key/device-name/provider input. Diagnostics and other preferences/devices are collapsed.
- Registration reuses valid subscriptions across repeated clicks/logins; verifies current browser permission, worker, key, expiry, saved subscription and delivery preferences. Subscription persistence failure cannot produce enabled status. Three booking preferences enabled together; transport-paused state remains truthful. Test transport acceptance does not claim device receipt/sound.
- Owner explicitly selected https://www.sightseeingshkodra.com/admin. Production admin/auth GET aliases temporarily redirect there, retaining query paths, with no-store. Local/Preview, public/customer routes, API/POST and old worker/manifest assets are excluded. Admin push links, new owner-email links and staff recovery use this origin. Existing relative manifest id/start/scope and existing subscriptions stay intact; no VAPID rotation.
- Existing server-side committed-event queues, multiple authorized devices, deduplication, private lock-screen facts, invalid-subscription cleanup and failure isolation remain in place. Customer messages and frozen retries are preserved.

## Verification

Full npm test: **701 passed, zero failures** (177 component, 24 identity, 246 integration, 219 database, 28 PostgreSQL, 7 CMS verification). npm run check: lint, generated route types, TypeScript and normal production build passed. Evidence: evidence/email-com-simple-alerts-20261107/.

Focused coverage includes all three saved booking event types, separate email/push delivery and failures, duplicate suppression, expired subscriptions, click/auth fallback, denied/unsupported/Home Screen states, failed persistence and Retry, canonical alias/query preservation, local isolation, valid subscription reuse, admin-only diagnostic authorization/recipient/idempotency/provider refusal and sender mismatch. Current card interaction tests use JSDOM; they do not establish real Safari rendering or permission acceptance. The prior notification report contains synthetic responsive layout evidence; it is not physical acceptance of this simplified revision.

Physical iPhone Mirroring was attempted; connection timed out. Actual iPhone Home Screen registration, background/locked-screen receipt, sound, and physical notification taps remain unverified. No .com test was accepted/delivered during this local audit, and inbox placement is unknown. No new database migration for this email/setup revision. The earlier product-controls migration remains separately documented and unapplied hosted.

## Owner actions when publication is authorized

1. Set production RESEND_FROM_EMAIL to `Sightseeing Shkodra <tickets@sightseeingshkodra.com>`; confirm the existing production API key permits this domain. Keep working Reply-To/admin routing, existing DNS records and delivery infrastructure intact. Do not replay historical uncertain/failed emails automatically.
2. Verify Vercel keeps www.sightseeingshkodra.com reachable and does not redirect it back to .app. Verify Supabase permits https://www.sightseeingshkodra.com/auth/activate for staff recovery; hosted allowlist was not inspected/changed. Keep Preview data isolated and automatic communications disabled.
3. Use the new Test delivery to admin button after an authorized release/configuration change. Match provider ID to accepted/delivered events, then inspect the actual mailbox original headers (From, Reply-To, Return-Path, Authentication-Results). Record inbox/spam placement independently. Decide separately whether to publish DMARC after reviewing all legitimate senders; no DNS record changed here.
4. On iOS/iPadOS 16.4 or later, open https://www.sightseeingshkodra.com/admin in Safari, sign in, then **Share → Add to Home Screen → open the installed app**. Open notification settings, tap **Enable booking alerts**, and allow the system prompt. Only saved registration reports enabled; tap **Send test alert**, then repeat with the phone locked and verify a tap opens the correct booking through login if needed.
5. If blocked, allow notifications for the installed app in iPhone Settings → Notifications; return and Retry. Enable Lock Screen/Banners/Sounds as desired and allow the installed app through Focus. Mail separately needs Allow Notifications, the relevant account's alert/sound settings and appropriate fetch/push behavior (or the Gmail app's account notifications). Silent mode, volume, Focus and delivery scheduling still affect sound. Importance headers cannot force an alert or bypass those settings.
6. Origins have separate permissions/subscriptions. An old .app installation cannot transfer its permission to .com. If migrating the same phone, disable that old installation's registration before enabling the new one to avoid two independent subscriptions. Other authorized devices remain valid. Confirm new/modified/cancelled email and push independently with an owner-approved operational test; real event delivery was not exercised here.

Official guidance checked: [WebKit Home Screen Web Push](https://webkit.org/blog/13878/), [Apple Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [Apple notification settings](https://support.apple.com/en-ie/guide/iphone/iph7c3d96bab/ios). Home Screen installation and a direct user gesture are required for the iOS permission request; sound and Focus are controlled by the device.
