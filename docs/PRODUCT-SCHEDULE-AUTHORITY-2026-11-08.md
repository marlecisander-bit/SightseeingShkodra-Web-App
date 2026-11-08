# Product schedule and fare authority — 8 November 2026

Local implementation; no commit, push, deployment, hosted migration, operational product save or customer booking. Current authorized fallback repository used; canonical sibling remains absent. Existing unrelated work and independent Live Map preserved.

The owner explicitly amended the previous calendar design: edit operating times and passenger fares once in Products, propagate them to Calendar and platform consumers, and suppress deactivated offers until reactivated. Calendar retains dated closures and seat limits. This replaces the former separate date/range/slot fare and special-hour editors.

## Confirmed defects and changes

- Calendar date overrides copied departure lists. Deleting a recurring product time could leave it effective through that copy. Effective times now originate only in the product-owned service schedule. Existing omissions migrate once to explicit dated closures; later additions inherit automatically. Calendar cannot create independent times.
- Calendar unioned all materialized departures into its projection, retaining empty retired slots. Empty retired rows now disappear; reserved retired rows remain explicitly closed history. Product edits use the existing locked reconciliation, and lazy availability reads retire stale pre-upgrade rows. Holds and new booking items also reject removed times at the SQL boundary.
- Calendar had three separate fare/offer layers that could shadow a newly saved product price. New quotes now use the selected product's passenger categories and prices. The old JSON remains retained but no longer changes new quotes. Existing held and booked price snapshots, order totals and reservations remain intact. Hero/booking tests verify the same price source.
- Calendar's independent time and special-price inputs are removed; links open Products Schedule & seats and Prices. Dated closures and seat limits remain in Calendar, with existing reservation confirmation, capacity, permission and stale-save guards.
- Calendar suppresses slots when no active published offer uses the service; disabled editor controls cannot silently reopen product sales. Reactivation reuses existing IDs. An active linked offer keeps its shared physical service available even when the inventory-owning offer is inactive. Individual product sales switches and product-specific fares remain independent.
- Staff new-booking product choices now exclude inactive products. Existing booking records remain available. Customer modification availability no longer advertises a deactivated offer.
- Public day planner now resolves the product's shared inventory schedule, handles inactive products as no service, and uses effective product times directly. It no longer lets old cancelled materialized rows shadow current effective operating times.
- Older catalog/website guidance now points to the current Products/operating-calendar owners.

Reviewed paths: Products recurring schedule/passenger pricing/activation; effective schedule, range and date overrides; materialized availability and holds; public booking and customer modification; Hero fare; day planner; Home/Tours daily projections; staff new-booking choices; reserved departure and order history. Existing operator scoping, shared van occupancy, cutoff, idempotency and booking transactions remain authoritative. This is a scoped availability/pricing audit, not a claim that every unrelated platform feature is defect-free.

## Validation

Full npm test: **726 passed** (185 component, 25 identity, 259 integration, 222 database, 28 PostgreSQL, 7 CMS verification), plus **one new upgrade test passed** after that full run. Final focused UI tests also pass. npm run check passes lint, generated route types/TypeScript and optimized production build. git diff --check passes.

Disposable SQL regressions cover deleting a copied time, adding a new time through an existing date override, stale materialized hold rejection, product fare propagation, deactivation/reactivation, stable IDs/no duplication, active linked offers, preservation of confirmed reservations and immutable old prices. The upgrade test starts from the actual pre-migration schema/data: an intentional omitted time stays closed, an extra old time becomes closed reserved history, and a confirmed one-cent legacy fare remains unchanged while new quotes use the product fare.

Actual Chromium synthetic calendar at 390×844 and 1440×1000: no horizontal overflow, no time input or price entry controls, correct links to product Schedule and Prices. Paused/no-departure state is also covered by component interactions. No hosted edits or physical Safari acceptance claimed.

Evidence: evidence/product-schedule-authority-20261108/{tests.log,check.log,upgrade-test.log,final-ui-tests.log}.

## Release boundary

Apply **20261108000100_product_schedule_authority.sql** with the matching UI/source in a separately authorized release. It changes functions and adds service-only validation triggers; no new booking engine/table or scheduler. Existing future Calendar special fares/offers and extra hours cease driving availability; product values become authoritative. Existing explicit closures and capacities remain. Preserve the old JSON for review; do not erase bookings or rewrite snapshots. Unsafe changes to reserved capacity/timing remain rejected by existing guards; use explicit dated sales closure with reservation confirmation where required.

This migration is unapplied hosted. Local code alone does not change the live system. Publication preparation must isolate these changes from the unrelated dirty worktree, run candidate CI, verify the current main/base and deployment behavior, and follow the existing authorization boundary.
