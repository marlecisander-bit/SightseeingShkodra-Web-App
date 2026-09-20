# Database migrations

Phase 1B introduces the 21-table core schema in 20260917000100_core_schema.sql. Run `npm run test:db` to apply migrations to disposable embedded PostgreSQL and validate the structural baseline. No hosted database has been connected. Do not import the old system.

Phase 1C adds 20260920000100_inventory_holds_and_states.sql for inventory holds and lifecycle constraints (22 tables total). Both migrations are exercised by the database suite.

See docs/DATABASE_SCHEMA.md and docs/BOOKING_STATE_MODEL.md for representations, state transitions, safe access defaults, platform prerequisites and remaining Supabase integration validation. Automatic expiry cleanup and transactional capacity allocation are later booking-domain work.
