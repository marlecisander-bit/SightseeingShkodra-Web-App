# Hero CTA, canonical Adult fare and public navigation

29 September 2026. Local implementation; no commit or deployment.

## Audit and approved price policy

HomepageHero already had one responsive picture, one commercial block and the canonical BookingProvider entry. The mobile grid ended the media at row 2; the commercial block occupied row 3. Desktop used the same content in its existing full-photo composition. Header already used a single fixed header with IntersectionObserver and ResizeObserver for transparent/red state. These mechanisms remain.

Navigation is a flat list from the existing website content fields (Home plus five configured links), with EN and booking. There are no child navigation records or submenu configuration to expose; no destinations or routes were invented. The active indicator previously spanned the anchor box. Mobile/desktop navigation breakpoint remains 900/901; the mobile hero grid continues through 900, including 699/700/701. Compact header sizing remains through 700.

Previously, loadHomepage quoted only today's one-adult availability and the hero selected among available departures. After cutoff, on closed dates or when sold out, that list was empty. The missing piece was an explicit date policy and integration with the existing next-operational-date helper, not missing Adult pricing or a required schema redesign. The user chose: **next bookable service date, with its date shown**. Today is used when bookable; otherwise the lookup advances.

Canonical path: Calendar & Pricing -> passenger categories/ranges/date exceptions/departure settings -> passenger_quote_v1 -> read_passenger_availability_v1 -> getAvailability/quoteAvailability -> shared Adult fare projection -> existing BookingPriceIndicator in the single responsive hero.

passenger_quote_v1 owns standard, range, date and departure overrides and supported fixed/percentage/amount offers. Hero code does not implement them. It requests one Adult, zero Children and zero Infants, uses available departures, retains quote currency, and formats with the existing booking formatter. The minimum valid Adult quote on the selected date supplies From. It never chooses a cheaper Child/Infant or legacy product unit price. EUR remains the engine's existing supported currency, not a new homepage rule.

## Changes

- Mobile image layer now spans headline, supporting copy and normal-flow commercial rows. The media region clips its one image; its size includes the commercial block. Existing image URLs, picture source selection and focal points remain. A restrained lower gradient supports CTA readability. No individual CTA coordinates, negative margins or image overflow were introduced.
- Price, yellow Book and secondary Track occupy the lower photo. Discover occupies the next compact white row. Desktop hero composition is unchanged.
- Header logo is 145px on narrow mobile (was 104), 190px on tablet/compact desktop and 210px on larger desktop (was 170). Header heights remain 68/76px plus safe area.
- Hamburger/X has Open menu / Close menu names and expanded/control relationships. The dark red, nearly opaque translucent panel has optional blur, independent vertical scrolling, safe-area padding, background scroll locking and keyboard containment. Escape returns focus; navigation closes the panel; menu booking returns focus to the toggle. Returning to desktop closes an open mobile panel.
- Yellow underline is attached to an inline label, shared across both navigation layouts. For Home, measured line width was 34.69px rather than the 343px mobile link box.
- nextHeroFare only orchestrates existing date and quote services. Today's timetable and planner fares remain date-specific and unchanged. No new pricing API/table/migration or admin control.

Refresh uses the existing request-scoped React cache, dynamic connection and no-store backend requests. A normal page refresh reads updated prices. The teaser is server-rendered, avoiding a separate client price request and asynchronous price swap. Invalid, zero, missing or failed quotes fall back to Check availability while booking remains available. Lookup is bounded to 14 candidate evaluations and a five-second additional lookup budget; unresolved searches fall back rather than display an arbitrary price. Normal availability calls can materialize dated inventory through the existing engine; this behavior was reused, not reimplemented. No manual hosted pricing or CMS writes were performed.

## Evidence

