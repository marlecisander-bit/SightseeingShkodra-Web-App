# Sightseeing Shkodra deployment

Official hosting: **Vercel**. Framework: full-stack **Next.js**. Production branch: **main**. Production domain: **sightseeingshkodra.app**. Supabase remains PostgreSQL, Auth, Storage and Realtime. Resend remains the email provider.

## Workflow and current state

Feature branch → Git push → Vercel Preview → test with isolated data → merge to main → Vercel Production. Use the existing Git integration, not a second deployment pipeline. The audited project is `sightseeing-shkodra-web-app` under `aleksander-marleci`; repository `marlecisander-bit/SightseeingShkodra-Web-App`. Production main deployment was verified; a fresh feature-branch deployment still needs acceptance.

Owner decision, 5 October 2026: **retain Hobby and leave background delivery disabled**. No root `vercel.json` is needed. Do not install the inactive `docs/vercel-cron-pro.example.json` on Hobby. Every-minute scheduling requires a different plan; silently replacing it with daily processing is not acceptable. Both worker entry points return disabled on Vercel before database work, even if delivery flags are accidentally enabled. Inbox projection is also paused, so new inbox events will not appear automatically. Existing inbox reads remain available after schema/configuration is installed.

## Dashboard setup

1. Open Vercel → project → Settings → Git. Confirm the existing GitHub repository and Production branch `main`; allow Preview deployments for feature branches.
2. Settings → Build and Deployment: Next.js preset, Node 24.x, repository root, normal `npm run build`, standard `.next` output. Leave install/output overrides unset. Never use static export.
3. Settings → Environment Variables: configure the names in [the environment inventory](docs/VERCEL-ENVIRONMENT-INVENTORY.md) for the correct environment. The last authenticated audit found no Project or linked Shared variables. Transfer values privately from their authoritative service configuration; do not paste secrets into Git or reports.
4. Production essentials: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `PUBLIC_OPERATOR_ID`, `PUBLIC_HOMEPAGE_PRODUCT_SLUG`, `CHECKOUT_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL=https://sightseeingshkodra.app`, `APP_ENV=production`. Keep `EMAIL_ENABLED=false`, `ADMIN_NOTIFICATIONS_ENABLED=false`, `ADMIN_PUSH_ENABLED=false`; keep indexing off until launch approval. Preserve optional read-only map bindings if used.
5. Preview: use a separate disposable Supabase project, its matching public/server keys, test operator/product and separate checkout secret. Set `PREVIEW_SUPABASE_PROJECT_REF` to that project and `PRODUCTION_SUPABASE_PROJECT_REF` to the actual live project. The build rejects equal refs, a URL not matching the Preview ref, incomplete keys or enabled communications/indexing. Owner must verify that credentials belong to the intended project; this guard does not authenticate keys. A credential-free Preview may build a configuration-unavailable shell. Set `APP_ENV=preview`, its own HTTPS site origin and all communications/indexing flags false. No real Resend/VAPID secrets are needed. Preview test-email sends are denied as well as background workers. Full booking/CMS tests remain usable with isolated data.
6. Development: Node 24, `npm ci`, private `.env.local`, `APP_ENV=development`, localhost origin, isolated test data and communications disabled. Never copy production privileged credentials into shared Preview/Development scopes. Local test-email diagnostics require the existing explicit controlled recipient and staff permission.
7. Supabase Auth: verify Production site/recovery URLs and separately configure the isolated Preview project's redirect allowlist. Apply reviewed existing application migrations to the intended database through the normal controlled process. This migration task has not applied hosted schema changes.
8. Settings → Domains: ensure `sightseeingshkodra.app` belongs to this project with valid DNS/TLS. Redeploy after setting build-time variables. Do not hardcode generated deployment hostnames as production canonical URLs.

## Workers and eventual activation

`GET /api/internal/booking-emails` and `GET /api/internal/admin-notifications` are existing Node Route Handlers. They retain timing-safe bearer `CRON_SECRET` authentication, bounded execution, leases/idempotency and sanitized errors. No public caller uses `/.netlify/functions/`. Email and push providers remain server-only.

For a future separately authorized activation: first stop legacy schedules and flags, wait for active leases/runs to settle, rotate the cron secret, choose exactly one scheduler, review/remove the Vercel pause guard, configure the original one-minute cadence and test against controlled recipients. Never activate both hosts. The current work neither activates scheduling nor changes legacy hosted settings. Do not manually invoke workers to bypass the Hobby pause.

## Legacy infrastructure and map exception

See [complete inventory](docs/NETLIFY-MIGRATION-INVENTORY.md). Keep `netlify.toml` and two legacy adapters until Vercel parity; do not introduce new Netlify functionality. Current Next routes contain the actual worker logic already. No Netlify redirect/header rule needs migration and no Netlify package is required.

The independent Live Map remains `https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html` with the existing project/embed parameters. It is separate from the old main website `https://sightseeingapp.netlify.app`. Preserve its iframe and read-only stop connection. Migrating the map needs a separate controlled scope.

Public/admin manifests use relative icons/start URLs. The admin service worker handles push/click events and has no fetch cache or hardcoded Netlify assets; existing no-store headers remain. Service-worker registrations are origin-bound, so an old Netlify origin cannot control the Vercel production domain. Physical installed-device acceptance is still required.

## Release gate

Run clean install, lint, typecheck, tests and a real production build/start. Verify public pages, booking lifecycle/cutoffs/capacity, auth/admin/CMS/pricing, Supabase, WhatsApp, PWA and the external map at desktop/tablet/mobile sizes. Email/push delivery remains deliberately deferred on Hobby. Do not represent local tests or HTTP shell responses as hosted functional parity. Keep legacy main hosting available until hosted parity and owner-approved cutover; never disable the external map as part of main-site cleanup.

References: [Vercel cron plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [cron authentication and management](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [deployment audit](docs/VERCEL-DEPLOYMENT-AUDIT.md).
