# Product availability and card ordering — 7 November 2026

Implemented locally on `work/product-availability-20261107`. No commit, push, deployment, hosted migration or infrastructure change. The documented canonical folder remains absent; this uses the current folder under the previously recorded owner authorization (4/6 November). Pre-existing documentation/evidence edits were preserved.

## Behavior and ownership

Products is the single admin owner. `products.active`, `products.unavailable_message` and `products.display_order` are the shared authoritative fields, independent of publication, pricing and physical inventory. Owner/admin can save availability or use Move up/Move down in All products; each product shows its position and state. The same availability form is available in the selected product editor. The old Pause sales button is replaced by these explicit availability controls. Existing draft/publish controls still govern editorial changes and homepage visibility.

Availability and order take effect on save through the existing `revalidatePath('/', 'layout')` mechanism. Role/tenant validation, optimistic timestamps, audit events and the existing tenant inventory lock protect SQL mutations. Adjacent moves are atomic and reject stale forms. New drafts append after current products. Legacy card JSON `order` is retained as compatibility data; its numeric editor is retired and public ordering uses the product column. Editing/publishing a card cannot undo a saved move.

Inactive published offers stay in the directory and homepage position. Their media/body are greyscale with readable text, an explicit unavailable status and disabled booking control. The red ribbon is a separate sibling outside the filter. It occupies a natural-flow row aligned to the top corner so wrapping never covers images, headings, prices or controls. Messages support up to 160 characters; SQL rejects whitespace-only inactive messages. React renders messages as text. Active offers hide the ribbon automatically. Mobile View details remains usable.

The public directory, primary homepage fallback and saved product preview project the same fields. Both desktop and mobile use the same sorted card list. Direct `/book?productId=…` links retain product title/introduction and display an unavailable notice without checkout for inactive offers. The public availability/checkout resolver excludes inactive offers, generic booking controls respect inactive context, and SQL rejects insertion of new holds/booking items for inactive products, including an old hold attempting a new checkout. Legacy hold inserts are checked after the existing reservation snapshot trigger has resolved product identity. Existing confirmed reservations, agreed fares, QR/management tokens, cancellation/check-in and already-created payment reconciliation are preserved. Inactivating an inventory-owning offer does not disable a different active offer sharing its physical schedule.

## Migration

Prepared: `supabase/migrations/20261107000100_product_availability_order.sql`.

It adds the three product fields and validation; defaults every existing product to active; backfills the exact previous order (card order, title, ID per operator); appends future products; adds service-role-only availability/move RPCs and booking insertion guards; extends existing product/homepage projections and excludes inactive offers from passenger availability quotes. It does not rewrite content/pricing/reservations or add another booking engine. Apply this migration to an isolated local/staging Supabase before exercising the real admin save actions, and before any separately authorized release of this code. No environment variables are added. No hosted database was modified.

## Verification

- Full `npm test`: **682 passed, zero failed** (176 components, 24 identity, 228 integrations, 219 database, 28 PostgreSQL, 7 CMS verification). Logs: `evidence/product-controls-20261107/tests.log`.
- `npm run check`: lint, generated route types/TypeScript and normal optimized Next.js build passed. Initial stale generated types from the removed temporary dev route were cleared; the final normal check passed. Log: `evidence/product-controls-20261107/check.log`.
- Two focused migration tests passed against the final SQL. Upgrade proof compares existing ordering, editorial JSON and pricing before/after. Operational proof covers active defaults, required/Unicode/oversized messages, activation/deactivation/reactivation, SQL holds/old-hold checkout rejection, unchanged reservations, usable shared inventory, persistent moves, stale writes, tenant/role restrictions and denied browser RPC access.
- Components verify escaping, inactive positions, accessible details, no inactive booking links, reactivation, primary fallback availability and existing active direct links. Resolver integration checks direct/default inactive product rejection and read-only inclusion for product information.
- Chrome synthetic local browser checks at 320×740, 390×844, 768×1024, 1024×768 and 1440×1000: no page overflow, ribbons fit, no image/title/control overlap, red ribbon outside greyscale, active image unchanged. A 159-character message wraps without clipping at phone widths. Desktop/mobile form saves, custom messages, reactivation and Move up were exercised; SQL covers moves in both directions and persistence. Mobile native scroll rail moved from 0 to 322.5px and updated pagination; unavailable View details opened successfully. Reactivation removed every ribbon/filter in the tested pair.
- Browser fixture used actual public/admin components with injected local save callbacks; SQL/domain tests independently used real migrations and RPCs in disposable databases. This does not claim an authenticated hosted/local Supabase browser save or real customer checkout. No real reservations, payments or communications were submitted. Physical-device touch gestures, Safari and Firefox remain unverified.
- Screenshots and machine-readable layout observations are in `evidence/product-controls-20261107/`; the temporary development route was removed, with its fixture source retained as `.tsx.txt` evidence. The combined fixture includes the admin shell below public cards; its fixed admin navigation is not part of the public page.
- `git diff --check` passed. Independent Live Map and its contract were untouched.

## Translation boundary

The current website is English-only (`EN · more languages coming soon`), with no active locale selector, translation catalog or per-language product fields. The ribbon follows the existing product/CMS plain-text approach and accepts Unicode messages, including Albanian. This change does not introduce a second translation system or claim automatic/per-language translations. Localized variants require the site's future translation infrastructure.

## Main files

- Migration above; new `src/app/admin/product-availability-form.tsx`.
- Products page/actions, details form, saved preview and Products styles.
- Shared product DTO/directory/resolver, workspace state and primary homepage projection/parser/fallback.
- Product card renderer/styles/booking link and shared booking controls/direct book page.
- New availability/order and upgrade database tests, expanded product component/resolver/projection tests.

This is the specifically requested product-controls amendment, not completion of a later roadmap phase. Original Roadmap V4, pricing/capacity/payment rules, independent map and hosted infrastructure remain unchanged.
