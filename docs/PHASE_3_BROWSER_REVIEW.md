# Phase 3 browser review and stale-edit fix

Date: 2026-09-22. Result: PASS for the implemented Phase 3 development scope. The follow-up below closes the outstanding core browser acceptance cases; physical-device testing remains a release follow-up.

## Verified in Chrome

Used a synthetic development operator, never the real owner's workspace:

| Workflow | Observed result |
| --- | --- |
| Staff sign-in and workspace selection | QA account entered only its assigned operator |
| Product publication | Missing SEO rejected inline; title, slug and publication choice retained; corrected submission saved |
| Supplier creation/deletion | Created supplier, then removed it with confirmation even with its required name cleared; clicked remove operation reached the server |
| Route stop creation | Named coordinates and product association saved |
| Departure creation | Native date/time/select controls saved a scheduled two-seat departure |
| Manual booking failure/retry | Missing pricing rejected; customer name and quantity retained; retry succeeded after synthetic pricing fixture setup without reentering the form |
| Booking total and capacity | Two guests at EUR 12.50 produced EUR 25.00; reducing capacity below the two held seats was rejected |
| Unpaid cancellation | Order, booking and item cancelled; hold became released; cancellation controls disappeared |
| Content publication/archive | Published text/SEO, then archived from a second browser tab |
| Stale content draft | Initially stalled; after the migration, old editor received the stale-record alert and retained `QA Retained Stale Draft` |
| Role demotion | Already-open owner content form denied mutation after role changed to operations; operations navigation omitted catalog/content |
| Keyboard navigation | Tab moved focus from Departures to Bookings |

Inspected CMS layouts at requested widths 360, 390, 430, 768 and 1280px. Measured document widths matched their available viewport widths (345, 375, 415, 753, 1265px respectively; scrollbar occupies 15px). The initial browser-level viewport handle did not resize this tab, so those initial desktop captures were discarded as responsive evidence. Applied tab-scoped CDP emulation and verified dimensions before inspecting the later captures. Full CMS page inspected at 360px, lower fields at 390px, header/content at remaining sizes. No horizontal overflow observed. Cleared emulation and reset browser viewport afterward. This is desktop Chrome emulation, not physical iOS/Android or virtual-keyboard testing.

## Confirmed defect and fix

