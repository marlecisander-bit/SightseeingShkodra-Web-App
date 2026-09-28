# Homepage section visibility - 28 September 2026

## Existing architecture
The structured `content_pages` row with slug `website-homepage` owns editorial content. `body.content` is the saved draft; `published_body.content` is the public snapshot. The existing permission-checked `save_website_content_v1` RPC retains optimistic concurrency, publication, audit and revalidation behavior. No new table or publishing mechanism was added.

## Field and schema
Eight optional `<section>.showOnHomepage` flags use strict string booleans (`"true"` / `"false"`) to match the existing flat `Record<string,string>` content model. Missing keys normalize to true in both application and SQL validation. Migration `20260928000100_homepage_visibility.sql` extends the validator only: no rows, content, images, timestamps or publication snapshots are rewritten. Existing drafts and published content remain intact.

## Supported sections
Hero; A day with possibilities (including its existing day-planner strip); The places between; Your day, without the guesswork; Today, at a glance; Guest Reviews; The local notebook; Final booking invitation. Order and numbering remain unchanged. Reviews still require published review records in addition to homepage visibility.

## Protected and inactive content
Global header/navigation, footer information, SEO and booking infrastructure have no visibility switch. The final switch removes only the homepage invitation, preserving the shared photographic footer and its information. Other pages retain their invitation and shared editorial content. Hero can safely be hidden: the fixed header becomes solid and receives its normal navigation clearance. If introduction is hidden, the hero discovery link leads to the tour instead of a missing intro anchor.

Hero amenities were already intentionally removed from the public homepage by the previous request. Their data and editor remain, with an explicit inactive explanation rather than an ineffective switch or accidental restoration. Removed historical homepage sections remain removed.

## Admin workflow
Each supported collapsed card has an accessible switch, ON/OFF text and separate green Visible / neutral Hidden badge. Publication status remains distinct. Visibility and editorial changes share the same form, Save Draft, Publish and Discard controls. The toolbar targets the section with unsaved changes even when collapsed. Save/discard that section before changing another; several saved section drafts can then be published together. The existing global publish behavior remains: publishing applies the current section plus previously saved website drafts.

## Public and preview behavior
The public reader normalizes and consumes only `published_body`; the authenticated draft preview normalizes and consumes `body`. Hidden sections do not mount, so no section containers, anchors, margins, loading placeholders or map iframe survive for them. Turning visibility on restores the existing content. Shared Tour/Explore/Live consumers ignore homepage-only flags.

## Verification
- Six new/existing visibility and hero tests passed, including legacy defaults, draft isolation, multiple hidden flags, publication, restoration, strict validation, permission and stale-write rejection.
- Ten additional existing CMS/content/public-homepage tests passed after updating the historical migration fixture to exclude the new future-schema keys.
- Browser fixture checks passed at 320, 390, 430, 768 and 1440px: collapsed switches, independent status, discard, form target, hidden fields, no horizontal overflow, default rendering, complete removal of optional sections/iframe and preserved footer.
- Mobile admin and hidden-state screenshots inspected; evidence is local under `private/visibility-*.png`.
- Lint passed. Isolated typecheck and production build passed. Root typecheck still reports only the pre-existing nested private-copy credits errors documented in the earlier responsive audit.
- Persistence verified through database reads after saving; a real authenticated browser logout/login and hosted editor save were not exercised. The temporary development UI fixture was removed after testing.

## Migration and deployment
Migration executed only in disposable local test databases. Nothing applied to hosted Supabase, committed, pushed or deployed. Apply this migration before releasing the app changes; the older hosted SQL validator will reject the additional fields until then. A localhost app pointing at hosted Supabase therefore cannot save these flags yet.

## Scope
No booking engine, pricing, departures, capacity, products, suppliers, GPS, routing, independent Map App or unrelated admin module changes were made in this task. Pre-existing email/admin work remains untouched. Changes are confined to the homepage schema/reader/action/editor, homepage rendering, shared footer invitation boundary, header presentation, preview, migration and focused tests.
