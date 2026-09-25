# Dynamic destinations and Calendar & Pricing

Implemented for the local application and development Supabase on 2026-09-25. Source: the two user briefs; the operations attachment ends mid-example in section 26. Audit and plan: DESTINATIONS-CALENDAR-AUDIT.md. No production release, real email delivery or independent-map deployment was performed.

## Owner workflow

- Website content > Destinations: add/edit an attraction, save a draft, preview the saved draft, publish/unpublish, move earlier/later, or archive with confirmation. Destination names generate initial slugs. Publishing a renamed slug preserves previous detail URLs through redirects and previous Explore-page fragment anchors.
- Calendar & Pricing: browse months, select a date or range, set open/closed, add/remove departure times, override seats and category prices, or apply a named fixed-price/percentage/fixed-amount offer. Saved ranges can be reopened or removed using Restore inherited rules.
- Standard Schedule retains the existing operating-period/weekdays/times editor. Standard Pricing owns Adult/Child/Infant ages and prices. All physical passengers consume one seat. Blank override prices inherit; explicit zero is valid.
- Existing EUR 10 adult pricing is preserved in development. Child and Infant prices are not invented; the owner must set them before selling those categories. Ages default from the authoritative SQL category function to 0-2, 3-12 and 13+, and are editable as contiguous non-overlapping ranges.
- Advanced / Inventory History retains dated inventory inspection. Booked closures require explicit confirmation and block new sales without cancelling existing bookings. Capacity reductions below confirmed seats plus active holds are rejected.

## Destination architecture and preservation

Previously, four attractions were fixed place.* fields in the website-homepage record, with separate optional explore-* plain-text guide records. They are now individually managed content_pages records, marked is_destination, with independent body and published_body snapshots, ordering, aliases and retained destination_legacy where an old guide existed. No operational foreign key is moved or deleted. The original homepage fields remain as a historical snapshot and fixture schema; the fixed destination editor and duplicate guide editor no longer own live content.

The migration and development backup comparison verified every existing name, label, short/summary text, image and alt value in both draft and published snapshots for all four destinations: Historic Centre, Rozafa Castle, Shiroka & the lake, Mesi Bridge. Existing anchor links remain valid. Existing unpublished guide routes stay unpublished until their destination is explicitly published. No existing content was hard-deleted.

A Destination is an editorial visitor attraction. A Stop is an operational boarding/alighting point in the independent map. The optional selector reads five published stops using their stable properties.objectId. It does not copy stops, rely on array indexes, ingest GPS or modify map records. Missing/unavailable stop sources do not prevent saving an unassociated destination; existing associations are retained. The map connection uses server-only LIVE_MAP_SUPABASE_URL, LIVE_MAP_PUBLISHABLE_KEY and LIVE_MAP_PROJECT_SLUG. Only the existing public map configuration was used.

Dynamic readers now supply the homepage, Tour, Explore, Live editorial destination list, Your Day, detail pages, private previews and sitemap. Notebook destination cards take their name/image/label from destinations; historical slot captions remain stored but are retired from the editor. One shared card link label remains editable. Original four-item references remain only in legacy schema/default fixtures, historical migration/backfill code and the old homepage guide projection retained for compatibility; they no longer limit live destination creation. Legacy CSS class names containing stop remain styling identifiers, not a claim of operational ownership.

## Operations architecture

Reuse products, service_schedules, schedule_exceptions, departures, inventory_holds, orders and booking_items. No parallel scheduler or reservation engine was introduced. calendar_ranges extends service_schedules; calendar_settings extends date exceptions, with per-departure nested overrides. Base < range < date < departure; the latest saved matching range wins if ranges overlap. Individual category prices inherit independently through those levels. Monthly projection is bounded to one month and does not generate inventory; the existing requested-date materialization remains authoritative.

passenger_pricing extends products. The legacy per_guest Adult amount stays synchronized for compatibility; configured products reject divergent legacy price edits. New holds use the existing advisory/request and departure locks and seat accounting. Public/staff APIs validate counts, then the RPC validates again. No-child/infant-without-adult is enforced server-side. The existing single inventory booking item carries a passenger_snapshot with quantities, effective unit amounts, age labels, applied offer, pre-offer subtotal, final total and EUR currency. Order subtotal/total use that snapshot. Recovery, ticket display and admin booking lists retain category details.

