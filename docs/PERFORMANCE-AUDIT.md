# Public performance audit and optimization

1 October 2026. Local implementation; not deployed.

## Status and measurement method

**NEEDS FURTHER WORK** for the complete performance acceptance target. Measured image and request-waterfall improvements are implemented. The full regression chain passed 295 tests before the final Explore loader simplification; final checks are recorded below. No booking rule, database record, GPS engine, email enablement or hosted configuration was changed.

Measurements use production Next builds, Chrome, browser cache disabled, a five-second observation window after navigation, and buffered Paint/LCP/LayoutShift/LongTask observations. Desktop: 1440×900, normal network/CPU. Mobile: 390×844, 4× CPU slowdown, 150 ms latency, 200,000 bytes/sec download and 93,750 bytes/sec upload. These are lab samples on one Windows computer, not physical-phone or field Core Web Vitals certification. Each table row is one successful run; no percentile claim is made.

[PERFORMANCE-MEASUREMENTS.csv](PERFORMANCE-MEASUREMENTS.csv) contains TTFB, FCP, LCP, observed layout-shift sum, DCL, load, request count, total/JS/CSS/image bytes for all six original URLs, both profiles, before and after. FAQ originally meant `/tour#faq`; the same old URL was remeasured after its requested content removal. `/faq` is an additional, new composition, not an identical-content optimization comparison.

The hosted reference is the unchanged Netlify release. Paired before/after rows use the same local production candidate and existing hosted read-only content. Earlier unpublished ownership/review-reader changes are already in that local baseline; their benefit is not attributed to this task. Do not compare hosted-before to local-after as a deployment improvement.

Important limits:

- Counts include observed prefetch attempts. Extension resources were excluded from transfer totals; the browser profile still has extensions, which can affect CPU timing. Earlier commentary totals before that filtering were provisional.
- Transfer sums include completed captured HTTP(S) requests in the window, not all bytes downloaded after scrolling. Unfinished requests and cross-origin iframe subresources can be absent. The map engine's full transfer is **not** included reliably. Thus these are captured initial-window bytes, not a complete full-page weight.
- `load=0` means load had not fired by collection, not zero milliseconds. Old mobile `/tour#faq` has that result.
- Layout-shift entries were summed over the window; this is a lab shift diagnostic, not the full standardized session-window CLS algorithm or a lifetime score.
- LCP is the last observer entry available in that window. Background/extension effects and late work make a field claim inappropriate. INP is **not established**: a short synthetic session is insufficient, and the event observer did not return a valid interaction sample. No zero or fabricated INP is reported.
- Long tasks measure main-thread work, not isolated React hydration. No React profiling-build attribution was collected.
- Image derivatives can have a cold transformation cost. Browser cache was cold, but server/CDN derivative caches were not forcibly cleared. Timing changes include ordinary network variation.

## Homepage baseline

| Hosted homepage | Desktop | Throttled mobile |
|---|---:|---:|
| TTFB | 1,949 ms | 1,740 ms |
| FCP | 2,268 ms | 2,432 ms |
| LCP observed | 2,268 ms | 3,648 ms |
| Layout-shift sum | 0 | 0 |
| INP | Not established | Not established |
| Requests | 27 | 19 |
| Captured transfer | 519,298 B | 301,054 B |
| JS | 156,733 B | 156,575 B |
| CSS | 19,535 B | 19,609 B |
| Images | 323,573 B | 106,887 B |

## Main bottlenecks and implemented changes

1. **P1: original public photos bypassed the image optimizer.** Tour downloaded a 1.69 MB WebP; Explore downloaded 489 KB and 1.07 MB JPEGs. `Media` now enables the already configured Next image optimizer for supported Supabase website-media URLs, with its existing responsive sizes and lazy/eager behavior. Unsupported external URLs retain the existing direct delivery. Uploaded originals and CMS URLs are untouched. No new media store or dependency.
2. **P1: server critical path includes operational work and below-fold data.** Homepage waits for CMS, operational homepage, reviews, planner and destinations. Independent destinations formerly started last; they now start concurrently. Planner cancellations now run with schedule lookup instead of after schedule-time RPCs. Prices, inventory, cancellations, dates and cutoff evaluation retain `no-store`; no business-data cache was introduced.
3. **P2: Explore fetched an operational homepage/availability quote only for a legacy guide fallback.** The final Explore loader uses the current authoritative destination records and CMS directly. The optional legacy input remains supported in the shared view for existing fixtures/previews. Public Explore no longer calls the booking quote path.
4. **Requested content cleanup: Tour fetched and rendered reviews and embedded FAQ.** Tour no longer requests review rows or renders either section. Dedicated `/faq` reads existing CMS questions and only the published product inclusions needed by one answer. This is a user-requested composition change, separately identified from pure performance optimization.
5. **Remaining P1: booking restoration layout shift.** The loading/restoration paragraph becomes the full first-step form, moving the global footer. Local observed shift sums remained 0.216 desktop / 0.1511 mobile before and after. Booking state restoration and focus behavior were not rewritten in this pass.

