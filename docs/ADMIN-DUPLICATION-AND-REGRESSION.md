# Admin refactor: ownership and regression report

28 September 2026. Local only. No deployment, migrations, production edits, email sends or data deletion.

## Duplication and ownership

| Business concept | Current sources/editors | Authoritative source | Display/reference only |
|---|---|---|---|
| Operational stops | Independent Map App; destination stop reference selector | Independent Map App | Website map iframe and optional destination stop ID |
| Editorial destinations | Website destination manager; homepage/tour/explore/notebook consumers | Destination content_pages records | Public cards/pages reuse published destinations |
| Departure times | Calendar service schedules, exceptions and dated departure view | Existing schedule/departure engine | Homepage timetable and booking choices |
| Service dates | Calendar service periods and exceptions | Existing service_schedules and exceptions | Public availability/planner |
| Prices | Calendar & Pricing category/range/departure editors | Existing effective-pricing rules | Booking quote, public price and saved booking snapshots |
| Products | Products & Suppliers; homepage configured product | products | Homepage presentation is a consumer, not another product |
| Homepage product presentation | Website headings plus configured product | Product identity/pricing remain operational; headings belong to website content | Homepage combines these distinct responsibilities |
| Guest Reviews | Dedicated Guest Reviews editor | reviews and review_settings | Public review cards |
| Homepage reviews | Website heading/visibility, review management | Website owns presentation; review entities own testimonials | Homepage consumes both; no second review copy |
| Images | Existing per-entity upload/image fields | Existing asset references/storage | Admin thumbnails reuse those URLs; no new media database |
| SEO | Global website editor and respective entity editors | Owning website/product/destination fields | Metadata consumers; scopes differ intentionally |
| Live Map data | Independent Map App | Existing independent tracking/ETA engine | Main website iframe/bridge, no new engine |
| Booking availability | Existing holds, allocations, departures, pricing | Authoritative booking domain/RPCs | Public booking and admin availability displays |
| Email settings | Existing server configuration; owner email screen | Existing Resend configuration and delivery queue | Admin safe status/history; no second settings store |

Multiple views are not inherently duplicated ownership. Schedule templates, date exceptions and dated inventory are deliberate layers. Immutable booking price snapshots are intentional historical values. Historical unused fields/prototypes remain retained, not activated or deleted. No conflicting new active editor was introduced by this refactor. The full pre-existing field inventory remains in CMS-RECONCILIATION.md and CMS-ROUTE-INVENTORY.json.

## Supabase load and code scope

Admin diff changes presentation, local UI state and existing action placement. CalendarPanel retains identical existing queries/RPC calls; the calendar moved earlier in render order. WebsiteWorkspace derives status from already-loaded content and does not fetch or autosave. Save buttons use the same existing form/handler. No query, polling, subscription or write path was added. This is static code verification, not production request telemetry.

Separate pre-existing email activation/service changes and migration remain in the working tree, outside this refactor. Do not confuse them with visual-refactor changes or include them in a future release inadvertently.

## Verification

79 tests passed in this acceptance run:
- 54 identity/CMS/calendar/catalog/reviews/customer-management/email-admin/QR tests.
- 25 availability-clock/availability/passenger-availability/checkout-session/checkout-reset/pass-recovery tests.

Covered: eight occupied seats with infants taking zero seats, child-only rejection, atomic capacity changes, exact 15-minute cutoff and Tirane/DST behavior, exclusion of past departures, cancellation/rebooking, QR decoding, safe email status and authorization, draft/publication visibility persistence and review ownership.

Earlier visual verification: six component surfaces at all 12 requested widths (72 cases), plus final CMS at all 12 widths, no horizontal overflow. Editor expansion, hidden thumbnail retention, visibility/discard and mobile menu tested with synthetic data. Latest isolated production build and targeted lint passed. Root typecheck still includes pre-existing broken private backup copies.

Public components/styles, map iframe URL binding, tracking provider, snapshots, Realtime, polling, ETA and stop logic have no changes from this admin refactor. This diff check establishes code isolation, not exhaustive live public acceptance.

## Remaining acceptance — not claimed complete

Full before/after screenshot comparison of every real authenticated module, each real CMS image upload/save/preview/publish/refresh cycle, real review management, calendar mutations, booking operations and email delivery were not performed against production. No live service or inbox delivery was certified. Physical iPhone safe-area/device checks remain outstanding. Existing automated database tests provide local contract coverage, not a substitute for those browser acceptance steps.

No new visual implementation was needed for this continuation. Website Content remains the shared design benchmark; unsupported Media/Settings pages, fake metrics and duplicate tracking were not added.

## Continuation 261–320
Fixed a demonstrated recovery issue: collapsed visibility actions now surface the existing server result in the card. Unsaved visibility explicitly displays the last saved state; failed saves retain edits for retry and never claim successful publication. Local synthetic-workspace denied save produced visible Access denied and Last saved: Visible, with no successful write. Empty contextual image is guarded. No backend handler changed.

Exact CMS viewport matrix passed without horizontal overflow: 320×568, 375×667, 390×844, 393×852, 414×896, 430×932, 768×1024, 1024×768, 1280×720, 1366×768, 1440×900, 1920×1080.

Asset inventory: public/brand/logo-color.svg, logo-light.svg; public/images/lake.webp, castle.webp, centre.webp, bridge-view.webp; attribution in public/images/credits.json; existing AmenityIcon. Hero/final use saved content image fields; uploaded images remain in existing Supabase website-media storage. No confirmed separate van photograph was introduced. Admin uses existing brand-tokens.css primary #B91546, yellow #F6C928 and Arial/Helvetica. Original assets preserved; existing image upload optimization and rendering retained. Thumbnail network optimization and full performance profiling have NOT been certified.

Final acceptance is still partial: physical Safari/PWA safe areas, actual login/logout, all real-data mutation/refresh workflows, exhaustive long-content/empty-content cases and production request telemetry remain unverified. No reference image beyond the textual brief was available. Existing code isolation/tests do not substitute for these checks. Nothing deployed.
