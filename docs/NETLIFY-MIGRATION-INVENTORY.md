# Netlify dependency inventory

## Current-state correction — 8 October 2026

The read-only audit observed production communications flags enabled, one active Supabase minute cron invoking both authenticated Vercel worker routes through Vault/pg_net, advancing successful worker heartbeats, and a verified Resend domain. This replaces earlier statements of observed disabled/unconfigured state; it does not retroactively establish who authorized activation. The owner approved local stage-A maintenance only. Preserve current infrastructure; no new activation, disablement, scheduler, secret rotation or cloud change is authorized here. Preview/Development must remain isolated with communications disabled.

The legacy main Netlify URL returns 404 and is absent from the current team listing; it is not a verified rollback target. Keep the independent Netlify map unchanged. Historical setup instructions below are evidence, not current activation instructions; use root DEPLOYMENT.md for current platform/configuration.


5 October 2026. Inventory completed before any removal. Scope: Git-tracked and non-ignored candidate files, including package-lock; binary original roadmap is retained unchanged. Ignored private verification copies, installed node_modules and generated .next are not deployment sources. No files removed.

| Location | Purpose | Classification | Still used / migration required | Replacement |
|---|---|---|---|---|
| `docs/ADMIN-NOTIFICATIONS-ARCHITECTURE.md` | Deployment/activation guidance | MIGRATE | Superseded by DEPLOYMENT.md / Vercel wording | See DEPLOYMENT.md |
| `docs/ADMIN-NOTIFICATIONS-REPORT.md` | Deployment/activation guidance | MIGRATE | Superseded by DEPLOYMENT.md / Vercel wording | See DEPLOYMENT.md |
| `docs/BOOKING-UI-ONLINE-ACCEPTANCE.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/EMAIL-ACTIVATION-PREPARATION.md` | Deployment/activation guidance | MIGRATE | Superseded by DEPLOYMENT.md / Vercel wording | See DEPLOYMENT.md |
| `docs/ONLINE-ACCEPTANCE-REPORT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/PUBLIC-PLATFORM-AUDIT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/PUBLIC-PLATFORM-INVENTORY.json` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/PUBLIC-PLATFORM-LIVE-SEO.json` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/VERCEL-DEPLOYMENT-AUDIT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/VERCEL-ENVIRONMENT-INVENTORY.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `netlify.toml` | Not present in repository or fetched history | ABSENT — DO NOT RECREATE | Verified 8 October 2026 with `git log --all -- netlify.toml` at `f4f0ded`; original inventory claim corrected | Preserve existing hosted legacy infrastructure separately |
| `netlify/functions/admin-notifications-schedule.mjs` | Legacy main-site build/schedule adapter | KEEP TEMPORARILY | Retain until hosted parity; not used by Vercel | Existing Next internal routes; scheduling paused on Hobby |
| `netlify/functions/booking-email-schedule.mjs` | Legacy main-site build/schedule adapter | KEEP TEMPORARILY | Retain until hosted parity; not used by Vercel | Existing Next internal routes; scheduling paused on Hobby |
| `src/modules/tracking/public-map-binding.ts` | External authoritative iframe | EXTERNAL SERVICE | Yes; keep exact host | None; separate controlled map migration |
| `tests/integrations/admin-push.test.mjs` | Legacy adapter regression coverage | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `tests/integrations/email-scheduler.test.mjs` | Legacy adapter regression coverage | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `.env.example` | Deployment/activation guidance | MIGRATE | Superseded by DEPLOYMENT.md / Vercel wording | See DEPLOYMENT.md |
| `AGENTS.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `README.md` | Deployment/activation guidance | MIGRATE | Superseded by DEPLOYMENT.md / Vercel wording | See DEPLOYMENT.md |
| `docs/ADMIN-AUTH-AUDIT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/ADMIN-REFINEMENT-FINAL-REPORT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/BOOKING-EMAILS.md` | Deployment/activation guidance | MIGRATE | Superseded by DEPLOYMENT.md / Vercel wording | See DEPLOYMENT.md |
| `docs/BOOKING-MANAGEMENT-AUDIT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/CANCELLATION-REBOOKING.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/CMS-VISIBILITY-AUDIT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/DAY-PLANNER.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/GLOBAL-FOOTER-REPORT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/HOMEPAGE-CMS-MAP.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/LIVE-MAP-EMBED-RESPONSIVE-AUDIT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/LIVE_MAP_EMBED.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/LOCAL-ACCEPTANCE-SETUP.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/MOBILE-BOOKING-DIALOG.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/MOBILE-HERO-COMPOSITION.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/MOBILE-HERO-FULLSCREEN.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/MOBILE-HOMEPAGE-STRUCTURAL-FIXES.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/PERFORMANCE-AUDIT.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/PHASE_STATUS.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/RESPONSIVE-RELEASE-CANDIDATE.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/TOUR-FAQ-CLEANUP.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |
| `docs/WIDGET-CONTROLS.md` | Historical evidence/reference | KEEP TEMPORARILY | Evidence only; not executable hosting configuration | See DEPLOYMENT.md |

No @netlify package dependency, edge function, /.netlify/functions caller, _redirects or _headers file found in application sources/configuration. The two legacy minute adapters invoke /api/internal/booking-emails and /api/internal/admin-notifications with bearer authorization; no business logic moves between hosts. The earlier claim about `netlify.toml` contents was incorrect: the file is absent from the repository and fetched history. Next.js already owns service-worker cache headers. REMOVE classification applies to obsolete active deployment instructions, replaced in README and environment comments; historical audit evidence stays. Netlify-only NETLIFY_EMAILS_DIRECTORY and NETLIFY_EMAILS_SECRET have no application consumer and must not be copied to Vercel.

The actual external map is sightseeingshkodralivetrackingapp.netlify.app. sightseeingapp.netlify.app is the legacy main website, not the iframe authority. All historical main-site URLs remain evidence only. Live bindings are documented in DEPLOYMENT.md.
