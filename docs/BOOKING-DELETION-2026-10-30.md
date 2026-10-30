# Permanent admin booking deletion — local implementation

Publication update: see `releases/all-completed-20261030/README.md`. The following is the historical local implementation report; production migration 20261030000400 has since been applied with business records unchanged.

User explicitly requested deletion from the admin panel and database, then confirmed inclusion of paid bookings while retaining financial history. Owner-only permission is used. No production database update, real booking deletion, commit, push or deployment was performed. Unrelated admin, responsive-control and Live Map work remains intact.

## Behavior

Open a reservation under Bookings → View booking → Reservation actions → Delete booking permanently. Owner must enter the exact reference, a reason, check the irreversible-action acknowledgement and accept the final confirmation. Server authorization and database role/operator/reference checks are authoritative. Failed actions retain form values. Successful deletion returns to the list with confirmation.

This is actual deletion of the `public.bookings` row, not a hidden/deleted flag on that reservation. Its QR and customer management token cease resolving. Reserved booking items are cancelled and active holds released transactionally through existing cancellation/inventory rules. Financial orders, original item/pricing/allocation snapshots, customers, payments, provider/payment events, refunds, audit logs, historical email/delivery records and domain events remain. This is not a full customer-data erasure operation. Deletion issues no refund; remaining paid/partially refunded evidence is flagged through the existing idempotent refund-review event.

A minimal service-only `booking_record_registry` preserves booking ID, tenant/order identity and reference, plus deletion actor/time/reason. Delivery-history foreign keys are repointed to this permanent identity instead of the removable reservation row. Tenant-scoped referential integrity remains; no FK is simply removed. Registry rows prevent delayed checkout/retry code from recreating a deleted reservation. Existing financial orders are excluded from booking search before result counts and pagination; ordinary pending orders without reservations still appear normally.

Deletion takes the existing operator inventory lock and departure/order/payment/work locks in order. Processing/pending payments and leased/sending email or sending push work block deletion. Pending/retry sends are skipped; old notification receipts become invisible without deleting their history. Queue insert guards serialize on retained identity, preventing an older projector snapshot from inserting new sends after deletion. No new notification provider/subscription/worker or automatic refund is introduced. Repeated deletion succeeds without a second audit entry.

## Files

- `supabase/migrations/20261030000400_admin_booking_deletion.sql`: registry/backfill, identity/queue guards, tenant/owner checked transactional RPC, search exclusion; no existing booking data is deleted by applying this migration.
- `src/modules/identity/roles.ts`: bookings.delete granted only to owner.
- `src/modules/booking/deletion-server.ts`: authenticated permission boundary and narrowly scoped RPC, validation and safe errors.
- `src/app/admin/booking-actions.ts`, `bookings-panel.tsx`, new `booking-deletion-form.tsx`: confirmation, submission, cache invalidation, list result and owner-only action.
- `src/app/dev/booking-deletion/page.tsx`, `preview.tsx`: development-only, reversible synthetic UI; no database or external actions.
- `tests/database/admin-booking-deletion.test.mjs`: paid/unpaid deletion, released capacity, unchanged payments/refunds, references/tokens, history integrity, queue skip/insert guards, owner/tenant/grants, in-flight blocking and idempotency.
- `tests/database/core-schema.test.mjs`: includes the new service-only RLS table in the complete schema/security inventory.
- `tests/components/booking-deletion.test.mjs`: owner-only permission and required confirmation controls.
- `tests/postgres/concurrency.test.mjs`: real PostgreSQL race between deletion and replacement last-seat reservation, plus repeat-request audit/financial preservation.

## Validation and limits

Lint, typecheck and production build passed. Disposable database and real PostgreSQL tests exercise the actual migration/RPC, not a mock deletion. Full final suite:661 passed, zero failed (162 components,24 identity,225 integrations,215 database,28 real PostgreSQL,7 CMS verification). Native Chrome synthetic UI review: wrong reference, preserved inputs, busy rejection, successful removal, staff-role restriction, mobile375x812 and desktop1440x900 captures under `docs/evidence/booking-deletion-2026-10-30`. These are not production deletion evidence or physical Safari testing.

## Database and release dependency

Migration is prepared and tested locally ONLY. Production deployment requires a separately authorized migration-first release: inspect actual production dependencies and definition of search_admin_orders_v1, confirm both expected history foreign keys and existing migration version, use a short migration lock timeout, apply migration, verify registry/backfill/FKs/function grants and unchanged financial/booking fingerprints, then deploy application. Migration locks booking writes during backfill/trigger installation; it aborts on unexpected booking foreign-key consumers instead of dropping unknown constraints. No new Supabase project/environment.

Application rollback may disable/remove the delete control while keeping this compatible migration and retained history. After any permanent deletion, do not drop the registry, restore history FKs to live-only bookings, or pretend a migration rollback recovers deleted QR/management tokens. Deletion cannot be undone through the application; recovery would require an explicitly planned database backup restore. Before feature use, a database downgrade would need a no-deletions preflight and restoration of the reviewed prior search/FK definitions; no destructive downgrade script is supplied or automatically run.
