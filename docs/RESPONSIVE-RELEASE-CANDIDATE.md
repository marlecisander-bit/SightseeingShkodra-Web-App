# SIGHTSEEING SHKODRA WEBSITE
# RESPONSIVE UI/UX RELEASE CANDIDATE

Local candidate verified 28 September 2026. Nothing deployed. Browser checkout/management responses are synthetic; business-rule tests execute local databases. Production reference was inspected read-only.

## 1. BEFORE
Existing Next.js public shell, one BookingProvider, one checkout engine, Supabase CMS, and one shared iframe host. The separate map remains authoritative.
Hero amenities obscured the van; text was vertically centered by space intended for amenities. Logo was a plain root link without explicit same-page top behavior. /book used large headings, summary before inputs, three-column desktop fields and a competing footer CTA. Short-screen navigation lacked bounded scrolling.
Audit included header/hero, booking dialog and checkout, management, footer, responsive rules/tokens, map consumers and prototype references. Unrelated pending email/admin/SQL files were left untouched.

## 2. HERO
Stopped rendering amenities in HomepageHero, removed empty list and exclusively hero-amenity CSS/imports. No amenity data/model/API/admin deletion. AmenityIcon and parser remain reusable.
Single picture element still chooses independent CMS desktop/mobile sources and focal positions. No media replacement, recompression or CMS writes. Object-fit cover retained; text now sits higher, revealing the van. Full-height photo presentation and natural colors remain, without a new full-image dark overlay. Mobile and desktop photographs were visually inspected; edge crop still depends on owner-selected media and focal settings.
Local DB test executed draft/publish/edit/hide/reorder/remove amenity lifecycle and confirmed operational data preservation. Authenticated hosted CMS editing was NOT TESTED.

## 3. HEADER & LOGO
Semantic labelled Link uses existing Next router. Other route ? homepage top; homepage scrolled ? smooth top; reduced motion ? instant. Logo clears homepage anchor and active state, closes mobile menu, and works with Enter. Modifier-key link behavior retained. Browser Back/Forward restoration was not globally changed.
Menu receives bounded dvh scrolling in short landscape. Header height uses one responsive custom property. All six configured links and active states tested at 390/1440; header overlap and logo/CTA minimum 44px targets tested at all 15 sizes.
The language display remains the existing static EN / more-languages-coming-soon, not an implemented language switcher.

## 4. LIVE MAP EMBEDS
Four public locations: / (HomepageView), /tour#tour-live (TourView), /live (LiveView), /your-day. Private website-preview reuses HomepageView/TourView. Development cms-reconciliation intentionally renders three previews. Other email iframes are not maps.
Shared source: https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra.
Prior local embed candidate is retained: full intent on /live; compact elsewhere; container query height clamp(320px,90cqi,500px), landscape cap, scroll-safe interaction gate, lazy preview/eager dedicated iframe. Same geolocation permission and referrer policy. No sandbox restriction added that would break the app.
Parent cannot inspect/control cross-origin DOM. Exact origin/source/payload validation in existing status bridge retained. onLoad means iframe document loaded, not GPS ready. Timeout/reload/direct-open retained.
Full/compact/mini internal presentations belong to Map App. Earlier local fixture audit passed resizing, hidden/visible, overlays and one map identity. This does not establish that the hosted app has those changes.
The old modules/tracking prototype is still referenced by /dev/tracking-preview, not public routes. It was not activated or deleted without proving its consumers obsolete.

## 5. LIVE MAP APP CHANGES REQUIRED
Issue: hosted compact loading banner overlaps status card; hosted card is narrow and still uses old presentation. Observed in master-live-390.png.
Desired: readable container-sized status, no banner collision, reserved canvas space, full/compact/mini behavior.
Why website cannot fix it: cross-origin iframe; duplicating DOM/state here would violate architecture.
Likely components: live-map.html, css/live-map/responsive-presentation.css, js/live-map/responsive-presentation.js, loading/status styling.
Recommendation: review the earlier authorized local Map App presentation candidate, validate against its latest authoritative state, then publish through that repository separately. No new Map App edits in this website task. No GPS/ETA/backend change required by the website candidate.

