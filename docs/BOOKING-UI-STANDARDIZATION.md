# Booking UI standardization — 29 September 2026

## Pre-implementation surface audit

| Current surface | Component | Current source | Shared presentation |
|---|---|---|---|
| Header, tour and editorial CTAs | BookButton / BookingProvider | One provider selection and useAvailability | Existing provider and CheckoutFlow |
| Homepage hero / footer | HomepageHero / HomepageInvitation links | Published CMS; /book route | Same /book flow; no new CMS fields |
| Mobile/desktop modal | BookingDialogContent | Provider selection, existing availability API | CheckoutFlow instead of a second pre-booking wizard |
| /book | CheckoutFlow | Existing hold/session/order actions and storage | When, Details, Confirm presentation |
| Tour booking card / widget | TourView / BookingBar | Homepage projection and provider | Shared selection controls; no separate price model |
| Confirmation | BookingPassCard / BookingQr | PendingOrder and existing QR matrix | Existing pass, refined hierarchy |
| Manage / modify / cancel | CustomerBooking | Token-authorized booking-management actions | Shared date/passenger/departure controls |
| Admin booking records | Existing bookings panel | Staff booking services | Operational interface retained |
| Draft/public preview | Existing public views | Draft/published CMS projection | Same public components |

No active WordPress booking consumer was identified in the inspected public routing/components. No partner backend is added.

## Data boundaries

Existing passenger snapshots contain authoritative per-category prices, totals and offer labels, including date/time rules. Components must display these values, not recalculate fares. Remaining seats and eligibility come from AvailabilityQuote. Existing SQL retains 8-seat normal inventory, infant zero-seat accounting, adult requirement and 15-minute cutoff. Existing transactional APIs, retry identifiers, QR, notification events and map iframe remain unchanged.

The availability endpoint omits past/cutoff departures. The UI cannot safely invent those rows. Returned sold-out departures can remain disabled. No service-period minimum adult fare or public cutoff timestamp is exposed in the ordinary availability DTO. Do not substitute infant/category defaults or claim a season-wide minimum from today's quote. Where no verified adult quote exists, show Check availability. Manage Booking currently supports private-link entry, not reference/email lookup; a new lookup would require a separate security/backend design. Booking notes are absent and remain omitted. No email-delivery promise is added while delivery is disabled.

No reference mockup image accompanied this attachment. The written brand/layout requirements are the available visual target. Implementation and verification results will be recorded below.

## Local implementation

- Modal and /book both use CheckoutFlow: When, Details, Confirm, then the existing booking pass. The modal no longer has an independent three-screen selection wizard.
- BookingDateSelector, PassengerSelector and DepartureSelector are controlled presentation components shared with modification. Existing caller limits, state and API requests remain authoritative. Sold-out returned rows stay visible/disabled; plentiful availability says Available and low availability says Only N left. Infant copy explicitly says No seat required.
- Contact details are reviewed before the existing order action. Edit preserves contact values; returning to selection uses the existing release action and retains the provider selection. Existing request identifiers, submitted retry payload and uncertainty handling remain intact.
- BookingSummary uses the selected passenger snapshot or hold total. The previous misleading fallback Total from quote.total before departure selection is removed. BookingPriceIndicator consumes existing adult quotes and labels the quoted date. Homepage and tour discovery use existing one-adult fares; no new query, stored marketing price or infant fallback.
- Responsive desktop selection/summary columns, mobile single column and transaction-scoped sticky action styling use current tokens. Header booking CTA becomes Back to website on booking/manage routes. The removed global action bar remains absent.
- Existing QR presentation is retained, with You're booked and Book another day. No promise of email delivery is introduced. Native cancellation dialog uses the existing commit action, focuses Keep booking and supports Escape when not busy.
- User explicitly approved retaining private-link management entry. Notes are omitted because the model has no notes field. Existing single international telephone string, tel keyboard, autocomplete and country-code example are retained.

## Explicit limits

The API does not supply a whole-service-period minimum or a public cutoff timestamp. This implementation shows date-labeled adult quotes and the existing generic 15-minute policy; it does not claim a seasonal minimum or add a duplicated eligibility calculation. Past/cutoff rows omitted upstream are not invented. A new homepage desktop quick-booking card was not added; current CTAs open the shared responsive transaction. No external mockup image was available for pixel comparison. These limits should be reviewed before declaring every visual example in the brief fulfilled.

## Verification

