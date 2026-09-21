# Phase 2B: transactional holds

Added 20260921000500_transactional_holds.sql and holds-server.ts. The server API provides createHold, readHold and releaseHold; the service-only expire_holds_v1 RPC expires bounded batches (1–1000 rows, default 100) using SKIP LOCKED. No public HTTP routes or scheduled worker yet; HTTP integration follows in Phase 2F.

## Contract

Each create request includes operatorId, departureId, quantity, a UUID requestId and a private sessionKey. Future handlers must derive the session key from a server-issued, cryptographically random session rather than trusting an arbitrary public body value. Hold responses strip session/request/order metadata. Service RPC errors map to INVALID_REQUEST, NOT_FOUND, CONFLICT, SOLD_OUT or UNAVAILABLE without database details.

Initial expiry policy: ten minutes, capped at the departure start. This is an implementation default, not a supplied business policy. Retries never extend expiry and return the original terminal hold if already released/expired/consumed. A changed payload for the same operator/request ID is a conflict. Request IDs are immutable.

Create serializes identical operator/request keys using a transaction advisory lock, then locks the departure row before reading committed items and active unexpired holds. Capacity is checked after waiting for the lock. Departure start and expiry use current wall-clock time. Sold-out creates raise without inserting a hold. Rollback frees both reservation and lock. Holds are only accepted for the published scheduled van-tour/departure-seat configuration from Phase 2A.

Read/release require matching operator, hold and session. They expire elapsed active holds and leave terminal states unchanged. Create expires elapsed holds on that departure; availability also excludes elapsed holds even before cleanup. Thus capacity reclamation does not require a running scheduler.

## Verification and limits

Native PostgreSQL tests use separate connections and observe a real lock wait for simultaneous last-seat requests. They cover first commit (one winner), first rollback (waiting request succeeds), replay preserving expiry, conflict, wrong-session release denial, release/reacquisition, natural expiry/reclamation, repeatable expiry sweep and immutable request IDs. Existing lifecycle, availability and RLS tests remain in the full suite.

Future order confirmation, capacity edits and any other capacity-increasing write MUST take the same departure-row lock and atomically coordinate item/hold transitions. Privileged direct table writes remain available for trusted server modules and can bypass this allocator; these RPCs do not claim to police arbitrary service-role SQL. Payments and order creation are not implemented here. No price is locked by a hold; checkout pricing validation is future work.

No new environment settings or production changes. The fresh development database is the only hosted target.

Validation results: npm test PASS (84 tests: 12 identity, 5 integration adapters, 59 embedded database, 8 native PostgreSQL). npm run check PASS (lint, typecheck, production build). CLI dry-run selected only the new Phase 2B migration before development deployment.
