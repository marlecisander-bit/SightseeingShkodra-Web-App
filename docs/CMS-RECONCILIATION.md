# Public website / admin CMS reconciliation - 2026-09-24

Architecture was inventoried before database changes: see CMS-RECONCILIATION-BASELINE.md. Automated route/field/media inventory: CMS-ROUTE-INVENTORY.json. Field proof: CMS-FIELD-PROOF.json.

## Final ownership matrix

Each row groups fields with the same owner; the JSON inventory enumerates individual fields. W = existing structured `content_pages` record `website-homepage`, draft `body` / published `published_body`. No parallel CMS table was created.

| Public page/section | Component | Authoritative source | Editable / admin owner | Shared | Duplicate | Status |
|---|---|---|---|---|---|---|
| All pages: header desktop/mobile navigation and CTA labels | Header | W nav.* | Website > Global > Navigation | Yes | No | CONNECTED |
| All pages: footer text/links/location/language/contact note | Footer | W footer.* | Website > Global > Footer | Yes | No | CONNECTED |
| Home metadata/social image | websiteMetadata | W seo.* | Website > Global > SEO | Yes | No | CONNECTED |
| All pages: brand name/approved logos | BrandLogo / metadata | approved SVG asset registry | Code owner | Yes | No | HARDCODED-INTENTIONAL |
| Home hero | HomepageView | W hero.* | Website > Homepage > Hero | No | No | CONNECTED |
| Home introduction | HomepageView | W intro.* | Website > Homepage > Introduction | No | No | CONNECTED |
| Home route heading and destination preview | HomepageView / RoutePreview | W route.* / place.* | Homepage > Route presentation; Destinations > respective place | Yes | No | CONNECTED |
| Home live pitch; Live page hero; Tour live pitch | HomepageView / LiveView / TourView | W live.* | Homepage > Live presentation | Yes | No | CONNECTED |
| Tour how-it-works presentation (removed from homepage) | TourView | W how.* | Public pages > Tour ? How it works | No | No | CONNECTED |
| Home/Tour timetable introduction | HomepageView / TourView | W departures.* | Homepage > Departures presentation | Yes | No | CONNECTED |
| Home/Tour price and actual departures | booking/public snapshot | products.pricing_rules + availability domain | Products / Departures | Yes | No | FUNCTIONAL |
| Home/Tour review introduction | GuestReviews | W reviews.* | Homepage > Guest Reviews (copy only) | Yes | No | CONNECTED |
| Home/Tour review cards, ordering, visibility and Google destination | GuestReviews | reviews / review_settings | Guest Reviews | Yes | No | CONNECTED |
| Home notebook presentation | HomepageView | W notebook.* | Homepage > Local notebook | No | No | CONNECTED |
| Home final CTA/image | HomepageView | W final.* | Homepage > Final invitation | No | No | CONNECTED |
| Book heading | PageIntro | W bookPage.* | Website > Public pages > Booking | No | No | CONNECTED |
| Booking selectors, holds, checkout, confirmation, QR | BookingFlow / BookingPass | booking domain, orders/bookings | Products / Departures / Bookings | Yes | No | FUNCTIONAL |
| Tour title, summary, inclusions, image and SEO | TourView / route metadata | products title/meta_description/inclusions/og fields | Products | Yes | No | CONNECTED |
| Tour eyebrow, inclusion/FAQ headings/questions | TourView | W tourPage.* | Website > Public pages > Tour | No | No | CONNECTED |
| Tour FAQ answers: booking/boarding/tracking mechanics | TourView | application contracts; fee answer uses product inclusions | Code owner / Products for inclusions | Yes | No | HARDCODED-INTENTIONAL |
| Tour destination presentation | RoutePreview | W route.* / place.* | Homepage > Route presentation / Destinations | Yes | No | CONNECTED |
| Home/Tour/Live/Your-day embedded map | LiveMapEmbed | independent live-map app | Independent map admin; deployment URL binding | Yes | No | FUNCTIONAL |
| Operational stop names, ordering, coordinates, GPS, ETA | external map frame | independent live-map app | Independent map admin | Yes | No | FUNCTIONAL |
| Live destination preview | RoutePreview | W route.* / place.* | Homepage > Route presentation / Destinations | Yes | No | CONNECTED |
| Explore introduction | ExploreView | W explorePage.* | Website > Public pages > Explore | No | No | CONNECTED |
| Explore four destination cards | ExploreView | W place.* | Website > Destinations | Yes | No | CONNECTED |
| Guide article title/body/SEO/social image | GuideView / metadata | content_pages explore-centre/castle/lake/bridge | Website > Explore guide articles | No (long article differs from short entity description) | No | CONNECTED |
| Guide hero image/alt/tag | GuideView | W place.* | Website > Destinations | Yes | No | CONNECTED |
| Your-day introduction and destination presentation | PageIntro / RoutePreview | W dayPage.* / route.* / place.* | Public pages > Travel companion / shared destination editors | Yes | No | CONNECTED |
| Your-day explicit sample ticket, sample QR and warning | YourDay | demonstration code | Code owner; never a real booking pass | No | No | HARDCODED-INTENTIONAL |
| Credits attribution/license text | Credits | asset provenance manifest | Code owner; attribution integrity | Yes | No | HARDCODED-INTENTIONAL |
| Auth screens/errors/form validation | identity components | identity domain | Staff identity/security | Yes | No | FUNCTIONAL |
| Removed homepage showcase/review-second-line fields | no active editor | three retained historical W keys | No editor | No | Historical only | ORPHANED |
| Old homepage-hero/intro/final slots; unsupported page slugs | no current renderer | historical content_pages | No editor | No | Historical only | ORPHANED |
| Internal stops / PublishedStops component | no active public consumer | retained database/history and compatibility DTO | No local stop editor | No | Inactive legacy model | ORPHANED |