Snapshots cannot be edited or silently repriced. No in-place passenger modification endpoint existed before this work; changing allocated passengers requires cancelling and rebooking. Direct quantity/snapshot changes are rejected. Legacy quantity-only callers remain all-adult callers. Category-aware clients must use passengerSnapshot/passengerQuote lines rather than interpreting the legacy unitPrice as one price for every passenger.

## Migrations

Applied individually to development project ybngoppqqiohcduojfyg and recorded as applied:

- 20260925000200_dynamic_destinations.sql
- 20260925000300_calendar_passenger_pricing.sql
- 20260925000400_calendar_inheritance_guards.sql

No blanket push of older unrecorded migrations. Private pre-migration backups were taken. A field-by-field comparison confirmed both existing orders, both booking items and all 16 pre-existing departures were unchanged. Normal requested-date reads can subsequently materialize additional future departures by design.

## Verification

- 117 database tests passed, including new destination lifecycle/preservation/permissions/aliases/reorder tests and calendar hierarchy/zero prices/age ranges/adult rule/snapshot/closure/capacity/offer/month projection tests.
- 60 integration tests passed in aggregate (57 existing plus 3 new HTTP category-forwarding and validation tests).
- 15 identity tests and 21 real PostgreSQL tests passed, including concurrent allocations, meeting-point confirmation, QR check-in and notification processing.
- Lint, TypeScript and an isolated production build passed. Local public /, /tour, /explore, /live and /book returned HTTP 200.
- Actual public availability returns four September 30 departures at the unchanged adult price. Child-only requests return 400; selecting an unconfigured child price returns controlled PRICING_UNAVAILABLE feedback, not an invented price.
- Chrome checks: actual calendar/date editor and destination list/editor rendered; the live stop selector showed the five published operational stops; new destination names generated slugs. Desktop and 390px layouts were inspected. Found and fixed inherited section gaps, squeezed mobile month headings and small mobile calendar targets. Mobile uses two-column date cards; larger screens use seven columns.
- Existing tracking integration tests passed. Independent GPS, geofencing, ETA and route-processing files were not changed. Read-only map source access succeeded. No new physical-vehicle field test is claimed.
- Final browser checks were interrupted by a Chrome native discard dialog. That dialog was subsequently replaced in code with inline confirmations. The temporary browser test destination was never saved. Remaining browser checks should resume after the dialog/connection is cleared.

## Files changed for this request

New:

- src/modules/content/destinations.ts, destinations-server.ts, destination-stops-server.ts
- src/app/admin/destination-actions.ts, destinations-editor.tsx, destinations.module.css, [operatorId]/destination-preview/page.tsx
- src/modules/booking/passengers.ts
- src/app/admin/calendar-actions.ts, calendar-panel.tsx, operations-calendar.tsx, calendar.module.css, staff-passengers.tsx
- the three migrations listed above
- tests/database/destinations.test.mjs, calendar-pricing.test.mjs; tests/integrations/passenger-availability.test.mjs
- docs/DESTINATIONS-CALENDAR-AUDIT.md and this report

Updated:

- src/app/admin/content-panel.tsx, website-panel.tsx, website-workspace.tsx, [operatorId]/website-preview/page.tsx, [operatorId]/[section]/page.tsx
- src/app/admin/departures-panel.tsx, schedule-editor.tsx, catalog-panel.tsx, overview-panel.tsx, booking-actions.ts, bookings-panel.tsx
- src/modules/content/website-schema.ts; src/modules/identity/admin-navigation.ts
- public route pages: page.tsx, tour, explore, explore/[slug], live, your-day; src/app/sitemap.ts
- src/components/public/homepage-view.tsx, editorial-pages.tsx, route-preview.tsx, booking.tsx, checkout-flow.tsx, booking-pass.tsx, use-availability.ts
- src/modules/booking/contracts.ts, availability.ts, availability-server.ts, public-availability.ts, holds-server.ts, orders-server.ts, staff-booking-server.ts; src/modules/public-preview/contracts.ts
- src/app/api/public/checkout/route.ts; src/app/(public)/public.css; src/app/button-system.css
- .env.example, local private environment, AGENTS.md, docs/DECISIONS.md and docs/PHASE_STATUS.md

Existing unrelated working-tree changes were preserved. Brand assets, online-payment policy, QR identities, notification enablement and external tracking behavior were not changed.
