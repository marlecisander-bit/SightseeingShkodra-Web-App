# Bright red color system

Updated 2026-09-24. Color-only change; no schema, booking, GPS, authentication, CMS or layout changes.

## Audit

Previous brand values: globals #8b2433, public #7a2020 (hover #5f1717), admin/CMS #78202d, local tracking #792335. Public focus used #ab482c; selected surfaces used #eadfdc, #f6eeec and #f0e8e6.

Searched source CSS/TS/TSX, global/theme variables, inline styles, RGB/HSL literals, public assets, and configuration. No Tailwind theme or red utility-class system is present. No remaining old burgundy literals in application source. Historical documents and migrations are reference/history, not active design-token sources.

## Canonical tokens

Defined once in `src/app/brand-tokens.css`, imported by the root layout:

| Token | Value |
| --- | --- |
| --brand-red | #E71922 |
| --brand-red-hover | #CF151D |
| --brand-red-active | #B91219 |
| --brand-red-soft | #FDE8E9 |
| --brand-red-border | #F3B9BC |
| --brand-on-red | #FFFFFF |
| --brand-text | var(--brand-red-hover) |
| --brand-focus | var(--brand-red-active) |

Existing --accent and --p-red are aliases to the central palette, not independent colors. Primary button backgrounds use the bright primary; normal links/small accent text use --brand-text. Hover/pressed states, selected navigation, checkbox/radio controls, booking progress, CMS buttons and tracking recovery controls share the palette. Leaflet's local SVG markers/default routes consume the same CSS variable.

## Contrast

Calculated using sRGB relative luminance: white on primary 4.61:1, on hover 5.56:1, on active 6.64:1. All pass the 4.5:1 normal-text threshold. Primary text on public off-white is only 4.26:1, so small accent text uses hover: 5.14:1 on off-white and 4.74:1 on the brand soft surface. Disabled controls retain existing disabled opacity; these ratios describe enabled controls.

## Files changed for this task

- `src/app/brand-tokens.css` (new), `layout.tsx`, `globals.css`.
- `src/app/(public)/public.css`.
- `src/app/admin/admin.module.css`, `website-editor.module.css`, `schedule.module.css`.
- `src/components/public/live-map.module.css`.
- `src/modules/tracking/shared-map.module.css`, `map-canvas.tsx`, `published-map.ts`.
- `src/app/dev/tracking-preview/preview.tsx` removes its duplicate literal and uses the map default.
- `tests/integrations/tracking-reuse.test.mjs` expects the safe shared-token fallback instead of the old literal.
- Decision/status documentation and this report. Earlier uncommitted CMS/schedule work is preserved.

## Intentionally unchanged

- Logo SVG artwork: original red #E2251B and its orange/green/purple/yellow/white colors are preserved as explicitly requested.
- CMS published/success green and draft/warning amber; map stop/POI colors and stale-position gray; neutral white/off-white/charcoal surfaces; blue admin keyboard focus rings. These are semantic, neutral or accessibility colors, not competing brand reds.
- Explicit published GeoJSON route colors are data, not theme defaults, and remain intact.
- The independently hosted live-map iframe owns its internal red and green status styles. Cross-origin CSS cannot be inherited from this app; no remote map deployment or tracking change was made.

## Verification

ESLint, TypeScript and isolated optimized Next.js build passed. All 32 integration tests passed after updating the existing color fallback expectation. The brand contrast values above were calculated directly. Chrome visual checks completed after reconnection: desktop homepage, booking selection, public live tracking, owner overview and Website CMS; 390px mobile homepage, booking selection and CMS. Bright primary buttons and soft selected navigation render correctly, with neutral backgrounds and green published/at-stop statuses preserved. CMS computed primary background is rgb(231, 25, 34) with white text. The live iframe loaded map tiles and its existing status controls. Booking details/confirmation remain untested because the product is draft/unpriced. No content was published or booking submitted; temporary viewport overrides were reset.