## Network and Supabase findings

A Node diagnostics-channel observer measured actual outgoing request-to-response-header time from the local production server without recording credentials or query values. Baseline homepage trace: CMS 384 ms; review settings 400 ms; public homepage RPC 401 ms; reviews 129 ms; availability RPC 185 ms; schedules 110 ms; effective-times RPC 117 ms; cancellations 110 ms; destinations 108 ms. Independent map project lookup was 287 ms followed by map version 126 ms. These include network/service time and are **not database execution timings**.

The baseline sequential tail was homepage → availability → schedules → effective times → cancelled departures → destinations. The final two independent reads now overlap earlier work. A subsequent trace confirms destinations begin with CMS/homepage and cancellations complete alongside schedules, before effective-times completion.

| Query/table or RPC | Caller / initial consumers | Blocking / duplicate | Freshness and realtime |
|---|---|---|---|
| `content_pages.published_body`, operator + website-homepage | website-server; layout, metadata and pages | Blocking; React request cache deduplicates identical CMS reads | Editorial; currently no-store. No realtime. Persistent cache requires tested publish invalidation |
| `review_settings` three display/link fields | shared review context; global footer | One per render context; footer requires platform link settings | Editorial/config; no realtime |
| `reviews`, explicit fields, published + not deleted, bounded display limit | Homepage review section | Settings then rows; removed from Tour and absent from FAQ | Editorial; no realtime |
| `content_pages`, published destinations, aliases/order, limit 500 | destinations-server; Home/Explore/Tour/Route/guide | One cached list per request. Same table as CMS, different query, not a duplicate | Editorial; no realtime. Current full destination bodies can be large |
| `read_public_homepage_v1` | homepage-server; Home/Tour/Route planner | Cached per request; returns published product/editorial snapshot | Product data; no realtime. Removed from final Explore and absent from FAQ |
| `read_passenger_availability_v1` | availability-server through homepage fare | Genuine dependency on product/date; no-store | Live capacity, prices and cutoff: never persistently cached |
| `next_operational_date_v1` plus further quote | conditional next-fare fallback | Only when needed, deadline bounded; not exercised in recorded normal-date trace | Operational; retain freshness |
| `service_schedules.id` | day-planner-server; Home/Route | Product-dependent; explicit fields | Operational; no-store |
| `effective_schedule_times_v1` per schedule | day-planner-server | Parallel across schedules; bounded by schedule count, potential fanout at larger scale | Operational; no-store |
| `departures.start_time`, current date + cancelled | day-planner-server | Independent of effective-times result; now parallel with schedules | Operational; no-store |
| Independent map `projects.id` then `map_versions.map_data` | destination-stops-server; planner | True project-ID dependency; large geometry fetched to derive stop summary | External engine remains authoritative. No copied stops or new subscriptions |
| `products.inclusions`, fixed operator/slug, published van_tour | faq-server | One narrow read; no homepage/price query | Same product source as before; no-store; no realtime |

Post-change direct-request traces: `/faq` had exactly CMS, review settings and product inclusions (167–180 ms each); `/book` CMS and review settings (127–130 ms); `/tour` CMS, settings, destinations, homepage and availability (139–175 ms). Final Explore verification is recorded below.

No initial browser CMS Supabase calls or global editorial realtime client were found. Explicit column projection is used in these readers. Destination list and CMS query are distinct, not identical table-fetch duplication. Existing indexes include operator/slug uniqueness, `destination_listing`, `reviews_homepage`, and `departures_schedule_idx`. No production EXPLAIN/ANALYZE or full database index-use certification was performed. No speculative index migration was added.

Observed prefetch requests sometimes completed headers and were cancelled (`ERR_ABORTED`); those are distinguished from failed content requests. Browser instrumentation also interrupted captures, which were discarded and rerun. No captured completed image/script 404 was found in the accepted after runs. Full iframe redirects, OPTIONS and retries are outside the captured top-level scope.

## Images, uploads and critical rendering