| Check | Result |
|---|---|
| 320x568, 375x667, 390x844, 393x852, 430x932 | PASS: photo includes Book/Track; Discover follows; no document overflow |
| Widths 699, 700, 701, 768, 820, 900 | PASS: same photo/commercial grid; no breakpoint gap or overflow |
| Widths 1024, 1280, 1440, 1920 | PASS: desktop composition retained; logo/nav/booking boxes do not overlap; no overflow |
| Photo boundary | PASS: Track ends 20px before photo bottom; Discover starts 8px after it in tested mobile cases |
| Van composition | PASS in inspected mobile/desktop screenshots: central van remains visible above the mobile commercial block; existing crop/focal metadata retained |
| Top, scrolling and return | PASS: transparent at top, fixed solid red after leaving hero threshold, transparent again at top |
| Menu top/scrolled and landscape | PASS: opens in both states; 844x390 menu has 313px visible height and 405px scroll content, with bottom inside viewport |
| Keyboard/focus | PASS: opening focuses Home; reverse Tab reaches Close menu; Escape restores toggle; menu booking returns focus correctly; existing visible focus treatment retained |
| Navigation | PASS: Route selection closes menu, restores body scrolling and reaches #route; underline follows label width |
| Current fare | PASS: desktop/mobile From EUR10 dated 2026-09-30; real local booking dialog for that date shows 1 Adult EUR10 total |
| Price update | PASS in disposable database: existing admin pricing function changes Adult EUR10 to EUR12; a fresh hero lookup and booking quote both return EUR12 |
| Seasonal/date/offer price | PASS in disposable database: Adult EUR15 range and 20% departure offer yield EUR12 teaser matching that departure; cheaper Child ignored |
| Closed/sold-out dates | PASS: closed first date and fully held second date advance to next bookable date using engine helpers |
| Failure handling | PASS: failed next-date lookup retains published product/today's schedule and omits teaser amount; zero and wrong-category samples are not advertised |
| Booking entry regression | PASS: desktop header, desktop hero, mobile hero and menu open the existing dialog; no new reservation/hold submitted |
| Track live | PASS: opens /live and retains the independent full map iframe URL; map/GPS code unchanged |
| Test chain | PASS: 276 tests, 0 failed/skipped (3 component, 17 identity, 96 integration, 137 database, 23 PostgreSQL) |
| Additional failure test | PASS: updated public-homepage suite 9/9; includes one additional new case after the full chain, giving 277 passing distinct tests overall |
| Final lint / TypeScript / production build | PASS: npm run check after final source edits |

Logs: private/hero-nav-tests.log and private/hero-nav-final-check.log (local only). Price mutation tests used disposable PostgreSQL fixtures; real hosted prices were not changed. Browser evidence is Chrome viewport emulation, not physical-device certification. Full assistive-technology/contrast certification and physical Safari/Android validation remain unverified. Dynamic map operational accuracy is outside this task.

## Files in this task

- src/app/(public)/public.css
- src/components/public/booking.tsx (Header only)
- src/components/public/homepage-hero.tsx
- src/components/public/homepage-view.tsx (hero fare prop only; pre-existing expandable-text changes retained)
- src/modules/content/hero-fare.ts
- src/modules/content/homepage.ts
- src/modules/content/homepage-server.ts
- tests/database/hero-fare.test.mjs
- tests/integrations/public-homepage.test.mjs
- docs/HERO-CTA-PRICE-NAVIGATION.md
- docs/DECISIONS.md and docs/PHASE_STATUS.md (task appendices)

No observed code blocker remains. Non-blocking limitations: bounded lookup may show Check availability during extended sold-out periods or backend slowness; physical-device and comprehensive accessibility acceptance remain pending. Prior expandable-text work and unrelated email/SQL/report working-tree edits are preserved. Capacity, category validation, cutoff, modification/cancellation, QR, email, independent tracking, admin structure, CMS schema and SEO structure were not modified by this task.

## Extended acceptance — sections 41–78

29 September 2026. No additional application changes, commit or deployment.

Complete npm test: **277 passed, 0 failed/skipped** (3 component, 17 identity, 97 integration, 137 database, 23 PostgreSQL). Log: private/hero-nav-complete-tests.log. Previous final lint, TypeScript and production build remain applicable to unchanged source.

Added 901x900: PASS, no overflow/header overlap. Logo right235px, nav317–695px, booking709–841px. Earlier 15 viewport results remain above.

All six desktop active indicators match label width: Home34.69px, Tour25.30px, Route34.70px, Explore96.13px, Live52.75px, FAQ26.02px. Mobile Home measured34.69px and prior Route checked; shared label rule applies to all. This is not a separate six-route mobile browser matrix. Logo from /tour#faq returned to homepage at scrollY0.

Menu close restored positions0,738,1476,2952 (top, midhero, afterhero, midpage). At midpage opening temporarily shifted2952 to2941 during locked layout; closing restored2952. At844x390 menu independently scrolled92px with Book bottom364px inside viewport390px. Temporary viewport override reset.

iPhone Safari: **PENDING REAL-DEVICE VALIDATION**.
Android Chrome: **PENDING REAL-DEVICE VALIDATION**.

