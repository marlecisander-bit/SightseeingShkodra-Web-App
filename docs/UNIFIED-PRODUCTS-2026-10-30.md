# Unified Products workspace — 30 October 2026

**Latest owner direction:** compact photo/information cards inspired by the supplied Prague reference. No date/passenger/departure controls on cards. One bottom booking link opens the shared `/book?productId=...` platform for that specific published product. This supersedes the inline vertical booking-controls revision recorded below.

The owner approved consolidating product management into one Products area and moving every offer, including Daily Ticket, into separate interactive cards immediately below the photographic hero. This amends the earlier Calendar/Website/Catalog editor ownership split. Original roadmap remains unchanged.

Release candidate on `feature/unified-products-20261030` from published main `8ffd230b5dace54950a0b34cf6e76295e4d01385`. Subsequent owner authorization covers publication of all developments; the compatible production migration has committed before application release. Earlier local-only entries below are historical checkpoints.

## Administration

Products is an explicit primary navigation area for roles with existing catalog-read access. Individual mutations retain their existing content, commercial and schedule permissions. The overview shows product photos/names, authoritative standard adult fares, reservation mode, shared source and setup status. New van products start as drafts without copying prices, photos or inventory.

One product editor owns Details, Prices, Schedule & seats, and Website placement. Details includes product name, introduction, photo/alt, inclusions and supplier association. Pricing and schedule forms reuse existing guarded RPCs. Linked offers point to the inventory-owning product's schedule; no duplicated schedule is introduced. Those operational saves explicitly affect new reservations immediately, independently of editorial draft publication. The daily calendar retains date-specific operational changes and links back to Products for standard settings. Old price/ticket routes and product-card route redirect to Products; Catalog now exposes suppliers only. The Website landing page links to Products instead of owning another card editor.

Product title, inclusions, supplier and photo/introduction/placement edits are staged in `products.editor_draft`. Save draft preserves public identity and card. Publish product validates photo/alt, visibility, all passenger fares, shared inventory source and an active operating period; then atomically updates that same product and its published card. Publish buttons inside Details/Website include current form values; the header explicitly publishes the saved draft. Incomplete drafts remain saveable, and failed publication rolls back intermediate card/activity writes. Stale submissions are rejected. Content editors can draft but cannot create, publish or pause. Pause removes the product from sale without changing bookings or published editorial snapshots. Details/Website unsaved changes block tab/product navigation and warn on reload. Private saved preview blocks booking writes and availability requests.

The new migration is `20261030000200_unified_product_workspace.sql`. It adds one draft column and two service-only functions; it does not rewrite stored products, bookings or inventory and does not replace the shared allocator. Migration must precede a future application release. Keep the schema if rolling the app back; no schema reversal after new editor writes.

## Homepage

The hero contains the existing CMS photograph/headline/amenities and a Choose your experience anchor. The homepage header booking action scrolls to the experience cards; other pages retain their existing booking action. Product cards follow immediately, two columns on desktop and stacked below 760px. All cards use the existing date/passenger selectors, quote/checkout and product-isolated selection state. Each offer uses its existing reservation policy and physical seat allocator.

For compatibility, the currently configured primary ticket remains visible below the hero using its existing CMS hero photo until its first unified product-card publication. This is a read-only fallback, not copied product content or a second image editor. Its admin label explicitly identifies the existing ticket and asks the owner to complete Product setup for subsequent publication. Additional products require a published enabled card and bookable inventory. No new product content or price is invented.

## Validation and limitations

Automated coverage includes private draft preservation, atomic publication and failed-publication rollback, missing setup blockers, independent shared product identity, pause, stale edits, invalid media, tenant/role restrictions, denied browser-role RPC access, validated sign-in handoffs and product-tab leave guards. Existing booking overlap/concurrency/QR/reference/payment/event tests remain applicable. Regression expectations were updated for the approved navigation and hero/card placement changes.

Local synthetic previews are available at `/dev/products-preview` and `/dev/products-preview?view=public`; forms/network booking are blocked, and the routes return 404 outside development. Both previews return HTTP 200. Browser visual/responsive acceptance could not be completed: native Chrome actions repeatedly reported concurrent app changes, then timed out/reset. HTTP/render tests do not establish visual acceptance. No isolated hosted Preview exists. Publication is not claimed.

Final automated results: **628 tests pass** (151 component, 23 identity, 219 integration, 201 disposable SQL, 27 native PostgreSQL, 7 CMS verification). Lint, generated Next types/TypeScript and optimized production build pass. The existing shared-seat allocator and booking/payment/event functions are unchanged. Browser responsive acceptance remains unverified for the reason above.


## Vertical booking cards — owner clarification