- Existing complete regression chain: 260 passed, zero failed/skipped (17 identity, 87 integrations, 133 database, 23 PostgreSQL). This supporting run preceded the final copy/CSS and native-dialog presentation adjustments.
- Final npm run lint, npm run typecheck and npm run build passed after all application edits.
- Browser test used the actual local components with a private synthetic-response proxy: availability/hold/order/management responses were in-memory, and other API actions were blocked. Hosted booking records were not created. This verifies frontend behavior, not another backend acceptance run.
- When -> Details -> Confirm -> existing QR confirmation passed. Edit contact details retained entered data. Book another day reset selection. Available/Only 2 left/Sold out states were observed.
- Review overflow checks passed at 320, 375, 390, 430, 768, 1024, 1440 and 1920px; modal overflow checks at 320, 390, 768 and 1440px. Screenshots inspected. Shared modification and cancellation/Keep actions passed at mobile width.
- Native date input event handling was corrected during the walkthrough; selection and summary then updated correctly.
- Browser device emulation cleared. Physical Safari/Android and real-server lifecycle acceptance of this new UI remain unverified. Existing online acceptance report describes the earlier deployed UI, not these local changes.

No deployment, migration, provider activation or map change. Unrelated pre-existing email work remains separate. Local logs: private/booking-ui-tests.log, booking-ui-lint.log, booking-ui-typecheck.log and booking-ui-build.log.

## Continuation 52-121 - 29 September 2026

Shared presentation now includes configured-currency money formatting, a date-scoped minimum selector, singular/plural passenger captions and aligned authoritative snapshot breakdowns. No price multiplication, persistence, query or pricing rule was added. Available departure labels are green; selected controls retain brand red; completed progress steps are red. One progress list remains, without duplicate step-caption markup. Required contact labels and Edit date/passengers/departure are explicit.

Manage Booking reuses BookingSummary and formats its existing cutoff timestamp in Europe/Tirane. This corrects the earlier broad statement about missing cutoff timestamps: ordinary availability does not expose one, but management does. Private-link entry is preserved as requested. Confirmation places QR/reference immediately after success, then trip facts and the existing map link. Mobile contact focus disables sticky positioning; mobile held-booking summaries precede contact/review content. No permanent bottom compensation was introduced.

### Hardcode and ownership audit
- No literal EUR10 ticket price found in public components. Hero and tour use existing date-scoped adultFares; selection and hold use existing passenger snapshots. No period-wide minimum is claimed. Invalid/missing discovery amounts use Check availability.
- EUR remains the default because the current AvailabilityQuote/PassengerSnapshot contracts explicitly constrain currency to EUR, and homepage adultFares omit a currency field. Shared exact-price components accept the supplied currency; no configurable currency was overwritten.
- Age labels use current category min/max data. No hardcoded 13+/3-12/0-2 replacement was introduced.
- Infant no-seat copy reflects the existing recorded rule. Remaining 15-minute copy in selection, review and pass reflects the established engine policy; management shows its actual timestamp.
- Prominent Europe/Tirane copy replaced with local Shkodra time in availability and the day planner; internal timezone calculations unchanged.
- Existing CMS-owned CTA wording remains owned by its current editor. No editorial content bulk replacement. No privacy/terms routes were found, so no new legal consent or privacy promise was invented. Existing meeting-point URL reused.
- Existing availability debounce/refresh and management requests retained. Departure selection adds no request; presentation helpers are pure. No new analytics, email, map, backend, route or storage work. Optional calendar date prices/period summaries and desktop quick entry omitted because no supporting dataset is exposed.

### Verification for this continuation
Lint, TypeScript and normal production build passed (private/booking-ui-continuation-*.log). A final CSS-only mobile summary ordering adjustment followed the build. Local synthetic selection -> details -> review -> confirmation passed; actual QR/reference ordering inspected at 390px. Review and management overflow checks passed at requested viewport settings 320,375,390,393,414,430,768,1024,1280,1366,1440,1920 (Chrome scrollbar/rounding can reduce CSS client width). One progress list verified. Management showed the supplied cutoff as 1 Oct 2026, 08:45 local time. Existing 260-test regression result belongs to the earlier implementation checkpoint and was not rerun for this presentation-only continuation. Physical Safari/Android keyboard, safe-area and full assistive-technology acceptance remain unverified.

The supplied continuation ends mid-sentence at section121. Implemented its available requirements; no unseen text inferred. Local only, no deployment or hosted booking writes.

## Continuation 122-192 - 29 September 2026

