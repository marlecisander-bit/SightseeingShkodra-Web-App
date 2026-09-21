# Supabase development setup

Current acceptance: Phase 1 foundations PASS; see PHASE_1_PLATFORM_ACCEPTANCE.md. Run the hosted verifier with `node --env-file=.env.local --import tsx scripts/verify-supabase-development.mjs` (tsx is required for the actual proxy import). Earlier pending notes below are historical. A dedicated synthetic audit operator and one immutable event/audit pair are now intentionally retained; all temporary identity fixtures are removed.

Configured on 2026-09-21 for the fresh development project `sightseeing-shkodra-dev`.

- Project reference: `ybngoppqqiohcduojfyg`
- Project URL: https://ybngoppqqiohcduojfyg.supabase.co
- Dashboard: https://supabase.com/dashboard/project/ybngoppqqiohcduojfyg
- Actual region: eu-west-1 (Ireland), verified through the CLI.
- CLI used: 2.117.0. Local configuration: supabase/config.toml.

The CLI was already authenticated. Linked only this project, previewed the migration push, then applied all five existing foundation migrations. Remote migration history matches the local versions. No fixtures, legacy data or staff users were imported. Other projects were left untouched.

Project URL, publishable key and secret key are stored in Git-ignored .env.local. Key values were suppressed from tool output and are not recorded here. Local CLI link state under supabase/.temp is also ignored. The local config file does not automatically configure hosted Auth settings.

## Verification

Read-only requests through the actual hosted PostgREST API succeeded using the secret key for operators, staff_profiles, products, departures, inventory_holds, orders, domain_events and audit_logs. Anonymous operator reads were blocked. The Auth settings endpoint returned HTTP 200 using the publishable key.

These are connection smoke checks, not full platform acceptance. Real user sign-in, cookie refresh/expiry, membership demotion, authenticated cross-operator RLS and privileged RPC integration tests remain pending before the Phase 1 checkpoint. No checkpoint or Phase 2 work was performed.

## Hosted identity verification (2026-09-21)

Added and ran `node --env-file=.env.local scripts/verify-supabase-development.mjs` successfully. This explicit opt-in script accepts only APP_ENV=development and this project's exact URL. It creates two synthetic operators and two confirmed Auth users without sending email; generates random passwords in memory; and deletes its own records in finally. It is excluded from the ordinary local test suite.

Verified real password sign-in and getUser identity, own-operator reads, guessed foreign-operator reads returning no rows, direct mutation denial, raw outbox read denial, refresh-token exchange, role changes visible without re-login, protected RPC denial (42501), immediate access removal after membership deactivation, and anonymous denial. Both runs completed cleanup successfully. Lint passes.

Remaining acceptance gap: this runner uses Supabase JS sessions, not Next.js HTTP cookie handling. Browser/SSR cookie refresh and expired-session behavior still need verification. Successful privileged event/audit RPC execution is also not exercised here, to avoid leaving immutable test history. Phase 1 remains PARTIAL; no checkpoint tag created.
