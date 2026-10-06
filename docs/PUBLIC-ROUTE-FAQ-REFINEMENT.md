# Public Route and FAQ refinement

6 October 2026. Local implementation only. No deployment, commit, push, hosted migration or production data mutation.

## Audit and ownership

Inspected HomepageView, TourView, RouteJourney, LiveMapEmbed, DayPlannerStrip, the Route/FAQ routes, WebsiteWorkspace/WebsiteSectionEditor/saveWebsiteSection, structured website validation, FAQ product reads, destination projections and prior CMS migrations before extending them.

| Information | Existing authoritative source retained |
|---|---|
| Vehicle, route, stop order/status, next stop and ETA | Independent Live Map iframe; validated origin/source presentation messages |
| Published operational stop fallback | Existing destination-stops projection from the independent map |
| Destination description/image | Published destination content_pages, joined only by explicit stopId; no guessed name matching |
| Today's departures | getDayPlanner → service_schedules / effective_schedule_times_v1 with date exceptions and cancelled departures excluded; Europe/Tirane |
| Price | Existing getHomepage / canonical one-adult availability and dated heroFare; no CMS price |
| Product title/inclusions | Existing published products record |
| Marketing and FAQ | Existing website-homepage content_pages record, separate draft/published content |

getHomepage is request-cached: Route's product/fare and DayPlanner share that read. Route keeps one schedule polling owner. Homepage's ticket and hero schedule summaries are portals from the same DayPlannerStrip owner, not additional polling components.

## Public changes and retained content

- Removed the inline How it works sections from Home and Tour, including Tour's #how link. Hero's discovery anchor now targets the existing operational route overview or Tour. No standalone How component existed to delete. Removed its recent homepage CSS rules.
- Removed Home's duplicated route storytelling/highlights; Tour's destination stories and shared RoutePreview remain intact. RouteJourney already had no such storytelling block.
- Folded Home's separate introduction into the compact existing product summary. Product copy/inclusions and date-qualified fare stay authoritative. No Wi-Fi or unlimited-use claim was invented.
- Route now introduces “Where’s the van?” directly above one eager map. Desktop width is 90% within a 1720px cap. Map height is 76svh with bounds; mobile uses 74svh with a 360px usable-control minimum. The iframe itself is resized, not cropped or transformed.
- Next departures sits immediately after the map, distinguishing past/next/upcoming. “Next scheduled” does not claim seat availability. Both schedule displays use the same state.
- Ordered stop cards become a horizontal mobile rail and desktop grid. Optional descriptors use an explicitly linked destination's tag/text. No invented labels or duplicate stops are stored. Stop selection reuses shkodra:select-stop and scrolls to the map; repeated selection works and reduced-motion preference is respected.
- Product summary also appears in the existing saved Route draft preview.

### Orphaned fields retained, not deleted

The removal was reported during implementation. Historical how.* fields remain in schema/content, but their inactive Admin card is hidden. intro.text / intro.link / intro.linkLabel no longer have a public consumer after the product-summary consolidation; their stored values and existing editor fields are retained for an explicitly scoped cleanup. Original fixed tourPage.faqBook/Board/Fees/Live fields remain as compatibility inputs, with their competing editable controls hidden after adding the single FAQ owner. The existing tourPage.faqTitle key remains the FAQ heading. No shared records or assets were deleted.

## FAQ before and after

Before: four CMS question strings, three code-defined answers, and one answer from published product inclusions. No independent FAQ table existed.

After: serialized faq.items in that same structured CMS record, following the existing amenity-list pattern. Each item has a stable ID, question, answer, active flag and answer source. Array order is display order, avoiding contradictory order fields. Parent record timestamps, permissions, optimistic concurrency, draft/save/publish and audit logging are reused.

Admin → Website → Public pages → Questions & answers supports add, edit question/answer, enable/disable, adjacent reordering and confirmed deletion. Discard restores the saved array. Public rendering filters active records in array order, escapes text through React and preserves the minimal details/summary accordion. An empty list shows a neutral message.

Historical snapshots lacking faq.items are normalized from their own saved question strings and former answers. The inclusions question retains its product source until an editor explicitly chooses a custom answer. This compatibility fallback never overrides an existing array, including an empty array. Unavailable publication returns no FAQ records.

