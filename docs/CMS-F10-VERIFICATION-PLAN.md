# F10 — Automated CMS field verification: read-only analysis and plan

16 October 2026. **Planning only; no F10 implementation approval, application changes, production mutation, new infrastructure or deployment.** Package 1 PR #19 is now released as main `a890a6a944886fce5b5adcdf893fe6e4f4666d00`; the authorized production deployment and read-only smoke checks passed. This plan remains local documentation, excluded from the released PR and awaiting separate F10 implementation approval.

Production-baseline revalidation: inspected the verifier at released main; schema/actions/development proof route are identical to the previously reviewed Package 1 head. Fresh read-only schema count confirms 210 retained keys / 126 active structured controls / 13 kinds. No legacy verifier run, database write or F10 source edit was performed.

## Findings from current source

Reviewed `scripts/verify-cms-fields.mjs`, `src/app/dev/cms-reconciliation/page.tsx`, active schema/editor/actions, existing Website/publication/component/database tests, legacy field-proof/route inventory and Package 1 release evidence. The 15 October audit's F10 diagnosis remains applicable:

1. The proof script creates only a `content_editor` actor and calls owner-only initialization, then tries publication using that same actor. It cannot complete the current role contract. Do not fix this by granting editors owner permissions.
2. Value generation recognizes text/image/position/amenities and treats other kinds as sequential generic links. It does not generate type-valid inputs for the current FAQ/visibility/toggle/phone/legal/publication/destination/external kinds, and can exhaust its short link array.
3. It mutates all fields together and checks marker presence anywhere in one composite HTML response. Matching in the wrong component, hidden markup or another consumer is not per-field public correctness. It misses normalization, conditional visibility, no-consumer controls, DOM state and metadata semantics.
4. The composite development route uses actual shared components, which is useful, but combines multiple pages and old `websitePlaces` data. It is development-only, reads a local ignored fixture, and cannot validate the current credential-free Vercel Preview. Do not expose it publicly as an admin bypass.
5. `docs/CMS-FIELD-PROOF.json` and `CMS-ROUTE-INVENTORY.json` are historical artifacts, not fresh evidence for the current application. Do not overwrite or relabel them as current results.
6. Package 1 leaves **210 retained schema keys and 126 active structured controls** (fresh read-only import/count). There are 13 active kinds: text87, image8, position2, visibility8, amenities1, toggle4, destination1, phone1, legal2, publication2, link5, external4, faq1. Collection subfields and separate destination/review/partner entities need separate denominators. Do not describe 126 controls as all public/admin fields.
7. `saveWebsiteSection` merges the active section into the full retained document and has sensitive owner-only sections; Publish includes saved drafts from other sections. The harness must exercise these actual semantics, timestamps and publisher/owner distinctions.

The legacy script was inspected, not executed: it writes historical report paths and currently cannot provide valid proof. Read-only schema counting ran without connecting to any database. Existing isolated regressions are supporting evidence, not a new field-proof run.

## Proposed scope and boundaries

Repair the existing proof tooling and add focused test adapters/fixtures; keep Next.js/Vercel, existing schema/entities, actions and SQL authorization. No generic CMS, new owner controls, design change, schema cleanup, real booking transaction or independent-map modification. F10 reports known disconnected/partial behavior; it does not silently implement F03/F04/F07/F08 or the other deferred fixes to manufacture a green total.

Start only after separate approval, on an isolated branch from the then-approved Package 1 baseline. Re-read actual schema/routes at that time; counts above are a snapshot, not hardcoded future totals.

## Implementation stages proposed for approval

