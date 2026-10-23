# Partners and homepage cleanup publication — 15 October 2026

Explicitly authorized by the user to publish the pending changes. Scoped release prepared against production main `73c807a` in `/private/tmp/shkodra-partners-release-20261015`; original dirty workspace preserved.

- PR: https://github.com/marlecisander-bit/SightseeingShkodra-Web-App/pull/18
- Release commit: `2dba62ab216a9fb9958281ae6a6e0965ba46c8ab` (39 scoped files)
- Main merge: `2714ea9d5ca8a9bd1a3a8ca4222cdbf7cee198cd`
- Vercel Preview: `FBxwnB9mDrzZ3vaDsPHZjGc21Sx6`, Ready for exact release source. Preview has no configured CMS bindings; only shell/build acceptance claimed.
- Vercel Production: `E5jvsjL7QdhRt5h7UsmRiorxH7qA`, Ready/Current on `https://sightseeingshkodra.app/`, exact main source above.
- Previous production `98nEYomDqtVTLAebXMo3hP22mtgS` retained. Additive schema remains compatible with the preceding application; no rollback was needed.

## Database publication

Applied only `20261015000100_homepage_partners.sql` to existing production project `ybngoppqqiohcduojfyg` through its SQL Editor. Application migration and new migration-history record ran in one transaction, with lock/statement timeouts and unchanged-document assertions. A disposable PGlite run first verified the execution wrapper and byte-exact canonical SQL in the history record. No historic migration records were rewritten.

Production verification: one new history entry; Partners RLS enabled; anon/authenticated INSERT/UPDATE/DELETE grants absent; zero partner records. Existing draft/published website bodies and update/publication timestamps retain fingerprint `ee13430d24906187b0fd7fefb51fa07b`; both documents still pass the SQL validator. No CMS records, media, suppliers, booking rules, communications flags, scheduler, credentials, hosting settings or external map settings changed.

## Release verification

- Clean offline locked install; lint/type-check/optimized production build pass. Built server boots; local homepage returns 200 configuration-unavailable shell and dev Partners fixture returns 404.
- 240 component/identity/database tests +143 integration tests +24 real disposable Postgres concurrency tests =407 passing tests.
- GitHub Project CI succeeds, including production dependency audit; all three PR checks pass before merge.
- Production homepage at 320,375,390,430,768,1024,1440px: no duplicate promotion wrapper/copy, no residual section gap, no page overflow, all five CMS amenities, 48px yellow hero CTA, exactly one footer. Empty Partners section hidden as designed.
- Original CMS hero image loads successfully and retains the same image paths. Real date/passenger widget opens checkout with two adults, selected date 16 October 2026 and four available departures. No hold/reservation/confirmation submitted.
- Authenticated owner Partners manager loads with zero records, Add partner form and existing upload controls; dedicated fresh 320px browser check shows no form/page overflow. No partner created or uploaded. Homepage editor exposes seven Partners settings, defaults and Manage partners link; retired promotion controls absent; no unsaved/published changes made.
- Public HTTP smoke:13 public content pages +robots/sitemap return 200; sitemap preserves nine URLs; `/tour` returns exact 301 to `/route`; production `/dev/partners-preview` returns 404.

Evidence: `/private/tmp/partners-publication-20261015/` contains responsive geometry, public HTTP results, database verification text and live screenshots. Logs: `/private/tmp/partners-release-{check,tests,integrations,postgres}.log`.

Partners is ready for authorized administrators to add approved logos/names/URLs. Public section remains hidden until an active logo exists. Physical-device Safari/Android and a real booking transaction remain untested; full hosted partner CRUD/upload was not exercised using invented production records. No infrastructure rollout beyond the scoped app release and additive migration.
