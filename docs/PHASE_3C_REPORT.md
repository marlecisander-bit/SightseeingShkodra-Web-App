# Phase 3C departures and capacity

Implemented date-filtered departure list and create/edit forms in the protected departures workspace. Owner/admin/operations use departures.manage; SQL separately verifies the active actor's operator and role. Fields include product, optional existing vehicle, local service date/time, integer seat capacity and draft/scheduled/cancelled status. The operator timezone is shown explicitly. No browser calculation decides remaining seats.

Migration 20260922000100_departure_management.sql serializes edits with the same departure-row lock used by hold creation and confirmation. It checks confirmed booking items plus active unexpired holds after lock acquisition, rejecting lower capacity or nonscheduled status while inventory is reserved. Product/date/time cannot change after any hold or booking-item history exists. Historical records are not deleted. Scheduled starts must be future instants in the operator timezone; invalid dates/time/capacity and cross-operator product/vehicle references are rejected.

Updates require the exact prior updated_at value, so stale forms fail rather than overwriting another staff edit. Writes and departure.changed event/audit are atomic; audit metadata includes previous/new capacity and status plus schedule/product/vehicle values. The UI maps stale/inventory failures to actionable messages without raw database details.

List limit is 100 departures and 100 product/vehicle choices, with date filtering for departures. No vehicle CRUD, vehicle-overlap planner, recurring timetable generator, bulk rescheduling or automatic booking cancellation is included. Staff must resolve reservations through booking operations before closing a reserved departure. This is a date-filtered scheduling view, not a drag-and-drop calendar.

Native PostgreSQL tests race last-seat allocation against capacity reduction in both lock orders. Exactly one operation succeeds; reservations never exceed capacity. Tests also cover stale writes, forged actor denial, schedule/cancellation restrictions and audit insertion. Existing domain/RLS tests remain in the suite.

Browser visual/interactive acceptance and owner onboarding remain pending from Phase 3A. No connected browser was available in the previous UI inspection. This report does not claim screenshots or interactive form validation. No production changes or new environment variables. Next: Phase 3D content CMS.

Results: npm test passed 92 tests (13 identity/navigation, 5 adapter, 61 embedded database, 13 native PostgreSQL); npm run check passed lint/typecheck/build. CLI preview selected only the departure-management migration, then development push succeeded. Hosted Auth/local HTTP verification confirmed the departure editor renders for authorized staff and existing role/tenant checks pass. Temporary test identities were cleaned up; no hosted departure records were created by the verification.
