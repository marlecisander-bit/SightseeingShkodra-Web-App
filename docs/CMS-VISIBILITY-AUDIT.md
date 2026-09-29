# CMS visibility audit and correction

29 September 2026. **LOCAL IMPLEMENTATION: READY FOR REVIEW. NOT DEPLOYED.**

## Identified section and root causes

- Section: **Final booking invitation**, CMS key `final`.
- Admin: Website > Homepage > Final booking invitation, existing save/publish action `saveWebsiteSection` -> `save_website_content_v1`.
- Record: operator-scoped `content_pages`, slug `website-homepage`, format `homepage_v1`; draft `body.content`, public `published_body.content` with status `published`.
- Persisted visibility: string-valued `final.showOnHomepage`. No new field, table or migration. The user's current instruction broadens the existing field's semantics to every occurrence of the same section; the Admin now describes shared switches as “across public pages”. The historical key is retained for compatibility.
- Public component: `Footer` in `src/components/public/ui.tsx`, previously gated by `HomepageInvitation`; now uses `FinalInvitation` in `final-invitation.tsx`.
- Consumers: shared public layout on `/`, `/tour` (including FAQ), `/explore`, `/explore/[slug]`, `/live`, `/your-day`, `/credits`. There is no independent Route or FAQ page. Existing `/book` and `/booking/*` invitation exclusions remain, including preview parity.
- Duplicate implementations of this invitation: **0**. One shared implementation had a route-scoped visibility bypass. Hardcoded copies: **0**. The default `final.*` strings are schema defaults, not another rendered section. `PreviewNote` is shared fixed booking-policy copy, not an editable subtitle. The CTA destination is fixed `/book`, not an Admin field.

| Severity | Finding | Correction |
|---|---|---|
| HIGH | `HomepageInvitation` checked disabled state only for homepage or homepage preview; secondary pages always rendered it | Route-independent canonical visibility guard |
| HIGH | `final.image` rendered outside invitation guard, leaving banner media even when CTA hidden | Image and all CTA markup share the guard; no wrapper returned while disabled |
| HIGH | Shared Route, Live, Departures and Reviews presentation was reused by secondary consumers without checking the same state | Existing switches now govern those same editorial sections everywhere; Admin labels reflect scope |
| MEDIUM | Process-local last-published fallback could revive an older visible state after failed reads; cold fallback defaulted to visible | Removed indefinite process cache; unavailable publication suppresses optional CMS sections |
| MEDIUM | Optional-section anchors could remain after target removal; review invalidation covered only Home | Shared link predicate and matching local anchor gates; review changes revalidate the public layout |
| MEDIUM | Tour image fallback dereferenced destination index1 even when visibility filters leave zero/one destinations | Safe canonical hero image/alt fallback; no destination visibility bypass |
| LOW | Homepage-only destination with no guide could point at a missing Explore anchor | Destination mapper points to Explore root when no published guide/list occurrence exists |

## Platform inventory

W = published website-homepage content. D = published destination_v1 record. R = published, non-deleted review records. Stored homepage visibility keys are shared semantic section switches; destination placement flags remain intentionally distinct. All rows were source-audited; browser scope is described separately below.

