# WhatsApp bottom anchor — 4 November 2026

The contact was already fixed, but its collision handler added vertical clearance and moved it up over the product cards. The user requested a floating contact that stays at the bottom while scrolling, and explicitly authorized publication.

Changed `whatsapp-contact.module.css`, `whatsapp-contact.tsx` and the existing `whatsappDock` helper in `src/modules/content/whatsapp.ts`: retain the fixed bottom/right safe-area anchor, remove upward compensation, and briefly hide rather than reposition when booking controls overlap. Existing dialog/menu/keyboard hiding, footer clearance, CMS visibility/contact URL and focus styles remain unchanged. Updated the existing regression test in `tests/database/whatsapp-contact.test.mjs` to require a constant position or hidden state, including a non-overlapping obstacle.

Local Chrome checks:320×568,390×844,430×932,768×1024,1440×900; seven scroll positions each,35 measurements. Visible or temporarily hidden, the button's bottom offset remains16px on mobile and24px on larger screens (plus actual device safe area). No page overflow or visible overlap with booking actions; visible at document end; hidden with booking dialog open. Zero checkout requests and no WhatsApp messages sent. Temporary development review route archived as text and removed before final build. Physical devices remain unverified.

Fresh678 tests, lint, TypeScript and normal production build pass. Live publication verification and receipt: `docs/evidence/whatsapp-bottom-20261104/`.
