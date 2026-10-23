# Public website and admin CMS integration audit

15 October 2026, Europe/Tirane. **Read-only audit and planning.** No application code, production records, migrations, RLS, deployment, tracking, booking logic or infrastructure were changed. Only the requested reports and local audit artifacts were created. Prior deployment authorization does not apply to implementation of these recommendations.

## Executive summary

| Measure | Result |
|---|---:|
| Concrete public page URLs audited | **14** |
| Public page patterns | **11**, including one dynamic destination pattern expanded to four current guides |
| Additional redirect endpoints | **2** (`/live`, `/tour`) |
| Admin modules inspected as owner | **9** |
| Meaningful matrix rows / field definitions | **259** |
| Admin-editable or hybrid business fields | **218** |
| Fully connected business fields, by complete source trace | **203** |
| Partially connected business fields | **6** |
| Disconnected business fields | **9** |
| Appropriately code-controlled elements | **41** |
| Defective/misleading active admin controls | **10**, including one action rather than a content field |
| Unnecessarily duplicated configuration families | **1** (navigation); zero confirmed competing live operational authorities |
| Confirmed P0 critical findings | **0** within inspected scope |
| P1 high-priority finding groups | **2** (Hero CTA label, obsolete catalog presentation controls) |
| Structural CMS coverage | **203 / 218 = 93.1%** |

Coverage excludes all 41 code-controlled rows. Partial fields do not receive half-credit. It counts complete traced connections, **not** successful live field edits. Matrix Working status is separately **59 Verified, 10 Broken, 190 Untested**: Verified names the stated isolated test/read-only observation; it is not a claim that every field passed a live UI save. Broken includes nine disconnected fields and the conditional zero-price teaser. The tenth defective admin *control* is destination Move later, which is an action outside the content-field count. No critical price/security failure was demonstrated on production; the zero-price display case is conditional.

Recommended first package: connect existing `hero.book`; retire three unused controls and amenity Description; align destination move-button permissions; fill the Partners Overview description. Resolve catalog SEO ownership separately before changing publication validation. Wait for explicit implementation approval.

## Baseline and evidence standard

Production is the published PR #18 tree: main `2714ea9d5ca8a9bd1a3a8ca4222cdbf7cee198cd`, feature source `2dba62a`; the release checkout at `/private/tmp/shkodra-partners-release-20261015` has the same application content. The IDE workspace is dirty and contains prior already-published work; an ordinary HEAD diff is not a new-change manifest. Roadmap V4 and recorded amendments were consulted. Architecture remains Next.js App Router/Vercel + Supabase, with external operational map administration deliberately separate.

Evidence labels used by all reports:

- **L1:** fresh browser inventory of all 14 pages plus redirects. `/private/tmp/cms-audit-20261015/public.json`; copied to `private/cms-audit-20261015/public.json`. Captures headings, semantic sections, image URLs/alts, links, canonical and robots metadata without customer bookings.
- **L2:** fresh authenticated read-only inventory of all nine admin modules. `private/cms-audit-20261015/admin-modules.json`; field names/headings/form counts only, not customer/contact values. Expanded existing Website Hero and shared action-label forms without editing. Current shared labels UI still exposes `labels.ticket` and `labels.faq`.
- **L3:** production **SELECT-only** policy/bucket metadata query. `private/cms-audit-20261015/security-dom.txt`. No mutation, transaction command, migration or schema change was executed for this audit.
- **R1:** local isolated component-marker reproduction: `private/cms-audit-20261015/reproduce-disconnections.mjs` and `disconnections.txt`. Positive product/amenity titles render while four exposed Website markers, amenity description and catalog presentation markers do not. No public data was replaced.
- **R2:** legacy field-proof initialization reproduction: `private/cms-audit-20261015/proof-role-check.mjs/.txt`; content_editor initialization is rejected in disposable PGlite, confirming old harness incompatibility.
- **T1:** fresh unchanged-source regression run in the credential-free release checkout: **240 component/identity/database +143 integration tests =383 passing**. Logs `/private/tmp/cms-audit-20261015/regression.log`, `integration.log`. These exercise real migrations in disposable local databases and mocked transports, never hosted writes. Prior release's 24 real Postgres concurrency checks/407-test result are historical supporting evidence, not a new audit run.
- **U1:** live Website list at 320/375/768/1440px and focused Hero form at 375px: no page overflow, clipped input or visible sampled button below 40px high. `private/cms-audit-20261015/mobile.json`. Physical devices and a full keyboard/screen-reader audit were not available.

