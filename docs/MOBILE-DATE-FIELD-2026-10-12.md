# Mobile date field containment — 12 October 2026

User requested centered, responsive date rows inside the homepage ticket box and booking dialog, preserving comfortable screen margins. Both use BookingDateSelector; only its shared CSS module changed.

The label now uses a minmax(0,1fr) grid track. The native date input has explicit block layout, zero minimum inline size, maximum inline size100%, and appearance:none to constrain native iOS sizing. At widths<=900px, date text and WebKit native date-value/edit pseudo-elements center within the field with 10px inline padding. Existing16px text prevents iOS focus zoom,48px minimum height and native date input/picker semantics remain intact. Existing card/dialog gutters remain unchanged; no clipping workaround or booking logic change.

Isolated candidate based on production main9af85cd passes lint, TypeScript and production build. Chrome local fixture used actual HeroBookingWidget and BookingProvider/CheckoutFlow with synthetic fare/date and no cloud credentials. Both controls at320/360/375/390/414/430/768/900/1024px remained fully contained, center error0px relative to their label, and no horizontal overflow. Mobile text center; desktop retains original start alignment. Empty and populated dates and native editing verified. Temporary fixture removed. Physical iPhone/iOS Safari rendering is not verified. No booking submission, cloud/config/CMS change, commit/push or publication for this request.

Evidence: /private/tmp/mobile-date-check.log, /private/tmp/mobile-date-ticket.jpg, /private/tmp/mobile-date-dialog.jpg. Screenshots show synthetic local content; isolated availability is intentionally unavailable.
