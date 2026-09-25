# Unified photographic public footer

2026-09-25. Reused the global Footer component in the public layout and saved-draft preview. It now owns both the existing final.* CTA fields and footer.* fields. Removed the homepage-only CTA, obsolete p-final rules, beige footer background and divider. One existing Media image spans the whole section with full-width responsive sizes and a progressive fade, stronger behind footer links. Existing CMS sources, link URLs, logo, booking action and shared reservation note are preserved. No database changes or publication were performed.

Desktop uses brand and two navigation columns; mobile stacks brand above a two-column link grid, switching to one column below 360px. Heights follow content with CTA minimum heights and responsive padding. White text, muted secondary text, yellow link hover/focus treatment reuse the existing visual system.

Verification: Chrome geometry checks at 1920x1080, 1440x900, 1366x768, 1024x768, 768x1024, 430x932, 393x852 and 390x844 found one footer, one background image, no horizontal overflow and unchanged link destinations. Desktop and mobile screenshots inspected. Homepage, Tour, Explore, Live, Book, Your Day and Credits returned 200 with exactly one unified footer and no old CTA. Other public detail routes inherit the same layout; no new destination was published for testing. CMS connection verified by shared field consumption and existing published content, without changing owner content. Lint and TypeScript passed. No formal contrast certification or CLS measurement claimed.

Changed: src/components/public/ui.tsx, src/components/public/homepage-view.tsx, src/app/(public)/public.css and this/status documentation.