1. **Build an explicit verification manifest.** Derive the active structured key list from `editableWebsiteSections`; list retained compatibility keys separately. For each key record owner/section, kind, save role, publication role, public route/consumer, locator/property, conditional prerequisites and expected normalization. The manifest must fail if an active field lacks a declared case. Canonical Destinations/Partners/Reviews use existing entity models and dedicated cases, not copied `place.*` controls. Keep operational prices/GPS protected and outside editorial marker coverage.
2. **Add type-valid deterministic fixtures.** Cover all 13 kinds exhaustively (unknown kind is failure). Use allowlisted local raster assets, supported internal routes or safe synthetic HTTPS destinations, real phone syntax, approved focal values, bounded FAQ/amenity JSON and valid publication/visibility pairs. Image proof checks `src/srcset/alt` and crop style, link proof checks effective normalized `href`, metadata proof checks its exact title/meta/OG property. Unique text markers remain escaped plain text. Invalid values receive explicit negative tests.
3. **Correct isolated persistence roles.** Disposable local PostgreSQL/PGlite only, real migrations and synthetic operator/staff. Owner initializes; content_editor saves ordinary drafts; admin publisher publishes ordinary changes; owner handles sensitive footer/contact/legal changes. Assert rejected editor initialization/publication/reorder, rejected admin sensitive publication, operator isolation, stale stamps, no draft leakage and retained historical keys/descriptions. Read timestamps as lossless SQL text. Reset independent cases so a sensitive saved draft cannot invalidate an unrelated admin test accidentally.
4. **Prove actual public consumers.** Reuse public components and published projections for Home/Book/Route/Explore/Guide/FAQ/legal/footer/navigation and SEO. Prefer focused route/component cases instead of a composite page. For each key test **edit/save → private draft persistence → saved-draft preview shows the intended marker while public remains unchanged → authorized publication → expected public DOM/metadata change**. Verify each boundary independently; private preview must consume saved drafts rather than unsaved form state. Assert marker absence from unrelated/hidden/unpublished consumers. Preserve the mandatory Route map exception and existing link normalization. Do not treat a field present only in JSON, a script or a hidden attribute as visible-copy proof.
5. **Test conditional and collection behavior.** Enable/disable/enable visibility; empty optional links; published/unpublished legal content; empty/all-hidden/published amenities; FAQ authoritative product inclusion answers; canonical destination association; active/inactive Partners/reviews. Check order, draft/public split and multi-consumer reuse. Explicitly report known issues such as duplicate normalized navigation slots or wide-screen focal transformation rather than asserting raw marker equality.
6. **Add editor/permission UI verification.** Test real shared editor components and role-derived props at mobile/desktop widths; controls, saved payloads, dirty/pending guards and field kinds must agree. SQL tests remain the authorization proof; mock UI role flags are not authentication. Any future true Auth/session end-to-end layer requires separately approved isolated services; never relax production security or use production sessions/data.
7. **Write truthful dated evidence.** New artifact paths, for example `private/cms-field-proof/<run-id>/results.json` plus an explicitly dated report under docs after review. Each row records commit/schema fingerprint, field/entity, route/locator, input fixture identifier, role, save/draft/publication/render outcome and evidence references. Use PASS/FAIL/BLOCKED/NOT_APPLICABLE/KNOWN_GAP with explicit reasons. Separate active coverage, compatibility and entity tests; blocked/known-gap rows do not count as passed. Missing cases, unknown kinds or unexpected failures return nonzero. Preserve historical artifacts unchanged.
8. **Integrate local/CI checks after proof passes.** Extend existing test workflow with bounded isolated runs and deterministic output. No network required for database/component proof; browser layer allowlists loopback or an explicitly approved Preview only and refuses Production, arbitrary DB URLs and real secrets. Exercise refusal paths before any mutation. Run lint/types/build and relevant suites. CI success must distinguish persistence proof, rendered consumer proof and hosted/browser acceptance.

## Candidate file changes, not yet implemented

- `scripts/verify-cms-fields.mjs` — role lifecycle, exhaustive fixtures, scoped assertions and dated output.
- New focused manifest/fixture/report helpers under `tests/helpers/` (exact names to be chosen during implementation).
- `tests/database/website-content.test.mjs`, `tests/database/public-admin-connections.test.mjs`, existing component/integration contract suites — extend only where the new harness needs independent regression proof.
- Existing development proof route only if needed for local browser evidence; retain its development-only guard, reuse public components and avoid duplicating page content/configuration.
- `.github/workflows/ci.yml` only if a new bounded verification command is necessary after local proof; no deployment pipeline added.
- New dated verification documentation. No migration, booking engine, catalog ownership or map work expected.

A separate hosted fixture harness for the current Package 1 Preview acceptance blocker is a distinct approval decision, not implicit F10 implementation authority and not an excuse to add a test bypass to the production branch.

## Acceptance criteria and review gates

- Every active control has an explicit kind-aware case or accurately documented gap; no fixed “134/134” promise.
- Draft/publication role and negative authorization paths pass against disposable SQL; old documents remain readable and unchanged except intended edits.
- Actual rendered consumers and metadata have positive and negative assertions; unrelated/hidden markers cannot produce false positives.
- All relevant flags/collection states and editor mobile/desktop layouts are covered; browser, component and SQL evidence are clearly distinguished.
- Refusal tests prove no production URL/credentials, hosted mutation, delivery or external-map write can be used by the harness.
- Fresh report identifies SHA/date/denominators, all failures/blocked cases and deferred findings. Production/Preview shell success never certifies field coverage.
- No production deployment, F10 source edit, new service or hosted fixture is performed until separately authorized. Before implementation, approve this bounded scope and choose whether true hosted Auth acceptance is required; local SQL/component verification can remain fully credential-free.

## Risks, rollback and estimate

Primary risks are false positives from broad marker searches, brittle generic fixtures, conflating stored compatibility keys with active controls, and accidentally exercising external services. Scoped assertions, exhaustiveness, isolated data and fail-closed environment checks address them. Preserve historical reports and keep proof artifacts free of secrets/customer data. No data migration or production rollback should be needed; revert the future scoped tooling/test commit if necessary. Complexity: Medium, primarily test-fixture/consumer mapping work; accurate coverage is the goal, not an all-green report while known gaps remain.
