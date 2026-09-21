# Phase 1H foundation verification

Date: 2026-09-21. Local checks PASS; Supabase platform integration remains pending.

Added `tests/postgres/concurrency.test.mjs` and `npm run test:postgres`, included in `npm test`. The runner starts a disposable PostgreSQL 17 cluster on a temporary loopback port, applies every migration and the development fixtures, and uses three independent connections. Tests observe an actual PostgreSQL lock wait before committing or rolling back the competing transaction.

The five cases verify duplicate event/audit requests, conflicting idempotency payloads, rollback followed by a waiting request, and competing hold consumption/release after commit and rollback. They run writes as service_role. They do not implement or prove last-seat allocation: the transactional capacity allocator belongs to Phase 2.

## Results

- `npm test`: PASS, 74 tests (12 identity, 5 integration adapter, 52 embedded database/fixture, 5 native PostgreSQL concurrency).
- `npm run check`: PASS, zero-warning ESLint, route generation, TypeScript and production build.
- `npm run fixtures:preview`: PASS during Phase 1G.
- Dependency installation audit: zero reported vulnerabilities.

The initial new hold tests failed because their synthetic orders lacked a required customer. Corrected the test setup; all checks above passed afterward. No application schema defect or migration change was needed.

## Configuration and operation

Added development dependencies embedded-postgres 17.10.0-beta.17 and pg (exact versions in package files). No environment variables, hosted database, system service or user accounts were added. Each run creates its own temporary directory and random password, binds only to 127.0.0.1, stops its own database process, validates the temporary directory path, then removes it. No external database URL is accepted. Verified on Windows; other operating systems are not yet verified. The package downloads native platform binaries during installation.

## Remaining work

Both database runners substitute auth.users and auth.uid. Actual Supabase Auth, signed session cookies, PostgREST/RPC exposure and hosted role configuration still need a dedicated development integration run. No credentials need to be posted in chat. Configure the development environment locally when that project is available.

No roadmap deviation. Phase 1 audit is PARTIAL; no checkpoint tag is appropriate yet. See PHASE_1_AUDIT.md.
