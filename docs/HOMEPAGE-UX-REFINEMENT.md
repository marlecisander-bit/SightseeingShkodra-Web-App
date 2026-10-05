# Homepage UX reorganization and mobile refinement

5 October 2026. Implemented locally; not committed or deployed.

## Production baseline inspected before implementation

| Order | Existing content / state | Authoritative source |
|---|---|---|
| 1 | Full-screen hero, two-line headline/subtitle, dated adult fare, booking CTA, desktop tracking link | CMS hero.*; getHomepage / canonical availability fare; shared booking dialog |
| 2 | A day with possibilities; four-part day planner | CMS intro.*; published product, service schedule, independent map stop list and iframe status bridge |
| 3 | The places between: four editorial destinations | CMS route.*; shared published destination records, not the five operational stops |
| 4 | Your day, without the guesswork; compact embedded map | CMS live.*; retained independent Live Map |
| 5 | Today, at a glance | CMS departures.*; existing departure engine |
| 6 | Guest reviews | CMS introduction; published reviews and review settings |
| Hidden | The local notebook and final booking invitation | Existing visibility flags; no flag changed |
| Last | Footer, legal/social links, WhatsApp | Existing shared footer and WhatsApp CMS configuration |

How it works existed on Tour under how.* but was absent from the homepage. Product inclusions existed on Tour, with no homepage ticket summary. No full homepage FAQ was present. Hero amenities are existing retained CMS data; this task does not invent additional benefits or publish amenities. The supplied brief ends at heading 54; no separate mockup asset was available. The actual Production layout was inspected in Chrome as the visual baseline.

## Implemented flow and ownership

Hero → How it works → operational Route & Stops → Live Service / timetable → A day with possibilities → destination highlights → notebook when enabled → Daily Ticket → reviews → final invitation when enabled → existing footer.

- Hero keeps CMS text, both image sources, focal positioning, logo, font family, palette and image treatment. Product title and stop count derive from existing published sources. Fare is the same date-qualified one-adult availability result used by the new ticket summary. Mobile headline is about 42px at 390px and capped at 44px for the larger phone widths; desktop headline sizes remain unchanged. No marketing text or price was written to the CMS.
- Four shared how.* step titles are immediately visible. Existing explanations remain in a keyboard-operable disclosure. No duplicated content model or new save/publish path.
- The intro visibility flag controls its story and homepage How it works consumer. The route flag controls operational stop overview and editorial highlights. Live and departure flags remain independent even though their sections now share a presentation area. Admin helper copy explains these relationships and where to edit the shared steps.
- Operational stop names/count/order come from the existing independent-map stop projection in DayPlannerData. Editorial destinations remain a separate, later consumer. Missing stops show a route-page fallback, never five fabricated stops.
- One existing DayPlannerStrip instance supplies the compact schedule summary, retaining its clock, refresh and unavailable/no-service/finished states. Timetable copy is preserved in a disclosure. A separate hero departure ticker was not added: the reliable schedule summary has one location instead of duplicating timers or data requests.
- The existing iframe is available under Show live map here; the main Open live map link remains prominent. Map help is collapsed on this consumer. Concise status suppresses unavailable tracking movement/freshness text and uses a neutral fallback; other DayPlanner consumers retain their previous status presentation. Map/GPS/ETA algorithms and external service were not modified. Live status is shown only when the existing iframe supplies it; before that the link is the honest fallback.
- Ticket title, description and inclusions reuse the published product. Long inclusions use existing Read more behavior. No Wi-Fi/audio guide or other unsupported benefits were added. Publication of the product controls whether its ticket summary exists. Price/date and booking action reuse existing components. FAQ is a link to the existing dedicated page.
- Notebook, reviews and final invitation retain their current data and visibility. The currently hidden notebook/final invitation were not forced on. The existing footer is unchanged. Three strategic booking locations are supported when the final invitation is enabled, plus the existing smart header/menu.

## Verification

