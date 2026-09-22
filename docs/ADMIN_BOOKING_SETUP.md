# Admin booking setup

Updated 2026-09-22. Owner sign-in is now completed: the user reported successful access and Chrome displayed the authorized Sightseeing Shkodra workspace with the owner role. No password was read or changed by the agent.

## Set up the first van tour

1. Open `/admin`, choose Sightseeing Shkodra, then **Products & stops**.
2. Expand **Create product**. Enter the real tour title, choose `van_tour`, and initially keep it `draft`. For the main public tour use URL slug `shkodra-day-tour`, matching this development app's configured public product. Save the product.
3. Expand the saved product. Under **Van tour price**, enter **Price per guest (EUR)**, such as `12.50`, and click **Save price**. The example is not a suggested business price. One rate applies to every guest; age bands are not implemented.
4. Add route stops with their actual coordinates and route order. Supply clear meeting-point information in your approved content.
5. Complete the product's SEO title and description and change publication to `published` when ready. Publishing does not create departures.
6. Open **Departures**, select the tour and set date, local departure time, van capacity and scheduled status. Capacity belongs to each departure, not the product price form.
7. Open the public `/book` page to check the published dates and price. Customers confirm seats online and pay at the meeting point. Manage reservations and full payment collection in **Bookings**.

The public booking page currently uses one configured main van tour. Creating boat or attraction catalog records does not add new booking engines or automatically display them publicly. Contact/cancellation details and confirmation message delivery still need separate setup before real customer use.

## Price editor implementation and verification

Migration `20260922000700_product_pricing_editor.sql` adds a service-only `save_product_pricing_v1` RPC. Owner/admin staff may update their own van-tour price; operations/content editors cannot. Decimal EUR input is parsed as exact numeric cents in SQL and validated through `unit_price_v1`. Saving also installs the existing departure-seat capacity model. The product row is locked and its expected timestamp checked, preventing silent stale overwrites. Every successful change records the actor and previous/new pricing in the audit trail. Existing saved order totals are untouched; later checkout uses the current product price.

The separate price form uses the existing authorized Server Action and mutation-form pattern, preserves errors/entries, and requires reloading after a stale edit. Product publication and other catalog editing remain separate. Other product types are deliberately excluded from this V1 editor.

Checks: 11 relevant database tests passed (pricing, catalog and availability), including exact cents, zero price, invalid/unsafe values, stale edits, actor permissions, inactive membership and direct-client RPC denial. Lint, typecheck and optimized isolated build passed. Migration was dry-run then applied to the development Supabase project. Chrome verified the signed-in owner catalog and guidance; the real catalog is empty, so no real product or price was created and no populated price form was submitted in that browser session.

Build output used ignored `private/build-pricing-editor`; temporary configuration was restored. The existing default `.next` OneDrive artifact issue remains unchanged. No new environment variables, dependencies, external deployment or notifications. The original roadmap remains unchanged; scope is operational setup following the approved meeting-point payment amendment.
