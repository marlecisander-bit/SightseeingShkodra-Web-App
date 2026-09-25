# Mobile booking dialog — local UX update

## Audit
The original shared dialog rendered date, all passenger rows, departure dropdown and detailed availability simultaneously, with a large heading and scrolling final action. The global public footer/reset styles also override unscoped modal footer padding. Existing passenger changes reset the chosen departure, incompatible with selecting When before Guests.

## Implementation
Reuse BookingProvider, BookingSelection, useAvailability, QuantityStepper, passengerCount/ageLabel and the existing /book CheckoutFlow. Below 768px the existing native dialog becomes a bottom sheet capped at 94dvh: compact header, 44px close control, small step indicator, scrollable content and non-scrolling bottom actions with safe-area padding. Desktop keeps BookingFields as one form.

When -> Guests -> Review -> existing /book. Date is a labelled native date control with a full-field hit area and calendar icon. Real API departures render as touch cards with textual Available/Selected/Unavailable states; no hardcoded schedule. Guests use compact 44px controls and configured age ranges only. Review/total use the API passengerQuote without recalculation. State remains in the same provider through steps, close/reopen, resize and checkout handoff.

Mobile passenger changes retain the departure ID while the existing hook refreshes its validity/price. An unavailable selection blocks progression and offers return to When. The stepper prevents adding dependants without an adult or removing the last adult while dependants remain. Existing domain validation remains authoritative. No hold, booking or payment is created by the sheet. Accurate footer explains that seats are not held and payment is at the meeting point.

## Accessibility
Native showModal dialog semantics/inert background and Escape behavior retained. Explicit Tab wrapping now excludes CSS-hidden controls. Step headings receive focus and progress is announced. Labels, pressed/disabled states, visible focus, reduced motion and touch targets are retained. Body scroll is locked/restored while open; only content scrolls. Native date picker is browser/OS owned.

## Verification
Production-build Edge/Chromium browser automation with mocked availability (no real seat reservation or email) exercised all eight requested sizes: 320x568, 360x800, 375x812, 390x844, 393x852, 430x932, 768x1024, 1440x900. Screenshots inspected, no horizontal overflow, sheet/footer contained within viewport. Flow checked selection, adults/children/infants, totals, back-state preservation, close/reopen, disabled sold-out departure, API error/retry, loading, and handoff into the existing /book selection. Additional 390x450 resize simulates reduced viewport; it is not proof of physical mobile keyboard/browser chrome behavior. Real iOS/Android date picker, software keyboard and assistive-technology testing remain manual release checks.

Lint, TypeScript and production build passed. Existing targeted domain/API regression run: 28 passed, 2 failed in unchanged public-availability.test.mjs. Those old expectations omit the now-present passengers:undefined request property and expect 503/UNAVAILABLE instead of current 409/PRICING_UNAVAILABLE. Neither the test nor API module differs from Git HEAD; no backend fix or altered expectation is included in this UI task.

## Files / scope
- src/components/public/booking.tsx: existing provider/dialog/stepper presentation and focus behavior.
- src/components/public/booking-dialog.module.css: scoped responsive sheet styles.
- docs/MOBILE-BOOKING-DIALOG.md and docs/PHASE_STATUS.md: evidence and limits.
- Ignored private/test-booking-sheet.cjs and private/booking-*.png: local verification script/screenshots.

Database changes: none. Availability/pricing/departure generation, checkout/booking/payment, email and tracking logic unchanged. Pending email work from earlier tasks preserved. No deployment.

LOCAL ONLY — NOTHING DEPLOYED

Publication authorized by user on 25 September 2026. Publishing the mobile booking dialog via the existing GitHub main / Netlify website pipeline. Email admin/activation preparation, scheduler and migration remain local and excluded from this release.
