# Database migrations

Phase 1B introduces the 21-table core schema in 20260917000100_core_schema.sql. Run `npm run test:db` to apply migrations to disposable embedded PostgreSQL and validate the structural baseline. No hosted database has been connected. Do not import the old system.

Phase 1C adds 20260920000100_inventory_holds_and_states.sql for inventory holds and lifecycle constraints (22 tables total). Both migrations are exercised by the database suite.

See docs/DATABASE_SCHEMA.md and docs/BOOKING_STATE_MODEL.md for representations, state transitions, safe access defaults, platform prerequisites and remaining Supabase integration validation. Automatic expiry cleanup and transactional capacity allocation are later booking-domain work.

15 October 2026: `20261015000100_homepage_partners.sql` is a prepared additive CMS migration for an operator-scoped editorial Partners collection and seven existing-document presentation settings. Actual migration/RLS and draft/publish behavior are tested in disposable PGlite. No partner records are seeded and no hosted database is changed by local verification. Apply to isolated staging before authenticated acceptance; production application requires separate explicit authorization.

16 October 2026: `20261016000100_catalog_presentation_retirement.sql` replaces only the existing Catalog save RPC, preserving omitted legacy presentation values and removing their publication requirement. Apply it before the corresponding metadata-free editor, only with separate hosted approval. This project has no dedicated staging environment; local upgrade/recovery rehearsal uses disposable databases. See `docs/CMS-FINAL-RELEASE-READINESS.md` for backup gates, controlled SQL Editor/history handling and migration-first release order. Do not replay old migrations to reconcile historical ledger gaps. No hosted migration was performed during local preparation.
