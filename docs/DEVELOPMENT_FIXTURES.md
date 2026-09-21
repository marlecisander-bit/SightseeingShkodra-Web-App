# Development fixtures

Run `npm run fixtures:preview` to create a disposable embedded PostgreSQL database, apply all migrations, load the fixtures and display the departure schedule. It closes the database afterwards and accepts no external connection string or disk path. It does not change the running website or a hosted database.

The fixture SQL is in supabase/fixtures/development.sql, outside migrations and the automatic Supabase seed path. It requires an explicit app.fixture_mode=development session setting. This is an accidental-use guard, not a security boundary; never run it on production.

The data includes two operators for isolation checks, one supplier, two draft van-tour products in separate operators, one vehicle, three ordered demo stops and three departures with capacities 0, 1 and 8. IDs and timestamps are fixed; service dates are June 1–2, 2030. These are synthetic examples, not current prices, actual schedules or validated stop locations. pricing_rules JSON is illustrative until Phase 2 defines the pricing contract.

Rerunning the seed uses ON CONFLICT(id) DO NOTHING; it neither duplicates records nor overwrites edits. To restore exact fixtures, recreate a disposable database rather than deleting data from an existing project. Fresh databases produce identical row values. No customer, booking, payment, hold, auth user or password is seeded. The separate tests/fixtures/staff.mjs identities remain test-only.

tests/database/development-fixtures.test.mjs verifies opt-in enforcement, required content, rerun stability, fresh-database equivalence and absence of financial/auth records. Existing domain regression fixtures remain separate because they intentionally exercise invalid, temporal and financial edge cases.