Migration: 20261006000100_managed_faq.sql extends validation through the established private-validator wrapper. It accepts historical records, validates up to 50 unique items, and rejects malformed types/unknown keys/oversized values. It creates no table and rewrites no content rows, timestamps or publication states. Tested in disposable local databases only; applying it to the hosted database is a future release prerequisite.

## Browser verification

Chrome desktop viewport emulation, actual components with synthetic local product/schedule data, plus the actual external map in read-only mode. The external map permits localhost:3000; the initial isolated alternate-port frame was refused by its existing policy. Testing used the allowed origin without modifying that policy. Temporary fixture API interception kept schedule refreshes synthetic; no booking was submitted. Temporary test-page source files were removed afterwards.

| Width | Height | Map width × height | Document overflow | Map count | WhatsApp overlap |
|---:|---:|---:|---|---:|---|
| 320 | 568 | 292 × 420 | None | 1 | None |
| 360 | 844 | 332 × 625 | None | 1 | None |
| 375 | 844 | 347 × 625 | None | 1 | None |
| 390 | 844 | 362 × 625 | None | 1 | None |
| 414 | 844 | 386 × 625 | None | 1 | None |
| 430 | 844 | 402 × 625 | None | 1 | None |
| 768 | 900 | 678 × 684 | None | 1 | None |
| 1024 | 900 | 908 × 684 | None | 1 | None |
| 1280 | 900 | 1138 × 684 | None | 1 | None |
| 1440 | 900 | 1282 × 684 | None | 1 | None |
| 1920 | 900 | 1714 × 684 | None | 1 | None |

Mobile and desktop map screenshots inspected, with a separate tablet 768×1024 view. Actual stop-card selection opened Rozafa Castle's map popup. Mobile stops/arrivals overlay opened and controls remained reachable. Live status and ordered stop updates reached the parent through the existing bridge. These checks verify integration/presentation, not GPS or ETA accuracy, physical devices, geolocation permission or a moving-vehicle journey.

Home removal/broken-anchor checks passed at 320px; Tour retains its destination story and has no #how anchor. FAQ add/edit/reorder/disable/public accordion/delete confirmation/deletion/discard were exercised with local state. The actual FAQ section editor fits 320/390/768/1440px, with 20px checkboxes and button targets at least 44px. SQL tests establish draft isolation/publication/deletion persistence; no hosted CMS save was exercised.

## Performance and limits

One eager Route iframe; existing homepage iframe remains deferred. No map engine, tracking subscription, dependency or second schedule owner added. Larger map area can require additional external map tiles; no claim of unchanged transfer bytes. Optional selected-destination image retains intrinsic dimensions and lazy Next Image loading. Long descriptions are clamped, with complete content available in the selected detail. Fixed map height reserves space before loading. No production Lighthouse, bundle comparison, field Core Web Vitals or physical Safari/PWA certification is claimed.

No new hardcoded prices, stop names, stop counts or departure hours in production code. Existing meeting-point links, deployment map binding, UI/booking-mechanics wording and migration-only legacy FAQ answers remain intentionally code-owned. Synthetic test hours/prices/names were never published.

## Final gates

Final lint PASS, TypeScript PASS, full tests **351 passed / 0 failed / 0 skipped**, isolated production build PASS. Totals: 28 components, 17 identity, 124 integrations, 158 database, 24 PostgreSQL concurrency. Evidence logs are private/restructure-final-{lint,types,tests,build}.log. Task diff whitespace check passes. The isolated build initially encountered a stale generated development validator for the temporary fixture; removing that generated cache file resolved it without changing application configuration. The final successful build contains no temporary fixture page.

No deployment authorized by this brief. This task also does not apply or publish the earlier locally committed transactional-email migration/release; its existing checkpoint remains separate. Physical-device and hosted FAQ save/publish acceptance remain unperformed.


## Authorized publication ? 6 October 2026

The subsequent owner request authorizes publishing this refinement and the preceding transactional-email commit. Applied 20261005000400_transactional_email_completion and 20261006000100_managed_faq through the authenticated Production SQL editor; both succeeded and were recorded in supabase_migrations.schema_migrations. Read-only checks confirmed the three email columns, recipient function with anonymous execution denied, FAQ helper, and compatibility of existing published homepage content with both legacy FAQ and an empty managed array. No booking/content rows were edited and no worker was invoked. Vercel Project environment inspection found no ENABLED overrides; disabled defaults and the existing Vercel delivery pause remain in force. Hosted release verification follows the Git push.
