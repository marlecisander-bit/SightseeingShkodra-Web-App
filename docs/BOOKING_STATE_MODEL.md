# Phase 1C holds and lifecycle constraints

The executable row-level rules live in `supabase/migrations/20260920000100_inventory_holds_and_states.sql`. This document explains the choices made while translating Roadmap V4 section 5 into constraints. No state rules are duplicated in React.

## Holds

Holds start active with a positive quantity, a nonempty session key and a finite future expiry. Composite foreign keys require the departure and optional order to belong to the same operator. A hold can be created before its order, then attached once; consumption requires that attachment. Reservation identity, departure, quantity, session, creation time and expiry cannot be rewritten. Releasing and creating a new hold will be the later booking-domain operation for changing selections.

| From | Allowed next states | Timing requirement |
| --- | --- | --- |
| active | consumed | Current database clock is strictly before expires_at; order_id is present |
| active | expired | Current database clock is at or after expires_at |
| active | released | May be released before or after its expiry time |
| consumed, expired, released | Same state only | Terminal: cannot resurrect or change outcome |

The database writes ended_at once and preserves it on same-state retries. An unchanged-state update does not reserve any new inventory. Expiry decisions use clock_timestamp, not the transaction start time: a long-lived transaction cannot consume a hold after its wall-clock deadline.

Indexes support departure availability, expiry cleanup, order association and session lookup. A stored active status can remain after its deadline until cleanup runs. Future availability queries must count **only status = active AND expires_at > current database time**. Do not rely on a periodic cleanup task alone to free seats logically.

There is no automatic cleanup worker, reservation API, capacity allocator or availability query yet. The holds table by itself does not prevent overselling. Phase 2 must coordinate active, unexpired holds and confirmed quantities under departure-level transaction locking, including capacity changes, and provide retry-safe commands. PGlite tests here do not prove concurrent last-seat safety.

## Orders and payments

All new order/payment rows must start pending. Identical-state updates are permitted; prohibited transitions raise SQLSTATE 23514. Status columns also have explicit CHECK constraints.

| Record | From | Allowed next states |
| --- | --- | --- |
| Order | pending | awaiting_payment, cancelled, expired |
| Order | awaiting_payment | paid, cancelled, expired |
| Order | paid | confirmed, cancelled, partially_refunded, refunded |
| Order | confirmed | cancelled, partially_refunded, refunded |
| Order | cancelled | partially_refunded, refunded |
| Order | partially_refunded | refunded |
| Order | expired, refunded | No change of state |
| Payment | pending | processing, paid, failed |
| Payment | processing | paid, failed |
| Payment | failed | processing, paid |
| Payment | paid | partially_refunded, refunded |
| Payment | partially_refunded | refunded |
| Payment | refunded | No change of state |

Section 5's compact arrows are treated as a vocabulary and lifecycle outline, not a requirement to fail a successful payment before refunding it. A verified success may arrive without an observed processing event. A failed attempt can be retried or later report success; an already-paid payment cannot be downgraded by a delayed failure event. A cancelled order can be refunded; an expired order is not silently reopened by late payment success. Handling that late payment, including possible refund or a new availability check, is a later payment-domain concern.

Settled payment states require a provider reference. This does not prove payment verification. Refund sums, paid amounts, transactional order/payment consistency, event deduplication and verified webhook authorization are deliberately still Phase 2/5 responsibilities. In particular, these row-level rules do not check that a paid order has a matching paid payment or that a consumed hold's order has been paid. Client privileges remain revoked; later server-only domain transactions must enforce those cross-record invariants before these capabilities are usable.

## Bookings and booking items

Bookings and items track fulfilment separately from order/payment refund accounting:

| From | Allowed next states |
| --- | --- |
| pending | confirmed, cancelled, expired |
| confirmed | cancelled |
| cancelled, expired | No change of state |

New rows must start pending. Booking confirmed_at and cancelled_at are database-owned timestamps. Confirmation writes confirmed_at, cancellation writes cancelled_at, and cancelling a confirmed booking preserves its original confirmation time. Retried updates cannot overwrite these timestamps. Cancelling a pending booking leaves confirmed_at null. Pending or expired bookings cannot carry confirmation timestamps, and only cancelled bookings can carry cancelled_at.

Item-level refund attribution and refund-record lifecycle rules are not introduced here; they belong to the later cancellation/refund implementation. This phase adds no state vocabulary for products, departures, content or refund rows.

## Security and migration checks

inventory_holds has RLS enabled and all PUBLIC/anon/authenticated privileges revoked, matching the initial 21 tables. Trigger helpers have a fixed empty search_path, fully qualified references and no SECURITY DEFINER privilege escalation; public/client execution is revoked. Usable operator/role policies remain Phase 1E.

Existing migrations are unchanged. The new migration validates existing rows when adding constraints and fails transactionally if they contain incompatible states/timestamps; it does not silently repair business records. Future production migration review must inspect data first. No persistent or hosted database was modified during Phase 1C.

Run `npm run test:db` to apply both migrations to disposable embedded PostgreSQL and exercise the lifecycle scenarios. The suite includes initial-state bypass attempts, invalid vocabulary, null status, cross-operator references, finite expiry, immutability, same-state retries, cancellation/refunds, expiry during an open transaction and default client denial. Full Supabase and concurrent connection validation remain required before the Phase 1 checkpoint.