## 6. BOOKING
Step 1 retains date ? configured passenger mix ? departure, with full-width fields and 44px counters. Step 2 keeps existing customer form/reservation handling, with 16px gaps and full-width mobile primary action. Step 3 uses existing confirmation/QR component. Compact Step N of 3 caption on mobile; desktop progress retained. Summary moves after required inputs/actions in DOM, not only visual order. Mobile headings reduced. Footer retains navigation/contact but hides repeated marketing CTA on /book.
Existing preselection dialog When/Guests/Review and handoff remain; tested date, category counts and departure survive /book navigation. Modal scroll/body lock/safe area behavior retained. No replacement booking implementation.
Modify/cancel/success layouts reused. Seven-width management test passed. Six cancellation?new-booking flows passed. Invalid details, sold-out/no departures/network, rejected modify/cancel and invalid-link UI tested.
Business rules, hold/order/retry/session handling, cutoffs, pricing, notification triggers and API payloads unchanged. Removed one unused lint suppression only.
Actual device keyboard behavior remains unverified; reduced-height browser viewport checked for input/CTA reachability.

## 7. FILES CHANGED
Current website task:
- src/components/public/homepage-hero.tsx ? hero-only amenities removal.
- src/components/public/booking.tsx ? accessible logo/home behavior.
- src/components/public/checkout-flow.tsx ? step caption and summary DOM placement; unused lint directive cleanup.
- src/app/(public)/public.css ? hero cleanup, checkout typography/flow, shared header height, short-screen menu, /book footer CTA suppression.
- docs/PHASE_STATUS.md ? evidence and limitations.
- docs/RESPONSIVE-RELEASE-CANDIDATE.md ? this report.

Retained prior, unpublished map candidate:
- src/components/public/live-map-embed.tsx ? intent/interaction host.
- src/components/public/live-map.module.css ? container/controls.
- src/components/public/editorial-pages.tsx ? full mode on /live.
- docs/LIVE-MAP-EMBED-RESPONSIVE-AUDIT.md ? prior detailed map evidence.
Existing unrelated dirty files are not part of this scope. No new migrations, backend/environment settings, production commits or deployment.

## 8. RESPONSIVE MATRIX
PASS means the described local browser layout/flow checks, not physical-device or provider acceptance.
| Viewport | Homepage | Hero | Header | Live Map embed | Booking |
| --- | --- | --- | --- | --- | --- |
| 320 ? 568 | PASS | PASS | PASS | PASS host? | PASS? |
| 360 ? 640 | PASS | PASS | PASS | PASS host? | PASS? |
| 375 ? 667 | PASS | PASS | PASS | PASS host? | PASS? |
| 390 ? 844 | PASS | PASS | PASS | PASS host? | PASS? |
| 393 ? 852 | PASS | PASS | PASS | PASS host? | PASS? |
| 412 ? 915 | PASS | PASS | PASS | PASS host? | PASS? |
| 430 ? 932 | PASS | PASS | PASS | PASS host? | PASS? |
| 768 ? 1024 | PASS | PASS | PASS | PASS host? | PASS? |
| 820 ? 1180 | PASS | PASS | PASS | PASS host? | PASS? |
| 1024 ? 768 | PASS | PASS | PASS | PASS host? | PASS? |
| 1280 ? 720 | PASS | PASS | PASS | PASS host? | PASS? |
| 1366 ? 768 | PASS | PASS | PASS | PASS host? | PASS? |
| 1440 ? 900 | PASS | PASS | PASS | PASS host? | PASS? |
| 1920 ? 1080 | PASS | PASS | PASS | PASS host? | PASS? |
| 844 ? 390 | PASS | PASS | PASS | PASS host? | PASS? |

? Host width/overflow and local authoritative-map fixture matrix passed; hosted Map App inner presentation FAIL at 390px and not approved at other sizes. It still needs separate release verification.
? Three checkout steps with synthetic HTTP responses. Assertions include document horizontal overflow, logo/top/menu behavior and progress transitions. Representative screenshots inspected; not a claim of exhaustive pixel comparison.
Additional 450px desktop embed, 280/350/600px resizing, hidden?visible, portrait?landscape and standalone map fixture cases passed in prior audit.