| Check | Evidence |
|---|---|
| Full regression suite | 342 passed, zero failed/skipped: 25 components, 17 identity, 120 integrations, 156 database, 24 PostgreSQL concurrency |
| Final component rerun | 25 passed after the final section/disclosure changes |
| Lint / TypeScript | PASS |
| Production build | PASS in isolated private/smart-header-release checkout; final CSS build rerun recorded in private/homepage-ux-build.log |
| Responsive layout | 320, 360, 375, 390, 414, 430, 768, 820, 1280, 1440, 1920: no document overflow |
| 390px density | How it works 416px; collapsed Live Service 650px; ticket 806px, including published copy and its booking summary |
| Booking actions | Hero, mobile menu and ticket each opened the existing dialog; closed without submitting a reservation |
| Smart header | Header booking action hidden while hero action visible; compact Book visible after scrolling; full CTA retained in menu |
| Map integration | Existing external iframe and stop controls loaded at the trusted localhost:3000 origin after expansion; localhost:3100 was not an allowed embedding origin |
| Disclosure / editorial behavior | Existing expandable text, compact destination selector, map disclosure and map-help disclosure retained; full text remains accessible |
| CMS safety | Existing full visibility regression passes, plus new tests for section order, source-backed product/stop values, missing-data fallbacks and independent hidden consumers |

At 320x568, the first headline text remains one line before its explicit break. The measured hero was 576px with almost zero gap between the booking CTA and WhatsApp. The final short-screen CSS reduces the commercial margin by 16px to restore breathing room. After Chrome reconnected, the final 320px recheck passed: hero height 568px, CTA bottom 492.2px, WhatsApp top 500px, no document overflow. Final desktop appearance was also visually inspected at 1440px. At 390x844 the measured booking CTA ends at 768px and WhatsApp starts at 776px (8px gap). Browser viewport tests do not certify physical iPhone/Android behavior.

Logs: private/homepage-ux-tests.log, private/homepage-ux-components-final.log, private/homepage-ux-lint.log, private/homepage-ux-types.log, private/homepage-ux-build.log. Development warnings observed: isolated localhost metadataBase fallback and an existing below-fold destination image LCP warning during scroll testing; no new application error was captured. No comprehensive performance profile is claimed.

No CMS Save/Publish, booking submission, schema migration, deployment, scheduler or delivery action was performed. Existing public loaders and booking-dialog reads were exercised normally; their existing availability/materialization behavior was not changed. Unrelated local documents, owner SQL and credentials remain untouched.

## Continuation: requirements 54–124 — 5 October 2026

The supplied continuation was checked against the existing implementation. Changes in this follow-up:

- Admin Homepage navigator now follows Hero, How it works, The places between (first controls the operational overview), Live presentation, Today at a glance, A day with possibilities, Local notebook, Guest Reviews, Final invitation. The existing how section moved from Public pages to Homepage; its stored ID and fields are unchanged and it still supplies Tour. No duplicate editor was added. Its Draft Preview link now targets Home. Product/inclusions and prices retain their existing Catalog and Calendar & Pricing owners.
- Authenticated saved-draft preview now passes getDayPlanner() into the same HomepageView used publicly. It therefore receives the same operational stop projection and summary inputs while preserving draft editorial content. This fixes the missing stop overview in the earlier preview composition. No authentication guard or publication behavior changed. Verification is source/production-build plus shared-component tests; no new authenticated save/publish workflow was performed.
- HomepageMapDisclosure creates LiveMapEmbed only after expansion and removes it on close. Browser proof: zero iframe elements initially, one after expansion, zero after closing. The dedicated map page and its engine are unchanged. No loading of the external map document is needed for the initial homepage. The neutral Open Live Map fallback remains until reliable embedded status exists.
- A hidden hero now leaves one screen-reader page heading using the existing product/search title; it does not leak hidden hero copy. The timetable uses a section-level heading when the live presentation is hidden. Existing visible hero still supplies the only H1.

| Requirements | Outcome |
|---|---|
| 54–61: flow, shared content, visibility, preview, Admin order | Implemented with existing IDs and sources; reviews remain the last main section before the conditional shared final invitation |
| 62–65: dynamic failures | Safe existing price/schedule/map fallbacks; no invented prices, stops or times; other homepage content remains usable |
| 66–76: hero, CTA, WhatsApp, steps | Existing responsive images/focal variables/shadow preserved; 320px gap verified in preceding run; compact steps and desktop four-column presentation retained |
| 77–91: route, live, highlights, ticket, reviews | Configured operational stops remain separate from editorial destinations; map deferred; published product and reviews reused; no invented benefits/counts/age prices |
| 87–88: amenities audit | Legacy hero.amenities field remains stored but was already excluded from the active editor/public layout; it was not reactivated or used to invent ticket inclusions. The active published product inclusions remain authoritative |
| 92–100: final CTA, desktop/tablet flow, links/navigation | Same composition at all widths; final invitation respects its current hidden flag; existing menu/routes/booking handler retained |
| 101–103: semantics/accessibility | One H1 with or without hero, logical timetable heading, CMS alt text, native disclosure keyboard controls and existing focus/button behavior retained |
| 104–109: performance and calm fallbacks | Eager primary hero retained; no new images; existing below-fold image/review pipeline; external map mounts only on request; no tourist-facing technical errors added |
| 110–117: architecture boundaries | SEO/metadata, indexing configuration, PWA, booking rules, database schema and map engine unchanged; no second homepage composition or obsolete replacement retained |
| 118–120, 123–124: visual/responsive consistency | Earlier eleven-width matrix remains applicable. Follow-up 320/390/820/1440 checks: no overflow, exactly one H1, zero initial map frames. Existing palette/logo/photography/editorial style retained |
| 121–122: real device / installed PWA | Physical iOS/Android/standalone acceptance remains NOT TESTED. Existing manifest/icons/service worker were not changed |