Route inventory: eight public patterns; `/explore/[slug]` expands to four allowed guides. There are no separate Route, Stops, Contact, About or Legal pages. Route/timetable/FAQ are anchors, not missing router files. Auth routes and technical endpoints are distinct from editorial public pages. Development preview routes are not production CMS destinations.

## A. Public sections audited

All rows above, all seven currently available concrete pages, all four publication-gated guide URLs, header/footer/mobile navigation, metadata, booking, map and technical boundaries. Every editable public section now has an identified admin owner. This ownership statement does not mean every operational field was individually clicked through in a browser.

## B. Admin editors audited

Workspace selector; Overview; Website content (Homepage, Destinations, Public pages, Global, guide articles); Products & suppliers (catalog/SEO/inclusions/pricing); Departures (service schedules/generated inventory/exceptions/capacity); Bookings (reservation operations/payment collection/QR); Guest Reviews (records/settings); saved-draft website preview. Embedded uploads are the current media interface. SEO is grouped within the owning content/product editor. No separate Media Library, Languages, Settings or Integrations editor exists. Operational map administration remains external by the user's prior decision.

## C. Missing connections found

Static destinations ignored CMS changes outside Home. Book, Explore, Live and Your-day introductions had no editorial owner. Tour inclusions and presentation were static, Tour review content bypassed canonical reviews, and its booking FAQ contradicted the active booking engine. Product/guide social metadata and product SEO title were saved but unused.

## D. Connections fixed

Shared destination mapper now feeds all relevant pages. Fourteen page presentation fields extend the existing schema. Product inclusions added to the existing product. Product/guide metadata reaches public metadata. Tour uses canonical reviews and accurate pay-at-meeting-point mechanics. Actual shared page components power draft preview and field proof. Saved normal CMS changes revalidate public content without rebuilding.

## E. Duplicate editors found

The generic page editor allowed unsupported slugs, including concepts overlapping the structured homepage. It now exposes only four actual guide routes. Global navigation/footer/SEO moved out of the Homepage group. There was no second functioning price or schedule editor to merge. Removed homepage controls remain hidden, not recreated.

## F. Duplicate data sources found

Runtime static destination arrays competed with saved place.* content. Internal stop projection competed with the independently owned map. Review sentinel-copy substitutions overrode saved values. Historical homepage content slots overlapped the structured homepage. Repeated image references were intentional reuse, not automatically duplicate files.

## G. Sources consolidated

Canonical W place.* for editorial destination identity; map app for operational stops; products for price/summary/inclusions; availability/service schedules for actual times/capacity; reviews for review records; W for presentation. Public snapshot no longer queries obsolete home slots or exposes internal map stops. Static entity data remains initialization defaults only. No records/media were merged or deleted.

## H. Intentional shared content preserved