The old `docs/CMS-FIELD-PROOF.json`/134-field result is historical. The current website schema has **210 retained keys**, **129 active structured controls**, and 81 compatibility/hidden keys. Collection subfields and canonical entity fields are expanded in the new matrix. The old `websiteEditorGroups.destinations` schema array is not the rendered owner UI: WebsiteWorkspace delegates to the separate canonical Destinations manager. This prevents falsely counting its legacy `place.*` values as a second active editor.

## Public route inventory

| URL / pattern | Actual behavior and visible areas | Main data/consumer |
|---|---|---|
| `/` | Transparent/sticky header, responsive hero, ticket widget, photographic stops, live service/schedule, optional notebook, reviews, optional final invitation, optional Partners, shared footer/WhatsApp. Duplicate ticket promotion is absent | HomepageView, HomepageHero, website publication, product quote, canonical destinations, external stop projection, reviews, Partners |
| `/book` | Editable introduction; shared date/passengers/departure/checkout flow and meeting point | PageIntro + BookingFlow; canonical availability API |
| `/route` | Editable introduction, one independent map, optional stop timeline and timetable; core map remains available | RouteJourney, DayPlannerData, external map bridge |
| `/explore` | Introduction and published destination articles/photos; guide and booking actions | ExploreView, canonical destination records filtered showOnPage |
| `/explore/[slug]` → lake, castle, centre, bridge | Four published guide titles, story, image, optional address/Maps, breadcrumb and route CTA; aliases redirect to canonical slug | GuideView + getPublicDestinations, guide SEO |
| `/faq` | Editable title, ordered active questions; text answers or authoritative product inclusions | FaqPage, websiteFaq, getFaqInclusions |
| `/privacy-policy` | Fixed document identity and editable publication/text; current unpublished notice is not proof of approved legal content | LegalPage; owner-only global settings |
| `/terms-and-conditions` | Same legal publication behavior | LegalPage |
| `/your-day` | Editable introduction plus explicitly illustrative ticket/QR/status and optional editorial journey; never an issued ticket | Sample page + shared destinations/map |
| `/credits` | Static licensed photography provenance; no endorsement implied | credits.json and Credits page |
| `/booking/manage` | Private customer lookup, then authorized management if a valid credential is supplied; only initial uncredentialed screen inspected | CustomerBooking, booking-management route; noindex/no-referrer |
| `/live` | Redirect to `/route` (framework permanent 308) | live/page.tsx |
| `/tour` | Exact 301 to `/route`; no separate Tour page/editor | tour/route.ts |

Fourteen concrete pages = home, book, route, Explore listing, four guides, FAQ, two legal pages, sample companion, credits, management. Auth routes, admin/private previews, eleven discovered `/dev/*` page fixtures, API handlers, robots/sitemap and manifests are technical/private boundaries, not added public-content pages. Public API families include availability, checkout, day-planner and booking-management; internal email/notification workers and authenticated notification API remain protected. No checkout/worker requests were submitted in the browser audit.

## Complete source-to-public flows

### S1 — Structured Website document

WebsiteSectionEditor → editable section allowlist → `validateWebsiteContent` → `saveWebsiteSection` → authenticated `withOperatorService` → `save_website_content_v1` with expected timestamp → `content_pages.body` draft / `published_body` public snapshot → layout `revalidatePath` → `getWebsitePublication`/`getPublishedWebsite` → actual public components and metadata. Reads are no-store with request-local memoization; failed publication returns unavailable/hidden optional sections, not fabricated prices. Publication applies the selected form plus all saved Website drafts. Owner-only footer/contact/legal changes are guarded in both action and SQL. Current production draft/public documents pass SQL validation.

Hero desktop/mobile photographs, copy, subtitle, About text, alt, amenities, tracking/discovery labels and visibility are connected. `hero.book` is the exception. Empty custom amenities use documented service defaults; a nonempty list with every item unpublished remains empty. There is no separate mobile content configuration. Wide-screen focal transformation is deliberate but semantically partial.

Website `intro.*` and Tour-related keys are retained, not editable consumers. Removed promotion cannot return through a stale true visibility flag. Section visibility is consumer-specific: route/departure flags affect their optional presentations, not the operational map. Header design, breakpoint behavior and colors are code.

### S2 — Canonical destinations and operational stops

