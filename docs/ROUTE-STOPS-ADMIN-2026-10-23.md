# Route stops admin panel — 23 October 2026

Implemented locally at `/admin/[operatorId]/route-stops`, listed under Website in the admin navigation. No push, deployment, migration, hosted content write or tracking change was performed.

## Behavior and ownership

The panel lists the existing independent Live Map’s published stops in their authoritative order. Each stop shows its linked canonical destination name/photo and draft/publication status. Edit name & image opens the existing destination editor in a compact presentation: name, main image uploader and alt text first; remaining destination/publication settings collapsed.

The same `content_pages` destination remains the content source for Route, homepage and Explore consumers. Shared content changes therefore appear wherever that destination is used. This is another entry point to the same editor and save action, not a second CMS or independent stop entity. Existing draft, publish, upload, operator authorization, conflict/stamp checks and public revalidation are reused. Publishing includes all saved fields of that destination, disclosed in the form. Content editors can draft; owners/admins can publish.

Stable `stopId` remains the join key. The panel locks that association while editing a mapped stop and provides no coordinate/order/tracking controls. The existing iframe and its message bridge still supply van position, current/next/departed states and ETA. Published operational stop references use the existing read-only map adapter, without a new polling loop, map instance or subscription. Names inside the iframe remain owned by the external Live Map.

Unmapped stops can reuse an unassigned destination or create one using the existing canonical workflow. Creation uses the real map label and selected stable ID as initial values; publishing still requires existing description, photo, alt and search fields. Duplicate links and draft reassociations are flagged for review instead of choosing a destination silently. When map references are unavailable, the panel preserves associations and links to Website → Destinations; it does not fabricate stop records. Archived destination records do not reappear as active route content.

## Changed files for this task

- `src/app/admin/route-stops-panel.tsx` — authorized server data loading using existing readers.
- `src/app/admin/route-stops-editor.tsx` — stop list, canonical editor entry and setup paths.
- `src/app/admin/route-stops.module.css` — responsive list styling.
- `src/app/admin/destinations-editor.tsx` — reusable preselected stop mode, primary image fields, locked association, compact optional fields and return feedback.
- `src/app/admin/destinations.module.css` — compact mode layout.
- `src/app/admin/[operatorId]/[section]/page.tsx` — new panel dispatch behind existing permission gate.
- `src/app/admin/admin-shell.tsx` and `src/modules/identity/admin-navigation.ts` — permission-filtered Website navigation entry.
- `src/app/admin/website-editor.tsx` — Route page content cross-link.
- `src/modules/notifications/contracts.ts` — allow only the new internal Route stops sign-in return path; no arbitrary query or external destination permitted.
- `src/app/dev/route-stops-preview/page.tsx` — development-only fictional UI fixture, disabled outside development.
- `tests/components/route-stops-editor.test.mjs` — canonical list, missing source, duplicate-link and reassociation cases; writes/uploads mocked out.
- `tests/database/destinations.test.mjs` — existing destination RPC draft/publication and public projection proof while retaining operational records.
- `tests/identity/admin-navigation.test.mjs` — updated role expectations and sanitized new sign-in return.
- `docs/CMS-RECONCILIATION.md`, `docs/PHASE_STATUS.md`, this report and `docs/review/route-stops-admin-2026-10-23/` — ownership and review evidence.

No dependencies, environment variables, schema, migration, save/upload action implementation, tracking/backend algorithm or production service changed.

## Verification

- ESLint, TypeScript and production build pass.
- Full existing npm suite including the new component/database coverage: 416 passed (60 components, 17 identity, 143 integrations, 172 database/domain, 24 real local PostgreSQL concurrency). One subsequently added sign-in-return test also passed in a focused 12-test run: 417 distinct tests total.
- New database test saves a destination name/image as a draft, proves its published body unchanged, publishes through the existing RPC, then checks actual destination/public stop projection. Stable external stop ID, live state and ETA remain unchanged; all local operational stop rows are byte-equivalent as JSON values before/after. Existing stale-save, operator and browser-role tests also pass.
- Browser fixtures verified list → edit, name entry, image-link replacement updating the preview, unsaved-change/discard handling, new destination preselection, reuse of an unassigned destination and draft-only editor permissions. No fixture Save/Publish or upload was submitted to hosted services.
- List and editor checked at 320, 390, 768 and 1440px without horizontal overflow. Desktop/mobile screenshots retained in `docs/review/route-stops-admin-2026-10-23/`. CSS scope corrections restore the existing styled image uploader in the standalone panel and prevent a text field stretching to image height.
- `git diff --check` passes.

## Limits and use

Authenticated hosted save/upload/publication was not performed. An attempt to inspect actual local `/admin` in the browser was blocked by the browser client (`ERR_BLOCKED_BY_CLIENT`); no bypass was attempted. UI review uses clearly labeled development fixtures, while persistence/security is verified using disposable local databases and existing authorization tests. Full live admin acceptance with isolated configured data and a real image upload remains a manual review step.

To use after a separately approved release: open Admin → Website → Route stops, choose Edit name & image, change the name or replace the photograph, enter a meaningful image description, then Save Draft or Publish. A new stop destination also needs its description/search fields completed. Only canonical shared editorial content changes; positioning and all operational behavior continue to come from the independent map.

Local implementation is ready for review. Production remains unchanged. The previously recorded release and isolated-environment checks still apply before any push or deployment.
