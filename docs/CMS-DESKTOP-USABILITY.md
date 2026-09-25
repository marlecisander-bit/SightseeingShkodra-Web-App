# Desktop CMS usability refactor

Date: 2026-09-23. Scope: existing `/admin/[operatorId]/content` only.

## Implementation

- Added `src/app/admin/website-workspace.tsx`: compact page toolbar, 13 existing section cards, publication indicators, contextual sidebar and section navigation. Main workspace caps at 1600px; desktop editor/sidebar ratio is approximately 68/32.
- Reused `WebsiteSectionEditor` in `website-editor.tsx`: paired short fields and images, full-width descriptions, image filenames/dimensions, existing upload control, discard and dirty state. Preserved existing form names, validation constraints and server actions.
- Simplified `website-panel.tsx` to load the same authorized record and render the workspace.
- Updated `website-editor.module.css`, `admin.module.css` and `[operatorId]/[section]/page.tsx` with scoped CMS layout styling. Other admin sections keep their existing layout.
- Reused the existing private preview route, which renders the actual public homepage component. Sidebar thumbnails are labelled saved content rather than presented as a live preview.

No changes to database schema, RLS, authentication, upload server action, save/publish server action, public website components, tracking or operational data. New client behavior consists of section selection, dirty/pending indicators, discard, a section-switch guard and browser unload protection. Toolbar buttons submit the existing section form.

## Verification

- Chrome at 1366x768, 1440x900, 1536x900 and 1920x1080: no horizontal overflow. At 1920px the CMS workspace measures 1600px. Screenshots below were visually inspected; the 1440px view demonstrates paired image fields and the sticky toolbar.
- Existing content and images loaded; hero image dimensions correctly display 2400 x 876, including cached images.
- Edited hero heading: dirty state appeared; switching sections was blocked until save/discard; discard restored the original heading.
- Saved a temporary hero heading through the top toolbar, reloaded and observed the persisted draft. Published through the top toolbar and verified the changed heading in the local public HTML.
- Restored original heading through Publish; database verification confirmed all 123 draft and published values match the original values exactly. Verification updated publication timestamps/audit history only.
- Jump to Homepage SEO opened the correct editor. Switch workspace displayed the authorized workspace selector; selecting the workspace and navigating Products & suppliers then Website content succeeded with the existing owner session.
- ESLint, TypeScript, all 15 identity/navigation tests and an isolated optimized Next.js build passed.

## Limitations

- Required image fields support replacement, not removal; removing them would violate existing content validation. Alt text remains editable below the image controls.
- Upload handler and storage integration are unchanged. End-to-end browser file selection remains unverified because the Chrome extension's file access permission blocked that check in the preceding CMS task.
- Preview displays saved drafts; unsaved edits must be saved first. No device simulator was added.
- Below 1024px the layout falls back to one column; detailed mobile optimization remains outside this desktop task.
- No external deployment was performed.

## Screenshots

![1366x768 overview](screenshots/cms-desktop-1366.jpg)

![1440x900 expanded editor](screenshots/cms-desktop-1440.jpg)

![1920x1080 overview](screenshots/cms-desktop-1920.jpg)