Submenus: N/A; current navigation is flat. Language control/switching and translated label testing: N/A; existing EN is informational (more languages coming soon), preserved without inventing behavior.

Accessibility PASS is limited to recorded keyboard, focus and ARIA checks; comprehensive assistive-technology/contrast acceptance remains pending. Performance PASS is limited to no new polling/dependency/duplicate client price request and bounded server lookups; full profiling remains pending. SEO regression PASS is scoped to retained headings, alternative text and routes. Desktop regression PASS is scoped to inspected layouts.

Price-source and all hero/header/booking evidence remains above. No schema blocker: canonical one-Adult quotes and quote currency drive both hero sizes. Fourteen-candidate/five-second lookup may fall back to Check availability; no further backend change required for this implementation. No hardcoded hero price matches found in src.

Files: task file list above; continuation changed only this report and PHASE_STATUS.md. Blockers: no observed application blocker; real-device acceptance incomplete. Non-blocking findings: bounded lookup fallback; exhaustive accessibility/performance evidence pending. No deployment.

## Final supplement — sections 79–112

LOCAL IMPLEMENTATION STATUS: **READY FOR REVIEW**. Not a production-readiness declaration. No deployment.

A concrete gap was fixed: uncovered content below the open mobile menu could receive pointer input. A restrained fixed backdrop now intercepts those taps below the header/menu; tapping it closes the menu and restores hamburger focus. The existing header stays above it, and the canonical dialog remains in the browser top layer. No menu animation was added, so there is no new motion to disable. Only booking.tsx Header and public.css changed in this continuation, plus these reports.

Source comparison confirms one hero picture/media owner, normal-flow commercial controls, cover without aspect-ratio distortion, retained focal settings, localized lower gradient, compatible transparent/red header heights and label-relative underline. Existing typography/number formatter retained. Long-text changes predate this task and were left untouched. Additional intended visible differences are the date beside the fare, compact white Discover row and the subtle menu backdrop. No pricing, capacity, coupon, map, CMS or route business logic changed.

“From” means the minimum publicly available one-Adult canonical departure quote on the displayed next bookable date, not a minimum across all seasons. Lookup receives no coupon/private-discount input and filters unavailable departures. Outside service dates, existing next-operational-date lookup advances to configured service; no next date or unresolved lookup means Check availability, never an invented fare. Both responsive layouts share one server-provided fare.

**ADMIN PRICE UPDATE PROPAGATION: NOT VERIFIED end-to-end in the browser.** This supersedes earlier unqualified PASS wording. A controlled disposable-database change through the existing admin pricing function proved fresh hero projection and booking quote both change EUR10 to EUR12, but did not exercise the complete admin -> rendered hero -> booking dialog sequence against that changed fixture. Hosted price data was not changed. Existing real-data hero/dialog agreement at EUR10 is separate supporting evidence.

Browser continuation used actual saved photograph/logo/copy/navigation and current canonical fare. Backdrop hit-testing and tap dismissal passed. One open booking dialog was observed from hero and menu; menu/backdrop removed before dialog opened. Partial-hero dialog close restored its opening scroll position (457px after the browser brought the link into view). Discover reached #home-intro without opening a dialog. Track reached /live with the unchanged independent full-map iframe. At320x568 all menu items already fit; forced scrolling is unnecessary. Internal scrolling at shorter landscape height was verified previously.

Final npm run check PASS after backdrop edit (lint, TypeScript, production build): private/hero-final-supplement-check.log. Prior complete277-test chain remains supporting evidence; no engine/test source changed in this supplement. Physical iPhone Safari and Android Chrome: **PENDING REAL-DEVICE VALIDATION**. Full browser price-update propagation and physical-device validation remain release acceptance gaps.

### Local screenshot evidence

Screenshots are local review artifacts, not committed assets. Chrome emulation, not physical devices.

![390x844 hero top](../private/hero-review/01-mobile-top.png)
![390x844 lower hero](../private/hero-review/02-mobile-lower.png)
![390x844 fixed red header](../private/hero-review/03-mobile-red-header.png)
![390x844 open menu](../private/hero-review/04-mobile-menu.png)
![320x568 menu; all controls fit](../private/hero-review/05-small-menu.png)
![430x932 photo ending and Discover](../private/hero-review/06-wide-mobile-transition.png)
![1440px desktop hero](../private/hero-review/07-desktop-hero.png)
![1440px active underline](../private/hero-review/08-desktop-underline.png)
