# CMS improvement roadmap

15 October 2026. Planning only. None of these packages is approved for implementation or publication by this audit request. Keep Next.js/Vercel, existing CMS entities, operator authorization, Supabase and the independent map. Complexity is relative (S: localized change; M: several components/tests; L: cross-model release), not a delivery promise.

## P0 — Critical

No confirmed P0 within the evidence collected. Investigate promptly if real wrong-price/capacity incidents, unauthorized writes or public draft exposure appear; do not weaken constraints or change booking/GPS algorithms as a CMS convenience fix.

## First implementation package — truthful existing controls

| Priority / problem | Root cause | Proposed solution | Files/components | Migration? | Risk | Complexity | Owner benefit |
|---|---|---|---|---|---|---|---|
| P1 F01 hero booking label ignored | Widget literal bypasses existing CMS label | Pass existing `hero.book` into `HeroBookingWidget`; preserve shared submit and quote guard | homepage-hero.tsx, hero-booking-widget.tsx, homepage-hero tests | No | Low | S | One existing field actually changes the hero CTA |
| P2 F02 dead copy/link controls | Homepage promotion and old route consumer retired | Remove three active controls from editor allowlists; retain compatibility schema keys | website-schema.ts, editorial-fields.ts, editor tests | No, if stored keys remain | Low | S | No meaningless saves or misleading owner options |
| P2 F05 amenity description ignored | Compact hero accepts only icon/title | Hide the unused description input; retain saved data; explain short-label/5-item presentation | hero-amenities-input.tsx, CMS contract tests | No | Low | S | Faster feature editing, no invisible description work |
| P2 F06 role-inconsistent Move later | Missing publisher check on one disabled state | Match Move earlier permission UX; retain server gate | destinations-editor.tsx, role/UI tests | No | Low | S | Content editors see only available operations |
| P3 F12 empty Partners overview tile | New module absent from description/order maps | Add existing module description/order | overview-panel.tsx | No | Low | S | Clear, consistent navigation |

Acceptance: isolated owner/editor/publisher tests, marker-based public rendering for the actual affected fields, retained old-document compatibility, no booking-engine or operational map changes. Run lint/types/build and relevant CMS regressions. Preview with isolated data; publish only under a later explicit instruction. This package intentionally defers the catalog ownership decision.

## P1 — Resolve catalog presentation promises

| Problem | Root cause | Proposed solution | Files/components | Migration? | Risk | Complexity | Benefit |
|---|---|---|---|---|---|---|---|
| F04 four catalog SEO/description/image controls have no consumer | Retired Tour/promotion; Book SEO already has a Website owner | Inventory business intent per target. Prefer removing/relabeling obsolete presentation inputs and relaxing only obsolete publication requirements, preserving stored fields. Keep product title/status/inclusions and Calendar prices authoritative. If a real product presentation is requested, connect it explicitly without adding another SEO owner | catalog-panel.tsx, catalog-actions.ts, website-schema.ts, homepage.ts, catalog publication SQL/functions, tests | **Yes, likely** to change SQL publication requirements; not for UI relabel alone | Medium | M | Owners no longer maintain invisible SEO/images or fill obsolete required content |

Do not automatically copy catalog SEO into Website fields or delete historical product data. Review current published product and old-version compatibility before any validator migration.

## P2 — Data semantics, clarity and proof

| Problem | Root cause | Proposed solution | Files/components | Migration? | Risk | Complexity | Benefit |
|---|---|---|---|---|---|---|---|
| F03 duplicate navigation options | Normalization and first-target wins | Effective-link preview and duplicate warning; consolidate owner controls only after reviewing persisted links | navigation.ts, website-editor.tsx, schema, tests | No with compatibility retained | Low/Medium | M | Predictable desktop/mobile navigation |
| F07 focal position differs on ultrawide | Center→bottom transform above 1600px | Explain the behavior or honor the existing desktop setting after design approval; test 1600/1920px alongside mobile | homepage-hero.tsx, module.css | No | Medium visual risk | S | Crop choices match the preview |
| F08 €0 teaser suppressed | Zero and absent price conflated | Define “Free”/€0 behavior and test free adult quotes/100% offers, missing price and positive price; preserve quote calculations | hero-fare.ts, booking-controls.tsx, booking-presentation.ts, tests | No | Medium (price communication) | M | Accurate promotion presentation without changing totals |
| F09 first stop lacks editorial image | Missing/ambiguous editorial association | Owner supplies approved content and associates existing map ID; validate exactly one match | Existing Destinations + stop projection validation | No | Low | S | Complete photographic timeline |
| F10 outdated field proof | Old roles/kinds/routes and historical fixture expectations | Repair isolated harness: owner initialize, editor draft, admin/owner publish; positive/negative public marker assertions; all relevant visibility states; regenerate dated results | scripts/verify-cms-fields.mjs, development proof route, tests | No | Low/Medium | M | Trustworthy proof rather than misleading “all fields passed” history |
| F11 mixed save/publish scope | Different established entity lifecycles | Rename direct actions “Save & update website” when active; show explicit Website publication-impact summary and pending drafts | partners/reviews editors, website-workspace.tsx | No | Low | S | Fewer accidental public changes |
| F14 visibility scope wording | Generic “across public pages” helper | Explain exact pages and mandatory map exception per section | website-schema.ts, website-section-card.tsx | No | Low | S | Owner knows what a switch affects |
| F13 no reference-aware media management | Upload-only media model | Start with read-only usage inventory and retention report. Design safe cleanup/confirmation only after reference proof; preserve public raster bucket | image-field.tsx, website-actions.ts, media reference service/report | No for report; review if persistent media records are added | Medium if deletion added | M/L | Less clutter without broken shared images |

## P3 — Optional, only with a real business need

- Retain English-only technical labels until a multilingual requirement supplies locales/content ownership; no ad hoc translation fields in every module.
- Keep licensed credit provenance in version control. Optional business contact display can reuse owner-scoped global configuration if a public email/address is actually requested.
- Consider review-delete confirmation, clearer numeric order controls and catalog concurrent-edit protection. These are convenience/consistency improvements, not proof that current saves fail.
- Decide separately whether to keep the clearly marked `/your-day` sample. Do not turn it into a real ticket by changing copy.

## Rollout and evidence gate

Use small isolated branches against current main. Reuse `content_pages`, Reviews, Partners, Calendar & Pricing and existing uploader. Never merge operational map stops into website CMS. Test with an isolated database, communications/indexing disabled; do not use production mutations to demonstrate editability. Record what is and is not proved. No new CMS framework, settings service, background worker or tracking deployment is recommended.
