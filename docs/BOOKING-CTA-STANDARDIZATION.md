# Public booking CTA standardization

29 September 2026 — local implementation; not deployed.

## Canonical implementation

`src/components/public/checkout-flow.tsx` (`CheckoutFlow`) remains the sole public checkout UI. `BookingProvider` in `src/components/public/booking.tsx` owns the single native booking dialog, shared selection, availability and reset. Its dialog dynamically mounts `CheckoutFlow`; `/book` mounts the same component through `BookingFlow`.

The standard tour comes from the existing public availability/checkout configuration. No CTA supplies an alternative product, fare, capacity or booking implementation. Existing date, departure and passenger selection is retained on ordinary reopen. Existing checkout session recovery remains authoritative once a hold exists. Explicit rebooking retains the existing reset.

`PublicBookingLink` adapts existing links to the provider's opener for ordinary `/book` activation. It retains anchor markup, classes, content, href and caller click callbacks. Modified clicks/new-tab targets retain direct-route behavior. Other routes and query/hash-bearing deep links retain navigation and are not silently stripped or interpreted. Existing CMS `/#booking` links already resolve to `/book` through `resolveWebsiteLink`.

`BookButton` continues to use the same provider opener. The opener ignores an already-open dialog. Dialog content receives focus after mounting; native modal behavior, Escape, the existing Tab loop and body-scroll restoration remain in use. The timetable popup closes before transferring to booking, returning focus to its visible timetable trigger when booking closes. Opening from the mobile header closes its navigation menu.

## Entry inventory

Counts represent **12 distinct CTA definitions**, not every repeated DOM instance or viewport. Six previously navigated to `/book`; those six now open the canonical dialog. The other six already used the provider or the active checkout. The repeated destination definition currently produces four cards; planner definitions appear on both Home and Live; header/footer repeat across public pages.

| # | Location / component | Previous action | Result |
|---|---|---|---|
| 1 | Desktop/mobile header, `Header` / `BookButton` | Provider dialog | Retained; mobile menu closes |
| 2 | Desktop/mobile hero, `HomepageHero` / `ActionLink` | Navigate `/book` | Shared dialog through `PublicBookingLink` |
| 3 | Shared footer invitation, `Footer` / `ActionLink` | Navigate `/book` | Shared dialog |
| 4 | Tour product/pricing card, `TourView` / `BookButton` | Provider dialog | Retained |
| 5 | Tour How it works, `BookingBar` | Shared date/guest/departure selection then provider dialog | Retained, including selection |
| 6 | Tour FAQ booking answer, `ActionLink` | Navigate `/book` | Shared dialog |
| 7 | Explore destination cards, `ExploreView` / `BookButton` | Provider dialog | Retained; all four cards exercised |
| 8 | Live page Plan your ride, `BookButton` | Provider dialog | Retained |
| 9 | Home/Live day-planner ticket tile, `DayPlannerStrip` | Navigate `/book` | Shared dialog |
| 10 | Home/Live timetable popup Check availability, `DayPlannerStrip` | Navigate `/book` | Close timetable and open shared dialog |
| 11 | Cancelled Manage Booking, `CustomerBooking` | Reset and navigate `/book` | Same reset then shared dialog |
| 12 | Confirmation/cancelled checkout Book another day, `CheckoutFlow` | Reset active canonical flow | Retained; already inside canonical UI |

Additional configurable navigation was audited: header menu links, footer navigation and the homepage introduction link now use the same adapter. They currently target non-booking pages; if their existing CMS link is `/book` (including resolved `/#booking`), they use the dialog. These conditional slots are not counted as additional current booking CTA definitions.

Known intentional distinctions:

