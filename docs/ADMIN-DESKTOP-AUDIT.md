# Admin desktop UX audit

Verified locally on 2026-09-24. Scope: presentation and responsive layout only.

## Routes audited

- /admin: workspace chooser, now with official branding.
- /admin/[operatorId]/overview: permission-filtered links to existing management tools.
- /admin/[operatorId]/catalog: products, prices, suppliers and publication editors.
- /admin/[operatorId]/departures: service schedules, operating dates, departure times and exceptions.
- /admin/[operatorId]/bookings: filters, manual reservation form and existing order controls.
- /admin/[operatorId]/content: homepage CMS, media, SEO and other content editors.
- /admin/[operatorId]/website-preview: private saved-draft preview; intentionally retains public presentation.

Media and SEO are embedded CMS features. Customer search and payment collection are within Bookings. There are no separate analytics, settings, language, user-management or integration pages to refactor. Routes, stops and GPS remain managed by the independent map application. Existing records use lists and disclosure editors, not data tables or custom dialogs.

## Findings and changes

The original general shell restricted large-screen workspaces to 78rem while CMS used a separate width system. Large headings, stacked fields and oversized gaps reduced useful desktop space. The header lacked the official logo; overview described management tools as pending despite existing implementations.

A shared AdminShell now supplies the official /brand/logo-color.svg asset, workspace identity, grouped permission-filtered navigation, current-page indication, skip link and existing account actions. The desktop sidebar is 248px (220px at intermediate widths); content supports up to 1600px within a 1920px outer shell. Typography, controls and spacing are consistent across sections. Desktop mutation forms use two columns with long fields spanning both; mobile forms stack. Booking filters wrap compactly. Existing destructive controls retain distinct presentation.

Overview now links to actual permitted tools without invented metrics. The CMS uses container-responsive columns and a sticky desktop save/publish action row. Its sidebar stacks when available workspace width falls below 900px. Navigation wraps above content on tablet/mobile. Checkbox dimensions and input font weights were corrected after visual inspection.

## Files in this refactor

- src/app/admin/admin-shell.tsx (new shared layout)
- src/app/admin/overview-panel.tsx (new overview)
- src/app/admin/[operatorId]/[section]/page.tsx (shared shell wiring)
- src/app/admin/admin.module.css (shared responsive rules)
- src/app/admin/website-editor.module.css (CMS responsive columns/actions)
- src/app/admin/page.tsx (workspace chooser logo)
- docs/ADMIN-DESKTOP-AUDIT.md and docs/PHASE_STATUS.md

Pre-existing changes elsewhere in the working tree belong to earlier tasks.

## Verification

Authenticated Chrome checks covered every route above at 1920x1080, 1440x900, 1366x768, 1024x768, 768x900, 390x844 and 375x812: 49 route/width checks with no document horizontal overflow. All five management sections had the correct active navigation. Expanded schedule and manual-booking forms also passed all seven width checks. Screenshots inspected the desktop overview, product form, schedule editor, desktop CMS and mobile CMS/booking layouts. Official logo rendered on both workspace and chooser. Temporary viewport overrides were cleared.

Typecheck, ESLint and isolated optimized production build passed. Identity tests: 15 passed. Integration tests: 35 passed. No data mutations were performed for visual QA. The current order list was empty, so populated order interactions were not exercised. Existing authorization, server actions, schema, booking/capacity/payment rules, schedules, GPS and public behavior were not intentionally changed. This UI audit does not claim full end-to-end business regression coverage or external deployment.

## Remaining limits

Mobile navigation remains a visible wrapping list of the five existing sections; it is usable but occupies vertical space. No new drawer or invented admin module was introduced. Production deployment is outside this task. Populated orders and all staff-role combinations should be included in release acceptance testing.
