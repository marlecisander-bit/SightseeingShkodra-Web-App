# Admin workflow improvements — 30 October 2026

Implemented locally after the owner approved the recommendations in the admin simplicity review. This extends that earlier presentation cleanup. No commit, push, deployment, hosted migration/data/configuration change or communication send.

## Product setup checklist

Products shows four linked steps: Details & photo, Passenger prices, Schedule & seats, Homepage placement. Every issue comes from `product_publish_blockers_v1`; the UI only groups those authoritative messages into tabs. Unknown requirements remain visible under Details. No independent publication validator or inferred price/capacity rule was introduced. Ready means that group has no current server blockers, not that a product has been published.

## Consistent editor actions

A shared, normal-flow action bar groups status, draft/save, saved preview and publication controls in product details/placement, Website sections and destinations. It wraps on phones without a fixed overlay. Unsaved content asks the operator to save before previewing; previews continue to show saved content. Website warns that publication includes all saved Website drafts; destination publication updates that shared destination everywhere. Products retain the distinction between draft editorial data and immediately saved operational prices/schedules. Duplicate toolbar publication was removed; its link now leads to homepage placement/publication.

Reviews and Partners use the same action-bar presentation but explicitly retain their existing immediate-save semantics. No invented draft or preview persistence was added to those entities. Existing role checks and stale-save protections remain. Destination editing blocks cross-admin navigation, view switching and unload while dirty/pending. Image uploads also block leaving until complete.

## Full-history booking search

A new read-only `search_admin_orders_v1` function performs operator-scoped search across customer name/email/phone and booking reference, with departure date, exact-email compatibility and booking/order status filters. Filters apply before deterministic created-at/ID pagination; 25 orders are hydrated per page. Total count and page navigation preserve the selected filters. Search characters are literal substring matches rather than PostgREST/SQL filter fragments. Existing single-booking links, creation, payments, cancellations, capacity, cutoffs and communications implementations are unchanged.

The server requires `bookings.read` before all reads. Privileged query invocation is scoped to verified operator/staff context; the SQL function independently checks an active owner/admin/operations staff record. Anonymous/authenticated execution is revoked. Related booking/financial reads retain existing RLS-scoped completeness checks and fail closed on truncated/error responses. Search failure is reported rather than falling back to a misleading latest-100 list.

**Release dependency:** `supabase/migrations/20261030000300_admin_booking_search.sql` must be reviewed/applied before deploying this application change. It adds one stable read-only function and grants, with no table, customer, booking, inventory or CMS record changes. No hosted application or SQL has been published here.

## Unified stops and destinations

`/admin/[operatorId]/route-stops` is the primary Stops & destinations workspace. Route stops and All destinations are views of the same destination records and existing save action. Website links point to this workspace. Historical Website destination entry still renders the same shared workspace for compatibility. Stop conflicts and unavailable source fallbacks lead to All destinations. Unsaved destination changes block switching views. Operational stop order, coordinates, GPS and live state remain in the independent map.

## Verification and limits

New disposable SQL tests exercise an oldest booking beyond 100 newer orders, all six pages of 130 matches, literal search, exact email, status/date filtering, foreign-operator isolation, inactive/editor denial, public execution grants and read-only record preservation. Component tests exercise checklist grouping, GET filter/pagination URLs and an unsaved destination blocking tab switching. Existing integration tests verify scoped read-only RPC/SELECT calls and unchanged mutation implementations.

Development fixtures were updated for checklist, unified destination and search UI review. Native browser focus interruptions prevented completing the new-feature visual acceptance; previous-stage desktop/390px evidence does not establish complete acceptance of these new controls. No authenticated hosted search, actual upload or physical-device workflow was exercised. Full final command results are recorded below once complete.

Final automated verification: full `npm test` passed 644 cases (155 component, 24 identity, 222 integration, 209 disposable database, 27 PostgreSQL and 7 CMS verification). The latest pagination placement also passed the focused workflow component tests and typecheck. Lint/typecheck/optimized build passed; final clean check was repeated after pagination placement. `git diff --check` passed. Out-of-range result pages clamp to the last available page; navigation is offered above and below results.
