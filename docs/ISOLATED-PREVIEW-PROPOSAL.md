# Isolated Supabase and Vercel Preview proposal

## Current baseline — 8 October 2026, superseding historical findings below

Source baseline is main/origin/main `18c48d0d88736de7dc9aae3a6fd7c8feb0054022`; dependency security patches are already published. The approved credential rotation subsequently redeployed this same source and revoked the exposed server key. Old deployment snapshots require current credentials before rollback. No secret values belong in these documents.

The fresh read-only **44-migration** comparison found matching final application structure: 350 columns, 121 indexes, 264 comparable constraints, 38 triggers, 27 policies, 34 RLS tables and 89 functions with equivalent executable definitions. `bookings.meeting_point_snapshot` exists. The previously reported email-function drift and proposed function replacement are **superseded; do not execute that repair**. Seven migration-history entries remain unrecorded; eleven explicit service-role trigger grants differ. Neither is permission to replay SQL or change privileges. Historical QR aggregate checks were clean but are not a fresh data audit.

Production Auth URLs were corrected under separate approval. Production delivery is observed active; preserve it. Inbox acceptance, historical data-update provenance, isolated functional development/Preview, CI/protection activation and hosting eligibility remain pending. Owner declined new/duplicate backends. Local production mutation bindings stay unset; communications stay disabled locally/Preview. The historical statements below describe their original inspection stage, including obsolete commit IDs, dependency-release status and disabled-delivery advice; they are not current operational instructions.

See [reconciliation proposal](SUPABASE-RECONCILIATION-PROPOSAL.md), [controlled acceptance](PRODUCTION-ACCEPTANCE.md) and [review packet](READINESS-RELEASE-REVIEW.md). No migration/history/grant/cloud change is authorized by this update.

## Historical record — preserved, superseded where noted above


## Owner decision — 8 October 2026

Owner declined creating or duplicating a database and identified the existing production project as the only hosted backend. Resource creation and Preview database bindings in this proposal are NOT approved. Retain this document as a proposal; do not execute provisioning, copy production credentials into Preview, or weaken stage-A guards. Functional Preview remains unavailable; use credential-free previews and disposable local automated tests.

Owner separately approved only the production Auth URL correction. Site URL https://sightseeingshkodra.app and redirect https://sightseeingshkodra.app/auth/activate were saved and verified after reload; all four previous redirects retained. No email sent, users changed, migrations applied, resources created or deployment performed.


8 October 2026. PROPOSAL ONLY: no cloud resources/configuration, deployment or push authorized or performed.

## Resources and approval scope

Recommended: one separate Supabase project named `sightseeing-shkodra-preview`, Micro compute, eu-west-1, in the existing Pro organization. It must have a new project ref and database password; never restore production data into it. Use it for a trusted acceptance branch and local development with synthetic data. Shared test data may be modified by both clients; resets require coordination. No production branch, settings, map project or old service changes.

Additional Micro compute is $0.01344/hour, approximately $10/month for continuous operation; the organization's existing $10 compute credit is shared, not an additional credit per project. Treat the new project as approximately $10/month incremental compute, plus applicable usage/tax. Compute is not covered by the spend cap. No paid add-ons, custom domain, IPv4 or PITR proposed. Verify the creation screen estimate before approval. A separate Free organization/project is an alternative if available and approved; account limits/pausing apply. Source: [Supabase compute pricing](https://supabase.com/docs/guides/platform/manage-your-usage/compute).