| Section | Admin control | Public consumers | Visibility consistent | Content consistent | Fixed / notes |
|---|---|---|---|---|---|
| Hero | W hero.* + hero.showOnHomepage | Home | Yes | Yes | Existing gate; header solid-state and Discover fallback retained |
| Hero amenities | W hero.amenities enabled entries | Existing amenities presentation where used | Yes within existing consumers | Yes | No new visibility field or reactivation of unused presentation |
| Introduction | W intro.* + intro.showOnHomepage | Home | Yes | Yes | Existing gate; optional configured anchor filtered |
| Route presentation | W route.* + route.showOnHomepage | Home, Tour, Live, Your-day | Yes after fix | Yes | Secondary section wrappers and exact section anchors gated |
| Live promotion | W live.* + live.showOnHomepage | Home, Tour, Live introduction | Yes after fix | Yes | Live's independent operational iframe remains; neutral Live map page title when promotion off |
| Departures introduction | W departures.* + departures.showOnHomepage | Home, Tour timetable | Yes after fix | Yes | Timetable anchor consumers follow state; booking availability engine unchanged |
| Reviews presentation | W reviews.* + reviews.showOnHomepage | Home, Tour | Yes after fix | Yes | Both also require actual published reviews |
| Individual reviews/settings | R published/deleted_at; featured/order/limit and Google URLs | Shared GuestReviews on Home/Tour | Yes | Yes | Existing public reader filters; featured controls order, not publication. Layout revalidation corrected |
| Notebook | W notebook.* + notebook.showOnHomepage | Home | Yes | Yes | Existing gate; legacy unused card fields not reactivated |
| Final invitation | W final.* + final.showOnHomepage | Shared public Footer | Yes after fix | Yes | Entire media/CTA boundary gated; fixed booking destination retained |
| Footer information | W footer.* | All public layouts | N/A: no visibility switch | Yes | Separate entity retained; ordinary footer padding is not disabled-invitation space |
| Navigation | W nav.* | Shared Header | N/A: no independent visibility switches | Yes | Exact optional-section links follow target state; major routes remain |
| How it works | W how.* | Tour | N/A: no visibility switch | Yes | Distinct entity, not governed by intro visibility |
| Tour/FAQ labels | W tourPage.* | Tour/FAQ anchor | N/A: no visibility switch | Yes | Policy answers remain intentional application copy |
| Explore introduction | W explorePage.* | Explore | N/A: no visibility switch | Yes | Independent entity, not notebook visibility |
| Booking / Your-day introduction | W bookPage.* / dayPage.* | Book / Your-day | N/A: no visibility switch | Yes | Operational booking and sample-ticket behavior preserved |
| Destination lists | D status + showOnHomepage / showOnPage | Home vs Explore/Tour/Live/Your-day | Yes, placement-specific by design | Yes | Unpublished/archived records excluded; no code fallback on public routes; empty destination fallback fixed |
| Destination guide | D status + guidePublished | Explore detail route and guide links | Yes | Yes | Independent article publication; showOnPage=false hides listing, not an explicitly published guide |
| Product presentation | Products status + title/description/inclusions/image/SEO | Home/Tour and booking consumers | Yes in existing published-product reader | Yes | Operational product state is not a CMS section switch; unchanged |
| Schedule / departure / category controls | Active/paused, scheduled/cancelled, enabled categories and date rules | Canonical availability/timetable/booking | Existing engine tests pass | Single engine | Audited boundary only; no rule changes |
| SEO | W seo.*, page/product/destination metadata | Metadata consumers | N/A: no display toggle | Yes | Publication distinction retained |
| Credits / logos / booking notices | Code-owned assets/policy | Shared public components | N/A | Intentional constants | Not duplicate CMS sections |
| Legacy content slots | Historical homepage-* and old guide snapshots | No active public section owner | N/A | Inactive | No deletion/migration of retained history |

## Cache, publication and preview

Public reader uses `connection()`, request-scoped React `cache()` and Supabase `fetch(cache: no-store)`. Publish calls `revalidatePath('/', 'layout')`. CMS changes require **Publish**, not Save Draft. On the next fresh request/reload after successful publication, all consumers read the new published snapshot; no production rebuild is required. No new polling was added. Already open browser tabs and reused client layouts do not receive pushed updates: refresh them. Netlify deployment behavior was inspected through the existing architecture, not re-deployed/certified in this task.

Failed/missing/invalid publication no longer reuses an indefinite stale process snapshot or enables default optional sections. Tradeoff: optional editorial sections temporarily disappear during CMS outages; operational booking/map paths and independent footer information remain available. Historical payloads without visibility keys still normalize to true, while explicit false is retained.

Saved-draft preview uses the actual shared components and saved draft content. Footer preview now supplies its intended public pathname, including booking exclusion. No Admin redesign or second CMS renderer was introduced.

## Controlled acceptance and limits

