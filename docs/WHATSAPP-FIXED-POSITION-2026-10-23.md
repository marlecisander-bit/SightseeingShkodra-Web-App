# WhatsApp floating position — local result, 23 October 2026

Implemented locally. No push, merge, deployment, backend/schema, booking-rule, tracking or CMS configuration change.

## Changes

- The existing single WhatsAppContact in the shared public layout now renders through a React portal directly under `document.body`, outside page overflow/transform containers. Its CSS remains `position: fixed` with z-index 20, below the existing header/menu layers and native modal dialogs.
- Desktop bottom/right spacing is 24px plus device safe-area insets; mobile spacing is 16px plus safe-area insets. The existing 52px mobile icon-only presentation, desktop saved label, green background, SVG, phone/message URL, target and enabled/device settings are preserved.
- Removed active use of the old broad collision algorithm, which moved the button using inline top coordinates and hid it around maps, content cards and the footer. Normal page sections no longer move or hide it.
- The existing measurement/listener lifecycle now only adds bottom clearance for an overlapping visible sticky/fixed booking action. The mobile fixture measured a 12px gap above the sticky booking bar, with the button still visible. No booking or map code changed.
- Conditional footer bottom padding reserves the floating corner when the button is enabled for the current device. This prevents the observed mobile Staff Login overlap while keeping the button at its normal bottom offset.
- Existing hiding during open dialogs/mobile menus and focused mobile booking fields remains intact. Closing menus/dialogs restores it. These are interaction exceptions, not scroll-triggered disappearance.

Application files changed: `src/components/public/whatsapp-contact.tsx` and `src/components/public/whatsapp-contact.module.css`. Documentation: this report, PHASE_STATUS and review images/measurements under `docs/review/whatsapp-position-2026-10-23/`. No new WhatsApp instance, dependency or polling timer added. The historical whatsappDock helper remains unchanged for compatibility; the floating component no longer uses it.

## Checks and evidence

- ESLint, TypeScript and optimized production build passed.
- All 60 component tests passed. All eight existing WhatsApp tests passed, including number/message URL construction, draft/publication, disabled settings and permissions. Their historical dock-helper test is compatibility coverage, not verification of the new active placement.
- Chrome local fixture at 320, 375, 390, 430px measured exactly 16px bottom/right; at 768, 1024, 1440px measured exactly 24px. Measurements use layout viewport client dimensions, excluding the desktop scrollbar. Safe-area values were zero in desktop emulation; physical notched-device behavior relies on the CSS env insets and was not physically tested.
- Every width had exactly one fixed, visible WhatsApp anchor. Desktop label visible; mobile label hidden. No footer link intersected the anchor at the bottom of the page after the clearance correction.
- Long-page scroll samples at scrollY 0, 630 and 1260 retained exactly 24px bottom/right and visible state. Footer checks passed on desktop/mobile; button stayed mounted directly under BODY.
- Mobile sticky booking fixture: bar top 768px, button bottom 756px, 12px separation; no hiding. Ordinary map content does not trigger relocation.
- Open test dialog and mobile navigation hide the button; closing restores it. The shared public layout continues to own the single instance across all public routes, with existing device/enable settings respected.
- Existing `wa.me` href, encoded message, `_blank` and rel attributes verified. Tests use the existing synthetic-number local fixture. A real WhatsApp conversation/app handoff was not opened, and no message was sent; actual external-app launch is not certified by these local checks.
- `git diff --check` passed.

Desktop footer, mobile footer, mobile booking-clearance screenshots and responsive/scroll JSON evidence are retained beside this report. This is a local review result, not a production release or a physical Safari test.
