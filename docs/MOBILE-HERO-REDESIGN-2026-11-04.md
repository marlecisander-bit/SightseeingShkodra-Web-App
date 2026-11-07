# Mobile homepage hero — local implementation, 4 November 2026

Branch: `work/mobile-hero-20261104`. Based on current published source plus the prior uncommitted homepage journey fix, which is preserved. No commit, push, deployment, CMS edit, dependency change or booking-domain change.

Reference: https://chatgpt.com/s/m_6aeb3d1785d4819180ae67f03eaedf6d . The reference informs composition; its invented scenery was not used. Actual published CMS hero/product photographs and product data are retained.

## Scope and result

The existing hero phone/image boundary is `max-width:599px` (tablet starts at600px). This boundary is intentionally used rather than the broader card-carousel or navigation breakpoints. New hero and compact-card presentation rules are confined below600px. Desktop/tablet keep their existing sizes, layout, imagery, blur, features and actions. The existing68px phone header, logo, language control and44px menu target remain unchanged.

On phones, the location eyebrow is hidden with no layout space. “Discover” and the yellow destination share a line where they fit, followed by the white emphasis on its own line. Responsive28–36px typography wraps naturally, including enlarged or translated text, without changing CMS strings. Supporting copy stays below with balanced spacing. The context gap uses stable viewport height and a bounded minimum; short screens scroll naturally with no hero viewport lock or clipping.

The saved mobile photograph is used at all phone orientations, falling back to the desktop photograph if missing. The phone photograph has its own bounded-height crop, with zero blur and a restrained overlay. The default centered CMS focus is presented at75% vertically on phones to reveal the van/city instead of empty sky; other explicit saved focal positions are honored. CMS image/focal settings themselves are not modified. The van remains visible between text and cards; beneath the photo the hero blends into its dark background.

The existing native carousel now uses88% phone columns and a shorter landscape product-photo crop. The compact body retains the actual CMS title, two-line description, first three configured benefit chips, price and yellow booking button. A phone-only native “View details” disclosure contains the full description, seat-reservation label and every configured benefit. There was no existing product-details dialog to reuse; native disclosures already used elsewhere in the public UI provide keyboard/touch behavior without another engine or dependency. The price/disclosure row has `display:contents` above the phone breakpoint, leaving desktop/tablet layout unchanged. Card heights/actions remain aligned, and opening details lets content grow naturally.

Booking links still use the existing product-selected popup and direct URLs. No availability, passenger, pricing, payment or checkout logic changed. WhatsApp reuses the existing `whatsappDock` helper only on the phone homepage hero, adding pagination/details targets to its obstacles and remeasuring horizontal carousel scroll. It clears safe areas, header and booking/control targets, and hides only if no free slot fits. The existing dialog/menu suppression is preserved. Other viewport/page docking behavior remains unchanged.

## Verification

- Fresh final full suite:675 tests passed, zero failures/skips (including the prior journey repair regressions).
- Final zero-warning lint, generated TypeScript types, `tsc --noEmit`, normal Turbopack production build and `git diff --check` pass.
- New component regressions cover phone CMS-image fallback and preservation of full product information, price and booking URL in compact cards.
- Real-CMS Chromium checks:320×640,360×740,390×844,430×932; short390×480; landscape568×320. No document overflow; two-line default headline; no eyebrow space; no background blur; card/action alignment. Complete first-card booking-button bottoms are559,600,676 and697px respectively, inside those normal phone viewports. Short/landscape content is vertically scrollable.
- Native touch swipe and accessible pagination select the expected card; four future layout offers get four pagination controls and reach the last card without page overflow. No autoplay.
- Native keyboard Enter expands/collapses View details; three compact chips remain visible and all eight saved daily-ticket benefits remain available in details. Expanded cards grow without clipping.
- Loop card opens the shared popup with the correct selected product on the same page. Escape restores focus and page scrolling; WhatsApp hides while the modal is open. No checkout request was made.
- WhatsApp collision checks at four page scroll positions find no overlap with price, booking, details or pagination targets. Existing safe-area CSS remains active.
- Simulated150% text enlargement preserves natural scrolling, no horizontal document overflow and a reachable booking action.
- Before/after600×900,768×1024,1024×768,1440×900 geometry is identical. Screenshots at768/1024/1440 are pixel-identical. At600px only36 image pixels differ by one color-channel level (maximum delta1/255); no geometric or visible design regression. Image-load-aware captures wait for actual CMS photographs before comparison.

Evidence: `docs/evidence/mobile-hero-20261104/`. Principal images: `after-home-320x640.png`, `after-home-390x844.png`, `after-home-430x932.png`, `after-details-expanded.png`, `after-booking-popup.png`, `after-enlarged-text.png`. `interactions.json`, `after-layouts.json`, `desktop-tablet-comparison.json`, and final logs record the checks. The local read-only review route was removed before the final build; source is archived under `review-harness/page.tsx.txt`. Extra offers are explicitly local layout variants, not CMS edits. Initial browser harness corrections supplied native Enter text events and allowed the first2px scroll-snap offset; these were test-harness assumptions, not disabled validations.

## Limits

No implementation blocker remains in the checked local scope. Physical iOS/Android devices, real browser-toolbar/safe-area changes, native text-size settings, Safari and Firefox were unavailable. Tests use Chromium emulation and a CSS text-enlargement scenario. No real hold, reservation, payment, WhatsApp message or communication was submitted. Production is unchanged.


Publication update — 4 November 2026: the owner subsequently authorized publication of all completed homepage changes. This supersedes the local-only limit above. Fresh combined676-test/lint/type/build/audit validation passed; exact-head PR/main CI and live acceptance are pending. Release evidence: `docs/evidence/combined-publication-20261104/`.


Publication verified — 4 November 2026: released with the other completed homepage changes via PR #53, main `602f9432d9974b90d48121bfc5d29ca59270148a`, Vercel `Bgre5qYueujJRN5RAnKqM24yPvbV`. Fresh676 tests, lint/types/build/audit and exact-head PR/main CI pass. Live .app/www acceptance passes10 viewports and8 booking cycles per domain, real journey acquisition/navigation/expiry/online recovery, mobile swipe/details/WhatsApp and zero booking geometry delta, with zero checkout requests. No rollback needed. Local receipt/screenshots: `docs/evidence/combined-publication-20261104/`. No documentation-only redeployment. Hardware/browser verification limits above remain.