| Original | Format / dimensions | Original encoded size | Finding |
|---|---|---:|---|
| Desktop hero `d3642a92…` | WebP 3840×1944 | 1,686,800 B | Homepage already optimized; Tour Media previously downloaded original |
| Mobile hero `fdc7a3f7…` | PNG 941×1672 | 2,212,684 B | Homepage already selected optimized WebP, ~86 KB captured at width 640 |
| Explore `9822de8d…` | JPEG 1350×759 | 1,064,441 B | Unnecessarily large direct photo; now responsive optimization |
| Explore `81b9045d…` | JPEG 1600×1067 | 488,243 B | Same direct-delivery issue |

Hero uses existing `getImageProps`, picture source selection for portrait <=900 px, quality 75, `sizes=100vw`, eager/high priority, and no competing desktop/mobile preload. Desktop sample rendered 1425×900 with a width-1920 derivative. Existing object-fit, focal positions and mobile 1.2 bottom-anchored zoom were preserved. Only one hero source is selected; no duplicate hidden desktop/mobile image request was observed.

Existing `Media` reserves layout through its positioned/aspect-ratio container. Below-fold pictures stay lazy; Tour/guide hero retains priority. Existing upload processing optimizes hero files only when over 8 MB; smaller large PNGs can remain original uploads. Public derivative delivery now addresses supported Media consumers without requiring perfect uploads. Admin thumbnails, review avatars and small selected-stop thumbnails retain their separate existing paths and remain follow-ups. Source originals were not recompressed, deleted or duplicated.

Hero still waits for the server page composition. Reviews and planner are still in the Home server await; streaming those independently is a remaining measured architectural opportunity, not implemented by guessing at fallback heights or hiding required fares.

## JavaScript, hydration, fonts, CSS and third parties

Public homepage transferred about 167 KB JS in the local build. Largest loaded chunks: `3kmozkq6tgqnz` 72,016 B (React runtime; 228,922 raw / 71,576 gzip), `3bawhkhjtuhib` 44,200 B (Next router; 160,635 raw / 43,778 gzip), then 13,742 B, 9,427 B and 9,230 B application/shared chunks. No broad icon package is installed; icons are existing inline SVG. Installed Leaflet is not proof it ships in the public parent page.

The production homepage client-reference manifest has no Admin modules, Leaflet or Supabase modules. Public client islands include booking/header, footer visibility, expandable text, day planner, booking controls, reviews carousel, route preview and iframe wrapper. Editorial page text is server-rendered. Public navigation can prefetch Staff Login, but that is not evidence of downloading the CMS editor. No Admin editor chunk was observed.

Checkout is already dynamically imported and mounted only on opening the modal (or on `/book`). Initial Home does not require the full checkout flow. Its button/context and selection controls are shared initial JS. Lab click-to-visible input took 332 ms with cold browser cache; no additional lazy layer was added. QR and payment/email logic were not changed.

After mobile Home had five observed long tasks totaling 603 ms; Explore two totaling 297 ms; FAQ two totaling 240 ms. Desktop Home had one 50 ms task, other recorded desktop pages none. Extension work can contribute; these are not pure hydration durations. Fewer client boundaries should be assessed with a dedicated profiling trace before a broad rewrite.

No external web fonts or font-family download pipeline is used: Arial/Helvetica/system sans-serif. Browser-extension Adobe fonts were explicitly excluded. Local captured CSS was 21,105 B; no large animation/icon dependency justified CSS micro-optimization.

The independent Live Map is an iframe. Its Leaflet, basemap tiles, Supabase/live-position work stay in that app. Native iframe lazy loading is already used below the fold, eager on the dedicated route. A compact iframe document can start early because browser lazy thresholds extend beyond the viewport; full child-engine cost was not captured. The `useMapStatus` hook exchanges messages with existing frames, not a second hidden map. No GPS, ETA, stop sequence, realtime or Scorpiontrack change was made.

Reviews are stored records, not a blocking Google widget. Google/social URLs are ordinary links; review avatars are optional lazy images. No global analytics, review-widget or Google-font script was found. Planner refresh runs every 60 seconds while visible, clock every 30 seconds; availability refreshes only after selecting a date. These operational refreshes are not CMS subscriptions.

## Caching, hosting and navigation

Public CMS/global settings already have request-scoped React deduplication. This consolidates Header, Footer, metadata and content without a new parallel data layer. No persistent CMS cache was added because publish invalidation must be verified across hosted runtime, drafts and public consumers first. Editorial data is cacheable in principle; live inventory/GPS is not. Image derivatives and immutable static chunks use the existing framework/CDN path.

Production build lists public pages as dynamic SSR; robots is static, sitemap dynamic. Auth proxy matches only Admin/Auth/Admin API. Netlify serves the hosted app; measured response cache-control was `private,no-cache,no-store,max-age=0,must-revalidate`, with no Server-Timing breakdown. Saved site metadata lists us-east-2, but was not treated as fresh deployed region evidence. Existing scheduler files are unrelated local email work, not a new performance change.

