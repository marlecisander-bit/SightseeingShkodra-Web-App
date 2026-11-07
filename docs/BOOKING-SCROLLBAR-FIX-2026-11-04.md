# Booking dialog background stability — local fix

Implemented locally on `work/booking-scrollbar-20261104`. Existing uncommitted journey/mobile-hero work remains present. No commit, push or deployment.

## Cause and minimal fix

`BookingProvider` makes the body fixed at the negative saved scroll offset. This removes the tall page from normal flow, so the root scrollbar disappears. Without a reserved gutter, the fixed body and fixed header acquire the newly available width. Chrome reproduced the supplied1695→1710px expansion, including the hero image's transformed width1715.34→1730.52px. Closing reversed it.

Only two application files changed:

- `src/app/globals.css`: reserve the root scrollbar gutter with `html { scrollbar-gutter:stable; }`.
- `src/components/public/booking.tsx`: capture the body's existing border-box width immediately before locking, then use that measured pixel width instead of `100%`. The measured width already accounts for the root gutter; no padding, margin or second subtraction is applied. Existing scroll-offset capture and restoration of the prior inline position/top/width are retained.

There is no hard-coded scrollbar width or compensation constant. The hero's crop, scale, image settings and styles are untouched by this fix. Dialog, focus, history and visual-viewport logic remain unchanged.

A root-gutter-only browser probe confirmed that Chrome sizes the fixed body/header correctly with the reserved gutter. The measured width also preserves a pre-existing custom body width, rather than overwriting it with a percentage. Chrome's root `clientWidth` can still report1710px while no scrollbar track is painted, even though the reserved-gutter root box, body and fixed header remain1695px. Rendered geometry—not that counter alone—is the meaningful layout test here.

## Chrome verification

Real published CMS photographs/products were rendered in a temporary local read-only review page, removed before the final build. The Chrome runner and exact archived route are in `docs/evidence/booking-gutter-20261104/`.

- Sixteen cycles: both product actions repeatedly, with Escape, close button and browser Back.
- Desktop1710×1000 with native visible15px scrollbar;1440×900 with a test-only24px scrollbar to demonstrate dynamic sizing; overlay-scrollbar mobile390×844; short mobile390×480.
- Before/during/after screenshots, steady geometry and continuous animation-frame measurements across opening and closing. Hero, transformed background image, content and fixed header retain identical position and size. The frame count and maximum measured delta are recorded in `browser-summary.json`.
- Native wheel input cannot move the background. On short mobile, the dialog content scrolls internally. Footer/dialog visual-viewport behavior is preserved.
- Saved page scroll offsets120px and240px restore exactly. During fixed-body locking, raw `window.scrollY` becomes0; `body.top` retains the negative saved offset and background bounding rectangles stay unchanged. The harness compares rendered geometry and restored offsets rather than treating raw locked scrollY as page movement.
- Focus trap and opener restoration pass. Both product dialogs retain the expected selected product. Existing nonempty inline styles—including a custom `calc(100% - 2px)` width—restore exactly. A component regression also verifies arbitrary measured widths, mobile width and unrelated inline padding/overflow preservation.
- No checkout requests, reservations or payments were made.

Final checks:676 tests passed; zero-warning lint, TypeScript, normal Turbopack production build and `git diff --check` pass. The full suite includes the prior local mobile/journey changes.

## Evidence and limits

Principal files: `baseline-measurements.json`, `probe-measurements.json`, `after-measurements.json`, `browser-summary.json`, `after-desktop-0-before.png`, `after-desktop-0-during.png`, `after-desktop-0-after.png`, plus corresponding mobile screenshots. Root `clientWidth`, body width/top, raw scrollY and all geometry are retained in the measurements.

Physical devices, actual iOS/Android on-screen keyboards, Safari and Firefox were unavailable. Chrome mobile/short-viewport testing verifies the existing viewport sizing and independent dialog scrolling, not physical keyboard behavior. No new keyboard or focus implementation was introduced. Production remains unchanged.


Publication update — 4 November 2026: the owner subsequently authorized publication of all completed homepage changes. This supersedes the local-only limit above. Fresh combined676-test/lint/type/build/audit validation passed; exact-head PR/main CI and live acceptance are pending. Release evidence: `docs/evidence/combined-publication-20261104/`.


Publication verified — 4 November 2026: released with the other completed homepage changes via PR #53, main `602f9432d9974b90d48121bfc5d29ca59270148a`, Vercel `Bgre5qYueujJRN5RAnKqM24yPvbV`. Fresh676 tests, lint/types/build/audit and exact-head PR/main CI pass. Live .app/www acceptance passes10 viewports and8 booking cycles per domain, real journey acquisition/navigation/expiry/online recovery, mobile swipe/details/WhatsApp and zero booking geometry delta, with zero checkout requests. No rollback needed. Local receipt/screenshots: `docs/evidence/combined-publication-20261104/`. No documentation-only redeployment. Hardware/browser verification limits above remain.
