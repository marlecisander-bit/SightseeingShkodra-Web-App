# Phase 1 audit

Date: 2026-09-21. Result: **PARTIAL**. Checkpoint: **not created**.

Hosted verification update: scripts/verify-supabase-development.mjs now passes actual Auth sign-in/getUser, refresh-token exchange, authenticated tenant isolation, direct-write and protected-RPC denial, role-change visibility and membership deactivation. Synthetic records were removed. The table below describes the original audit; its platform gap is narrowed to Next.js cookie/expired-session integration and successful privileged RPC execution. See SUPABASE_DEVELOPMENT_SETUP.md for current evidence.

| Requirement | Result | Evidence / remaining verification |
| --- | --- | --- |
| Modular Next.js/TypeScript foundation | PASS | src/app, src/modules; production build, lint and typecheck pass. |
| Core schema and tenant relationships | PASS locally | 20260917000100_core_schema.sql; core-schema.test.mjs verifies all 22 tables including holds, mandatory tenant IDs, keys, money and capacity constraints. Every migration also applies to native PostgreSQL. |
| Hold and lifecycle constraints | PASS locally | 20260920000100_inventory_holds_and_states.sql; embedded expiry/transition tests and native competing consume/release tests. Capacity allocation itself is deferred to Phase 2. |
| Staff roles and verified authorization | PARTIAL | roles.ts, require-permission.ts, authorization.ts; 12 identity tests pass. Actual sign-in, cookie refresh and session expiry against Supabase remain unverified. |
| Operator-scoped RLS | PARTIAL | 20260921000200_operator_access_policies.sql; database tests cover all roles, foreign tenants, disabled/nonstaff callers, forged claims and direct write denial. Auth and PostgREST platform integration remains unverified. |
| Outbox/audit persistence | PASS locally | 20260921000300_outbox_and_audit_foundations.sql, activity.ts; immutable history, scoped actors, atomic rollback and real concurrent idempotency tests pass. Dispatch and delivery belong to later phases. |
| Reproducible synthetic fixtures | PASS | supabase/fixtures/development.sql and development-fixtures.test.mjs: guard, replay, fresh database equivalence and required capacities. |
| Foundation suite and quality checks | PASS locally | npm test: 74/74; npm run check: lint, typecheck, build pass. Native concurrency uses actual separate connections and verified lock waits. |
| Fresh project / no legacy imports | PASS | DECISIONS.md, synthetic fixtures; no old services or data accessed. |
| Deployment / production readiness | NOT APPLICABLE | This scope is local foundations; no deployment authorized or performed. |

## Code review and limits

Inspected src modules, database migrations, test coverage, secret configuration locations and Git changes. No booking/pricing implementation is duplicated in React; the public route remains a coming-soon page. Secret-key client construction is isolated in the server-only identity module, after authorization. Its trusted callback must still scope every future query to the authorized operator; this is not automatic enforcement by service_role. Environment files are ignored. No new manual schema changes or provider calls were introduced.

No confirmed Phase 1 application defect was found in this review. This is not a full security certification or browser accessibility/performance audit. The remaining integration gap cannot be established by the test auth substitutes. Before a PASS checkpoint, use a dedicated development Supabase environment to verify real sessions, refresh/expiry, role demotion, cross-operator reads/writes and privileged RPC access through the actual platform interfaces.

Phase 2 was not started. Last-seat allocation, booking API and provider payment behavior remain future work, not claims supported by this suite.

At audit time the work is on main. Phase 1G was committed as 02d04b0. Phase 1H changes comprise package files, the native test suite and these reports/status. Existing README.md changes are preserved; Next-generated AGENTS.md changes are left outside the phase commit.
