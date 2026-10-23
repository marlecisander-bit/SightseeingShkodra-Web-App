# Admin UX recommendations

15 October 2026. Audit and recommendations only. No application changes or production edits.

## What is already practical

- One role-filtered workspace shell, with Website, operations, sales and communication groups. Nine discovered modules load for the authenticated owner without an error alert.
- Website groups Homepage / Destinations / Public pages / Global; existing entity managers reuse the same layout and uploader.
- Native mobile navigation dialog, Escape/focus return, offline status, minimum touch-target styles and field wrapping are implemented.
- Section editing uses focused cards and a saved-draft preview. Dirty/pending guards prevent switching away from unsaved Website edits. SQL stamps protect Website, Destination, Partner and Review concurrency where implemented.
- FAQ has meaningful answer-source selection, move controls and delete confirmation. Partners has explicit two-step delete confirmation and explains immediate publication of active records.
- Calendar groups standard schedule and pricing, offers range overrides and explains preservation of existing confirmed prices. Meeting-point history is separate and owner-only.
- Errors and status text are generally owner-facing, not raw provider errors. Privileged provider credentials are not editable public/CMS fields.

## Observed mobile evidence

Read-only live Website section-list checks at 320, 375, 768 and 1440px found no page overflow and no visible button under 40px high in that sampled view. The focused Hero form at 375px also had no field outside the viewport. Existing release evidence additionally covers the empty Partners form at 320px; this audit does not substitute that evidence for a fresh edit/save/upload test. Physical iPhone Safari/Android, virtual keyboard, rotation, screen-reader flow and every expanded Calendar/Booking form remain untested. Results are not a blanket accessibility conformance claim.

## Recommended changes, in practical order

| Priority | Everyday problem | Recommendation using existing interface | Evidence / finding |
|---|---|---|---|
| P1 | Owner edits a CTA label that does nothing | Connect the current Hero booking label; do not add another field | F01, hero-booking-widget.tsx |
| P1 | Catalog promises SEO/images no public page uses | Decide/label current public ownership before asking the owner to fill these fields | F04, catalog-panel.tsx |
| P2 | Editing invisible copy wastes time | Retire three obsolete fields and unused amenity Description; retain stored data | F02/F05 |
| P2 | Navigation labels seem to disappear | Preview effective links after normalization and explain duplicate targets at the actual fields | F03, navigation.ts |
| P2 | Publisher and editor buttons behave differently without explanation | Disable both destination move directions consistently for content editors; explain publisher-only actions | F06 |
| P2 | Save means different things across modules | Use clear “Save draft”, “Publish saved website changes”, and “Save & update website” terminology. Display affected saved drafts immediately before Website publishing | F11; existing pending-change summary is a strong starting point |
| P2 | Owner cannot tell which pages a visibility switch affects | Replace broad scope labels with actual page names and a note that the Route map stays available | F14 |
| P2 | Owner expects an exact desktop crop | Explain/test >=1600px focal transformation or obtain approval to use one faithful setting | F07 |
| P2 | “Photo coming soon” remains on first stop | Link the owner directly to the existing Destination association workflow; require approved photo/content | F09 |
| P2 | Old/replaced uploads accumulate | Start with a usage/read-only media report and clear file guidance, then design safe cleanup; never auto-delete shared assets | F13 |
| P3 | Partners quick action has no description and sorts unexpectedly | Reuse its existing navigation description/order in Overview | F12 |
| P3 | Review deletion has no explicit confirmation unlike Partners/FAQ | Consider consistent confirmation and explain soft deletion/history retention | reviews-editor.tsx / review-actions.ts |
| P3 | Catalog concurrent edits can silently replace each other | Consider a timestamp guard matching the existing Website/Partners convention | catalog-actions.ts save_catalog_v1 has no expected stamp |

## Field wording and grouping

Keep product **title/status/inclusions** in Products & suppliers, actual **prices/age bands/dates/seats/offers** in Calendar & Pricing, editorial **destination stories/photos/guide SEO** in Website → Destinations, and **operational stops/GPS/order** in the separate map admin. Partners are editorial relationships, not a duplicate supplier editor. Shared footer Google Reviews URL has one authority in review_settings and one owner control in Footer; Guest Reviews consumes it without another editable copy.

Use plain owner-facing examples for optional URLs and display order. A numeric order is adequate for Partners; a drag-and-drop rewrite is not justified. Existing explanation of full Website publication should remain prominent. Date/guest validation, security, capacity, GPS and provider settings must not become editable text fields merely to reduce clicks.

## Preview and verification

Current private previews reuse public components and saved drafts, which is appropriate. Improve the proof harness and allow a short, consistent preview/save/publish checklist for a non-technical owner. Do not promise per-field correctness from a successful build, current screen or old 134-field audit artifact. Test publisher/editor/operations roles in isolated sessions, not by relaxing production permissions. No new admin module, CMS framework or generic page builder is recommended.
