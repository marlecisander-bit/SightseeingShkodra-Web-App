# Admin function ownership and execution review — 8 November 2026

Local source review and repairs requested by the owner. No push, deployment, hosted mutation, real booking, notification send, migration or independent Live Map change. Existing uncommitted work retained in the current repository because the documented canonical folder is absent. Roadmap/decisions/phase status and CMS reconciliation consulted; this is a presentation/projection and ownership amendment, not a new booking engine.

## One authoritative editing location

| Function | Editing owner | Other surfaces and execution |
| --- | --- | --- |
| Product active/paused status, reopening copy, display order | Products | Existing product actions/RPCs; public cards and booking eligibility consume the product. Displayed reopening never automatically enables sales. |
| Product identity, photo, inclusions, amenities, supplier | Products → Details | Saved draft and published product remain distinct. Website links to Products rather than editing another card collection. |
| Homepage product visibility/publication | Products → Website | Uses the same product entity and existing publication action. Legacy product-cards route redirects to Products. |
| Passenger categories and usual prices | Products → Prices | Existing passenger-pricing RPC; new reservations consume saved prices, existing reservation snapshots remain unchanged. |
| Usual operating period, weekdays, times, capacity and shared inventory policy | Products → Schedule & seats | Existing service-schedule/booking-policy RPCs. Calendar/history links return here. Shared offers do not get duplicate physical schedules. |
| Date closure, departure-time overrides, date price/offer, review/save/reset | Calendar | Existing operations-calendar reader and calendar-override RPC; reserved-seat closure confirmation and stale-write checks remain in SQL. |
| Prepare dated inventory for a staff reservation | Bookings → New reservation | Removed the duplicate history preparation form and server action. History links to the existing authorized booking workflow. Browsing remains read-only. |
| Create/modify/cancel/delete reservation and record payment | Bookings | Existing server services and transactional SQL retain capacity, operator authorization, request identities and refund/payment safeguards. Home/Calendar consume outcomes. |
| Manual departure records | Calendar → Departure history | Distinct manual inventory editor remains; schedule-owned rows link to the calendar. This is not a second recurring-schedule editor. |
| Meeting point | Calendar → Booking meeting point | More links to this same editor. Effective-time rules and saved reservation details remain authoritative. |
| Suppliers | Products → Suppliers | Catalog route renders only supplier controls; product editing stays in Products. |
| Page sections, FAQ/policies, SEO, public contact/footer | Website | Existing website draft/publish source. Menu shortcuts select this same editor. Saving a draft does not publish it. |
| Stop editorial names/photos and destination guides | Website → Route & destination content | Removed the second embedded destination workspace from the page editor; it now links to the canonical Stops & destinations route. Stop/gallery views reuse the same destination editor and record. |
| Review records/settings | Website → Guest reviews | Existing review actions; shared Google Reviews URL remains owned by Website footer and is linked from review settings. |
| Partner records/order/visibility | Website → Partners | Existing partner actions; homepage section heading remains Website page content rather than a duplicate partner record. |
| Notification read state, preferences, devices | More → Notifications & devices | Header/Home are readers and shortcuts using the same notification context/API. Registration/test acceptance does not establish automatic delivery. |
| Email outcomes, controlled tests and permitted recipient retry | More → Booking emails | Existing provider/outbox controls; no booking transaction sends directly. Email and push remain independent asynchronous consumers. |
| GPS, operational stop order/coordinates, journey status | Independent Live Map | Admin links only; companion and its contract unchanged. Editorial destination content does not become GPS configuration. |
| Account/workspace | More → Account | Existing Auth actions and role-scoped workspace selection. |

Repeated links and read-only summaries are allowed; competing editors and duplicated mutations are not. Draft/publication, product sales state and calendar closure are separate decisions with different owners. A single saved source may have many consumers without making every displayed field editable everywhere.

## Confirmed stale/incorrect departure findings and fixes

- Home previously selected active schedules and counted `slot.open`, without checking active published offers. It could label a paused Hop On Hop Off product as the next departure. It now loads complete operator-scoped products, resolves active published offers against their shared inventory source, and counts each physical schedule once. Pausing an inventory-owning offer does not disable another active offer sharing it; labels use only the active offers.
- Both Home and the daily read-only view now use the same offer and operating-slot helpers. Whole-day exception/range closures and per-time closures are respected, including an explicit reopening exception overriding a closed range. Closed/paused inventory remains available in the calendar for review; existing reservations are retained and booked-seat totals are not erased by pausing sales.
- The daily view previously counted every projected slot, including closed ones, and displayed an unavailable next-departure value. It now counts operating slots and derives the upcoming time using the operator timezone for today.
- Calendar overrides invalidated only the departures route. Booking mutations and some operational actions similarly invalidated too narrow a path. Successful calendar/schedule/booking/manual-departure/meeting-point saves now invalidate the platform layout, matching existing product/content actions. Failed saves and closure-confirmation requests do not publish a successful result.
- Home refreshes its authorized server snapshot on focus/visibility return and once per minute while visible. It does not run background workers or overwrite editing forms. Public pages refresh on subsequent navigation/revalidation; this is not an instant cross-device push subscription for every open public tab.

## Execution and evidence boundary

Server actions retain existing operator/role checks, validated inputs, SQL transactions, concurrency stamps and return/error contracts. No SQL policy, allocator, payment idempotency, event projector, delivery scheduler, public content or configured flag changed. Public booking rules remain enforced below the UI.

The Home count is an operational **schedule** projection; manually maintained departures without a schedule are still reviewed in Departure history and Bookings. It is not GPS boarding status, a seat quote, or proof every physical departure operates. Capacity, cutoff, quotes and reservations remain authoritative in the booking API. No production account's current product/date data was changed or independently verified in this task.

Validation: full suite 717 passed (184 component, 24 identity, 253 integration, 221 database, 28 PostgreSQL, 7 CMS verification), plus an 18-test focused final run after removing duplicate history preparation. Lint/types/production build verified; final presentation refinement rechecked. Regression tests cover inactive product, date closure, active shared offer, complete/failing reads, per-time closure and reopening precedence. Synthetic mobile Chromium daily view confirms paused and closed service show zero operating departures without page overflow. Physical Safari, live account mutations and deployed-platform acceptance remain unverified.

Evidence logs: `evidence/admin-function-ownership-20261108/`. Local changes require separately authorized publication before they affect the hosted admin.
