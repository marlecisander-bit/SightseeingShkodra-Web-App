# Vercel deployment audit

5 October 2026. Audit and local fixes complete; production configuration, release and acceptance remain outstanding. No deployment, Supabase mutation, migration application, real email or push was performed.

## Exact cause of the blank homepage

The production project `sightseeing-shkodra-web-app` has **no project environment variables** in any environment and **no linked shared variables**. Both lists were inspected in the authenticated Vercel dashboard. The current production deployment is `A3zGvu32CAiKFTxSNaiAqHe5eDsD`, sourced from commit `977a60ab51f2d852bbb56b77a805de7128b98cef`, serving https://sightseeingshkodra.app. The newer local notification, WhatsApp and icon implementation is not included in that release.

The exact failure chain is:

1. `getWebsitePublication()` requires `PUBLIC_OPERATOR_ID`, `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
2. With these absent it returns `unavailableWebsiteContent()` before making any Supabase query.
3. That helper intentionally sets all eight homepage visibility flags false, protecting unpublished content.
4. `HomepageView` places every main section behind those flags; the result is an empty `<main id="main-content" class="p-home p-home-no-hero"></main>`.
5. The public layout independently renders Header/Footer using the unavailable-content defaults. CSS still reserves a main-area height, producing the large blank region.

The live DOM was inspected: main was empty, displayed as a block, approximately 622px high. This is absent server-rendered content, not hidden text, zero-height images, hydration failure or a frozen static build. No fallback content has been substituted for CMS data.

Controlled reproduction using `npm ci`, `npm run build`, and the Next production server reproduced the same empty main with server CMS bindings cleared. With the existing local CMS bindings, the same build returned 22,294 bytes inside main and six rendered sections, with the saved hero, destinations and reviews. A direct **read-only** CMS query returned HTTP 200, one published website record and its published body. This establishes that the intended database content exists; Vercel currently has no binding to that project at all.

The comparison deliberately clears the product slug and disables background workers, preventing availability reads from materializing hosted dated inventory. It proves CMS production rendering, not full live booking operation. No Supabase records were changed. Final local failure rendering now contains the explicit unavailable message, while configured rendering remains intact.

## Architecture and hosting inventory

| Area | Actual implementation | Vercel assessment |
|---|---|---|
| Framework | Next.js 16.3.5, React/React DOM 19.3.0, TypeScript 5.9.3 | Next.js preset supported; no architectural migration needed |
| Runtime/package manager | Node `>=24 <25`, npm lockfile; local Node 24.20.0/npm 11.19.0 | Dashboard Node 24.x confirmed |
| Build/start | `npm run build`, `npm run start`; build now runs a configuration preflight before `next build` | Dashboard framework Next.js, no command/output override, root directory unset/default |
| Router | App Router under `src/app`; route handlers and server actions | Native Vercel implementation |
| Output | Standard `.next`; no static export or custom server | Keep Next.js default output, do not select `out` or generic static hosting |
| Config | `next.config.ts`: image allowlist, server-action body limit, service-worker response headers | Portable Next.js config |
| Proxy | `src/proxy.ts`: Supabase cookie session refresh on admin/auth/admin API paths | Missing public Supabase config currently returns 503; authorization also enforced in handlers |
| Data | Server-only Supabase secret client; operator-scoped public projections and guarded staff RPCs | Keep same intended project/operator; no RLS bypass introduced |
| Public rendering | Server route/layout readers; client booking/navigation/interactive widgets | Build and runtime CMS rendering verified |
| Static assets | `public/brand`, images/icons, manifests, push service worker | Portable; latest icon/PWA work remains uncommitted/local |
| External services | Supabase Auth/Postgres/Storage/Realtime, Resend, Web Push, separate map iframe | Credentials and activation gates must be configured per environment |
| Netlify packages | No Netlify runtime package required by application dependencies | No package removal needed |
| Netlify config | `netlify.toml`, two scheduled function adapters | Vercel ignores these schedules; see scheduler section |
| Vercel config | No existing `vercel.json`; dashboard uses detected defaults | No config file required for the Next application; optional cron example supplied separately |

The repository is a dirty working tree containing earlier authorized feature work. Audit fixes were applied without reverting or committing that work. The local build tests the current candidate; the live deployment is the older commit above.

## Changes made in this audit

| File | Reason |
|---|---|
| `src/modules/content/website-server.ts` | Extracted testable publication read and added sanitized categories: missing configuration, client configuration, query failure, no publication and invalid published content. Logs contain no secrets, raw provider errors, URLs or CMS payloads. Existing publication filtering, operator scope, validation and no-store policy retained. |
| `src/app/(public)/page.tsx` | Detect unavailable publication before loading dependent homepage data; display a plain error state instead of an empty main. Intentionally hidden sections in a valid publication remain hidden. |
| `scripts/check-deployment-env.mjs` | Fail a Vercel Production build if essential named bindings are absent. Names only in output; credential validity is still a runtime/configuration responsibility. Preview/local workflows unchanged. |
| `package.json` | Invoke the preflight from the existing build command. No dependency version change in this audit. |
| `src/modules/content/image-upload.ts` | Keep 8 MiB non-hero original limit and unrestricted hero original size; optimize upload copies above 4 MiB to fit Vercel's 4.5 MB function-body ceiling with multipart headroom. Shared server validation uses the same upload limit. |
| `src/app/admin/reviews-editor.tsx` | Route reviewer photos through the same existing image preparation helper instead of sending up to 8 MiB directly. |
| `src/app/admin/website-editor.tsx` | Explain that larger accepted originals are optimized before upload. |
| `tests/integrations/website-publication.test.mjs` | Missing config, operator/publication filtering, no-store, visibility preservation, sanitized and distinct failures. |
| `tests/integrations/deployment-env.test.mjs` | Missing production values fail without exposing secrets; configured/non-production modes pass. |
| `tests/integrations/image-upload.test.mjs` | Verify original-size rule and optimization of a valid 5 MiB non-hero image as well as a large hero. |
| `.env.example`, `docs/VERCEL-ENVIRONMENT-INVENTORY.md`, `docs/vercel-cron-pro.example.json`, this report, `docs/PHASE_STATUS.md` | Configuration inventory, optional scheduler example and grounded audit evidence. |

The upload issue is confirmed by the server-action transport and the [Vercel Functions request limit](https://vercel.com/docs/functions/limitations). The local `9mb` Next parser setting cannot override the platform ceiling. No direct browser Storage write or new upload architecture was introduced. Real hosted upload remains pending; unit tests exercise image preparation with a mocked canvas.

## Environment inventory

Full names, consumers, client/server classification, requirement and host-presence matrix: [Vercel environment inventory](VERCEL-ENVIRONMENT-INVENTORY.md). No secret values are included.

Netlify's authenticated environment list contains the core Supabase/operator/product/site/checkout variables, optional map read bindings, email-enabled flag and indexing gate. Vercel's Project and Shared lists are empty across All Environments. This confirms the configuration was not transferred with the Git deployment. Values were not revealed or copied.

**The application expects `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not `NEXT_PUBLIC_SUPABASE_ANON_KEY`.** Setting only the latter does not configure this code. `SUPABASE_SECRET_KEY` is server-only and must never receive a `NEXT_PUBLIC_` prefix. Use URL and keys belonging to the same intended project; configure the same fixed operator/product for public and Admin consumers. No separate Vercel database is required.

