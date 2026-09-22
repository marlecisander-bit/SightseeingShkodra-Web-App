# Confirm online, pay at the meeting point

Implemented 2026-09-22 under the explicit amendment in DECISIONS.md. New public and staff reservations use this flow; Stripe setup and online payment work are skipped. The original V4 source is unchanged.

## Customer and staff behavior

Customers choose a departure and guest count, hold seats while entering contact details, then confirm their reservation. Confirmation gives a booking reference and the final server-calculated total, marked **Payment due at the meeting point**. No money is marked paid at confirmation. Confirmed seats remain allocated after the original form timer ends. A reservation can be recovered in the same browser while its private session remains valid.

Owner, admin and operations staff can create confirmed reservations, record receipt of the full amount at the meeting point, or cancel a reservation. Recording collection requires a receipt checkbox, uses the saved order total/currency, creates one payment record and records the staff actor in the audit log. It does not charge a card or contact a payment provider. Repeated collection cannot create another receipt. Cancellation releases confirmed inventory; if payment was collected, the existing workflow requests manual refund review without issuing a refund.

## Implementation

- Migration `20260922000600_meeting_point_bookings.sql` adds an explicit order collection mode, permits pending-to-confirmed only for meeting-point orders, and retains historical online state transitions. Collection mode cannot be changed after checkout.
- `create_meeting_point_booking_v1` reuses customer validation, price snapshots and departure-first transactional locking from the existing checkout domain. It validates the hold/items/capacity, consumes the hold, confirms order/items/booking and writes one confirmation event in the same transaction. Same-request retries retain the reference and do not reconfirm cancelled reservations.
- The existing staff booking RPC now uses that same confirmation operation. `collect_meeting_point_payment_v1` authenticates the staff role within the operator and serializes on the order lock. A unique receipt index and replay checks prevent double collection records. Cancellation uses the same order lock.
- New `payments.collect` application permission allows owner/admin/operations. Operations RLS can read only its own operator's meeting-point payment records; general financial access and refunds remain restricted. Anonymous/authenticated clients cannot execute the privileged booking/collection RPCs or write payments directly.
- Public checkout remains bound to server-side operator/product and signed HttpOnly session. Recovery projects booking reference/status and payment status without customer contact fields. Attempting to release an already confirmed reservation returns a conflict instead of falsely implying cancellation. The customer UI removes the expiry timer and release button after confirmation.
- Staff forms call authorized server actions. The public API cannot record collection or cancel a confirmed booking.

## Verification

- 15 identity, 20 integration and 67 database tests passed, followed by 17 native PostgreSQL tests: **119 passing tests across completed runs**.
- New native tests cover concurrent confirmation/replay, invalid customer rollback, cross-session denial, retained unpaid capacity, original form expiry after confirmation, duplicate collection, restricted operations payment reads/direct-write denial, expired forms, cancellation before/after collection and privileged RPC denial. Historical online-payment domain tests still pass.
- Lint and typecheck passed. Optimized builds passed using ignored isolated output directories; the final build is `private/build-meeting-point-final`. Temporary config/type-generation edits were restored. The existing default `.next` OneDrive cleanup issue is unchanged.
- The single migration was dry-run, applied to development project `ybngoppqqiohcduojfyg`, and matching remote migration history verified. No production database or hosting changes.
- `scripts/verify-public-checkout.mjs` passed against actual hosted development RPCs and an isolated loopback production build: Origin/session guards, holds, confirmed unpaid order, replay/conflict, private recovery, denied public release of confirmed seats, full collection/replay and cancellation restoring capacity.
- Chrome confirmed two synthetic seats for EUR25, displayed reference `SS-f5dd28fb-c49b-4745-86ca-0c4b66c85d9f`, showed payment due and no expiry timer, and recovered the same confirmation after reload. 390px viewport had no horizontal overflow. Staff collection was verified through the hosted RPC and native tests; its newly added form was compiled but not independently exercised in an authenticated browser session.
- Synthetic operator `7522da7e-a7c7-41b1-b9f3-06a42118b507` retains immutable fictional booking/payment/audit history. Test reservations were cancelled, active holds released, catalog archived and synthetic staff deactivated. The test identity has no configured password. Owner data was not changed.

## Before real customer use

Enter and publish the real tour, prices, stops/meeting point and departures. The current price-editor limitation remains as recorded in Phase 4A; age bands have not been added. Supply contact details and cancellation/no-show terms. No automatic confirmation email or WhatsApp is sent yet; customers should retain their reference. Recovery is limited by the existing 24-hour cookie and same-browser storage. Refunds, partial payments, receipt corrections and no-show handling require staff review; no automatic seat release is scheduled for confirmed no-shows.

Localhost delivery only. Public abuse controls, production performance and launch checks remain pending. Next work should focus on operational content/setup and any separately requested confirmation notifications, rather than Stripe.