The same destinations, image references, product rate, service inventory, review records, header/footer and map are reused. Destination guide article title/body is intentionally longer editorial content, distinct from short destination identity. Page CTA labels may differ by context while pointing to the same structural booking route.

## I. Intentional hardcoded elements

Layouts, responsive behavior, fixed page/anchor structure, control labels, booking and payment rules, authentication/security, validation, QR generation, GPS/ETA algorithms, safe errors/empty states, image attribution and approved brand asset identity. FAQ answers describing application mechanics remain tied to those mechanics. Default content seeds are not a second live CMS. There are no duplicated live phone/email/social configuration records to consolidate.

## J. Obsolete controls removed

Unsupported arbitrary-page publishing controls removed from the generic editor. Old homepage showcase fields remain hidden; no booking-selector or map-placeholder homepage editor restored. Stop/GPS editor remains excluded. Global fields are grouped once. Pricing/service cross-links guide editors to canonical operational modules.

## K. Orphaned data/code

Three historical structured fields retained, plus dormant PublishedStops/PublicStop compatibility and old home-slot parser/sitemap compatibility. Unsupported historical content_pages retained without publishing UI. No physical media deleted. Automated SHA-256 comparison found zero identical local image groups; remote binary duplicate detection was not completed. Reused stored URLs are references, not proof of duplicate storage objects.

## L. Remaining issues / owner decisions

- Four long-form guides are unpublished; their URLs correctly return 404. Supply/publish approved articles when ready.
- `/your-day` remains an explicitly labeled sample. Decide separately whether to replace it with a real reservation-linked companion or remove it from public routing.
- Current external map shows stale location and unavailable ETAs. Validate the van's live feed in the independent map product; no tracking logic changed here.
- Footer contact/legal copy remains an editable placeholder. Approved business/legal content is needed before launch; this audit did not invent legal pages.
- Product slug remains the existing deployment product identifier. Renaming the configured product slug requires updating the deployment binding; no new multi-product routing was introduced.
- Historical rows/components can be retired later after a retention decision. Remote physical media duplicates require a separate storage-level review before any deletion.

## Verification evidence and limits

- 134/134 editable structured CMS fields: real isolated RPC draft save, unchanged publication assertion, publish, and rendered HTML assertions using actual shared public components. See CMS-FIELD-PROOF.json and scripts/verify-cms-fields.mjs. No hosted user content was replaced by test markers.
- Database suite 101/101 plus two new reconciliation tests 2/2; integrations 42/42; PostgreSQL concurrency 20/20; identity 15/15. Coverage includes availability, booking creation/capacity, QR persistence/check-in, reviews, scope/roles and migration preservation. These are automated safe-context checks, not newly submitted customer bookings.
- Lint, typecheck and optimized production build passed. Final label-only cleanup is checked by lint/typecheck.
- HTTP: Home, Book, Tour, Live, Explore, Your-day, Credits return 200. All four unpublished guide URLs return 404 as designed. Guide published DTO/metadata projection tested in the isolated database.
- Browser: all six admin modules loaded; actual public pages loaded; product rate shown from configured product; review remains present. New CMS groups and shared destination page visually inspected. CMS and Live page checked at 375, 390, 768 and 1440px without horizontal overflow; viewport restored.
- Map frame loaded route/stop controls. Live GPS/ETA accuracy not verified because source reported stale/unavailable location. No external map code modified.
- The field-by-field proof covers structured editorial fields. Existing operational editors are covered by domain regression suites and read-only browser smoke checks, not every individual field in every browser form. Remote media binaries and physical QR scanning were not revalidated in this audit.

## Permanent rule

One piece of content -> one authoritative source -> zero or one logical admin owner -> one or many public consumers. Placement and presentation may vary; never copy an entity merely to display it on another page.

## Global footer amendment - 30 September 2026

One existing Footer continues to serve all public routes. Website Global > Footer owns four new social URLs and business/VAT/year fields in the existing website document. Google Reviews retains review_settings.google_reviews_url as its sole source, with its editing control relocated to Footer; Guest Reviews consumes that value. Privacy Policy and Terms & Conditions text/status use the existing Website document, editor, preview and publication RPC. Old footer fields remain stored but have no active editor/consumer. No second CMS or settings table introduced. See GLOBAL-FOOTER-REPORT.md for the field ownership and route addendum to the historical CMS-ROUTE-INVENTORY.json snapshot. Migration remains local and unapplied hosted.

