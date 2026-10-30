# Admin simplicity review — 30 October 2026

Local implementation only. No commit, push, deployment, hosted data change, migration, permission change or delivery configuration change. Earlier pending product-button and image-control fixes are preserved and included in this review.

## Implemented

- Products now groups All products and Suppliers. Original routes, role filtering and server authorization stay intact.
- More has one booking-email entry, rather than duplicate delivery/integration links to the same screen. Personal notifications/devices remain separate from customer emails.
- Website has one main Homepage card; all homepage sections remain accessible inside that editor. Shorter page titles replace internal “presentation/introduction” wording. Draft/published comparisons and per-destination publication remain explicit.
- Website, sidebar, Products, Tours and booking-filter explanations are shorter. Removed infrastructure claims and migration instructions from routine product/partner errors. Longer email receiver troubleshooting and schedule explanations use expandable help.
- Kept decision-critical warnings: loaded booking result limit, incomplete daily-service projection, existing reservation/price preservation, shared van capacity, infant seating, future-only settings, email delivery uncertainty and external map ownership.
- Product management links now have readable white labels on red backgrounds, including hover/visited states.
- ImageField owns its layout instead of relying on styles scoped to the Website editor. One accessible Choose/Replace image control, a separated Remove action, responsive wrapping/stacking and an optional image-link disclosure replace the exposed native file picker inside a button.
- Shared controls use border-box sizing; fieldsets may shrink inside narrow layouts; long headings/buttons wrap. Website/Tours headers wrap on phones; product forms and tabs stay contained. Form values use normal weight instead of inheriting bold labels.

## Management ownership

| Task | Main location | Other entries |
| --- | --- | --- |
| Product identity, photo, amenities, standard fares, schedule/seat policy, homepage publication | Products | Public cards and booking page consume the same product |
| Suppliers | Products → Suppliers | Original supplier editor and permissions |
| Date-specific availability, departures and prices | Tours → Calendar & departures | Products supplies the recurring setup; no duplicate booking engine |
| Reservations, check-in, payment records | Bookings | Notifications link to the same booking |
| Page copy, search metadata and visibility | Website | Navigation shortcuts open the same editor |
| Stop descriptions/photos and destination guides | Website → Route & destination content | Tours links to the existing stop editor; shared destination data retained |
| Operational stops, coordinates, GPS and live state | Independent Live Map | External links retained with separate sign-in |
| Reviews and homepage partners | Website | Existing editors; no additional collections |
| Public contact/footer/WhatsApp | More → Business, opening Website-owned controls | Shortcuts, not copied fields |
| Personal alerts/devices | More → Notifications | Same inbox as header bell |
| Customer/owner booking email delivery | More → Booking emails | One owner-only delivery screen |

## Review coverage and verification

Source review covered the shared shell/navigation, Home, Bookings, Products, Suppliers, Tours/calendar/schedules/meeting point, Website/page editor/media, route stops, reviews, partners, More, notifications/devices and email delivery. Booking write actions and authorization were intentionally not redesigned.

Native Chrome review used existing development-only synthetic fixtures with submissions blocked. Desktop More and Website were inspected; Website, Bookings, Calendar and Products/image controls were inspected at 390px. Visible reviewed controls fit without collisions; this is not a complete geometry measurement of every form. Native focus interruptions prevented completing tablet and all-page browser acceptance. No claim of complete authenticated hosted workflow, real-device, upload or payment validation.

Regression checks cover canonical URLs/role filters, supplier grouping, single email entry, Website editor navigation/dirty-state protection, publication summaries and existing booking/product behavior. Final command results are recorded in the task response.

## Recommended next improvements

1. **Product setup checklist:** show Photo, Prices, Schedule, Seats and Website as clear completion steps. Link each missing item directly to its tab. The existing server publication blockers should remain authoritative.
2. **One consistent save pattern:** show “Unsaved changes / Save draft / Preview / Publish” in a compact bar across editors, with a review of exactly what will be published. Website currently publishes all saved Website drafts together; keep that behavior explicit until a separate transactional publishing design is approved.
3. **Unify the editorial stop experience:** make the stop-ordered list and full destination editor one route with simple/full views, preserving shared records and stable map stop IDs. Current links share data but the two presentations can still feel like different tools.
4. **Search the complete booking history:** replace the current latest-100 local filter with paginated server search and date/status filters. Preserve operator scope and clear result counts. Current search limitation stays visible until implemented.
5. **Make Home operationally complete:** implement a reliable next-departure/manifest projection including manual departures and date overrides. Do not replace unavailable values with inferred totals or clock guesses.
6. **Separate business configuration from daily work more clearly:** a dedicated settings destination could own boarding/contact shortcuts and support diagnostics. Moving meeting-point editing out of Calendar needs a focused ownership/route review; existing versioning and UTC effective-time semantics must remain intact.
7. **Complete visual acceptance before a broad release:** test every role at 375/390/768/1024/1440, long product/guest names, validation errors, pending/failed saves, keyboard focus, calendar range editing, image replace/remove and phone safe-area/keyboard behavior. Use isolated data for writes.

These are suggestions, not newly introduced data models or claims that unavailable operational features are complete.

Final verification: `npm test` — 635 tests passed; `npm run check` — lint, typecheck and optimized production build passed; `git diff --check` passed.
