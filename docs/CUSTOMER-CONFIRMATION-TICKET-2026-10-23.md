# Compact customer confirmation ticket — 23 October 2026

Local implementation only, ready for owner review. Work is isolated at `/private/tmp/shkodra-ticket-email-20261023`, cloned locally from the just-published release candidate (same application code as production main 7c7f15c). No remote Git operations, commits, push, merge, deployment, production data/configuration change or live email send occurred. The original IDE worktree is preserved.

## Result

Only newly prepared customer BOOKING_CREATED confirmations select the compact design. Header, green confirmation mark, requested title/subtitle, date/time, saved meeting-point name/directions, passenger count/breakdown, centered QR/reference, arrival sentence, red View My Booking button, support and essential conditions follow the requested order. The map and QR-fallback links are small text links, with one primary button. Long ticket descriptions/inclusions, repeated status/customer/seat/price rows and competing modify/live-map buttons are removed from this confirmation only.

The owner explicitly approved “Please arrive 10 minutes before departure” in this conversation. This is an arrival instruction, distinct from the unchanged 15-minute cutoff for online changes/cancellation. Existing code had no prior 10-minute arrival rule. Saved meeting-point directions contain the configured address/instructions; no separate address is invented. Old snapshots without an address retain their historical data. No contact name, QR or management token is read from production for previews.

## Before / after

| Content | Existing v2 confirmation | Compact confirmation |
|---|---|---|
| Opening | Confirmation plus boarding/seat-rule paragraph | Booking Confirmed! / Your Shkodra adventure is ready. |
| Details | Reference, customer, status, service, descriptions/inclusions, passenger categories/seats, total/payment and meeting details | Date, time with recorded timezone, saved meeting point/address, passenger total and adult/child/infant breakdown |
| Ticket | Inline QR after the long details table | 224px square QR on white, readable reference directly beneath, digital-ticket fallback |
| Actions | View, Modify and Live Map buttons | One red View My Booking button; map/fallback remain text links |
| Conditions | Long receipt-style presentation | Short payment-due/change-cutoff footer, support, business name and existing Terms link |

On the same base synthetic fixture, HTML falls from 6,977 to 4,311 bytes (38% reduction), and plain text from 129 to 93 words (28% reduction). QR attachment size/generation is unchanged; preview HTML embeds its PNG solely for local browser display.

## Retry and QR compatibility

The envelope stays at database snapshot version 2. An optional `customerConfirmationDesign: 3` field selects the new presentation only for new customer-created messages. The existing prepare RPC saves arbitrary envelope JSON only when creating the immutable snapshot. Already prepared v1/v2 messages keep their stored envelopes and original bodies. No migration is necessary. The worker adds only this presentation selector; retries, idempotency keys, provider delivery/reconciliation, enqueue/claim/finish and activation are unchanged.

Both the original PNG and the QR as actually rendered at 224×224px in the browser screenshot were decoded to the unchanged synthetic credential. Real delivery retains `cid:booking-qr` and the existing PNG attachment pipeline. The existing secure `/booking/manage#token=...` URL provides both primary action and fallback digital ticket. Missing/malformed credentials are never invented; the reference/support fallback remains available.

All owner, modification and cancellation templates, old v1/v2 rendering and QR validation/generation remain unchanged. The existing synthetic admin preview now shows the compact customer confirmation, with a local SVG preview of the same synthetic QR payload; other previews are unchanged. Actual delivery uses PNG, not SVG. Existing English-only localization remains English; date formatting uses the recorded calendar date without browser-timezone shifting, and time includes its snapshot timezone.

## Files changed in the isolated checkout

- `src/modules/integrations/customer-confirmation-ticket.ts` — new frozen compact rendering.
- `src/modules/integrations/booking-email-template.ts` — optional presentation marker and narrow dispatch.
- `src/modules/integrations/booking-email-worker.ts` — supplies marker for new customer-created snapshots only.
- `src/modules/integrations/booking-email-preview.ts` — corresponding synthetic preview only.
- `scripts/preview-customer-ticket.mjs` — local HTML/text/PNG preview generator, no database/provider/network imports.
- `tests/fixtures/customer-ticket.ts` — reserved-domain synthetic data.
- `tests/integrations/customer-ticket.test.mjs` — focused content, credentials, escaping, QR, locale and compatibility checks.
- `tests/integrations/booking-emails.test.mjs` — retain lifecycle assertions with concise copy; verify saved v2 retries remain frozen.
- This report and `docs/PHASE_STATUS.md` — evidence only.

## Previews and validation

Generated artifacts: `private/customer-ticket-preview/{before,family,single}.html` and matching text, plus family/single PNG attachments. Responsive family HTML supplies both mobile and desktop layouts. Screenshots: `/private/tmp/shkodra-ticket-mobile.png`, `/private/tmp/shkodra-ticket-desktop.png`.

Synthetic browser checks at 320/393/800px found no horizontal overflow. QR loaded and remained exactly 224px square. Native Gmail, Apple Mail and Outlook rendering was not exercised: browser previews are not proof of email-client rendering. Production markup uses presentation tables, inline styles, white QR background, safe wrapping and an Outlook fixed-width conditional wrapper. Remote-image blocking and CID handling depend on the recipient client; textual reference, secure link and plain-text alternatives remain. No promise of inbox placement or new delivery test is made.

Final validation: recorded below after the complete local checks. Release requires separately authorized publication and a native client check where available; no production send is needed to review these local artifacts. Booking/payment status, passenger/pricing data, trigger/rule paths, QR validation and delivery infrastructure are preserved.

### Final checks

Clean locked dependency install succeeded. ESLint, TypeScript and production build passed. All 496 tests passed (91 component, 23 identity, 167 integration, 182 database, 26 PostgreSQL concurrency, 7 CMS verification). Eight focused new ticket tests plus the frozen-v2 worker retry test pass. git diff --check passes. Preview generation runs successfully without database/provider imports. Local source is ready for owner review; it has not been committed, pushed or deployed.
