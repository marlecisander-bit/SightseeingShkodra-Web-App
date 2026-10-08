# Approved roadmap amendments

## 2026-09-29 - Full-screen mobile hero from phone reference

The user supplied the real-phone screenshot and requested that the mobile photograph, including Discover your day, cover the screen; remove the mobile hero Track live option and lower the headline/support slightly. This supersedes the earlier requirement that Discover sit outside the photo and that hero geometry remain independent of viewport height. Use stable small-viewport minimum height (100svh), allow readable content to extend on short screens, retain proportional cropping, and keep desktop/header/booking/pricing/map behavior. No deployment is included in this implementation request. See MOBILE-HERO-FULLSCREEN.md.

## 2026-09-24 - Unified van-inspired visual system

The new user design brief supersedes the earlier bright-red palette: raspberry #B91546 is primary; yellow #F6C928 identifies booking CTAs, with turquoise/green/purple accents and white/cream/sand surfaces. Central tokens also govern typography, controls, cards, spacing and widths. Preserve CMS content, route ordering, booking/authentication/Supabase/GPS/ETA logic and logo artwork. Independent map iframe styling remains owned by its separate app; no remote deployment authorized. Original roadmap unchanged.


## 2026-09-24 - Bright red brand palette

The user explicitly replaces the roadmap's deep-red accent direction with primary #E71922, hover #CF151D, active #B91219, soft #FDE8E9 and border #F3B9BC. Centralize these in src/app/brand-tokens.css. Preserve layout, neutral surfaces, semantic colors, logo artwork and functionality. Small accent text uses the darker hover color for contrast on off-white surfaces. The independent embedded tracking app remains responsible for its own internal styles; this project's tracking controls and local map defaults use the shared tokens. Original roadmap unchanged.

## 2026-09-23 - Recurring operational service schedules

The user supplied the service-schedule task, replacing manual daily departure creation with a product operating period, weekdays, multiple daily times, default capacity/vehicle and date exceptions. Preserve the roadmap's explicit dated inventory for transactional locking: materialize only a requested day (at most 24 times), never the entire season. Existing holds, confirmed booking items and departure IDs remain authoritative. Exact future manual departures can be adopted; conflicting records block adoption rather than being deleted or silently duplicated. This is a requested extension to departures and the shared availability entry point, not a second booking engine or production launch.

Current ticket semantics were inspected before implementation: booking items and holds reserve a particular departure ID; there is no entitlement or repeated-boarding model. The marketing label "Daily Ticket" does not establish all-day capacity rules in the code. Preserve current per-departure seat reservations and state this in the admin; all-day reboarding requires a separate explicit business decision. Original roadmap unchanged.

## 2026-09-23 - Connect the existing homepage to structured admin content

The user supplied the detailed Homepage CMS task and explicitly authorized connecting the existing `/` page, importing its current local content, structured section editors, draft/preview/publish, responsive hero images, Supabase media uploads and end-to-end verification. Preserve the existing public layout and components; do not create a replacement homepage or generic builder. Extend `content_pages` publishing rather than duplicate operational sources. Preview may extract existing markup into a shared component. This is a specifically requested CMS extension after Phase 7C, not launch authorization. See HOMEPAGE-CMS-MAP.md and HOMEPAGE-CMS-CONNECTION-AUDIT.md. The original roadmap is unchanged.

## 2026-09-23 - Route administration belongs to the independent map app

The user explicitly requested removing route stops from this website's admin because stops, routes and GPS are managed in the live map app. Remove the catalog stop editor and stop query, rename navigation to Products & suppliers, and reject stop submissions in the website catalog server action. The independent map remains authoritative. Existing database tables/history are preserved; this is not authorization to delete data or change the map service. This supersedes the roadmap's stop-management UI requirement for this website; the original roadmap remains unchanged.

## 2026-09-22 - Embed the independent public tracking app

The user explicitly approved connecting only the existing public live map while keeping its app and admin independent. Embed the hosted public page with `project=sightseeing-shkodra&embed=1` on this site's `/live` route. Continue map editing/publishing in the original tracking admin. Its existing refresh behavior owns map/GPS updates; this website does not copy tracking data, run processors or merge authentication. This supersedes the deeper code/database/admin consolidation plan below. Existing experimental port code is retained as inactive development work, not the public tracking implementation. No external deployment or original-service modification is authorized. The original roadmap remains unchanged.

