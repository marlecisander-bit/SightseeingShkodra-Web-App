# Global button system audit

Local implementation and browser verification: 2026-09-24.

## Existing primitives and findings

Public ActionLink and BookButton shared p-button presentation, but its space-between layout shifted labels when arrows were present. Admin SubmitButton handled pending state while raw buttons across forms had separate padding rules. CMS links, save actions and map recovery buttons used additional styles. No general Button component existed.

## Shared implementation

- src/components/ui/button.tsx: Button and ButtonContent preserve semantic buttons, native form attributes, event handlers, disabled and aria state. Optional trailing arrows sit outside label flow; leading semantic icons remain part of the centered label group. Sizes sm/md/lg and fullWidth are supported.
- src/app/button-system.css: central alignment, minimum heights (44/48/52px), padding, balanced 40px icon gutters, label wrapping, focus and disabled/busy presentation. Root layout imports the system.
- Public ActionLink and BookButton use ButtonContent. Booking dialog review links and hero tracking CTA use the same structure. Checkout and ticket actions use Button.
- Admin SubmitButton, workspace/account actions, product and supplier forms, schedule controls, booking filters, CMS publish/save/discard and error recovery use Button. Existing pending logic and submit names/values remain intact.
- CMS preview links share label/icon geometry; image replacement labels share responsive sizing while retaining native file-input behavior and focus-within styling.
- Map reload and local shared-map vehicle selection use Button.

Redundant public base flex/padding/alignment declarations were removed; admin/CMS padding now references shared tokens. Color variants, intended radii and hover treatments stay in their existing contextual styles; this task does not change brand colors.

Hero CTA groups stack at 430px and below. Mobile action groups wrap when needed. Standard controls have bounded widths, centered multiline labels and reserved arrow space. No fixed height clips long text.

## Intentional exceptions

CMS section navigation, public navigation/menu toggles, destination selectors, quantity steppers, close icons, Leaflet markers and independent-map bottom controls retain their specialized layouts and semantics. Ordinary text links are not restyled as CTA buttons. There are no local analytics/settings/stops-management pages or custom admin dialogs to invent. Media and SEO actions are within CMS; service data is within Departures.

The hosted map is an independent cross-origin app. Its existing centered control group was visually inspected through the public embed; no remote map files or tracking behavior were changed by this task.

## Browser checks

Widths: 1920, 1440, 1366, 1024, 768, 430, 390, 375 and 320px.

Loaded routes checked: homepage; /tour; /book; /your-day; /explore; /live; /credits; /admin; operator overview, catalog, departures, bookings, content and website-preview. No page horizontal overflow or clipped visible standard buttons was found. Homepage arrow labels and CMS action labels were measured within 1px of the button center, without icon overlap. Expanded product creation and booking modal passed all nine widths; manual booking was also checked expanded at 320px.

The development-only /dev/buttons-preview route exercises English, Albanian, Italian, German and French-length labels, semantic icon groups, trailing arrows, small/full-width controls, disabled and busy states. All nine widths passed centering, overlap and clipping measurements. Keyboard focus showed a visible outline. Mobile hero, desktop CMS, translated multiline buttons and live page were inspected visually.

Typecheck and ESLint passed. Isolated optimized build passed. Identity tests: 15 passed. Integration tests: 35 passed. Business actions were not submitted during visual checks. Existing hover color rules were retained; exhaustive hover/touch interaction testing was not performed.

## Limits

No published product currently permits completing the full checkout, and no populated order was available for payment-control testing. Dynamic published guide detail pages were source-audited, but unavailable content was not fabricated for browser QA. No production publication was performed. Authentication, permissions, booking capacity, schedule rules, database contracts and tracking logic were not intentionally changed.
