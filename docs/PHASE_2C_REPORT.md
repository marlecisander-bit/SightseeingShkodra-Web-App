# Phase 2C: pending orders and items

Added migration 20260921000600_pending_checkout.sql, server-only createPendingOrder in orders-server.ts and native PostgreSQL checkout tests.

The V1 request supplies operatorId, holdId, trusted sessionKey and customer name/email/optional phone. It accepts no price, total, product or quantity overrides. Email/name/phone are bounded and normalized. The SQL RPC locks departure then hold, checks ownership/session, active expiry and saleable product/departure, validates the existing per-guest EUR pricing contract and derives quantity from the hold.

One transaction inserts the customer, pending order and pending item, attaches the hold and records order.created event/audit history without customer contact data. Any failure rolls back all writes. The hold remains active with its original expiry; no payment or confirmation is implied. Checkout snapshots current product pricing, which can differ from an earlier informational quote.

The hold is the idempotency identity. Concurrent submissions serialize and return the same order. Replays compare normalized customer details and reject changed details; they return the stored order even if its hold later expires, without reopening inventory or changing its lifecycle. New orders cannot use elapsed or released holds. One hold produces one item in V1; the schema still supports multiple items, with multi-hold checkout deferred.

Server outputs contain version, order/hold IDs, status, currency, total, expiry and items; no session key or customer contact information is returned. Service-only RPC permissions preserve RLS. Trusted future HTTP handlers must derive session identity securely; this module is not a public route. SQL pricing validation enforces the same V1 contract as quote validation at the transaction boundary.

Tests verify real concurrent duplicate checkout, server totals, pending state, session denial, conflicting retry, unchanged hold expiry, outer rollback, expired/released holds and invalid-pricing rollback. Local lint/typecheck/build pass. No new environment variables or production changes. Phase 2D lifecycle/confirmation primitives is next; no payment success is fabricated.

Verification: 76 identity/adapter/embedded tests passed in the full run. A preexisting expiry-sweep test assumed no other elapsed holds; the new checkout expiry fixture invalidated that assumption. Updated it to assert the second sweep returns zero. The affected native suite then passed all 10 tests, giving 86 passing tests across the suites. The final migration (including atomic event/audit persistence) was replayed successfully on native PostgreSQL. CLI dry-run selected only this migration for the linked development project.

Development deployment: migration push succeeded; final lint passed. No synthetic checkout/customer data was created in the hosted database for this phase. Full hosted checkout behavior is not claimed by the local integration evidence.