- `/book` remains a directly accessible full page using `CheckoutFlow`; new-tab/link-copy behavior remains available. No WordPress/external embedding implementation exists in this repository.
- The approved mobile homepage design hides the duplicate header booking button; the hero is its booking entry. No mobile header CTA, sticky bar or floating CTA was invented. The previously removed bottom bar remains absent.
- The homepage footer invitation is currently hidden by saved CMS visibility; the identical shared invitation was exercised on Tour, where it is visible. No visibility data was changed.
- Route cards link to editorial destinations; tracking links open Live Map. Management, modification, cancellation and private QR links keep their specific actions. They are not new-booking CTAs.
- `/your-day` remains an explicitly labeled sample ticket with disabled sample action; it is not a competing booking implementation.

No legacy booking modal/controller was found after the source/reference audit. **Legacy implementations removed: NONE.** The timetable popup is informational and remains separate; it no longer stacks beneath the booking dialog on transfer.

## Changes and protected scope

Changed frontend files: `booking.tsx`, `ui.tsx`, `homepage-view.tsx`, `day-planner-strip.tsx`, `customer-booking.tsx` under `src/components/public/`.

The existing hero HTML, imagery, CSS and responsive work were preserved. One booking engine, pricing source, availability source and capacity source remain. No application API, database, migration, payment, QR, email, Live Map, admin/CMS or booking business-rule change. Unrelated pre-existing working-tree changes remain separate. No deployment or hosted booking mutation was performed.

## Verification

All existing tests passed: **269 total, 269 passed, zero failures/skips** (17 identity, 96 integration, 133 database, 23 PostgreSQL concurrency). Existing coverage includes passenger pricing, seasonal overrides, infant zero-seat accounting, child-only rejection, eight-seat/concurrent capacity, past dates and 15-minute cutoff, booking creation, QR recovery, modification, cancellation and rebooking. These are regression results, not a claim of a new full hosted acceptance run.

`npm run check` passed lint, TypeScript and the normal production build (25 pages). Local logs: `private/booking-cta-tests.log` and `private/booking-cta-check.log`.

Chrome browser checks:

- Header, hero, footer, tour card/bar/FAQ, all four Explore cards, Live booking action and both day-planner entry types opened the provider's dialog while retaining their current URL.
- Timetable transfer left exactly one open dialog; closing returned focus to the visible timetable trigger.
- Header double-click left one dialog; hero Enter activation opened the same flow. Close button and Escape returned focus to the originating control. Tab/Shift+Tab wrapped within the dialog; native modal accessibility excluded background controls. Mobile header activation closed its open menu.
- A real existing availability quote for 1 October 2026 exposed four departures and date-scoped adult From €10. One adult + one child + one infant produced the authoritative €18 total, with infant Free/no seat. Closing and reopening through another entry preserved date, party, departure and total. No hold or booking was created.
- A tab-scoped synthetic cancelled-management response verified Book another day opens the same dialog and resets to the existing one-adult default selection. Interception was then cleared and the fixture page left. This was a UI test, not a database cancellation.
- `/book` directly loaded one `CheckoutFlow` without an open modal.
- Both the dialog and `/book` passed document-overflow checks at 320×568, 375×667, 390×844, 393×852, 430×932, 768×1024, 1024×768 and 1440×900. The dialog also had no horizontal internal overflow and one mounted flow at every size. Desktop, tablet and mobile screenshots inspected; mobile sheet scrolling and persistent close/action presentation retained.

Accessibility PASS is scoped to the changed entry behavior and the keyboard/modal checks above. Physical iPhone/Android, screen-reader certification and comprehensive accessibility/performance audits are not newly certified. Dynamic General From Price remains **BACKEND-DATA LIMITATION**; no hardcoded marketing price was introduced.

## Result

Header, hero, mobile, other public CTAs, `/book`, shared booking UI, dynamic date-scoped pricing, availability, capacity, cutoff, modification, cancellation, responsive UI, targeted accessibility, TypeScript, lint, tests and production build: **PASS** within the verification scope above.

Blockers: none for this local CTA standardization.

Non-blocking findings: general From-price backend limitation; physical-device and comprehensive accessibility/performance acceptance remain outside the evidence collected here. The existing independent map can display a slow-loading notice while its iframe is visible; its engine and integration were not changed.
