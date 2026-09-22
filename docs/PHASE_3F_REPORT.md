# Phase 3F admin usability review

Date: 2026-09-22. Result: PARTIAL — code/HTTP checks completed; interactive mobile/browser acceptance blocked by unavailable browser connection.

## Changes

Added a shared useFormStatus submit control to sign-in and catalog/content/departure/booking mutations. Pending forms disable their submit controls and expose busy state. Added admin route loading status and a generic recoverable error boundary without exception details. Added clear-filter links for scheduling/bookings and explanatory disabled creation controls when prerequisite products/departures are absent. Enlarged checkbox hit areas and header links; constrained inputs/selects/textareas to container width with 16px text and wrapped long header names.

Existing controls reviewed: semantic headings/nav, role-scoped links, explicit form labels, keyboard focus, skip link, confirmation/reason controls, stale-write feedback and empty states. The layout switches to a single column below 700px. No capacity/pricing/payment rules changed; all server authorization stays in place.

## Remaining acceptance work

The browser tool returned `{apps:[],browsers:[]}`. Therefore no desktop/mobile screenshot, keyboard/tab interaction, native date/select behavior or real browser Server Action submission is claimed tested. Required viewport checks: 360, 390, 430, 768 and 1280px widths. Test sign-in/out, workspace switching, each create/edit/archive/cancel path, pending double-click prevention, error retry and focus visibility with a temporary staff account. Verify no horizontal page overflow or keyboard-obscured controls. Temporary test data must stay in development.

Known usability debt: failed mutations generally redirect and can discard unsaved input; field-level errors and retained drafts need improvement before final acceptance. Catalog/booking lists are bounded without pagination, and catalog edits lack stale-write protection. Those limits are documented in their phase reports. Manual-booking failure preserves its request UUID, but users must review the list before attempting a new booking after an uncertain outcome. No new design/public phase is authorized by this review.

Owner onboarding still awaits the user's email and appropriate Auth setup. No invitations or new real-user permissions were created. No schema/environment/hosted configuration changes were needed for this phase.

Validation: 95 local tests pass; lint/typecheck/build pass. The initial HTTP verifier expected only 307 redirects; the new loading boundary legitimately streams HTTP 200 with Next's redirect meta. The verifier now checks either the 307 Location or the exact redirect meta plus absence of protected workspace content. The rerun passed real Auth/tenant/role/HTTP checks and cleaned temporary identities. It still does not establish interactive browser behavior.
