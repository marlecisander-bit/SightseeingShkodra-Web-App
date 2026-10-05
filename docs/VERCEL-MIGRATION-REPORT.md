# Permanent Vercel migration report

5 October 2026. **MIGRATION: PARTIAL. NETLIFY SAFE TO DISABLE: NO.**

Vercel is now the documented permanent platform in AGENTS.md, README, DEPLOYMENT.md and the recorded user decision. Supabase, Resend, booking rules and the independent map retain their responsibilities. The owner selected Hobby with background delivery disabled. No active Vercel cron was added; the existing protected Next handlers remain the future scheduling targets. Worker-boundary guards pause email processing and notification projection/push on all Vercel environments. Preview diagnostics cannot send email.

Preview builds with database credentials now require an explicit isolated project URL and a different production project reference; enabled email, push, projection or indexing flags fail the build. This protects against accidental environment inheritance, not a malicious/misconfigured owner declaration. Credentials must still be checked against the intended Supabase project. Isolated Preview booking/CMS operations remain available. No business calculation, permission policy or migration was changed by this hosting work.

## Inventory and infrastructure

[The file inventory](NETLIFY-MIGRATION-INVENTORY.md) classifies every discovered candidate reference before removal. Two legacy schedules call the existing Next endpoints; no business logic or public Netlify-function caller required relocation. No Netlify package, edge function, redirect or header rule needed replacement. No runtime infrastructure was removed because hosted parity is absent. Active setup instructions and Admin scheduler wording now name Vercel; historical evidence remains labeled as legacy.

The main legacy site is `sightseeingapp.netlify.app`. The separate authoritative map is **`sightseeingshkodralivetrackingapp.netlify.app`**, retained as an external service. Its Vercel iframe integration loaded in the preceding audit. Map migration is out of scope.

Next uses the standard full-stack build, Node 24, normal .next output, existing proxy/auth and route handlers; no static export. Existing service-worker no-store headers remain in next.config.ts. Public/admin manifests use relative URLs and shared icons. Admin SW has push/click handlers and no fetch cache. No cached Netlify asset URL was found. Physical PWA acceptance remains open.

## Hosted acceptance status

These results refer to the last authenticated Vercel audit in this session, not a new deployment. The audited production commit is `977a60ab51f2d852bbb56b77a805de7128b98cef`. All Project and linked Shared environment settings were empty. Local work has not been committed, pushed or deployed. FAIL below includes a required acceptance gate that has not passed; explanatory scope distinguishes failure from untested behavior.

| Required gate | Status | Evidence / remaining work |
|---|---|---|
| Vercel hosting | PASS | Existing production deployment Ready, Next.js preset, Node 24.x, production domain served |
| Git → Vercel Preview | FAIL — unverified | Existing Git repository connected; no feature-branch push/Preview acceptance performed |
| main → Vercel Production | PASS | Existing deployment identifies main and audited commit; current local candidate not released |
| Homepage | FAIL | Hosted empty main caused by missing configuration; local fallback/read fixes verified in prior audit |
| Public pages | FAIL | HTTP shells render but configured data parity absent |
| Booking | FAIL | Hosted availability 503; isolated regression verifies rules |
| Admin | FAIL | Hosted admin/sign-in 503 with missing configuration |
| Supabase | FAIL | Vercel binding absent; source database read verified separately |
| Resend | FAIL — delivery deferred | Architecture retained; owner explicitly paused background delivery on Hobby |
| Notifications | PENDING | Local schema/feature not hosted; projection deliberately paused |
| Web Push | PENDING | Dispatch paused; hosted subscription/device acceptance outstanding |
| WhatsApp | PENDING | Local implementation has no Netlify dependency; hosted migration/configuration outstanding |
| Live Map | PASS | Existing external iframe loaded; GPS/ETA accuracy outside this check |
| PWA | FAIL — acceptance incomplete | Local assets exist; current hosted admin manifest/SW configuration and physical acceptance outstanding |
| Desktop/mobile/tablet parity | FAIL — incomplete | Prior configured local desktop/390px check passed; hosted data absent; full tablet and physical-device matrix not established |

No hosted mutation tests were performed. Availability can materialize inventory, so it is not assumed read-only for a configured live database. Local disposable regression tests cover capacity, adult/child seats, infant zero seats, dates, future slots, 15-minute cutoff, modify/cancel/restoration, concurrency and QR contracts.

## Owner configuration and cutover

Follow [DEPLOYMENT.md](../DEPLOYMENT.md) for exact dashboard steps. [Environment inventory](VERCEL-ENVIRONMENT-INVENTORY.md) lists every variable name, consumer, visibility and Production/Preview/Development assignment. No secrets were output or transferred. Configure the eight essential production bindings, keep communication flags false, rebuild the reviewed candidate, and verify hosted workflows. Preview needs isolated Supabase credentials and explicit distinct project refs.

Netlify main hosting is not safe to disable because Vercel's booking, CMS and auth are still unconfigured and hosted parity has not passed. Legacy schedule activation was not changed; before any future Vercel activation disable legacy schedules, settle active leases and rotate the worker secret. No dual scheduler was introduced. The independent Netlify map must remain available regardless of main-app cutover.

Hobby is a deliberate delivery deferral, not a promise that every-minute jobs work there. [Vercel's plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) allow Hobby daily scheduling; no daily replacement was introduced. A future background-delivery activation needs a separate owner decision and guard/configuration review.

## Verification of this migration candidate

Clean isolated npm ci: PASS. Lint: PASS. TypeScript: PASS. Production build and next start: PASS. Complete regression chain: 324 passed, zero failures/skips (11 components, 17 identity, 118 integrations, 154 database, 24 PostgreSQL concurrency). One additional network-denial test was then added; the complete three-test migration guard file passed separately. Thus 325 distinct tests passed across these runs; the later targeted run is not added wholesale to the full-chain total.

Production-mode smoke: Home, Tour, Route, Explore, FAQ, sign-in, public/admin manifests and admin SW all HTTP 200. Home main contained 22,294 bytes of real published CMS markup. Both internal worker endpoints rejected unauthenticated requests with 401. Local product binding was deliberately blank to prevent availability reads from materializing hosted inventory; this is route/CMS smoke, not functional booking parity. The temporary port 3101 server was stopped; existing development server was preserved.

Logs: private/vercel-migration-install.log, -lint.log, -types.log, -tests.log, -guards.log, -build.log and private/vercel-migration-smoke.json. Existing dependency advisories remain (five high development-tool findings and one critical Next advisory, previously assessed in VERCEL-DEPLOYMENT-AUDIT.md); no automatic force upgrade was used. The isolated nested build emitted the known multiple-lockfile warning.

No commit, push, deployment, provider setting change, secret migration, hosted schema change, email/push send or Netlify shutdown was performed.