DestinationsEditor → `validateDestination`/`saveDestination` → role/stamp/URL/association checks → `save_destination_v1` → versioned destination `body`/`published_body`, status, aliases/order → layout revalidation → no-store `getPublicDestinations` → Homepage/Explore/Guide/Route. Published guides use canonical slug aliases; draft text does not automatically publish. Publication derives guidePublished; there is not a missing second toggle. Listing flags are not equivalent to unpublishing a direct guide URL.

`getDestinationStops` separately reads the public external map's published version. `sightseeingStops` requires exactly one stopId match for editorial name/photo/link enrichment; stop count/operational sequence comes from the map. A stop's CMS display order cannot reorder GPS stops. No website stop/GPS editor should be added. The first stop's missing photo is a content/association follow-up, not evidence of a broken image uploader.

### S3/S4 — Reviews and Partners

ReviewEditor/PartnerEditor → existing publish permission and server validators → operator-scoped rows + optimistic update/delete → layout revalidation → no-store public selectors → GuestReviews/PartnersSection. Reviews filter published/not-deleted and featured/order/limit; language sets the card lang attribute. Partner public rows require active/logo, with deterministic order and secure links. Hosted Partners count is zero; absence of the public section is correct. Public CRUD tests use disposable records only.

`review_settings.google_reviews_url` has one logical editor in Global Footer and two consumers (Footer/Reviews). Leave-review URL and review limit remain in Reviews settings, owner-only. Partners live saves do not create Website drafts; this is explained but could be clearer.

### S5/S6 — Catalog, calendar and booking

Product title/status reach the ticket and sale eligibility; canonical inclusions feed FAQ. Four catalog presentation fields remain orphaned after earlier public sections were retired. Website owns current Book SEO. Supplier records are internal catalog relationships, not public partner logos.

ScheduleEditor/OperationsCalendar/StandardPricing → existing schedule/pricing actions and permission checks → SQL schedule/override/pricing functions → service_schedules, exceptions/ranges and dated inventory → shared availability/passenger quoting → date/passenger/departure fields, price breakdown and timetable. Operator/product bindings are server-configured, not accepted from arbitrary public query fields. Schedules and confirmed prices are distinct; existing reservations retain snapshots. Calendar save primarily invalidates admin, but public reads are no-store and polling refreshes schedule/availability; this is not evidence of a permanent stale-cache defect. An already-open client need not update instantly.

Booking confirmation, holds/capacity, cutoff/eligibility, QR/idempotency, pay-at-meeting-point rules and historical status remain protected domain behavior. No confirmed wrong charge or oversell was observed; a conditional €0 teaser issue is reported separately from booking totals.

### S7/S8/S9 — Meeting point, map and protected technical surfaces

Owner meeting-point form → URL/stop/effective-time validation → versioned RPC/table → current presentation and immutable confirmation snapshot. Effective UTC input is explicit; ordinary text edits must not rewrite historic ticket details. Fallback meeting-point data is historical compatibility, not another normal owner settings system.

Independent map origin/project/frame URL, postMessage origin+source validation, staleness expiry and payload validation stay code-controlled. ETA/GPS accuracy and external admin save propagation were not tested or changed.

Canonical/robots/indexing depend on validated deployment origin and environment gate; sitemap depends on publication rather than availability. Logo assets/design tokens, security messages, app routes, sample-ticket disclaimers and image licensing should remain in code. EN is honestly English-only; there are no partially implemented translations to count as missing fields.

## Admin inventory: fields, storage, security and propagation

The matrix enumerates public business fields individually. This table includes internal/non-public modules without inflating public CMS coverage.