Follow-up gates: full chain 343 passed (26 components, 17 identity, 120 integrations, 156 database, 24 PostgreSQL); the final heading test brought the final targeted component run to 27 passed. These are separate runs, not an inflated full-chain total. Lint and TypeScript passed. Final isolated production build PASS; evidence is in private/homepage-ux-continuation-build-final.log. Other logs: private/homepage-ux-continuation-{tests,components-final,lint,types}.log.

No commit, push, deployment, production CMS write, database migration or communications activation. Local preview remains available at http://localhost:3000.

## Final brief: requirements 125–190 — 5 October 2026

The final brief explicitly authorizes publishing after critical checks. Final visual inspection found and fixed the Live Service-to-story spacing transition. Numeric fare now has stronger hierarchy than its supporting prefix, scoped to the homepage. A compact hero departure status uses a portal from the existing DayPlannerStrip state: one fetch/clock owner supplies both presentations, with no second polling loop. It respects the departures visibility flag and uses the existing local-time next/finished/unavailable calculation. This supersedes the earlier decision to omit the hero status.

Final screenshots inspected: hero at 320×568, 375×667, 390×844 and 430×932; full homepage at 390 and 1440. The final 320px hero measures 568px high, CTA bottom 466.2px, with WhatsApp below; no horizontal overflow. The mobile story transition now has 40px breathing room. Earlier eleven-width coverage remains supporting evidence. Sticky header visibility was checked after a clean load and after scrolling beyond the hero; sticky Book opens the shared date/guest/departure dialog. Hero/menu/ticket entries were checked in the preceding continuation. Route & Live Map, FAQ and Explore navigation were exercised. The route's existing embedded map loaded its published stops and van controls.

The published final invitation is Hidden. Its shared component, booking action and visibility contract remain intact; no public content was enabled merely to demonstrate it. Final-invitation browser acceptance in a visible state is not claimed. Existing component visibility tests cover its conditional rendering. Reviews retain their existing carousel and original-source links. Language remains the existing EN/“More languages coming soon” interface; no translation system was invented.

Duplication review: one how-to explanation (details disclosure), one operational stop list, one live explanation/map, one guest-review section, no FAQ wall and no extra amenities list. Deliberate repeated product/price/booking context at hero and ticket serves purchase decisions. The short hero departure status and detailed service panel share state. If the owner enables Local Notebook, its existing editorial destination consumer remains available. Full destination/inclusion/review text stays available through existing Read more controls; CMS text was not overwritten. No editable field became a hardcoded replacement.

Data-state evidence: homepage render fixtures cover configured fare and missing product/route/schedule; existing timetable tests cover next departure, finished/closed day and stale-date suppression. Existing database fare tests cover overrides and offers. Missing reviews retain surrounding homepage structure. Live-map fallback was observed; actual parked-vs-moving physical vehicle behavior was not independently certified and no map algorithm was altered.

Final code gate: complete chain 344 passed (27 components, 17 identity, 120 integrations, 156 database, 24 PostgreSQL), zero failed/skipped. After final price/status/spacing changes, 27 components, lint, TypeScript and isolated production build were rerun and passed. Isolated source/test/script/config content matches the working candidate after normalizing line endings. Logs: private/homepage-final-{tests,components,lint,types,build}.log.

Physical iPhone/Android and installed PWA acceptance: PENDING. No booking submitted, CMS saved, database migrated, delivery enabled, or independent map deployed. Production release/hosted evidence will be recorded after the authorized main-to-Vercel publication.
