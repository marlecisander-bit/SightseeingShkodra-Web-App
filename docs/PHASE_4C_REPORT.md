# Phase 4C - Live booking selection

Date: 2026-09-22. Local/development only. Phase 4D holds/orders and payments remain out of scope.

## Implementation

`GET /api/public/availability?date=YYYY-MM-DD&guests=N` validates inputs before privileged reads, rejects duplicate/unknown parameters (including operator/product overrides), resolves the deployment's published tour server-side, and calls the existing shared availability/pricing domain. Success includes its quote and operator timezone. Responses are no-store; unpublished tours return 404, invalid input 400 and provider/configuration failure a safe 503. No database writes, migrations, table grants or credentials exposed to the browser.

One provider-level availability hook serves homepage/tour controls, the booking dialog and `/book`. Requests debounce 250ms, cancel superseded work, time out after 12 seconds and key results to date, guests and refresh revision. Editing date/guests clears the departure and invalidates old results, including when returning quickly to a previous selection. Refresh runs every 30 seconds, on window focus, and on demand. Loading/errors cannot continue. The UI uses domain `available`, `remaining` and `total` values without recalculating business rules.

Actual departure options replace morning/afternoon samples. Available choices carry into the details preview; stale/unavailable departures are rejected on refresh without losing date/guest choices. Group capacity, empty schedules, unpublished product and transient failures have explicit messages. Currency formatting is presentation only. Existing selection memory survives client navigation and steps, not a full reload. Details/payment remain previews: no real personal details should be entered and no seat is held.

## Verification

- All 15 integration tests passed, including four new HTTP-boundary tests for validation, tenant binding, shared quote forwarding, unpublished/archival behavior and error redaction.
- Lint and TypeScript passed. Initial full build passed; after the final stale-result invalidation refinement, standard build cleanup hit Windows EPERM on a generated OneDrive reparse directory. Automatic approval review blocked removal. A complete final build passed in `private/build-phase-4c` using temporary `distDir`; configuration and tsconfig were restored. The original blocked build artifact was left untouched. Future default builds may still need that local generated-directory issue resolved.
- Extended development harness verified actual hosted API totals, capacity rejection for oversized groups, no-store responses, tenant-override rejection and 404 after product archival, plus existing homepage/tour regressions.
- Chrome: selected two guests and the published test departure, saw the domain EUR25 quote, continued to details with choices intact. After reducing only the synthetic departure's capacity to zero, refresh displayed the change and blocked continuation. Back navigation preserved date/guests; another date correctly showed an empty timetable. 390px layout had no horizontal overflow.
- All synthetic fixtures were removed; no owner records were changed. Local preview continues at http://127.0.0.1:3000/book.

## Remaining scope

No environment/dependency changes or roadmap deviations. The actual catalog remains unpublished for manual entry. No public launch, production rate-limit/load testing or booking confirmation is claimed. Publication reads currently reuse the homepage snapshot projection; a narrower read can be considered if profiling warrants it. Phase 4D must revalidate and acquire a transactional hold before creating an order; selection availability is advisory and cannot reserve inventory.

Changed areas: public availability route and boundary module, shared client hook/booking controls, availability status styling, integration tests, hosted verification harness and phase documentation. Ready for Phase 4D.
