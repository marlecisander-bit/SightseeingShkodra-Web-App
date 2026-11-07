# Unavailable tour-card redesign — 7 November 2026

Implemented locally; no production content edits, hosted migration or deployment in this task. Existing shared changes preserved in the authorized fallback repository (documented canonical directory remains absent).

Products retain the existing operational `active` flag and `unavailable_message`. One nullable JSONB column, `availability_presentation`, stores validated state, optional badge label, structured reopening `{precision: "month" | "day", value: "YYYY-MM" | "YYYY-MM-DD"}`, and optional secondary-action label/destination. Existing values are not backfilled or overwritten. Legacy inactive products retain their explanatory message and use the temporary-unavailability label. Available products retain their booking flow; dates never change their active flag.

Apply `supabase/migrations/20261107000300_product_availability_presentation.sql` before releasing this revision. It adds the column, allows blank messages for derived defaults, adds database validation, adds service-only `save_product_availability_v2`, and extends the existing directory/homepage projections. The older RPC stays compatible. Authorization, inventory locking, optimistic concurrency, and database quote/hold/checkout restrictions remain authoritative.

In **Admin → Products → Manage product → Availability status**:

1. Select **Seasonal break** (or Temporarily unavailable / Sold out for those distinct conditions).
2. Leave Public status label and Explanatory message blank for defaults, or supply overrides. Existing message text is retained until explicitly edited.
3. Select **Month only** and enter the intended year/month, or select **Exact date**. No day is stored for month-only entries. Formatting uses the site's current English / en-IE date convention.
4. Optionally enter `/route` or a supported site destination / credential-free HTTPS URL. Leave its label blank for **Explore the route**. Without a destination, no action is shown.
5. Review the live status preview and save. Saving Available explicitly reopens sales subject to existing schedule/capacity rules; reopening information alone never does.

Shared `product-availability.ts` handles types, defaults, dates and URL validation, using existing website-link conventions. `product-availability-status.tsx` renders the same cream clock badge and information panel in admin preview and public cards. Existing card/photo dimensions are retained; grayscale and the red ribbon are removed. Secondary links do not open checkout. Homepage fallback carries the same saved settings.

Validation includes disposable-database persistence/public projections, state/date/URL rejection, role/stale guards and existing direct quote/hold/checkout tests; component tests for old records, normal booking links and new secondary actions. Real Chromium at 390×844 and 1440×1000 showed no horizontal overflow, equal image heights and full colour. Local admin fixture saves updated the visible card; missing dates/links rendered cleanly. The fixture is development-only and creates no production records.

`npm run check` passed lint, generated types and production build. Full `npm test`: **708 passed, zero failed**. Enhanced persistence/projection checks and existing booking restrictions were rerun after the final test fixture adjustment. Logs: `evidence/tour-status-20261107/`.
