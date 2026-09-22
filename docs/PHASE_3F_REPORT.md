# Phase 3F admin usability review

Final follow-up: PASS for development admin acceptance. PHASE_3_BROWSER_REVIEW.md records the completed core browser matrix, responsive inspection, keyboard workflows, interruption/retry and double-click checks. All 97 tests, quality checks and hosted verification pass. PHASE_3_AUDIT.md accepts the Phase 3 checkpoint. Physical-device/soft-keyboard testing and the documented usability debt remain release follow-ups. Owner activation is still pending through the existing private setup file; no email is required from the user again. The remaining paragraphs below are historical implementation notes, superseded where they describe unavailable browser access or incomplete acceptance.

Date: 2026-09-22. Result: PARTIAL — code/HTTP checks completed; interactive mobile/browser acceptance blocked by unavailable browser connection.

## Changes

Added a shared useFormStatus submit control to sign-in and catalog/content/departure/booking mutations. Pending forms disable their submit controls and expose busy state. Added admin route loading status and a generic recoverable error boundary without exception details. Added clear-filter links for scheduling/bookings and explanatory disabled creation controls when prerequisite products/departures are absent. Enlarged checkbox hit areas and header links; constrained inputs/selects/textareas to container width with 16px text and wrapped long header names.

Existing controls reviewed: semantic headings/nav, role-scoped links, explicit form labels, keyboard focus, skip link, confirmation/reason controls, stale-write feedback and empty states. The layout switches to a single column below 700px. No capacity/pricing/payment rules changed; all server authorization stays in place.

## Remaining acceptance work

The browser tool returned `{apps:[],browsers:[]}`. Therefore no desktop/mobile screenshot, keyboard/tab interaction, native date/select behavior or real browser Server Action submission is claimed tested. Required viewport checks: 360, 390, 430, 768 and 1280px widths. Test sign-in/out, workspace switching, each create/edit/archive/cancel path, pending double-click prevention, error retry and focus visibility with a temporary staff account. Verify no horizontal page overflow or keyboard-obscured controls. Temporary test data must stay in development.

Follow-up implementation: catalog, content, departure, manual-booking and cancellation actions now return safe operation-level errors before redirect/revalidation. A shared client MutationForm intercepts submission, captures the clicked operation, displays an inline alert and retains the existing form DOM on failure. Manual-booking request UUIDs remain with the draft. A synchronous submission guard and pending disabled fieldset prevent overlapping submissions; controls stay disabled until hydration, with an explicit JavaScript requirement and POST fallback. Successful actions still refresh and redirect. Drafts are not persisted to browser storage and are lost on reload/navigation. Sign-in keeps its existing behavior and does not retain passwords.

Remaining usability debt: validate the new retention/retry/redirect behavior in a real browser, including archive/delete buttons that bypass native validation, stale edits, network failures and manual-booking idempotent retries. Error messages are operation-level, not field-specific. Catalog/booking lists are bounded without pagination, and catalog edits lack stale-write protection. Those limits are documented in their phase reports. Users must review the list before attempting a new booking after an uncertain outcome. No new design/public phase was started in this follow-up.

Owner onboarding still awaits the user's email and appropriate Auth setup. No invitations or new real-user permissions were created. No schema/environment/hosted configuration changes were needed for this phase.

Validation: 95 local tests pass; lint/typecheck/build pass. The initial HTTP verifier expected only 307 redirects; the new loading boundary legitimately streams HTTP 200 with Next's redirect meta. The verifier now checks either the 307 Location or the exact redirect meta plus absence of protected workspace content. The rerun passed real Auth/tenant/role/HTTP checks and cleaned temporary identities. It still does not establish interactive browser behavior.

Follow-up validation: reran all 95 tests, lint, typecheck and production build successfully after the MutationForm changes. Development hosted Auth/local HTTP verification passed again and removed temporary identities; deliberately invalid-cookie/refresh cases emitted expected SDK diagnostics. These checks verify regression safety and server rendering, not interactive draft retention, hydration, focus, or viewport behavior.
