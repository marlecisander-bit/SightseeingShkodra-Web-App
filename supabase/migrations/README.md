# Database migrations

Phase 1B introduces the 21-table core schema in 20260917000100_core_schema.sql. Run `npm run test:db` to apply migrations to disposable embedded PostgreSQL and validate the structural baseline. No hosted database has been connected. Do not import the old system.

See docs/DATABASE_SCHEMA.md for representations, safe access defaults, platform prerequisites and remaining Supabase integration validation. Inventory holds/state rules follow in Phase 1C.