The owner specified separate vertical product cards with photo, date selection and immediate booking options. Cards now show photo, product title/introduction, reservation policy, authoritative fare, date input, always-visible adult/child/infant controls, departure buttons, quoted total and booking action directly on the card. No collapsed passenger panel or modal is needed to select a departure. Each card retains its own product selection; only a currently available, priced departure enables checkout. The existing checkout/hold/capacity engine is reused. Two columns on desktop, one stacked column on mobile.

Validation: 153 component tests pass, including inline departure selection, independent product state, retained date/passenger/departure selection into the existing checkout, and no checkout writes during card selection. Lint, typecheck and production build pass. Public synthetic preview returns HTTP 200. Browser visual acceptance remains unverified; local only, no publication.

## Compact information cards — latest owner reference

The owner replaced inline selectors with photo-led cards containing title, short icon badges, price and one booking action at the bottom. Cards use a pale neutral blue background, rounded photos and centered concise content, retaining the brand booking button. Desktop cards have bounded vertical proportions and equal bottom action alignment; mobile cards stack.

Duration/reservation and van badges derive from operational product data. Optional audio guide, live guide, air conditioning, Wi-Fi, walking and live tracking badges are selected explicitly under Products; none is enabled by default or inferred from the reference image. SQL validates the optional feature list and retains backward compatibility with existing cards. The directory exposes the existing standard adult price, labeled as such; zero is valid. Booking-page introduction remains editable in Products and appears on the selected product's booking platform rather than as long homepage prose.

The booking action is a normal product-specific link, not an inline modal/form. The booking page resolves that ID against the fixed operator's published directory and binds the existing BookingProvider/BookingFlow to that offer. Malformed, repeated or unavailable selectors return not-found rather than silently selling the default product. The existing plain `/book` route retains its default behavior. Dates, passengers, departures, holds and checkout remain in the shared engine. Private previews disable live booking links.

Still local only; the pending unified-workspace migration now also extends compatible card validation and adds the authoritative standard adult price to the server-only product directory. No production product edits, cloud changes or deployment.

Latest compact-card verification: 632 tests pass (151 component, 23 identity, 222 integration, 202 disposable SQL, 27 native PostgreSQL, 7 CMS verification). Lint, typecheck and optimized production build pass. Local public preview returns HTTP 200. Browser visual review remains unverified.


## Product-owned amenities and icon selection — latest owner amendment

The owner requested selectable multilingual audioguide, 2-hour ticket, full-day ticket, air conditioning, live tracking and hop on hop off options, with icon selection, and removal of shared hero/elsewhere amenity placement and old admin controls. Products → Details → Product amenities is now the only active amenity owner. Additional explicit options retain generic audio guide, live guide, Wi-Fi, walking and van tour. Air conditioner/air conditioned uses one canonical option. Each selected amenity has an icon picker and immediate icon preview; no amenity is implicitly enabled.

2-hour/full-day ticket labels are mutually exclusive in the editor and SQL validation. They are presentation labels and do not change operational seat reservation mode, minutes or shared inventory. SQL validates allowed feature keys, unique selections, icon names and that icon overrides belong to selected amenities. Public cards consume the published selections and icon overrides; automatic duration/van badges were removed. The draft/publish boundary remains intact.

The hero amenity strip, defaults/fallback generator, dedicated styles and Website amenity editor were removed. Existing `hero.amenities` document values and validation remain compatibility-only, without an active editor or public renderer. Retained historical rows cannot restore the strip, including in saved preview. Existing Route/Live Map navigation remains functional; it is not a product amenity editor. The CMS verification inventory and retirement proofs reflect this ownership change. Original roadmap unchanged.

Validation: **633 tests pass** (151 component, 23 identity, 222 integration, 203 disposable SQL, 27 native PostgreSQL, 7 CMS verification), including selection/icon payloads, exclusive ticket labels, malformed icon rejection, published icon persistence, seat-policy preservation and hero retirement. Lint, typecheck and optimized production build pass. Local preview returns HTTP 200. No hosted migration, product change or deployment for the redesign; browser visual acceptance remains unverified.


## 30 October 2026 — Complete Products redesign publication authorized

The owner explicitly requested publishing all new developments: unified Products administration, compact product cards, product-aware booking-page links, product amenities/icon selection and hero amenity retirement. This supersedes the local-only limits for these developments. Production migration 20261030000200 committed on project ybngoppqqiohcduojfyg after both replaced function definitions matched the tested baseline. Stored migration source MD5 40b2323b97eba6515971714676db02c1 matches the exact source. Transactional product fingerprint afebc04e95412e51417efea404fd3add remained identical; no existing product content/prices, booking or inventory records were rewritten. All 633 tests and lint/typecheck/build passed again; production dependency audit has zero vulnerabilities. Application PR/CI/Vercel release and read-only hosted acceptance follow. Existing delivery, map and cloud settings are preserved.