## 2026-09-22 - Reuse the supplied tracking app

The user requested integrating their existing van-tracking product, including admin and public pages, to avoid separate development, then supplied files from the sibling Sightseeing Shkodra Map App folder. This supersedes the no-legacy-code-import decision specifically for that tracking source. Inspect and reuse its working features within this project's public/staff experience; preserve one authoritative tracking pipeline. No permission to migrate live data, change existing services, provision credentials or cut over production is implied. The fresh-project rules continue to apply outside tracking. See TRACKING_REUSE_AUDIT.md for schema/authentication conflicts and the staged integration plan. The original roadmap remains unchanged.

## 2026-09-22 - Confirm seats now, pay at the meeting point

The user explicitly skipped Stripe and online payments, requested online van-seat reservations with payment at the meeting point, and approved implementation. This supersedes the paid-before-confirmed rule for new meeting-point reservations and Stripe Phase 5A-D. The original roadmap remains unchanged.

Confirm reservations atomically from valid holds; count confirmed items against capacity. Abandoned forms expire, but confirmed reservations retain seats until cancelled. Keep payment separately due until authorized staff record full collection. Preserve tenant/session security, locking, idempotency, audit history and historical online-payment primitives. No automatic emails/WhatsApp, no external deployment; local/development only.


## 2026-09-22 - Replacement logo artwork

The user's newly supplied `SIGHTSEEING SHKODRA LOGO 2 VERSIONET 2 (3).svg` supersedes the earlier `(2).svg` for app logos. Both public web variants are replaced from this source and served on localhost only, as explicitly requested. The earlier source remains archived; [the brand registry](brand/README.md) identifies the current artwork and its hash.

## 2026-09-22 - Logo integration on local server

The user requested updating and publishing the supplied logo, then clarified: "no no just publish in the local server". Use derived web SVG versions in the public header and footer, preserving the original artwork. This authorizes the local branding update only; no hosting deployment or existing-site change is requested. See [brand asset registry](brand/README.md).

## 2026-09-22 - User-supplied logo versions

The user explicitly requested recording the supplied `SIGHTSEEING SHKODRA LOGO 2 VERSIONET 2 (2).svg` as Sightseeing Shkodra logo versions. The unchanged original and provenance are retained in [the brand asset registry](brand/README.md). Use this artwork as the logo reference for future integration. This authorizes retaining the supplied brand asset within the fresh project; it does not change the roadmap phase or authorize legacy-site imports. App logo replacement is not part of this recording task.

## 2026-09-22 - Website reference; business details entered later

The user supplied https://sightseeingshkodra.com/ for reference and said they will enter details such as prices manually later. Reading the public site for context is authorized. This does not authorize importing legacy code, copying operational data into the new database, or changing the old service. Phase 4A connects the homepage to published structured data while leaving the owner's empty catalog unpublished. The reference site's age-based pricing is not adopted automatically: the existing V1 domain supports one per-guest rate; age bands require a separately scoped extension. The retained roadmap is unchanged.

## 2026-09-17 — Fresh project without legacy imports

User instruction: "skip this and set up as a new project without importing anything from the old website".

Build a new application from scratch. Legacy website content, indexed URL exports, ticketing migration, tracking-code reuse and existing database imports are not prerequisites. The Phase 0 legacy inventory and Phase 0.5 legacy audit are skipped by this decision, not marked passed. No existing service is to be modified or retired.

The V4 Next.js/TypeScript, Supabase, Vercel, modular-monolith, shared booking-domain, security, payment and design requirements remain the baseline. Phase 1A establishes the local foundation. New cloud accounts and project credentials can be supplied when their phases require them.

Future tracking will be a new implementation with one position data source, rather than reuse of unavailable legacy code. Legacy migration/redirect work in Phase 7 is not applicable unless the user later requests replacing an existing domain/site. Deployment and launch verification still apply.

This amendment overrides conflicting legacy-reuse and import requirements in the retained V4 text. The original DOCX is unchanged.

## 2026-09-22 - Local notification testing first

The user requested building and testing locally before setting up WhatsApp or email providers. Phase 5E is limited to a local queue, provider ports, message preview and simulated tests. No messages, hosted migration or scheduler activation in this phase. Live delivery remains pending; original roadmap unchanged.

