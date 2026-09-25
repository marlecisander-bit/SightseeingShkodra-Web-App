# CMS navigation flow correction

2026-09-25. The content-area buttons reused toolbarActions directly below a sticky header with no intervening spacing. The sticky header could visually cover following rows while scrolling.

The shared WebsiteWorkspace now uses a dedicated sectionNavigation class. Its root is a normal-flow flex column with the existing 24px spacing token. Header positioning is static. Navigation wraps naturally, has no fixed height, and its full height contributes to layout. Removed the previous columns top margin to avoid doubling the new gap. Header actions and status can wrap independently. Button appearance, active-state handlers, preview links and publication form bindings are unchanged.

Chrome geometry checks at 1920, 1440, 1366, 1024, 768, 430 and 390px, each with 100/125/150% CSS zoom, showed positive gaps (24 CSS px), no overlap and no horizontal overflow. CSS zoom was a layout stress simulation, not the browser's native zoom setting. Desktop/mobile screenshots inspected; Public pages and Global navigation switching retained aria-pressed state. Temporary zoom/viewport overrides reset. No content was published during this presentation-only check.

Files: src/app/admin/website-workspace.tsx, src/app/admin/website-editor.module.css, this report and PHASE_STATUS.md.