## Tour removal amendment — 11 October 2026

The historical matrix above describes earlier implementation. `/tour` now has only a 301 redirect to `/route`; TourView and its private preview are removed. Public pages no longer includes a Tour section. Retained `tourPage.includedTitle` has one logical owner under Homepage > A day with possibilities; `tourPage.faqTitle` and `faq.items` remain owned by the dedicated FAQ editor. Legacy FAQ question fields remain migration/read fallback values. `tourPage.eyebrow`, `how.*`, `labels.tour` and historical Tour navigation values remain stored, without Tour-only controls or a public Tour consumer. Historic route/field inventory and migration files are evidence, not current navigation. Optional record/media cleanup needs a separate decision. See TOUR-REMOVAL-2026-10-11.md.

## Our Partners amendment — 15 October 2026 (local only)

Homepage → Our Partners exclusively owns the seven `partners.*` heading/visibility/optional-CTA fields in the existing website document. Dedicated `/admin/[operatorId]/partners` owns editorial partner name/logo/website/description/order/active records in new operator-scoped `public.partners`; it does not duplicate operational catalog suppliers. Public homepage and private saved-draft preview consume that collection. The section follows the final booking invitation and precedes the global footer. No independent settings or media system. See OUR-PARTNERS-IMPLEMENTATION-2026-10-15.md for the field/route addendum, prepared migration, RLS and verification limits; historical inventory JSON remains unchanged as an audit snapshot.

## Homepage ticket promotion removal — 15 October 2026 (local only)

The entire `#home-ticket` promotion is removed from homepage rendering, superseding the earlier Homepage intro/inclusions ownership note. Homepage → A day with possibilities controls and its unused inclusion-heading control are retired. Stored `intro.*`, `intro.showOnHomepage` and `tourPage.includedTitle` remain compatibility data; no active homepage consumer can revive them. Product descriptions/inclusions/prices and shared labels retain their existing sources for other pages. No migration or hosted content deletion. See HOMEPAGE-PROMOTION-REMOVAL-2026-10-15.md.


## Route stop presentation panel — 23 October 2026 (local only)

`/admin/[operatorId]/route-stops` is a dedicated, stop-ordered entry point to the existing shared destination editor. It edits the same `content_pages` destination `body`/`published_body` name, image and alt fields used by Website → Destinations. It reuses ImageField, saveDestination, content.draft/content.publish authorization, stale-save protection and revalidation; no separate stop-content collection or duplicate field ownership is introduced. More destination details remain available through that same editor. Website consumers continue joining published destination `stopId` to the independent map’s stable IDs.

Live Map owns operational stop order, coordinates, vehicle position, recognition, live status and ETA. This panel reads the existing published-stop reference source and cannot edit those operational values or iframe labels. Unlinked stops offer reuse of an unassigned destination or creation through the existing canonical destination workflow. Ambiguous/draft-reassigned links require review in the full destination editor. Source failure preserves links and offers the existing editor rather than inventing stops. Existing section/destination visibility remains authoritative. See ROUTE-STOPS-ADMIN-2026-10-23.md for validation and limits.


30 October 2026 amendment: the complete homepage live-service/timetable/map section was removed at owner request. Its text/link fields remain stored compatibility data and are absent from active Homepage controls. Departures visibility remains operational on Route/Your Day and is owned by the existing Route page editor. The active CMS verification probes RouteJourney for that flag; no shared content was deleted. See HOMEPAGE-SERVICE-SECTION-REMOVAL-2026-10-30.md.


30 October 2026 retirement amendment: Local notebook and Final booking invitation have no active admin owner or public consumer. Homepage notebook, cross-route footer invitation, saved-preview wiring, exclusive renderer and styles are removed. Their existing document keys/media remain historical compatibility data. Shared destinations/Explore and business/footer/booking controls remain active. See RETIRED-HOMEPAGE-FEATURES-2026-10-30.md.


30 October 2026 local product extension: product identity/publication remains in Products & suppliers. Calendar & Pricing owns shared inventory links, reservation periods and passenger prices. Website > Product booking cards is the single owner of product card draft/published photo, alt text, introduction, display order and homepage visibility, stored on the same product entity. Public cards consume only card_published and the shared booking API. The main CMS verification normalizes opaque per-mount React IDs while still checking dialog title associations. See SHARED-VAN-PRODUCTS-2026-10-30.md.
