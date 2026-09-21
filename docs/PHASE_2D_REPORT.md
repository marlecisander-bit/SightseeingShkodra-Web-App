# Phase 2D: booking lifecycle primitives

Added migration 20260921000700_booking_confirmation.sql, lifecycle-server.ts and native PostgreSQL confirmation tests.

prepareBooking verifies the private hold session, locks departure/order/hold, creates one pending booking with a UUID-based reference and advances the pending order to awaiting_payment. Replays return the existing booking. It neither starts a provider payment nor marks one paid.

confirmPaidBooking is a trusted server payment-integration primitive, not a public route or Server Action. The service-only SQL function requires an existing paid payment for this operator/order, a provider reference and exact order amount/currency. It never updates payment status. It locks departure, order, hold, payment, booking and item, checks unexpired active inventory, pending lifecycle, matching item quantity/totals and sufficient remaining capacity. V1 explicitly supports one hold/item per order, matching Phase 2C.

One transaction consumes the hold, confirms the item, advances order awaiting_payment → paid → confirmed, confirms/stamps the booking and records booking.confirmed event/audit data. Replays return the existing confirmation without another event. An error rolls back all changes. Payment/expiry mismatch or late/cancelled inventory leaves payment evidence untouched and requires reconciliation; no automatic refund or overselling fallback is implemented.

Server-only adapters suppress raw provider/database errors and fetch without caching. No session keys/customer contact information appear in responses. Authenticated and anonymous clients cannot execute the SQL functions or directly mutate payment state. Trusted service-role writers can still alter database records; verified provider webhook processing is Phase 5 and remains necessary before real payments are accepted.

Tests cover pending creation/replay, unpaid rejection, mismatched amount, released hold, reduced capacity, outer rollback, concurrent confirmation with actual PostgreSQL lock wait, one event, consumed inventory, confirmed timestamp and authenticated RPC denial. Synthetic paid evidence is inserted only in disposable native PostgreSQL, never in hosted Supabase or a payment provider. Existing lifecycle tests cover expiry consumption and illegal transitions.

No new environment variables, payment account settings, public UI or production changes. Next phase is 2E cancellation/refund hooks. HTTP documentation/packaging is Phase 2F.

Validation: npm test PASS, 87 tests (12 identity, 5 integration adapters, 59 embedded database, 11 native PostgreSQL); npm run check PASS, including lint, typecheck and production build. Development CLI dry-run selected only the new confirmation migration.

The migration was applied successfully to development Supabase. No hosted payment or confirmation test records were created. Functional acceptance evidence is from disposable databases, not a live payment provider.
