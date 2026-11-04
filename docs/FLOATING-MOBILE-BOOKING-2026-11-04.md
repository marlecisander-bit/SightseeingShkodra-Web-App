# Approved floating mobile booking popup — 4 November 2026

Implemented and validated locally on `work/floating-mobile-booking-20261104`. No commit, push or deployment. Unrelated local edits preserved. Production remains the previously published release.

## Reference and visual comparison

Approved image: [shared mockup](https://chatgpt.com/s/m_6aeb69d97e448191a20f972c826a4b40). The public share opened successfully in Chrome. A review copy is saved as `docs/evidence/floating-booking-20261104/approved-reference.jpg`.

The implementation follows its floating white rounded surface, dimmed website, logo-free burgundy header, pill-style active step, inline Monday-first monthly calendar, compact four-column times, yellow selected departure, grey date/total strip and yellow Continue action. When/Who/Review Daily Ticket screenshots were inspected against the reference.

Deliberate responsive/data differences:

- The written requirement specifies approximately12 CSS px side margins; those take precedence over the larger outer margins illustrated in the image. Safe-area insets can increase these margins. Height is content-driven, capped at92% of the usable visual viewport; short screens scroll internally.
- Actual CMS products, real booking dates, available departures and authoritative prices replace the illustrative8 November/€45. Screenshots show5 November, with the actual Daily Ticket €15 adult quote and €25 adult/child/infant group quote. The Loop Tour retains its own €10/€18 quotes.
- Existing required contact fields, terms, countdown and Maps link remain on Review. They scroll inside the same modal when necessary. The real underlying homepage remains unchanged rather than reproducing the mockup's background artwork.
- Calendar dates with no response yet remain neutral and are checked when tapped. Past/adjacent-month and confirmed-unavailable dates are disabled. The existing API supports one date per request; no month-wide availability is fabricated, and no new endpoint or eager30-request month sweep was introduced. Unknown dates cannot be committed until the real quote confirms a bookable departure. Rejected-date state clears on focus/30-second refresh or month navigation so it is not permanent.

## Changed files

- `src/components/public/mobile-booking-date.tsx` and `.module.css`: reuse the prior monthly-grid/check-before-selection logic inline. Remove the date carousel, secondary calendar dialog, trigger and calendar history entry. Render adjacent-month muted cells, real selected date and month chevrons; preserve abort/retry behavior and existing validated quote reuse.
- `src/components/public/booking-dialog.module.css`: floating phone shell below the existing768px boundary,12px/safe margins,22px corners, shadow, dim backdrop, centred usable-area sizing, compact header without logo, progress pills, compact review and footer. Keep header/footer outside central scroll. Native discrete open/close transitions respect reduced motion. Asymmetric notch insets are accounted for in centering, not just width/height.
- `src/components/public/booking-controls.module.css` and `.tsx`: four compact departure buttons, grey unselected/yellow selected, “Departure time” label. Price/availability text remains available to assistive technology while the visible buttons show compact times. Actual departure count/configuration remains authoritative.
- `src/components/public/checkout-flow.tsx`: mobile labels “Choose your date”/“Continue”, mobile product separator and compact date formatting. Existing reserve/release/order state machine, fields and validation unchanged.
- `src/components/public/booking-presentation.ts`: optional compact date presentation for mobile footer; default desktop date formatting unchanged.
- `tests/components/mobile-booking-date.test.mjs`: update calendar regression to require inline monthly rendering, Monday-first complete weeks, no additional dialog/trigger, unavailable rejection and month navigation. Existing exact quote reuse/wrong-product validation regression retained.

No booking API, database/schema, inventory calculation, price, expiration, payment, email, product configuration or dependency changes.

## Blue outline cause

`CheckoutFlow` intentionally gives its step `<h2>` `tabIndex=-1` and programmatic focus/scroll on step changes. Chrome's matched CSS identified the actual ring as **`:focus-visible` in the user-agent stylesheet**, `outline: -webkit-focus-ring-color auto 1px`; computed colour was `rgb(0,95,204)`. It was not a heading border authored by the app.

The new selector only clears the focused non-interactive checkout heading's outline within the dialog. Heading focus/announcements remain; button, date, input, link and other interactive focus indicators are retained. Proof: `heading-outline-source.txt` in the evidence directory.

## Validation

| Area | Status | Evidence |
| --- | --- | --- |
| Floating overlay, reference composition and three steps | PASS | Real Chrome screenshots, including Daily Ticket When/Who/Review at390px; website visible behind |
| Responsive containment | PASS |320×568,360×640,375×667,390×844,414×896,430×932,768×1024,568×320,844×390,390×480,1280×800,1440×900;72 measured stage records plus6 Daily Ticket records |
| Calendar and availability | PASS | Inline grid, only one open dialog, no horizontal overflow; real GET availability; explicit unavailable/error/recovery edge simulations; selection validates before commit |
| Who and Review | PASS | Authoritative category/group prices, adult guard, required-field validity, Maps, preserved counts/contact details through Back, dirty-close prompt |
| Confirmation/QR rendering and duplicate guard | PASS locally | Complete journey using locally intercepted reservation responses; double click produces one order; pending Escape/Back cannot dismiss; existing pass/QR rendered |
| Scroll/focus and keyboard | PASS in Chrome | Existing fixed-body lock and exact scroll restoration; trigger focus restored; focused email and footer contained at390×400;200% text stress; non-interactive heading ring absent |
| Animation and safe areas | PASS in emulation | Normal-motion transition includes opacity/transform/display/overlay; closed display:none after transition. Reduced-motion flow checked. Asymmetric-inset stress568×320 gives44px left,12px right,12px top,21px bottom margins |
| Desktop/tablet regression | PASS |12 compared stages at768 and1440: zero dialog/header/content/footer/input/action geometry changes;1280 full flow also passes. Only requested shared heading-ring correction changes desktop visuals |
| Project checks | PASS | Fresh678 tests, zero failures/skips; zero-warning lint; TypeScript; normal Turbopack production build; standalone tsc after generated-file restoration; git diff --check |
| Actual iPhone Safari / Android device / OS keyboard / notch | UNVERIFIED | Chrome viewport, text and safe-inset emulation is not physical-device testing |
| Real email/payment/reservation delivery | UNVERIFIED intentionally | No real bookings, payments or emails created; existing integration/database tests pass |

The review harness used current public client CMS props captured read-only from the website and the existing read-only production availability endpoint. All checkout responses were intercepted locally; a second network guard would abort escaped checkout requests. Recorded escaped requests:0. Sold-out/error modes are explicit edge simulations over real availability responses, not asserted production facts.

Temporary development review routes were archived as text and removed before the final production build. Generated next-env changes were restored afterward. Evidence remains local; no publication action is authorized by this task.

## Screenshots and evidence

Directory: `docs/evidence/floating-booking-20261104/`.

- [When — Daily Ticket390px](evidence/floating-booking-20261104/reference-when-390x844.png)
- [Who — Daily Ticket390px](evidence/floating-booking-20261104/reference-who-390x844.png)
- [Review — Daily Ticket390px](evidence/floating-booking-20261104/reference-contact-390x844.png)
- [Filled Review390px](evidence/floating-booking-20261104/reference-review-390x844.png)
- [Small320px](evidence/floating-booking-20261104/after-when-320x568.png)
- [Keyboard-sized viewport](evidence/floating-booking-20261104/extras-keyboard-sized-viewport.png)
- [Asymmetric safe-area stress](evidence/floating-booking-20261104/extras-asymmetric-safe-area-stress.png)

`after-results.json`, `reference-results.json`, `extras-results.json`, `desktop-comparison.json`, `current-public-cms.json`, browser runners, archived `harness/*.txt`, `check.log`, `tests.log` and `tsc-restored.log` retain the measurements and verification procedure.
