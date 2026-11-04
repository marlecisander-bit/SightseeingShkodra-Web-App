# Mobile booking popup — local implementation, 4 November 2026

Status: implemented locally on `work/mobile-booking-20261104`; no commit, push, publication or deployment. Base: `602f9432d9974b90d48121bfc5d29ca59270148a`. Existing unrelated local changes retained.

## Scope and inspection

The existing BookingProvider, CheckoutFlow, availability reader, passenger controls, public checkout contract, confirmation pass and meeting-point component remain the implementation. The popup's existing mobile boundary is 767px; tablet/desktop retain their original presentation and contact-preview sequence. Homepage hero/cards are unchanged.

Pre-change defects: the shared introduction and meeting point consumed mobile space before When; a large heading and booking-field margins persisted; date selection was a native field with no compact date strip; departure/category prices were absent from those controls; mobile contact entry required a second contact-preview screen; the Review summary omitted the meeting point and product title. Existing full-screen shell, footer portal, scroll locking, focus/history and pending-request guards were reused.

The supplied reference URL, `https://chatgpt.com/c/6aeb4a46-64b0-83ed-b6ad-132ce2692609`, opened the ChatGPT home/sign-in surface rather than the referenced conversation in the available browser. Exact reference-image comparison remains UNVERIFIED. Implementation follows the complete written attachment.

## Changes

- `booking.tsx`: responsive presentation flag without remounting the checkout, compact mobile title, shared field/price wiring, mobile date focus recovery, and visual-viewport width/offset tracking alongside existing height handling. Existing measured-width body lock and scroll restoration remain intact.
- `checkout-flow.tsx`: mobile When → Who → Review headings; contact fields and final confirmation share the third mobile screen; original validation, terms, hold/release/order/idempotency and confirmation flow retained. Contact and selection state survive normal backward navigation.
- `mobile-booking-date.tsx` / CSS: native swipeable seven-day strip and viewport-contained calendar subdialog. Calendar dates are checked on tap through the existing availability API; unavailable dates cannot be committed. No invented availability, eager month fetch, new API or dependency. Calendar Escape, Close and Back consume only the calendar surface and restore focus.
- `use-availability.ts`: one shared fetch/validation path for both readers. An exact matching calendar response seeds the selected date for up to five seconds, avoiding an immediate duplicate fetch; checking an already-selected date refreshes its result. Counts/product/generation/revision must match. Existing periodic/focus refresh and abort/error handling retained.
- `booking-controls.tsx` / CSS and `booking-dialog.module.css`: authoritative departure/category prices, compact passenger rows, mobile product/meeting-point summary, single-column contact form, fixed full-width yellow action, safe-area padding and central scrolling. No global overflow clipping added.

Browser checks caught and resolved two implementation issues: inherited public-page CSS overrode the compact heading/footer, and native Escape could close both nested dialogs. A 150% pinch-zoom check also exposed the existing width-only containment gap; the mobile shell/calendar now follow visualViewport width and horizontal offset. Desktop styling does not consume those new width variables.

## Validation results

| Acceptance area | Result | Evidence / limits |
| --- | --- | --- |
| Mobile full-screen shell, mounted homepage, compact header, progress, fixed action and internal scrolling | PASS | Chrome geometry and screenshots at every requested width; exact underlying scroll restored after closing |
| When, date strip, calendar and departure prices | PASS | Live public availability; calendar at nine mobile/short/landscape sizes; unavailable/error/retry scenarios are explicitly injected over the real response |
| Who, category prices, running total and existing rules | PASS | Actual Loop Tour quote: adult €10, child €8, infant free; group total €18; adult-removal guard; existing booking/database integration suites |
| Review, Maps, required contacts, terms, confirmation/QR rendering and duplicate prevention | PASS locally | Same checkout engine; reservation responses intercepted locally, reference `LOCAL-MOBILE-REVIEW`; no real reservation/payment/email |
| Backward selections/contact preservation, dirty-close prompt, pending Escape/Back guard and focus restoration | PASS | Native Chrome interaction plus existing tests; calendar Escape/Back tested separately from parent |
| No horizontal page/dialog/content overflow; footer does not cover scroll container | PASS | 72 measured stages across twelve viewport scenarios, plus six stages at 568×320; two additional stress layouts |
| Tablet and desktop unchanged | PASS | 18 stage geometry comparisons at 768×1024, 1024×768 and 1440×900: zero differences; screenshot comparisons described below |
| Enlarged text and browser pinch zoom | PASS in emulation | 150% computed text-size stress; 150% native Chrome pinch zoom: 260px visual viewport, 260px dialog, 228px action fully contained |
| Keyboard-sized viewport | PASS in emulation | 390×400, focused email remains visible and action remains reachable; actual operating-system keyboard unverified |
| Existing languages | PASS for supported English | Current booking UI supports English only. No new locale or shared CMS copy introduced; other languages are not available to test |
| Physical iOS Safari / Android Chrome, actual keyboards, device safe areas and screen-reader speech | UNVERIFIED | No physical devices or those browser runtimes available; Chrome CDP emulation does not establish physical-device acceptance |
| Exact supplied mockup match | UNVERIFIED | Private reference unavailable in authenticated browser context |
| Real booking/email/payment end-to-end | UNVERIFIED intentionally | No production mutations authorized or performed for testing; existing integration tests pass |
| Automated suite / lint / TypeScript / normal production build | PASS | Fresh 678 tests, zero failures/skips; zero-warning lint; typecheck and standalone tsc; normal `npm run build` |

