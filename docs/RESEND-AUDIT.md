# Resend integration audit (before implementation)

Creation: public checkout calls prepare_booking_v1 via checkout API; meeting-point amendment confirms booking/items and consumes holds atomically, emitting booking.confirmed. Staff manual action uses create_staff_booking_v1 with stable request UUID, invoking the same domain primitives. References are SS- plus generated UUID, unique per booking. Pending requests are not confirmations.

Cancellation: staff server action -> cancellation-server -> cancel_order_v1; terminal transition and order.cancelled outbox event in the same transaction. Retry returns existing state. Paid cancellations additionally request refund review; no automatic refund.

Modification: no general booking edit API or admin form exists. Departure date/time/product edits are prohibited once inventory history exists. Notification support must not relax these rules. Add narrowly scoped change capture for meaningful customer/contact and confirmed item fields; no-op updates do not emit. A transaction-scoped key coalesces one booking mutation, distinct transactions generate distinct events. No invented previous-state summary.

Sources: bookings reference/status/confirmed_at/cancelled_at; orders customer/total/currency/collection_mode/created_at; customers name/email/phone; booking_items product/departure/quantity; departures service_date/start_time; operators timezone; products title; payments/refunds payment evidence. No passenger age breakdown, customer notes or canonical meeting-point text exists in these booking records. Do not invent them. Staff origin can be derived from booking.staff_created event.

Reuse domain_events outbox and notification_deliveries. Existing queue only supports one guest confirmation per booking and an inactive WhatsApp/email port. Extend with event/recipient identity and immutable send snapshot; do not add duplicate log/booking tables. Keep old inactive queue compatibility isolated. Protected scheduled Next server worker consumes committed events and sends customer/owner emails independently. No email network calls in database or booking transaction. Modification triggers emit outbox records only, needed because there is no existing modification event service.

Provider acceptance is not delivery. Unknown attempts retain a deterministic Resend key; stop automatic retries before its 24-hour guarantee expires. Snapshot and minimal sender configuration remain stable across retries. Retention redacts contact/snapshot fields after 60 days but retains compact deduplication tombstones.

Production is not enabled by this work. Required explicit switch, fixed operator, activation timestamp, owner/sender/reply-to, secure worker secret. Development requires an explicit test recipient and never targets real booking contacts. No real email is sent during implementation.