## 2026-09-24 - Persistent booking QR amendment
User requested one opaque cryptographic QR credential per confirmed booking, persisted atomically with confirmation, dynamic rendering, safe existing-booking backfill, admin visibility and atomic staff check-in foundations. Existing references and capacity rules remain authoritative; camera scanner UI is deferred. Implemented and development migration applied; see BOOKING-QR-PASSES.md.

## 2026-09-24 - Homepage simplification
User requested removing only the homepage booking selector, dashed route/map information box and Four reasons to linger showcase. Preserve shared features/content/data. Dedicated booking CTAs and tracking access remain; shared destination fields move to a separate editor area, with historical schema intact. See HOMEPAGE-SIMPLIFICATION.md.

## 2026-09-24 - Manual guest reviews
User requested curated genuine reviews entered manually, no Google API, no invented reviews or aggregate Google score. Extend existing reviews table, retain source attribution, provide dedicated Reviews admin with homepage settings, hide the public section until published content exists, and preserve a future provider-adapter path. See MANUAL-GUEST-REVIEWS.md.

## 2026-09-24 - Public/admin CMS reconciliation amendment
Architecture mapped before changes. Extend the existing structured content record for page introductions; reuse shared destinations, reviews, operational price/schedules and the independent map. Add product inclusions without parallel tables. Group global editing once and limit guide editing to actual routes. Preserve historical data/media. Permanent rule: one content entity, one authoritative source, zero or one logical editor, many consumers. See CMS-RECONCILIATION.md for matrix, evidence and remaining publication/companion decisions.

## 2026-09-24 - Homepage Hero V2
User requests full-screen homepage hero, transparent-to-solid sticky header, route-aware active navigation and freely managed marketing amenities. Extend the existing structured CMS, retain separate desktop/mobile images with focal controls, and use validated serialized amenity items in the same draft/publication lifecycle. Amenities do not become operational truth. No unverified example claims are published. Existing primary/yellow tokens and approved logos remain. See HOMEPAGE-HERO-V2.md.


## 2026-09-25 - Resend booking email amendment
User explicitly requested Resend customer and owner notifications for confirmed creation, supported modifications and cancellation, with safe testing and manual confirmation resend. Use existing transactional domain events and delivery queue, plus narrow outbox-only modification capture; no online payments or parallel booking architecture. This supersedes the earlier provider-unconfigured confirmation stage for email only; WhatsApp delivery remains inactive. Production delivery is not enabled. See BOOKING-EMAILS.md.

## 2026-09-25 - Dynamic destinations and Calendar & Pricing
The two user briefs supersede the fixed destination form and Products-owned per-guest pricing. Editorial destinations are individually managed content_pages records with separate draft/publication snapshots and preserved URL aliases. Operational stops remain in the independent map; destinations may reference their stable objectId via a read-only published-stop selector. No GPS/ETA code or map data is migrated.

Calendar & Pricing owns schedules, inventory policy, passenger categories and pricing. Reuse service_schedules, schedule_exceptions and dated departures; extend them with range/day/departure rules. All physical passengers use seats. Default age bands are authoritative SQL configuration, with owner-editable contiguous ranges. Existing per-guest prices remain Adult prices; Child/Infant require manual setup, including explicit zero. Holds and booking items snapshot the effective category prices. No in-place passenger modification endpoint previously existed; immutable allocations require cancellation and rebooking. Payments remain at the meeting point. Development only. See DESTINATIONS-CALENDAR.md.

## 2026-09-25 - Customer booking management and inventory amendment
User explicitly changes seat consumption: adults and children occupy one seat, infants zero; total passengers remains separate. Booking completion, customer modification and customer cancellation close at departure minus 15 minutes in Europe/Tirane, equality closed. Existing explicit admin departure capacity remains authoritative under the brief's exception; normal van capacity is eight. Customer self-service may atomically change unpaid meeting-point bookings before cutoff; paid/check-in cases require staff. This supersedes prior all-passengers-use-seats and cancel/rebook-only decisions. Local implementation and tests only; no production migration or deployment.

## 2026-09-29 - Hero fare date context
The user explicitly selected the next bookable service date, with its date shown, when today's departures are unavailable. Reuse canonical one-Adult availability and the existing next-operational-date helper; no independent homepage price or new pricing engine. See HERO-CTA-PRICE-NAVIGATION.md.

## 2026-09-29 - Shared CMS section visibility