Production, Preview and Development are distinct scopes. Production variables must be present during build and runtime. Do not give arbitrary preview deployments live sending/push gates or shared production mutation data. Use isolated test bindings for preview acceptance. Vercel changes apply to **new deployments**, not the already-built deployment. See [Vercel environment documentation](https://vercel.com/docs/environment-variables).

## Homepage/CMS source matrix

| Section/data | Authoritative source / Admin owner | Read-only source evidence | Visibility in saved publication | Current Vercel |
|---|---|---|---|---|
| Hero | Published website document / Website Hero | Saved text and image render in production-mode local build | Visible | Missing binding; hidden fallback |
| Introduction | Published website document / Website introduction | Rendered | Visible | Missing binding; hidden fallback |
| Route/destinations | Website heading plus published destination records / shared destination editor | Four destination entries render | Route visible | Missing CMS binding |
| Live promotion | Website text / Website; independent operational iframe | Text renders locally; live iframe also loads on Vercel `/route` | Visible | Homepage promotion hidden; standalone map works |
| Departures/pricing | Website labels plus canonical schedule/passenger pricing / Calendar & Pricing | CMS labels render; operational browser read intentionally disabled for read-only audit | Visible | Availability API 503 `UNAVAILABLE` |
| Reviews | Dedicated reviews and review settings plus website heading / Guest Reviews | Published review cards render | Visible | Unconfigured reader returns empty selection |
| Notebook | Website heading + shared destinations | Published flag read successfully | Hidden | Remains absent; must not force-enable |
| Final invitation | Shared website document / Website final invitation | Published flag read successfully | Hidden | Remains absent; must not force-enable |
| FAQ | Existing FAQ reader and product inclusions / existing product/editor ownership | Source traced; `/faq` route loads | Dedicated route, not restored to Tour | Shell loads; data incomplete |
| Amenities/inclusions | Product content/passenger-independent inclusions; legacy hero field inactive | Source ownership traced | Product publication dependent | Missing operational/content binding |
| Header/footer/legal/global | Same website publication; review link settings separate existing source | Saved social links appear locally | Shared global source | Default shell alone renders |
| WhatsApp | Six fields in same publication / Global WhatsApp editor | Prior local feature tests retained; defaults disabled | No business number enabled | New feature not in deployed commit |

The read-only record currently has notebook and final invitation Hidden. This differs from an older acceptance report's restored final invitation; this audit reports current data and did not change it.

## Rendering, client boundaries, images and PWA

CMS readers call `connection()` and use `cache: 'no-store'`; React `cache()` only deduplicates within a request. The production build labels the homepage dynamic. There is no evidence that an empty build-time CMS result is frozen by ISR. No global force-dynamic change was needed.

Browser globals/hooks were inspected. Interactive entry components are client components. The canvas image helper executes only from browser file-selection handlers; checkout storage cleanup is called from client flow handlers. Other search hits were type/text/icon names. Build/type checks and the configured local production browser showed no hydration error. This is not exhaustive execution of every authenticated flow.

Current CMS image host matches `*.supabase.co/storage/v1/object/public/website-media/**`, already allowed in Next config. The production-mode hero and destination images loaded with nonzero natural dimensions and no observed broken images. Image failure is not what removed the live main: there are no images or sections in it. Public Media uses existing optimization/fallback decisions; no host wildcard expansion was needed.

Local public/admin manifests and `/admin/sw.js` return 200. The service worker is scoped to Admin push and has **no fetch handler/offline HTML cache**, so it cannot cache a stale homepage. Netlify and Vercel custom domains have separate service-worker origins. The new shared icons/PWA files are absent from the older deployed commit; on Vercel the missing auth config also makes `/admin/*` requests 503. Physical installation and real push remain pending.

`NEXT_PUBLIC_SITE_URL` controls canonical/booking/recovery links. The live homepage currently has no canonical because that variable is missing. Set the final canonical production origin; do not bake a preview domain into source. Verify Supabase Auth site and allowed recovery redirect URLs for the new origin manually; no Auth project settings were modified.

## Netlify dependency decisions and endpoint inventory

| Dependency | Decision | Explanation |
|---|---|---|
| `netlify.toml` build/function config | KEEP for existing Netlify deployment | Ignored by Vercel; not a runtime dependency |
| `netlify/functions/booking-email-schedule.mjs` | MIGRATE scheduling when activating on Vercel | Calls existing Next email worker; no email engine rewrite |
| `netlify/functions/admin-notifications-schedule.mjs` | MIGRATE scheduling when activating on Vercel | Calls existing Next projector/push worker |
| Independent `sightseeingshkodralivetrackingapp.netlify.app` map | KEEP EXTERNAL | Intentional iframe, read-only integration; works on Vercel |
| `NETLIFY_EMAILS_DIRECTORY`, `NETLIFY_EMAILS_SECRET` on host | Do not copy to Vercel | No application source references; no deletion of old host settings performed |
| Netlify-only redirects/headers/API calls | None requiring conversion found | No `/.netlify/functions/*` application dependency; response headers use Next config/proxy |

| Endpoint/function | Implementation and consumer | Compatibility / evidence |
|---|---|---|
| GET `/api/public/availability` | Next route, canonical Supabase availability | Portable; live valid request currently 503 due missing binding |
| GET `/api/public/day-planner` | Next route, public planner | Portable; depends on same configured sources |
| POST `/api/public/checkout` | Next route for hold/customer/confirmation lifecycle | Portable Node crypto/cookie flow; requires checkout signing secret; disposable regression passes |
| GET/POST `/api/public/booking-management` | Next customer token/status/modify/cancel route | Portable; disposable regression covers ownership, seats, cutoffs, QR lifecycle |
| Admin server actions | Authenticated CMS/catalog/reviews/calendar/pricing/bookings/email operations | Portable; same operator/RLS guards; hosted auth currently unavailable |
| GET/POST `/api/admin/notifications` | Authenticated Next route, inbox/preferences/device controls | Portable; prior feature not deployed; local tests pass |
| GET `/api/internal/booking-emails` | Node route, CRON_SECRET bearer auth, bounded Resend worker, maxDuration 60 | Live unauthenticated request correctly 401; actual sending not tested |
| GET `/api/internal/admin-notifications` | Node route, CRON_SECRET bearer auth, bounded projector/push, maxDuration 30 | Current Vercel 404 (older code); current local unauthenticated route 401 |
| Auth routes/actions | Supabase SSR session, claims, reset/recovery | Portable; current Vercel `/admin` and `/auth/sign-in` return 503 |
| Analytics | No analytics runtime integration found | Nothing to migrate or enable |

Vercel invokes cron jobs as GET requests and can attach `Authorization: Bearer <CRON_SECRET>`; existing endpoints already accept this. The current project is Hobby. Its cron schedule is limited to once daily, which does not preserve the existing every-minute delivery behavior. See [cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) and [secure cron configuration](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

A **non-active** example for an appropriate Vercel plan is supplied at `docs/vercel-cron-pro.example.json`. Do not copy it into a Hobby deployment: an unsupported schedule can fail deployment. Alternatively, an approved external scheduler can call the same existing protected endpoints. This choice needs owner configuration, not another booking/email engine. Keep both workers disabled until migrations, activation instants and safe recipients/devices are verified. Do not run two production schedulers unintentionally. No schedule, paid plan or sender was activated.

## Verification and limitations

| Gate | Result |
|---|---|
| Clean dependency installation | `npm ci` PASS in isolated audit copy |
| Baseline production build/start | PASS; missing CMS config reproduces exact live blank main |
| Final production build/start | PASS; configured CMS retained; missing configuration now visibly explained |
| TypeScript | PASS |
| Lint | PASS |
| Complete final test chain | **322 tests, 322 passed, 0 failed, 0 skipped** |
| Test breakdown | 11 components, 17 identity, 116 integrations, 154 database, 24 real PostgreSQL concurrency |
| Local production desktop/mobile | 1920px desktop and 390px emulated mobile inspected, no document overflow; loaded hero/section images |
| Live browser | Empty main verified; no captured homepage console error; response capture had no observed failed entries, but event buffer was truncated and is not a complete network profile |
| Live map | Actual Vercel `/route` iframe, marker, stops and controls loaded; GPS/ETA accuracy not certified |
| HTTP routes | Live public page shells 200, Admin/auth 503, valid availability 503, email worker 401, notification worker 404; local page/sign-in/static PWA smoke 200 |

Logs/evidence: `private/vercel-audit-install.log`, `private/vercel-audit-baseline-build.log`, `private/vercel-audit-final-build.log`, `private/vercel-audit-final-tests.log`, `private/vercel-audit-final-lint.log`, `private/vercel-audit-final-typecheck.log`, `private/vercel-audit-cms.json`, `private/vercel-audit-routes.json`. Private evidence is local only.

Install warnings: ESLint 9.39.5 deprecation, npm install-script review notices and six existing dependency advisories (one critical Next, five high ESLint-chain findings). Nested isolated checkout start warns about multiple lockfiles; this is an audit-directory layout warning, not observed in the project-root Vercel settings. A missing-publication metadata warning appeared in the intentionally stripped configuration run; normal configured browser had no captured console warning/error.

The Next advisory affects Node `next/og` ImageResponse with attacker-controlled SVG input. No `next/og` source use was found. This does not explain the homepage symptom, but the existing dependency patch review remains a release follow-up. No dependency downgrade or broad `npm audit fix --force` was used. [Upstream advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) identifies 16.3.6 as patched; npm currently suggests 16.3.8. Five high development-tool findings remain separately recorded.

Real booking creation/modification/cancellation, authenticated Admin save/publish, hosted image upload, actual email/push delivery and physical iOS/Android acceptance were not executed. The explicit no-Supabase-change instruction prevents hosted mutation tests; availability itself calls `ensure_schedule_date_v1`. Disposable database suites cover adults/children seats, infants zero seats, capacity concurrency, historical pricing, service dates, 15-minute Europe/Tirane boundaries, modification/cancellation and QR contracts. Passing those tests is not a claim that the unconfigured live site works.

## Current production status

FAIL here describes the current Vercel deployment, not failure of the local unit/database gate. PENDING means activation/deployment/acceptance has not occurred.

| Requested status | Result | Scope |
|---|---|---|
| NEXT.JS BUILD | PASS | Live deployment Ready; clean local final build also passes |
| HOMEPAGE | FAIL | Live main empty until correct environment and new deployment |
| CMS CONTENT | FAIL | Live reader unconfigured; published source and local production render pass |
| SUPABASE | FAIL | Vercel has no connection configuration; intended database read is healthy |
| PUBLIC PAGES | FAIL | Routes load, but data completeness is not satisfied |
| BOOKING ENGINE | FAIL | Live availability 503; local domain/database regression passes |
| ADMIN PANEL | FAIL | Live `/admin` 503 |
| ADMIN AUTH | FAIL | Live sign-in 503; session acceptance blocked |
| RESEND EMAIL ARCHITECTURE | PASS | Portable protected worker; configuration/scheduler/delivery PENDING |
| NOTIFICATION CENTER | PENDING | Local feature not deployed; migration/activation not applied here |
| WEB PUSH | PENDING | VAPID, worker, devices and delivery acceptance outstanding |
| WHATSAPP | PENDING | Local feature not deployed; defaults disabled until configured |
| LIVE MAP | PASS | Existing iframe loads on Vercel; no engine changes |
| PWA | FAIL | Current deployment lacks new implementation/configuration; local asset smoke passes |
| MOBILE | FAIL | Live homepage incomplete; configured local 390px layout passes |
| DESKTOP | FAIL | Live homepage incomplete; configured local desktop layout passes |
| TYPESCRIPT | PASS | Final current candidate |
| LINT | PASS | Final current candidate |
| TESTS | PASS | 322/322 final current candidate |

## Owner actions

1. Open **Vercel → sightseeing-shkodra-web-app → Settings → Environment Variables → Add Environment Variable**, select **Production**, and add the eight required names from the inventory. Copy the correct intended Supabase URL, publishable key, server secret, operator ID, product slug and checkout signing secret from your existing secure configuration; do not paste secrets into chat. Set the application environment and canonical site origin for the actual production deployment. Keep the existing checkout signing secret when preserving valid signed checkout sessions across hosts is required.
2. Add optional read-only map variables if the planner/admin stop references are needed. Keep indexing, email, notification and push gates disabled until their separate launch/acceptance conditions are met. Never substitute the independent map database for the booking/CMS database.
3. Keep **Framework Preset: Next.js**, **Node: 24.x**, root directory at the repository root and default Next output. The build command must run **`npm run build`** so the new preflight is honored.
4. Review the exact source diff to release. Vercel currently runs `977a60a`; local newer work is not automatically included. If releasing notification/WhatsApp features, separately review/apply their existing migrations before enabling/saving those features. This audit added no migration and applied none.
5. Verify Supabase Auth site/recovery redirect allowlists for the production domain. Choose a supported minute scheduler before activating background delivery; the supplied Pro example is not active configuration.
6. Create a **new production deployment after configuration and release approval**. Environment changes alone cannot repair the existing deployment. Deployment was explicitly excluded from this audit and was not performed.
7. After deployment, check the real homepage, canonical URL, Admin login/session and isolated or explicitly authorized test booking/CMS/media flows. Then separately verify controlled email/push delivery and physical phone PWA behavior.

No redesign, CMS hardcoding, RLS relaxation, Live Map rewrite or booking-rule change was made. Repository fixes are locally verified; the hosted application cannot be called fully ready while the required production configuration and acceptance remain outstanding.
