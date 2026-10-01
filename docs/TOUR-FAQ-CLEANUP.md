# Tour and dedicated FAQ cleanup

1 October 2026 - implemented and verified locally; not deployed.

The former FAQ destination was /tour#faq. It is now /faq, using the existing FAQ content keys and published product inclusions. The page contains the global header, FAQ heading and four accordion questions, then the standard footer. No promotional invitation, reviews, tour sections or map appear in its main content.

/tour no longer renders Reviews or FAQ, their section-navigation anchors, or the unused review fetch. The remaining tour content and booking controls are preserved. Homepage reviews, shared review components, stored review records and Admin ownership remain intact. The standard footer retains its existing Google review link as requested.

## Content and navigation

- FaqPage extracts the original questions and answers without creating a second content record. Existing CMS title/questions remain editable in their current owner; the editor now links to the saved FAQ draft preview. Three answers remain existing fixed copy, while inclusions remain owned by the product. This does not introduce arbitrary FAQ add/remove or answer-editing controls.
- Header/footer default FAQ links and Your Day help use /faq. Legacy saved /tour#faq links resolve to /faq without rewriting stored values. Canonical metadata, sitemap and authenticated draft preview include the dedicated route.
- FAQ reads only published product inclusions, not a seat/price quote. Operator, slug, published status and product type filters remain explicit.
- Migration 20261001000100_faq_route_link.sql adds /faq to the existing CMS link validator. It was tested in disposable databases and has not been applied to the hosted database. Apply it through the release workflow before saving canonical /faq links there.

## Verification

Tour and FAQ passed layout checks at 375, 390, 430, 768, 1024, 1440 and 1920 px. No document overflow or empty Tour section remained. FAQ has four 44 px accordion targets; expansion, navigation and refresh worked. Desktop and mobile screenshots were inspected. The footer follows the main content directly. Homepage reviews remained visible and no console errors were captured in the inspected tab.

Component coverage verifies edited CMS heading/question and product inclusion values render, Tour excludes both removed sections, and FAQ suppresses the promotional invitation. Full regression chain: 295 passed, zero failed (11 components, 17 identity, 104 integrations, 140 database, 23 PostgreSQL concurrency). The subsequent Explore loader-only follow-up passed all 11 component tests, typecheck, lint and production build.

Hosted CMS save/publish was not exercised in this task. Physical devices and assistive technology were not certified. This is local implementation acceptance, not a claim of completed hosted acceptance.

## Scope

No deployment, hosted data mutation, image deletion, booking rule, payment, email or independent map-engine change. Existing unrelated working-tree changes were preserved. Performance evidence and remaining priorities are recorded in PERFORMANCE-AUDIT.md and PERFORMANCE-MEASUREMENTS.csv.


## Authorized publication - 1 October 2026

Hosted FAQ link validation was updated through a guarded replacement of the single existing route allowlist, equivalent to the new migration. Verification returned faq_route_allowed=true and footer_preserved=true. No content rows were modified. Exact isolated release production build, 11 component tests and final lint passed. Earlier unrelated public-audit and email work is excluded; original local audit measurements are not exact-release performance certification. Netlify deployment verification follows the release commit.
