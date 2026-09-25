# Homepage simplification - 24 September 2026

## Scope and reuse audit
Removed only the homepage booking/availability form, the dashed route information box, and the complete Four reasons to linger showcase. No replacement sections or database changes were introduced.

- `homepage-view.tsx`: removed BookingBar invocation/import and wrapper, destination showcase and excerpt helper; disabled RoutePreview note on this page only. Hero/final booking CTAs link to `/book`; Track live remains `/live`; Discover your day targets the retained route section.
- `route-preview.tsx`: optional `showNote` defaults true. `/tour` and `/live` preserve their existing shared preview and note.
- `public.css`: removed unused story grid/card/offset rules after searching all usages. Existing route, booking and map styles stay.
- `website-schema.ts`: stored schema and historical fields remain intact. Separate editable homepage and shared-destination definitions hide obsolete showcase headings. Retired saved homepage links resolve to `/book` or `/explore` without modifying records.
- `website-workspace.tsx`, `website-editor.tsx`, `website-actions.ts`: homepage editor no longer offers Four reasons to linger. A separate Destination content area retains its 28 shared fields; obsolete heading fields are not editable. Booking selector and dashed note had no CMS controls. Route headings and actual live-map section controls remain because those sections remain visible.
- `booking.tsx`, `ui.tsx`: normalize historical navigation/footer anchors. Booking engine and controls are unchanged.

## Preserved
BookingBar on `/tour`, checkout `/book`, booking session/holds/availability/confirmation/QR, admin booking and service schedule management; RoutePreview on `/tour` and `/live`; live-map embed and independent tracking app; all destination records, guide routes, images, SEO, CMS schema and published/draft database data. The existing local notebook remains and uses shared destination images/links. No API, hooks, storage objects or records were deleted. Destination guide bodies continue in their existing content system.

## Verification
- Database suite 97 passed; integration suite 39 passed, covering booking creation, capacity, cancellation, QR persistence/recovery/rendering and tracking contracts.
- Lint, typecheck and isolated production build passed.
- Browser homepage: no booking form, no dashed note, no showcase; two direct booking CTAs and five tracking links. Remaining section headings and route interaction present.
- Layout measurements at 1920, 1440, 1366, 1024, 768, 430, 390 and 375px: no horizontal overflow or empty sections. Desktop/mobile screenshots inspected; route section ends exactly where live section starts, with no removed-section gap.
- Booking CTA reaches `/book`; selecting 25 September displays 09:00/11:00/13:00/15:00 with 8/8/8/5 seats. No live reservation was created for this presentation-only task; automated booking and QR regressions passed.
- `/live` loads its hosted map, stop controls and route preview. The feed reports temporarily unavailable/stale location and ETA unavailable; fresh GPS/ETA cannot be certified by this check. Tracking code/configuration was not changed.
- `/explore` returns 200 and retains centre/castle/lake/bridge content anchors; `/tour` returns 200. Individual guide routes return 404 while their full guide content is unpublished, as required by their unchanged publication guard. No destination was removed or unpublished.
- Admin homepage editor shows the 12 remaining section groups; Destination content retains 28 shared fields and zero obsolete showcase-heading inputs. No admin or media records were mutated; operational editor code remains unchanged.