Actual deployed Supabase latency and serverless cold-start contribution cannot be separated from browser TTFB without deployed tracing/logs. The local outgoing timings above must not be presented as Netlify-to-Supabase measurements. No hosting migration, region change, scheduler change or deployment was performed.

Local desktop click-to-first route content: Home→Tour 350 ms, Home→Route 554 ms, Home→Explore 311 ms. Home→Book modal input 332 ms. These DOM-observer interaction timings are not INP. Framework client navigation preserves the shared layout. Hosted navigation comparison was interrupted and is not reported as a paired result.

## Regression and remaining priorities

- Full chain: **295 passed, 0 failed** (components 11, identity 17, integrations 104, database 140, PostgreSQL concurrency 23). Includes capacity, infant seating, cutoff, modify/cancel, QR and concurrency contracts. This predates the final Explore-only loader simplification; final component/type/lint/build checks cover that follow-up.
- FAQ and Tour checked at 375, 390, 430, 768, 1024, 1440 and 1920 px: no overflow or empty Tour sections; FAQ summaries 44 px; accordion expands; standard footer follows content directly.
- Homepage reviews remain visible. FAQ metadata uses existing canonical/indexing configuration. No hosted CMS writes or physical-device acceptance claimed.
- P0: no demonstrated severe new blocking defect.
- P1: booking restoration layout shift; deployed tracing/real-user INP; repeat representative mobile tests without extension noise and include full iframe target coverage. Target LCP <2.5 s, shift score <0.1, field INP <200 ms remains an acceptance target, not certified.
- P2: stream below-fold Home data with stable layout; evaluate editorial cache plus immediate publish invalidation; narrow independent-map stop summary read only through the existing engine's supported contract; verify derivative cold-cache performance/quality on physical devices.
- P3: smaller shared client/schema payload, supported Admin thumbnail variants, selected-stop image delivery, and possible intent preload for booking. Do not spend this effort ahead of P1.

## Deployment and rollback

No deployment. The FAQ migration only adds `/faq` to the existing CMS internal-link validator; apply it through the established release workflow before saving canonical FAQ links in the hosted CMS. Old stored `/tour#faq` values remain valid and resolve to `/faq` in public navigation. No stored record was rewritten. Rollback is scoped to this task's source changes and new migration; preserve unrelated local audit, email and SQL work.

## Paired local production results

Single runs under the same recorded device conditions; bytes cover the initial capture window. These are lab observations, not field guarantees.

| Device / page | TTFB ms before -> after | LCP ms before -> after | Transfer bytes before -> after |
|---|---:|---:|---:|
| desktop / home | 856 -> 650 | 1104 -> 864 | 533302 -> 503492 |
| desktop / book | 192 -> 154 | 352 -> 260 | 240996 -> 240563 |
| desktop / route | 763 -> 627 | 972 -> 784 | 229912 -> 228779 |
| desktop / explore | 471 -> 343 | 1740 -> 564 | 1958492 -> 493514 |
| desktop / explore/centre | 179 -> 209 | 372 -> 368 | 322109 -> 319321 |
| mobile / home | 1008 -> 595 | 1680 -> 1264 | 417574 -> 323336 |
| mobile / book | 373 -> 208 | 988 -> 764 | 248886 -> 246327 |
| mobile / route | 686 -> 575 | 1460 -> 1132 | 229401 -> 229477 |
| mobile / explore | 493 -> 366 | 5152 -> 2396 | 896942 -> 396581 |
| mobile / explore/centre | 171 -> 188 | 3744 -> 1476 | 325637 -> 282385 |

Final Explore follow-up removes its unused homepage/availability quote entirely. A direct production-server request verified only two content_pages reads (CMS and destinations) and review_settings for the shared layout, all HTTP 200; no homepage or availability RPC. Final repeat transfer was 492,967 B desktop and 396,565 B mobile. Paint observers did not return valid FCP/LCP in those two repeats; they are left blank in the CSV and do not replace the earlier valid paired paint observations. Final desktop/mobile TTFB was 1,323/300 ms; the desktop run followed a server restart and is not used to claim an improvement.


## Release scope - 1 October 2026

The release isolates the performance and Tour/FAQ changes from earlier uncommitted public-audit and email work. Earlier local benchmark results include those pre-existing audit changes and are not exact release benchmarks. Shared review-reader consolidation, footer HomeLink behavior, map-binding, navigation-label projection and earlier sitemap eligibility changes remain local. Exact release production build and 11 component tests passed before the final removal of an unrelated Admin navigation tip; final build/lint and component verification are rerun for that scope.