## 9. FUNCTIONAL REGRESSION
- Booking: PASS locally ? 31 focused tests plus 23 real PostgreSQL concurrency checks. Exact 15-minute boundary, past/future filtering, configured prices/ages, eight occupied seats, infant exclusion, no-adult rejection, atomic modify/cancel and rebooking all executed.
- Browser checkout/management: PASS using intercepted responses; no production reservations or emails.
- Navigation/mobile menu: PASS ? all six links, active indicators, logo, keyboard Enter/Escape, menu closure, booking entry at 390/1440. Full matrix logo checks also passed.
- Hero CMS / Amenities data: PASS local persisted draft/publication tests; authenticated admin UI NOT TESTED.
- Live Map host: PASS geometry/single iframe; hosted internal overlay FAIL; live moving-van/GPS correctness NOT TESTED.
- Language switching: NOT TESTED / unavailable in baseline (static EN).
- Full physical-device 390px journey: NOT TESTED. Browser journey covered hero/logo/menu, dialog handoff, all checkout steps, validation, reduced viewport and management separately; not represented as an on-device end-to-end run.

## 10. PERFORMANCE
No new tracking subscriptions, GPS calls or map engines. Same iframe retained during ordinary rerenders; explicit Reload intentionally remounts. Header adds no global listener; existing observer cleanup retained. Existing prototype is development-only. Native lazy loading retained for below-fold maps, eager /live.
Hero uses one responsive picture, reserved hero height and unchanged next/image infrastructure. No additional images/libraries. Existing hidden mobile/desktop dialog markup shares one provider; not replaced with another state system.
No new image recompression or optimization infrastructure. Quantitative field Core Web Vitals/CLS and memory profiling NOT TESTED. Initial loading placeholders and native lazy-image behavior remain; screenshots taken after scrolling to load visible sections.

## 11. ACCESSIBILITY
Semantic labelled logo, keyboard Enter/Escape, reduced-motion top scrolling, native form labels/validation, iframe title, configured age labels and text status preserved. Logo/CTA targets ?44px checked at 15 sizes; passenger controls 44px and fields ?48px by shared styles. Disabled controls and non-color confirmation/error text retained.
Photo text uses existing text-shadow; representative readability visually checked, but every CMS-image contrast combination was NOT certified. No global overflow-x hiding added. Physical touch/zoom/screen-reader/keyboard-overlay testing remains open.

## 12. SCREENSHOTS
All local artifacts; map fixtures and hosted map captures are distinguished.
- [Homepage desktop 1440?900](../private/master-home-1440.png)
- [Homepage mobile 390?844](../private/master-home-390.png)
- [Homepage mobile 360?640](../private/master-home-360.png)
- [Hero desktop 1440?900](../private/master-hero-1440.png)
- [Hero mobile 390?844](../private/master-hero-390.png)
- [Hosted map in homepage desktop](../private/master-live-1440.png)
- [Hosted map in homepage mobile](../private/master-live-390.png)
- [Booking Step 1, 390px](../private/master-book-step-1.png)
- [Booking Step 2, 390px](../private/master-book-step-2.png)
- [Booking Step 3, 390px](../private/master-book-step-3.png)
- [Booking desktop 1440px](../private/master-book-1440.png)
- [Mobile landscape 844?390](../private/master-home-844.png)
- [Management review 390px](../private/manage-390-review.png)
- [Cancelled booking 390px](../private/manage-390-cancelled.png)

Browser scripts/results remain in private/test-master-*.cjs, private/master-test-*.cjs, private/master-responsive-results.json and private/master-presentation-evidence.json. Local automated test commands:
npx tsx --conditions=react-server --test tests/database/hero-v2.test.mjs tests/database/customer-booking-management.test.mjs tests/database/availability-clock.test.mjs tests/integrations/passenger-availability.test.mjs tests/integrations/customer-management.test.mjs tests/integrations/checkout-browser-state.test.mjs
npm run test:postgres
npm run lint
Isolated private/booking-release: npm run typecheck; npm run build.

## 13. REMAINING ISSUES
Hosted Map App overlay/mode rollout; physical iOS/Android gestures/keyboard/browser bars; authenticated CMS UI editing; real live-state verification; quantitative CWV/contrast coverage.
Root typecheck remains affected by the pre-existing nested private copy missing credits.json; isolated candidate typecheck/build pass. No root config changed to conceal it.
Map App prior local candidate is not deployed; ordinary localhost embeds the hosted map. English-only baseline remains.
No approval requested or deployment performed; this report is the local review artifact.

## 14. RELEASE STATUS
NOT READY FOR PRODUCTION