Readable date formatting now serves discovery prices, summaries and cancellation/modification. Native date inputs retain their existing value contract. Infant lines say Free only for an authoritative zero total; positive prices still use currency formatting. Price and seat concepts remain separate. Cancellation includes reference, readable date/time and explicit cancellation/seat-release consequences; Keep booking remains initially focused. Management status uses existing confirmed/cancelled values with readable labels. Final submit says Confirming booking while busy. Mobile /book keeps the editorial h1 accessible while removing its duplicate visual headline above the shared flow.

Availability retains the existing request, date/default and active departure-selection behavior. All returned rows with zero remaining seats produce a sold-out message; empty rows retain the accurate No bookable departures wording because the current API does not distinguish every no-service/closed/cutoff case. Choose another date focuses the existing input. No expensive next-date search, automatic selection or guessed operational state added. Existing nextOperationalDate remains available where supplied.

Submission audit: busyRef serializes actions; submitted contact payload and request identifiers remain stable on retry; confirmation follows the returned order; refresh reads the existing hold/order; reset starts a new flow. No creation on render/selection added. No email-sent promise or invented meeting-point address added. Existing meetingPoint URL is authoritative. The default price breakdown is already short category lines, so no extra disclosure interaction was introduced.

SEO/localization audit: current SEO module uses WebPage/BreadcrumbList, without a structured tour-price offer. Existing metadata and published CMS SEO fields are retained; no literal ticket-price metadata was found in inspected source. Stored editorial SEO is not rewritten or certified against every possible future price change. No booking translation-resource infrastructure exists in src; English component copy and existing en-IE currency formatting are preserved.

Verification: TypeScript, lint and normal build passed after these edits (private/booking-ui-122-lint.log and private/booking-ui-122-build.log). Browser fixture verified readable management date, cancellation reference/consequences and Keep booking recovery. Selection with one adult plus one infant showed 1 Infant / Free, two guests and authoritative EUR10 total. Some CDP viewport interactions timed out, so this continuation does not claim a new mobile visual acceptance result; prior responsive matrix remains supporting evidence. No hosted writes/deployment. Physical-device testing remains pending. Attachment ends at section192 mid-example.

## Continuation 193-276 - 29 September 2026

Discovery uses the shared currency formatter with whole-unit decimals omitted only when exact; totals retain two-decimal currency formatting. Central scarcityThreshold and availabilityLabel translate returned values without capacity calculation or negative-count output. Date-scoped minimum handles absent/corrupt/zero values with availability fallback; it does not hide a zero minimum behind a higher paid fare.

Shared BookingAction places the actual selection/held total next to Continue/Confirm. Before exact selection it identifies the missing departure. Mobile sticky positioning belongs to this transaction row, includes safe-area padding only while mounted, and becomes static while contact fields have focus. The large incomplete mobile summary is omitted; Details/Confirm retain their shared summary. A step-change effect focuses and scrolls to the current heading. No new state library, date/icon dependency, theme, image, hold system, URL data or request path introduced. Existing backend holds and their actual expiry timer remain in use.

Verification: complete npm test passed 265/265 (17 identity, 92 integrations, 133 database, 23 PostgreSQL), zero failures/skips. Five new presentation tests cover precision/currency, date-scoped standard/varied/discount amounts, missing/corrupt/zero fallback, scarcity and explicit timezone formatting across midnight. Existing database tests cover configured category offers, cutoff and concurrent last-seat allocation. Lint, TypeScript and production build passed. Logs: private/booking-ui-193-*.log.

Local browser fixture with 1200ms API delay retained loading states and disabled reserve/confirm buttons, exact total and heading focus; successful confirmation shown only after response. Review action row passed the twelve requested width settings, no horizontal overflow, 52px button height. Chrome rounded the requested 393px inner width to 394px in this run. Mobile selection screenshot inspected at 390px. This is delayed-response testing, not comprehensive network bandwidth/device performance certification. Physical Safari keyboard/safe-area and complete production profiling remain pending.

No deployment, hosted booking writes or email enablement. Section276 ends after Child cheaper; remaining unseen cases have not been inferred.

## Acceptance and ownership report (277-349) - 29 September 2026

### Pricing-source trace
| Concern | Existing authoritative source / resolution |
|---|---|
| Adult, Child, Infant | passenger_categories_v1 supplies configured category ages/base prices; passenger_quote_v1 resolves each category independently. Infant seat consumption never sets its price. |
| Seasonal/range pricing | calendar_range_v1 selects the matching existing calendar range for the requested service date. |
| Date override | schedule_exceptions.calendar_settings overlays that date's range/base settings. |
| Departure override | The selected time's departure settings overlay range/date prices. |
| Offers | Existing SQL applies configured fixed/percent/amount offers to named categories and optional times; returns offer labels/basePrice and final totals. No frontend offer formula. |
| Total | Existing SQL sums authoritative category line totals; holds/order items preserve snapshots. UI reads snapshot total. |
| Discovery | loadHomepage already requests guests=1 for its service_date and projects available departure passengerQuote totals into adultFares. Hero and tour use that same projection and label its date. |

