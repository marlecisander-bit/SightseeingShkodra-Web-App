# Phase 2E: cancellation and refund review hooks

Added cancel_order_v1 in 20260921000800_cancellation_hooks.sql, cancelOrder staff server adapter, RefundReviewRequested event type and native cancellation tests.

## Policy and behavior

V1 is staff-only. Owner/admin/operations with bookings.cancel may cancel pending, awaiting_payment, paid or confirmed orders. A bounded nonempty reason is required. The adapter verifies the signed-in staff context; SQL independently verifies the supplied staff profile is active and belongs to the operator with an allowed role. Anonymous/authenticated direct RPC execution is denied. This is not a public HTTP endpoint.

No customer deadline or refund percentage has been supplied, so none is inferred. Staff cancellation is an operational action, including after departure if staff choose it. Expired/refunded/partially-refunded order states require reconciliation rather than an automatic transition. Future customer self-service needs an explicit commercial policy.

The transaction locks departures in ID order, then order and payment evidence. It releases live active holds, marks elapsed active holds expired, cancels pending/confirmed items and bookings and cancels the order. Consumed holds remain consumed as historical records; their cancelled items cease consuming capacity. Existing lifecycle triggers stamp cancellation times. All changes and order.cancelled event/audit data commit together or roll back. Reasons stay in staff audit metadata; staff should avoid entering unnecessary personal details.

Retries return the cancelled result and preserve the first cancellation reason/actor. Repeated calls never create a second cancellation event. If a paid or partially-refunded payment with positive amount exists, a stable refund.review_requested event is emitted once per order. Its payload contains only orderId; future workers must re-read current payment/refund evidence and apply policy. No refund amount is promised, no refunds row is inserted and payment status never changes here. A late payment arriving after cancellation must trigger reconciliation in the future payment handler; there is no worker yet.

## Validation and scope

Native tests cover unauthorized actor rejection, unpaid release, paid cancellation after confirmation, unchanged payment state, absence of refund records, outer rollback and concurrent idempotent calls with a real PostgreSQL lock wait. The refund hook is event-driven only; provider execution and delivery remain Phase 5.

No new environment variables or production changes. Next is Phase 2F shared API types/documentation, then the Phase 2 audit.

Results: npm test PASS, 88 tests (12 identity, 5 integration adapters, 59 embedded database, 12 native PostgreSQL). Lint/typecheck pass. First build encountered a Windows EPERM lock inside .next; npm run build retry passed. Dry-run selected only this migration and push to development Supabase succeeded. No hosted cancellation/refund records were fabricated; functional tests ran on disposable PostgreSQL.
