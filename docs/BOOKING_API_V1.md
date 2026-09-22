# Booking API V1

Public transport update (2026-09-22): Phase 4C adds the fixed-site GET availability adapter; Phase 4D adds signed-cookie POST session/hold/read/release/order adapters at `/api/public/checkout`. See PHASE_4C_REPORT.md and PHASE_4D_REPORT.md. The earlier statement below that no public HTTP handlers exist describes the Phase 2 baseline. `readPendingOrder(operatorId, holdId, sessionKey)` now provides session-scoped recovery without customer contact data. Payment preparation/confirmation remain server-only and are not exposed by these handlers.

Canonical DTOs: `src/modules/booking/contracts.ts`. Use `import type` from this module in Admin/Public/partner clients. It imports no server modules, credentials or business logic. Existing type exports from individual modules remain compatible. Status types enumerate the database lifecycle states rather than accepting arbitrary strings.

This is the modular monolith's server-domain API, backed by service-only versioned SQL RPCs. There are no public HTTP endpoints, routes, HTTP status guarantees, customer login/session issuance, rate limiting or partner credentials yet. Earlier phase notes that suggested HTTP adapters in 2F are superseded: 2F consolidates the actual contract; HTTP handlers belong with their authenticated consuming interfaces. Do not expose the raw privileged RPCs to browser or partner clients.

| Operation / module | Input | Output | Caller and retry behavior |
| --- | --- | --- | --- |
| getAvailability / availability-server | AvailabilityRequest | AvailabilityQuote | Server; informational no-store quote, no reservation |
| createHold / holds-server | CreateHoldRequest | Hold | Trusted server session; same operator/requestId returns original hold, changed terms conflict |
| readHold / holds-server | operatorId, holdId, sessionKey | Hold | Matching private session; elapsed hold is expired |
| releaseHold / holds-server | operatorId, holdId, sessionKey | Hold | Matching private session; terminal states unchanged |
| createPendingOrder / orders-server | CreatePendingOrderRequest | PendingOrder | Matching hold session; one order per hold; retry preserves original price and compares normalized customer details |
| prepareBooking / lifecycle-server | operatorId, orderId, sessionKey | Booking | Matching checkout session; prepares awaiting_payment, never marks payment paid |
| confirmPaidBooking / lifecycle-server | operatorId, orderId, paymentId | Booking | Trusted verified payment integration only; existing exact paid evidence required; duplicate confirmation returns original |
| cancelOrder / cancellation-server | operatorId, orderId, reason | CancellationResult | Signed-in owner/admin/operations through bookings.cancel; first cancellation reason preserved |
| expire_holds_v1 / SQL only | operator UUID, limit 1–1000 | integer count | Trusted worker integration; repeatable bounded cleanup; worker not scheduled yet |

V1 appears explicitly in quote/order/cancellation responses and SQL function names. Hold/Booking retain their existing snake_case DTO fields; other DTOs retain camelCase. Do not independently rename fields. A future wire transport must declare its version and preserve or explicitly map these fields.

## Units, identity and inventory

Dates are real YYYY-MM-DD calendar dates; startTime is operator-local time. expires_at/expiresAt/asOf/confirmed_at are timestamp strings, interpreted as instants. Money is integer EUR cents within JavaScript safe integer range. Guests/quantities are positive integers. V1 supports a published scheduled van tour with per-guest pricing and one departure seat per guest; one hold becomes one checkout item. No customer age discounts, taxes/fees or refund percentage is inferred. See BOOKING_AVAILABILITY_V1.md.

Session keys are private capability credentials issued by future trusted server session handling. Browser forms must not select arbitrary session keys or staff IDs. requestId is a client retry UUID scoped to operator; it is not an authorization credential. Never log session keys, tokens or customer request bodies. Cancellation derives the staff actor from verified membership.

Quote → hold → pending order → prepare booking → verified provider processing → confirm. Holds last ten minutes or until departure, whichever is earlier. Quote prices may change before checkout; the pending order snapshots current pricing. Neither a pending order nor a prepared booking is proof of payment. Late/invalid confirmation requires reconciliation and leaves payment evidence intact. Holds reserve capacity; pending items alone do not. All future capacity mutations must follow the documented departure-row lock protocol.

## Errors

Each module exports an Error class with a stable code. AuthorizationError may also arise from staff operations. Clients branch on codes, never exception text.

| Module | Codes |
| --- | --- |
| AvailabilityError | INVALID_REQUEST, NOT_FOUND, INVALID_CONFIGURATION, UNAVAILABLE |
| HoldError | INVALID_REQUEST, NOT_FOUND, CONFLICT, SOLD_OUT, UNAVAILABLE |
| CheckoutError | INVALID_REQUEST, NOT_FOUND, HOLD_INACTIVE, CONFLICT, UNAVAILABLE |
| LifecycleError | NOT_FOUND, RECONCILIATION_REQUIRED, UNAVAILABLE |
| CancellationError | INVALID_REQUEST, NOT_FOUND, RECONCILIATION_REQUIRED, UNAVAILABLE |
| AuthorizationError | UNAUTHENTICATED, FORBIDDEN, UNAVAILABLE |

After a timeout, retry hold creation with the same request ID and terms; retry checkout against the same hold. Do not invent a new key to mask a conflict. Refresh quotes after SOLD_OUT. Do not automatically retry reconciliation failures as a successful booking or refund.

## Events and refunds

order.created, booking.confirmed and order.cancelled persist atomically with their changes and audit records. refund.review_requested is one review signal per order; its payload is `{orderId}` and its shared type is RefundReviewRequested. It is not a refund command with an approved amount or a completed refund. Consumers must reread current payment/refund state and apply an explicit policy. No consumer worker, provider transaction or notification dispatch is connected yet.