`tests/components/cms-visibility.test.mjs` creates a disposable database, seeds a content editor, invokes the existing canonical Admin save/publish RPC, then feeds the published record to the actual Footer under BookingProvider. It performs **enabled -> disabled -> enabled** across seven configured public pathname contexts and checks booking-route exclusion. Changed eyebrow/title/emphasis/CTA label/image/alt values propagate to each rendered occurrence. False removes both CTA wrapper and media. No hosted CMS writes were made. This proves canonical persistence-to-component propagation; it is not a hosted Admin button-click lifecycle test.

Additional component tests verify enabled/disabled Tour sections, Live editorial removal with independent iframe retained, Home route removal, outage suppression and optional anchor rules. Prior database tests exercise draft isolation, publish, stale-write rejection and operator permission checks.

Chrome rendered-fixture evidence: seven route contexts at **320x568, 375x667, 390x844, 393x852, 430x932, 768x1024, 820x1180, 1024x768, 1280x800, 1440x900, 1920x1080**, both enabled and disabled. All77 disabled cases had zero CTA nodes, zero banner media, zero extra invitation height beyond the independent footer's own content/padding and no horizontal overflow. All77 enabled cases rendered seven invitations/media with no overflow. Local fixture HTML comes from the actual renderer and real stylesheet, with synthetic edited content.

Actual application spot checks using current published content: Tour, Explore and Live rendered no final invitation/media. Tour Book opened exactly one canonical dialog. Live loaded the unchanged independent full-map iframe. No booking submitted. Tour product availability temporarily returned unavailable during one check; canonical fallback rendered without crashing, while destinations/reviews remained readable. No pricing/availability logic was changed to mask that response.

| Acceptance | Result |
|---|---|
| CMS -> public synchronization; section identification | PASS in audited implementation |
| Admin enable / disable / re-enable propagation | PASS in controlled canonical-RPC-to-renderer cycle; hosted Admin UI cycle not performed |
| Text / image / CTA label propagation | PASS in controlled cycle |
| Subtitle / CTA destination editing | N/A: not editable fields for this entity; fixed policy note and canonical /book retained |
| Zero gap when disabled | PASS in rendered-component and 77 browser layout cases |
| Mobile / tablet / desktop consistency | PASS in Chrome emulation |
| Booking CTA / single dialog / Live Map regression | PASS in stated local browser scope |
| TypeScript / lint / production build | PASS: private/cms-visibility-check.log |
| Tests | PASS: full280-test chain, zero failed/skipped; strengthened secondary-section assertions rerun3/3 |

Logs: private/cms-visibility-tests.log. Breakdown: components6, identity17, integrations97, database137, PostgreSQL23. Browser measurements: private/cms-visibility/viewport-results.json. Physical devices and hosted deployment propagation are not certified.

## Changes and closure

Files for this task: src/modules/content/website-schema.ts, website-server.ts, destinations.ts; src/components/public/final-invitation.tsx (renamed from homepage-invitation.tsx), ui.tsx, editorial-pages.tsx, homepage-view.tsx, booking.tsx (navigation filtering only); src/app/(public)/public.css (footer-only changes), your-day/page.tsx; src/app/admin/website-workspace.tsx (scope labels), [operatorId]/website-preview/page.tsx, review-actions.ts (invalidation); tests/components/cms-visibility.test.mjs; this report, DECISIONS.md and PHASE_STATUS.md.

Hardcoded duplicates removed: NONE found. Legacy components removed: old HomepageInvitation name/route-specific gate replaced by FinalInvitation; no unrelated historical assets/data deleted. Removed obsolete CSS booking-page hide rule in favor of the existing rendering exclusion.

Blockers: NONE for local review. Non-blocking findings: published changes require refresh in existing tabs; fail-closed outage behavior; no physical-device/hosted-deployment certification. CTA target and policy subtitle are intentionally not editable. Independent destination listing and guide flags are not conflated.

**READY FOR REVIEW. No commit, deployment, hosted content write, schema change, email enablement or map-engine change.** Previous hero/header/dynamic-price/expandable-text and unrelated working-tree work retained.

![Disabled shared invitation, independent footer retained](../private/cms-visibility/disabled.png)
![Re-enabled edited canonical invitation](../private/cms-visibility/enabled.png)