Use the existing Vercel project; no new Vercel project or custom domain proposed. The owner previously selected Hobby, but current [Vercel Hobby documentation](https://vercel.com/docs/plans/hobby) restricts it to non-commercial personal use. This commercial booking site therefore has an unresolved plan conflict: obtain an eligible plan decision or explicit provider confirmation before Preview/production hosting. No plan upgrade is authorized or performed. An eligible Pro alternative currently costs a $20/month platform fee including one deploying seat and $20 usage credit, plus excess usage/tax ([official pricing](https://vercel.com/docs/plans/pro-plan)); combined with a new Micro backend, budget about $30/month incremental before excess usage/tax if that alternative is selected. No cron, emails or push resources needed.

Approval would cover: creating this one test project, applying all 44 repository migrations there, creating synthetic fixtures and test Auth users/Storage objects, configuring that project's Auth redirects, and setting the Vercel Preview-only/Development-only variables below. It would NOT authorize production changes, deploying, pushing, or connecting Preview to production. Preview execution/deployment is a separate later authorization.

## Exact bindings

Store secrets privately in Supabase/Vercel settings and ignored `.env.local` (mode 600). Never use chat or tracked files. Check `.gitignore` with `git check-ignore .env.local private/example` before provisioning. Prefer branch-specific Preview bindings for a single trusted `preview/acceptance` branch. Do not share the privileged test key with untrusted forks/branches. Current Vercel Preview has no project/shared variables and tracks all unassigned branches; narrowing availability to the approved branch requires explicit configuration approval.

| Variable | Preview value/source | Local Development value/source |
| --- | --- | --- |
| `APP_ENV` | `preview` | `development` |
| `NEXT_PUBLIC_SITE_URL` | Exact approved HTTPS Preview origin, to be determined before configuring Auth; no placeholder deployed | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<new-test-ref>.supabase.co`, new test project's Connect/API settings | Same test URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | New test project's publishable key | Same test key |
| `SUPABASE_SECRET_KEY` | New test project's matching server secret key; server-only | Same test server key, local private file only |
| `PUBLIC_OPERATOR_ID` | UUID of newly created synthetic operator | Same synthetic operator UUID |
| `PUBLIC_HOMEPAGE_PRODUCT_SLUG` | `shkodra-day-tour`, synthetic published/priced product | Same |
| `CHECKOUT_SESSION_SECRET` | Fresh random at least 32 characters, generated privately | Separate local random secret already exists; retain privately |
| `PREVIEW_SUPABASE_PROJECT_REF` | New test project's ref | Optional same identifier for explicit inventory |
| `PRODUCTION_SUPABASE_PROJECT_REF` | `ybngoppqqiohcduojfyg` (identifier only, never its keys/URL) | Same known production identifier for target rejection |
| `DEVELOPMENT_SUPABASE_PROJECT_REF` | Not needed; hosted development scripts refuse Vercel execution | New isolated project ref |
| `ALLOW_ISOLATED_DEVELOPMENT_MUTATIONS` | `false` | `false` ordinarily; explicit `true` only for an approved reviewed fixture/verification run |
| `BACKGROUND_DELIVERY_ENABLED` | `false` | `false` |
| `EMAIL_ENABLED` | `false` | `false` |
| `ADMIN_NOTIFICATIONS_ENABLED` | `false` | `false` |
| `ADMIN_PUSH_ENABLED` | `false` | `false` |
| `SITE_INDEXING_ENABLED` | `false` | `false` |

Do not bind production credentials, production operator IDs, Resend/VAPID secrets, scheduler secrets or live-map backend credentials to Preview. Leave optional email/map fields empty for this acceptance scope. Use the exact publishable-key variable above, not integration aliases such as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Vercel-supplied `VERCEL_ENV=preview` activates the isolation build guard; do not manually override it. Guard checks identifiers/completeness and disabled flags, but cannot authenticate key ownership; verify matching project identity privately before use.

## Schema, data and Auth

1. Pin the maintenance branch revision after review. Apply all 44 SQL migrations in filename order ONLY to the new empty test project. Supabase owns real Auth/Storage platform objects; never apply the tests' fake `platformSql` to a hosted project. Record migration versions and compare catalog reference, RLS and grants after setup. No production migration replay/history repair is included.
2. Prepare a reproducible synthetic acceptance seed using current models/contracts. Existing `supabase/fixtures/development.sql` is not sufficient by itself (dates/product defaults need updating). Stage A now guards all six hosted development scripts against the known production project and requires DEVELOPMENT_SUPABASE_PROJECT_REF plus ALLOW_ISOLATED_DEVELOPMENT_MUTATIONS=true. They still mutate data; privately verify project/key identity and review fixtures before any approved run. Review any seeding command's resolved project identity before execution.
3. Seed one synthetic operator in Europe/Tirane, a published van-tour `shkodra-day-tour`, valid current passenger pricing, capacity-eight future departures/recurring schedule and exceptions. Use dates relative to the execution date. Include draft/unpriced/unpublished/sold-out examples and a second operator for isolation tests. Use fictional customer data with `example.invalid` emails, no copied real bookings/content/customer records.
4. Seed current Website CMS homepage, shared editorial destinations, FAQ, reviews, legal/footer/visibility settings and controlled HTTPS images in this project's `website-media` bucket. Preserve migration-defined policies/path restrictions. No independent live-map writes or production assets required. Local Supabase HTTP Storage does not satisfy current HTTPS media validation, which is why a hosted test backend is proposed.
5. Create a password-based, confirmed test Auth user without an invitation/email send; password goes directly into a password manager/private input. Link its Auth UUID to active `staff_profiles` with canonical `owner` role for the synthetic operator. Create operations/content_editor and second-operator users for permissions tests. Do not use user_metadata for authorization or create production staff. The owner should select privately controlled test-user email addresses; keep synthetic booking recipients non-deliverable.
6. Configure only the test project's Auth Site URL to the exact approved Preview HTTPS origin. Allow `http://localhost:3000/auth/activate` and the approved Preview origin's `/auth/activate` recovery route. If ephemeral URLs are needed, agree on a narrowly scoped Preview URL pattern first; avoid broad `*.vercel.app` access. Existing sign-in is password-based, with no OAuth provider proposed. Test password recovery/activation only via an approved private link mechanism; app email flags do not disable Supabase Auth emails. Do not send invitations/recovery messages until the owner approves a controlled recipient.
7. Keep public signup closed unless the existing application contract explicitly requires it; staff provisioning remains trusted. No schedulers/communication activation. Confirm Supabase Auth/Storage settings and Vercel branch/scope bindings privately, names only in reports.

## Acceptance gates

Local tests already pass with isolated embedded databases. These hosted/browser checks remain pending:

- Public published pages, CMS visibility/footer/FAQ/reviews/images, noindex robots/sitemap; draft/unpriced/sold-out states reject booking.
- Future availability, passenger price totals and limits, capacity-eight allocation; competing final-seat requests do not oversell; expired/retried holds behave correctly.
- Meeting-point booking confirmation and management link; repeat submissions remain idempotent; valid QR resolves and can be checked in exactly once across two staff devices. Cancellation/rebooking releases/moves capacity transactionally. No charge or external payment event is initiated.
- Admin sign-in/out, cookie refresh, session expiry, recovery/activation via the controlled mechanism, active/disabled membership, all canonical roles, and second-operator denial for reads and mutations.
- Calendar & Pricing edits and schedule exceptions, Website CMS draft/publish/media/FAQ/reviews, audit history; no unauthorized client privileged access.
- Communications remain disabled, no notification/email/push dispatch, no cron invocation, no real external recipients; anonymous/browser roles cannot call privileged RPCs.
- Hosted PostgREST RPCs, real Auth/RLS/Storage and optimized local app against the test backend. Later authorized Vercel Preview smoke checks additionally verify exact origin/Auth redirects, Node 24.x, scoped variables, logs without secrets, and branch connection.

## Decisions/access needed

Approve or amend the separate Micro project (~$10/month incremental compute), region/name, trusted acceptance branch and its exact Preview origin. Approve test-only migrations/data/Auth/Storage and scoped variables/redirects as listed. Choose private test-user addresses/password storage. Separately authorize a Preview deployment when ready; none is included in the initial resource/configuration approval. Production launch requires its own parity, schema reconciliation, functional/operational and plan decisions.

## Production Auth correction — separate approval

Set Site URL to https://sightseeingshkodra.app and add only https://sightseeingshkodra.app/auth/activate to the production redirect allowlist. Preserve existing entries for now. This aligns password recovery with the existing application route; do not send recovery messages or alter users. This setting change is independent of isolated-project approval and deployment.

## Current reference evidence

8 October stage-B preparation applied all 44 migrations to a disposable PGlite reference and generated /private/tmp/shkodra-schema-reference-44.json (mode 600). Catalog: 34 RLS table records, 350 columns, 121 indexes, 27 policies, 38 triggers and 89 functions. This reference does not certify hosted parity. A fresh hosted read-only export must be compared before any history/schema repair proposal.
