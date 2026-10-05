> Current hosting decision (5 October 2026): Vercel is the permanent main-app host. The owner chose Hobby with background delivery disabled. Netlify scheduling instructions below are historical/legacy only and must not be used for new activation. Follow [DEPLOYMENT.md](../DEPLOYMENT.md). Notification projection and push dispatch are paused on Vercel.

# Admin notifications: audit and integration plan

5 October 2026. Audit completed before implementation.

1. Public and staff booking handlers call the existing transactional SQL booking functions. Confirmation emits `booking.confirmed` into `domain_events` with operator, booking and order IDs. Holds, seat accounting and cutoff checks stay there.
2. Customer modification and existing item/customer change triggers emit `booking.modified`, deduplicated by booking plus transaction ID. The event does not contain previous departure values; notifications must not invent a before/after comparison.
3. Cancellation emits `order.cancelled` after the existing atomic cancellation/capacity release. Bookings resolve through its order ID.
4. Meeting-point collection emits `payment.collected`; QR check-in emits `booking.checked_in`. These are existing operational events, not new triggers.
5. Resend's `enqueue_booking_emails_v2` reads the same outbox into `notification_deliveries`; the current worker handles recipient snapshots, leases, retries and history. The old provider abstraction is explicitly inactive. Existing uncommitted email-readiness work must be preserved.
6. Reuse `domain_events` as the sole business-event source. Add an asynchronous projection into shared notifications, per-user receipts and per-device push deliveries. Unique source keys prevent duplicate projections. No push or new notification trigger runs inside a booking transaction. A bounded scheduled consumer processes committed events once per minute independently of email enablement.
7. Source inspection found no manifest, service worker, PWA registration or Admin Realtime subscription. Add one worker scoped to `/admin/`, with no fetch handler or authenticated-data cache. Public pages and the independent map remain outside its scope.
8. Authorize through existing verified Supabase session, active operator membership and `bookings.read` (owner/admin/operations). The existing booking detail is `/admin/{operator}/bookings?booking={id}`. Add an allowlisted login return path; all destinations still perform authorization. Keep notification history distinct from email history, with a link to its existing owner-controlled configuration.

Preferences are per user and event category for in-app and push. Existing Resend settings remain authoritative; no second email toggle is added. Notification payloads contain references and compact operational summaries, no customer contact details. Summaries describe booking state at processing time, because existing events do not snapshot previous values.

Realtime uses one shared provider per Admin workspace, subscribing only to the current user's receipts. Inserts/read changes invalidate bounded server reads; subscription recovery performs one resync. There is no UI polling loop. Worker latency is normally up to the scheduler interval, followed by Realtime delivery.

Push sending uses the established Next.js/Netlify environment, VAPID and the `web-push` library. Endpoint allowlisting prevents subscription registration from becoming a server-side request proxy. Invalid subscriptions are disabled, retries bounded, ambiguous acceptance recorded without automatic resend. Device display never exposes keys or endpoints. Logout keeps explicitly registered devices active; staff revocation and preferences are rechecked before dispatch.

Release configuration and real-device acceptance will be reported separately. No hosted migration, deployment, permission prompt or sending is authorized merely by this local implementation brief.