Content and departure stale checks raised SQLSTATE `40001`. The hosted PostgREST path retried this as a serialization failure: one browser action took about 125 seconds; a direct stale RPC probe hit its 15-second deadline. This behavior is documented by [Supabase](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

Added migration `20260922000400_non_retryable_stale_edits.sql`, replacing only the stale-error code with `PT409` in both functions. Existing role checks, row locks, capacity/history rules and audits remain intact. Updated action error mapping and SQL assertions. Original applied migrations remain unchanged.

Applied only to linked development project `ybngoppqqiohcduojfyg`, after a successful dry-run showing only this migration. The first CLI connection attempt failed transiently; the second dry-run and push succeeded. Hosted content probe returned HTTP 409 with unchanged row in 277ms including read-back; departure probe returned in 122ms. Retested the two-tab CMS conflict in Chrome successfully.

Extended `scripts/verify-supabase-development.mjs` to call both stale RPCs with a five-second deadline, assert `PT409`/HTTP 409 and unchanged records, then remove the exact synthetic fixtures. This catches the API behavior that direct SQL tests missed.

Validation: all 97 local tests passed after the final migration/test edits; lint, typecheck and production build passed. Extended hosted Auth/tenant/role/HTTP/stale-RPC verifier passed and removed its temporary identities and records. A test run started before the edits finished had one outdated SQLSTATE assertion failure; the complete rerun passed. No production or environment configuration changed.

## Initial fixture disposition and remaining work (superseded below)

Browser QA operator: `080775be-c91c-4482-8b74-dfba7c90232b`. Its synthetic cancelled booking, product, stop, departure, archived content and audit history are retained for traceability. The QA staff profile `00dab083-5a4d-49a8-9fcf-8ba672269e79` is inactive, its synthetic Auth account is banned, and the browser signed out. The test supplier was deleted through the UI. Product pricing/capacity rules were assigned only to this synthetic fixture through the privileged development API; this was not an owner product configuration workflow.

Still pending: the rest of the catalog edit/archive/delete matrix, deliberate network interruption and double-click/replay browser tests, full keyboard/focus checks and mobile checks for each admin section. Field-specific feedback, catalog stale-write protection and bounded-list pagination remain documented limitations. Owner activation is still pending; the user's private setup file was not read or redeemed. No Phase 3 checkpoint or Phase 3.5 implementation is claimed.

## Final acceptance follow-up - 2026-09-22

Reactivated only the isolated synthetic QA identity for this run. No real owner credentials or workspace were used.

| Workflow | Observed result |
| --- | --- |
| Product edit and interrupted save | Renamed to QA Lake Tour Edited; offline submission showed an inline network error and retained the title; restoring connectivity and retrying saved it |
| Product archive | Confirmation plus archive action saved; publication read back as archived |
| Supplier edit | Created QA Final Supplier, renamed to QA Supplier Edited, changed type to partner; saved name/type visible |
| Route stop edit/delete | Renamed to QA Stop Edited; missing deletion confirmation rejected inline; confirmed deletion removed it |
| Rapid double-click booking | Double-clicked Create unpaid booking; exactly one order for qa-doubleclick@example.invalid, verified through a scoped hosted read |
| Booking search | Exact-email filter displayed only the matching synthetic order and customer |
| Keyboard cancellation | Entered reason, Tab focused checkbox with visible outline, Space confirmed, Tab/Enter submitted; Order cancelled displayed |
| Capacity after cancellation | Reduced departure from two seats to one successfully after reservations were released |
| Calendar filter | Empty date displayed No departures found; clear filter restored the departure |
| Keyboard focus | Catalog Tab advanced title to slug with visible focus outline; cancellation checkbox/button worked through keyboard input |

The second order is 392d77c3-4b47-4b72-ac90-e9971522842a, reference SS-27f06c90-087e-48af-9b39-9015cccafbbb, one guest at EUR 12.50. It is cancelled. This checks rapid browser duplicate submission; concurrent domain replay and conflict semantics remain covered by the native PostgreSQL tests, not claimed as a browser simulation of every ambiguous-response case.

Visually inspected full catalog, booking and departure forms at 360px, including native date/time/select controls, filter controls and lower submit buttons. No horizontal overflow or clipped controls observed. Catalog DOM measurements at 390/430/768/1280px additionally reported client/scroll widths of 375/415/753/1265px respectively. Combined with the earlier CMS and sign-in/onboarding observations, the shared admin layout and core forms have responsive browser evidence. Keyboard focus checks are representative workflows, not a complete assistive-technology audit. Desktop Chrome emulation does not establish physical iOS/Android soft-keyboard behavior; that remains a pre-release device check.

Fresh final checks: all 97 tests passed (15 identity, 5 integration, 63 database, 14 native PostgreSQL); lint, typecheck and production build passed. The extended hosted verifier with --admin-http passed, including Auth refresh, tenant/role denial and both stale-edit HTTP 409 deadlines. Expected malformed-cookie and invalid-refresh diagnostics were emitted by the negative tests; its temporary fixtures were removed.

Restored network connectivity and cleared viewport emulation. One browser-control sign-out attempt timed out without changing the page; retry succeeded and the staff sign-in screen was verified. Disabled the exact QA membership and banned its Auth account again. The first cleanup query used a nonexistent user_id column and made no change; the corrected auth_user_id query and ban succeeded. Retained both cancelled orders, archived product/content, departure, edited supplier and immutable audit history; the test stop and earlier supplier were deleted through the UI. The real owner's private setup link was not read or redeemed.

No application code, migration, environment variable or production configuration changed in this follow-up. Remaining nonblocking development limitations: operation-level rather than field-specific errors; bounded lists without pagination; catalog edits without stale-write protection; pricing/capacity configuration outside catalog UI; drafts lost on reload/navigation. Review existing orders after an uncertain booking outcome. These limits remain visible in the phase reports and do not imply public launch readiness. Phase 3.5 design foundation is the next phase.