No competing active price source was found. Legacy per-guest model.price remains in the existing projection for older consumers/tests; new hero/tour pricing deliberately uses adultFares. A cheapest-fare search across all future seasons is NOT exposed by this contract. It remains unsupported here; adding a server query/contract is outside the protected backend scope and requires approval. Date-specific From is the frontend-only alternative. No backend change was made to meet that broader requirement.

### Remaining hardcoded business/presentation values
| Value | Location | Why retained / authority | Future action |
|---|---|---|---|
| 15-minute policy | booking.tsx, checkout-flow.tsx, booking-pass.tsx | Existing documented SQL cutoff; ordinary availability does not expose exact cutoff timestamp. | Derive policy text from an existing shared policy contract if one is introduced separately. |
| Europe/Tirane | booking-presentation.ts, pass check-in formatting | Existing service timezone; only formatting, not eligibility. | Accept timezone in DTO if service becomes multi-timezone. |
| EUR fallback | booking-controls.tsx, checkout-flow.tsx | Current contracts explicitly constrain EUR; homepage fares omit currency. Exact snapshots carry currency. | Extend contract separately if currencies become configurable. |
| Infant no seat | booking-controls.tsx, customer-booking.tsx | Recorded infant-zero-seat rule; does not imply zero price. | Keep aligned with approved engine rules. |
| 100 guests / 99 per category | existing checkout/management counter callers | Pre-existing frontend input ceilings preserved; they do not replace returned seat availability. | Review separately if these established input limits should change. |
| Scarcity threshold 2 | booking-presentation.ts | Central presentation-only threshold. | No business-capacity change needed. |
| Meeting point URL | modules/booking/meeting-point.ts | Existing authoritative static configuration reused. | Update that source only when location changes. |

No literal ticket price, age-band example, season date or booking reference from mockups was added to application UI. Synthetic test data is isolated in tests/private fixtures.

### Component report
Reused: BookingProvider/useBooking/useAvailability, Button, Field, BrandLogo, BookingQr, existing checkout and management actions. Refactored: BookingFields/QuantityStepper, CheckoutFlow, BookingPassCard, CustomerBooking, homepage/tour price consumers. Added frontend-only shared pieces: BookingDateSelector, PassengerSelector, DepartureSelector, BookingPriceIndicator, BookingSummary, BookingPriceBreakdown, BookingAction, CancelBookingDialog and booking-presentation helpers. Removed active parallel modal wizard; modal now hosts CheckoutFlow. Existing preview BookingBar and private-link management entry retained as adapters around shared controls; no independent new checkout. Native date control retained. No active WordPress integration identified.

Marketing invitation is now omitted on /book and /booking/*; normal footer links and unrelated homepage sections remain. This is a booking integration adjustment only.

### Protected-subsystem report
Within this booking UI task: database schema changed NO; migration added NO; Supabase query contract changed NO; Booking API changed NO; pricing engine changed NO; capacity engine changed NO; calendar engine changed NO; QR engine changed NO; email engine changed NO; Live Map changed NO. Unrelated pre-existing email/scheduler/SQL working-tree edits are not attributed to this task.

### Acceptance limits
Local regression and browser fixture evidence are recorded at each checkpoint. New homepage integration tests verify the actual projection with adult1000/child500/infant0 or300, excluding a cheaper unavailable departure, and differing date quote contexts. They test projection contracts, not a newly provisioned real seasonal environment. Existing calendar-pricing database tests exercise range/date/departure layers and offers.

Hosted capacity/season write acceptance for this unpublished candidate was not rerun: the online site still serves the previous release, and this brief forbids silent deployment. Prior hosted acceptance is historical evidence only. No hosted records/configuration were changed in this continuation, so no hosted cleanup was needed. Physical Safari/Android, comprehensive bundle/network/Supabase profiling, full assistive-technology testing and a final all-surfaces device matrix remain pending. Full acceptance is NOT declared complete.

The supplied text ends mid-instruction in section349. No push or deployment performed.

Final 277-349 code verification: npm test 267/267 passed (17 identity,94 integration,133 database,23 PostgreSQL), zero failed/skipped; npm run check passed lint, TypeScript and normal build. Logs private/booking-ui-277-tests.log and private/booking-ui-277-check.log. Local management route verified without promotional invitation. No deployment.