| Module | Editable fields / saved values and actions | Store / validation / permission | Public consumer and refresh | Mobile / evidence |
|---|---|---|---|---|
| Overview | No business settings; role-derived quick links and local date | Navigation policy; verified staff session | None; operational entry points | L2 loads; Partners blank quick-action description F12 |
| Website content | 129 active structured controls across Homepage/Public pages/Global, including two JSON collections; drafts, publication, visibility, private preview | content_pages; exact allowlist, field kinds/lengths/URL/image/FAQ/amenity validation; content.draft vs content.publish; owner-only sensitive keys; stale-stamp guard | website-server public snapshot + shared pages; layout invalidation, no-store reads; cross-page use traced | U1 list and Hero form pass sampled widths; real save/upload not performed |
| Website → Destinations | Name/slug/tag/text/detail/story/image/alt/SEO/social/location/Maps/stop association, listing flags, order, draft/publish/unpublish/archive; old coordinates retained without controls | content_pages destination_v1; published description/image/alt/SEO required, HTTPS Maps restrictions, alias uniqueness and stop binding; draft editors / publisher operations; SQL role/stamp guards | All destination consumers share published records; layout invalidation/no-store | L2 mounted manager/source trace; Move later permission mismatch F06 |
| Partners | Name/logo/HTTPS website/description/order/active; confirmed deletion; immediate active-row save | partners; name160, description300, order0–100000, active logo, safe operator media; content.publish owner/admin, read-only content_editor | Homepage Partners only when section enabled and active records exist; layout invalidation/no-store | Fresh L2 empty manager; prior release320px form proof; no invented record/upload |
| Guest Reviews | Author/rating/body/source/date/original link/avatar/language/featured/order/published; soft deletion. Owner settings: limit3–6, Google Reviews and leave-review URLs | reviews/review_settings; rating1–5, original HTTPS/source validation, ISO language/date, image allowlist, stale guard; publish owner/admin, sensitive settings owner | Homepage review rail and shared footer Google link; layout invalidation/no-store | L2 forms load; CRUD/query behavior T1; delete confirmation optional UX follow-up |
| Products & suppliers | Product name, publication, inclusions, SEO/description/image/alt, supplier; create/archive/delete confirmation. Product slug/type protected for existing binding. Supplier name/type | products/suppliers; save_catalog_v1, publication validation, referential integrity; catalog.manage owner/admin | Product title/status/inclusions used; four presentation fields disconnected F04. Catalog revalidates admin, public readers no-store | L2 forms; catalog stale-edit protection weaker than stamped Website forms |
| Calendar & Pricing | Operating period/weekdays/times/capacity/vehicle/status; date/range closure/time/seat/price overrides; categories/age limits/unit prices; offer name/label/type/value/time filter. Owner meeting-point versions | service_schedules/schedule_exceptions/calendar_ranges, departures, products.pricing_rules; schedule/manage vs pricing guards; SQL capacity/commercial safeguards; no decrease below protected bookings | Shared availability and day-planner; no copied public rates. Client polling/no-store and layout invalidation for category changes | L2 80 named inputs across rendered/hidden forms; not all expanded at narrow width; T1 covers relevant rules |
| Bookings | Date/search/status filters; staff creation, guest/category/departure modifications, cancellation/check-in, meeting-point payment collection; public customer management is separately verified | bookings/orders/items/customers/payments and immutable events; bookings.read/create/cancel/payments.collect; operator-bound RPC transactions/idempotency | Customer private booking/receipt/QR and availability; updates through existing APIs/refresh | L2 read-only page only; no customer records copied to reports, no mutation/lookup credentials supplied |
| Notifications | Read state/filter preferences, push device opt-in/out and operational links | admin_notifications/receipts/preferences/subscriptions/deliveries; authenticated booking-read/own-user boundaries | Admin only; no public CMS source | L2 loaded; no mark-read/enable-push action clicked |
| Email & Notifications | Status/recipient filters, template previews, configured test/resend controls; provider/sender/activation values are read-only server configuration | Notification/event/delivery stores; integrations.manage owner; controlled recipient, resend confirmations/idempotency, server-held credentials | Customer/owner confirmation messages, not editable website prose | L2 loaded without sending/resending or copying customer delivery details |

No generic public Media Library, Languages, Staff Management, Settings or Integrations editor route was discovered. Uploads are embedded existing ImageField controls. Their absence is not automatically a missing CMS requirement. Email/provider/security settings deliberately stay outside ordinary content controls.

## Hardcoding classification

**Admin (A):** editorial copy/photos, alt text, FAQ, approved legal content, social/WhatsApp details, review and Partner identities, publication/listing switches and page SEO. Defaults are seed/read-time compatibility, not a competing live source. The active editor should not promise fields without actual consumers.

**Hybrid (C):** prices, offers, season/times/capacity, passenger ages, meeting-point versions, operational stop publication and editorial stop associations. Business values are editable only by suitable roles; validation/calculations, historical booking snapshots, route/GPS ownership and link/media safety stay protected.