No outstanding observed local layout failure. Reference access and physical-device verification remain delivery limits.

### Browser method and safety

Real installed Google Chrome was driven with CDP, touch/mobile metrics and native input. Production CMS product/content/image snapshot and the current public meeting-point payload were used. Availability was forwarded read-only to the existing production GET endpoint. All checkout mutations were intercepted before reaching the network and answered locally. A second CDP network guard would abort any escaped checkout request; none occurred. No database/GPS/schema/configuration or external Live Map changes.

Full local flow: 320×568, 360×640, 375×667, 390×844, 393×852, 414×896, 430×932, 768×1024, 844×390, 390×480, 1024×768, 1440×900, plus 568×320. Calendar additionally checked at 390×400. Baseline and candidate used the same CMS data and viewport settings. Desktop screenshot comparisons are identical at 768px; the 1024/1440 comparisons differ by only 0–7 raster pixels per image, with no geometry changes. Accessibility evidence covers semantics, native validation, focus behavior and reduced motion, not a formal screen-reader audit.

The temporary development-only review route was archived as text under the evidence directory and removed before final typecheck/build. Its fixed-upstream availability proxy and fake checkout never ship. Removing it exposed stale generated `.next/dev/types/validator.ts` references; regenerating route types after clearing that generated cache resolved them. No validation was disabled. Build-generated next-env changes were restored; standalone tsc passed afterward.

### Fresh command results

- `npm test`: 174 component + 24 identity + 228 integration + 217 database + 28 Postgres + 7 CMS verification = **678 passed**, zero failed/skipped.
- `npm run lint`: passed, zero warnings.
- `npm run typecheck`: passed after generated-route cache refresh.
- `npm run build`: passed with normal deployment environment checker and Next.js 16.4.2 Turbopack; no flags, validation bypass or dependency/config changes.
- `npx tsc --noEmit`: passed after restoring generated next-env file.
- `git diff --check`: passed.

## Evidence

Directory: `docs/evidence/mobile-booking-20261104/`.

- `after-results.json`, `landscape-results.json`: full-flow geometry, completion checks and checkout network guard results.
- `extras-results.json`: calendar containment, recovery, contact preservation, dirty dismissal, pending dismissal and zoom measurements.
- `desktop-comparison.json`, `desktop-pixel-comparison.json`: baseline/candidate comparison.
- `tests-final.log`, `lint-final.log`, `types-final.log`, `types-restored.log`, `build-final.log`: final checks.
- `browser-review.mjs`, `browser-extras.mjs`, `harness/*.txt`: reproducible review procedure; harness is archived text, not an application route.
- `public-root-props.json`: actual CMS/meeting-point review input.

Representative screenshots: [When 320px](evidence/mobile-booking-20261104/after-when-320x568.png), [Who 320px](evidence/mobile-booking-20261104/after-who-320x568.png), [Review 390px](evidence/mobile-booking-20261104/after-contact-390x844.png), [Calendar](evidence/mobile-booking-20261104/extras-calendar-320x568.png), [Confirmation](evidence/mobile-booking-20261104/after-success-390x844.png), [short keyboard-sized viewport](evidence/mobile-booking-20261104/extras-keyboard-sized-viewport.png), [150% pinch zoom](evidence/mobile-booking-20261104/extras-pinch-zoom-150.png).