The user explicitly requires every public occurrence of the same CMS section to respect its Admin disabled state. Existing persisted *.showOnHomepage keys remain for compatibility; Route, Live promotion, Departures, Reviews and Final invitation now use those same flags across their shared consumers. Admin labels disclose the expanded scope. Independent operational maps/booking and destination listing/guide flags remain distinct. No new schema or visibility fields. See CMS-VISIBILITY-AUDIT.md.

## 30 September 2026 - Unified route presentation (user amendment)
The user's Route + Live Map brief authorizes /route as the canonical combined public consumer and a permanent /live redirect. Reuse the independent iframe; expose resolved operational state through a small additive presentation message bridge, never a second GPS/ETA engine. Booking/service and CMS retain their existing ownership. This supersedes the earlier separate public route/live presentation, not the independent tracking architecture. Implementation and acceptance limits are recorded in LIVE_MAP_EMBED.md. No deployment authorized or performed in this task.

## 5 October 2026 - Admin operational notifications (user amendment)

The user's Admin Notification Center + Mobile Push brief authorizes an integrated
personal inbox and multi-device Web Push for existing operational events. Reuse
`domain_events`; do not create another booking event source or replace Resend.
Notification projection and delivery run asynchronously, outside booking
transactions. Active owner/admin/operations receive personal receipts; device
credentials remain server-only. Use one admin-scoped service worker without
offline booking caching and explicit permission enablement. No hosted deployment
or push enablement was requested by this implementation brief. Architecture,
configuration and acceptance limits are recorded in ADMIN-NOTIFICATIONS-REPORT.md.


## 5 October 2026 ? Permanent Vercel hosting amendment

User explicitly designated Vercel as the permanent main Next.js host, main as production branch and sightseeingshkodra.app as production domain. Supabase and Resend retain their existing responsibilities. Netlify is legacy and may not receive new main-app functionality. Retain the separate sightseeingshkodralivetrackingapp.netlify.app map and legacy fallback until hosted parity. This amends hosting assumptions without rewriting Roadmap V4 or business rules. User selected Hobby with background delivery disabled; no upgrade or active cron is authorized. See [DEPLOYMENT.md](../DEPLOYMENT.md).

## 5 October 2026 — Transactional email completion scope

The user requested completing the existing Resend booking-email system, then explicitly selected “Complete implementation; keep live delivery disabled.” Extend the existing event/recipient queue, preserve the canonical booking QR and versioned in-flight retries, and test against isolated data/fake provider responses. This does not authorize live email, scheduler activation, deployment or hosted migrations. Vercel Hobby communications pause remains in force. See BOOKING-EMAILS.md.

## 8 October 2026 — Local Mac stabilization approval

The owner approved stage A: preserve/finalize compatible local dependency patches, configure this clone's Git credential helper, guard hosted development scripts against production and update development/deployment guidance. No commit, push, deployment, cloud settings, migration, resource creation or cleanup is authorized. Production scheduler/delivery observed active on 8 October differs from the 5 October disabled decision; this entry records evidence and preservation, not retroactive activation authorization. See DEPLOYMENT.md and DEVELOPMENT.md. Roadmap and booking architecture unchanged.

## 8 October 2026 — Existing backend only and approved Auth correction

Owner explicitly declined creation/duplication of a Supabase backend and identified ybngoppqqiohcduojfyg as the existing database. Keep that production project; do not bind it to Preview or use hosted development mutation scripts against it. Isolated provisioning proposal remains unapproved; disposable local automated tests and read-only production checks remain available. Owner separately approved setting production Auth Site URL to https://sightseeingshkodra.app and adding https://sightseeingshkodra.app/auth/activate while retaining existing redirects. Those settings were saved and verified after reload. No email, migration, resource creation, commit, push or deployment was authorized by this decision.


## 8 October 2026 - Readiness release preparation (unpublished)

User authorized local safety/documentation review and CI/reconciliation/acceptance proposals only. Fresh 44-migration evidence supersedes historical email-function drift: final structure matches; seven missing history entries and eleven trigger grants need separate decisions. Published source remains 18c48d0; same-source approved credential rotation already completed. New CI draft, review packet and bounded acceptance/reconciliation procedures are local only. No commit, push, deployment, cloud configuration, migration or production data change in this preparation. Original historical entries and mixed-encoding bytes preserved.