**Code (B):** architecture/App Router, CSS/breakpoints/header transparency, approved logo identity, technical routes/APIs, authentication/RLS/schema, GPS/ETA/stop algorithms, transactional booking rules and receipt/QR generation, environment indexing/security, UI error/control vocabulary and licensed attribution provenance. The 41 coherent rows include stable legal/Staff Login identities; no admin toggle is recommended for arbitrary auth paths or algorithms.

Marketing descriptions are not a second operational guarantee: editing a feature label cannot alter Wi-Fi service, audio languages, van capacity or reboarding entitlements. Current “Daily Ticket” wording does not change the approved per-departure reservation model. No pricing/booking policy amendment is inferred from this audit.

## Security findings and limits

Hosted SELECT metadata confirms RLS enabled for content_pages, partners, reviews, review_settings, products, service_schedules, schedule_exceptions, meeting_point_versions and staff_profiles. All nine inspected tables lack anon/authenticated INSERT/UPDATE/DELETE grants. Partners alone has anon SELECT and an active+logo policy; inactive rows are staff/operator-scoped. Content/review reads are staff-role scoped; public projections use server-held credentials and explicit operator/publication filters. Browser forms do not receive service keys.

The website-media bucket is public by design, raster-only (JPEG/PNG/WebP/AVIF), 8MiB storage limit; no storage.objects policies are present, so browsers do not gain direct object write access. Existing server action authenticates content.draft before upload and accepts <=4MiB after browser preparation (8MiB original nonhero cap). It checks byte signatures and unique operator paths; SVG/HTML are rejected. Transparent PNG/WebP paths are preserved. Server magic-byte checks are not claimed to be a full image-decoder/fuzz audit. Never put private documents in this public bucket.

React escapes ordinary text and legal documents; no raw CMS HTML renderer was found in the inspected public path. JSON-LD escapes `<`. External links use HTTPS validators; Partners/Reviews/socials open with noreferrer/noopener, and trusted map bridge checks origin, frame source and payload shape. Authorization is repeated per action, not only menu filtering; SQL guards protect publication and commercial changes. Only owner UI was inspected live; non-owner/unauthenticated mutation behavior is covered by isolated tests and source, not impersonated production sessions. This is not a full endpoint penetration test, and not a review of external map administration or provider credentials.

## What was and was not verified end to end

- Existing tests exercise draft/public separation, role rejection, SQL validation, status/order/visibility, canonical destinations, FAQ, Reviews, Partners, prices and domain behavior. R1 independently proves disconnected renders rather than assuming a stored field works.
- Live pages and owner forms were read; current server content is observed across source-equivalent deployed builds. **No changed production marker was saved**, no hosted logo uploaded, no partner/review/destination/order created, no email/push sent and no booking submitted. A live field’s save→database→public refresh→redeploy was therefore not certified by browser observation.
- Public queries are persistent database-backed/no-store; layout invalidation and polling support updates without deployment. Persistence/refresh expectations are traced and locally tested, but no cache defect was inferred simply because a source exists. Concurrent save, provider outage and role flows need isolated browser acceptance for full certification.
- Empty/disabled content is conditional, not disconnected by default. Current Partners is empty; final invitation/notebook are configured hidden; four guides are published; legal bodies currently unpublished. Those states do not justify inventing public content.
- All visible public regions/routes were inventoried. Existing footer/booking/hero functionality and nine-URL sitemap were verified in the preceding release; fresh audit browser route inventory does not claim a new HTTP status/link-crawl, physical device run or reservation transaction. Initial admin reads raced rendering; only the subsequent heading-waited nine-module inventory is used as L2 evidence.

## Deliverables and next decision

- [Detailed field matrix](PUBLIC-ADMIN-MAPPING-MATRIX.md)
- [Gaps and broken connections](CMS-GAPS-AND-BROKEN-CONNECTIONS.md)
- [Prioritized implementation roadmap](CMS-IMPROVEMENT-ROADMAP.md)
- [Admin UX recommendations](ADMIN-UX-RECOMMENDATIONS.md)

These reports recommend small changes to current owners and consumers. They do not authorize implementation, production publication, schema/RLS changes or external map work. The owner can approve the first small package separately; catalog ownership and any price-display semantics should be reviewed explicitly before changing their behavior.

Final source cross-check: all `src/` and migration files match the published release checkout byte-for-byte. One pre-existing workspace-only test difference, `tests/integrations/sitemap.test.mjs`, was preserved; fresh T1 was run against the isolated published checkout. See `private/cms-audit-20261015/source-comparison.json`. No audit recommendation was implemented.
