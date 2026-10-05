# WhatsApp contact and shared site icons

5 October 2026 — implemented and verified locally; not deployed.

## Ownership and integration

The audit found an existing operator-scoped `content_pages` website document, Global editor, draft/publish RPC and public layout reader. WhatsApp extends that source with six string fields: enabled, number, message, label, desktop and mobile. No new settings table, duplicate phone source, SDK, analytics, subscription or polling was added. The public layout reuses its existing published-content read. Saved draft previews use draft settings deliberately; ordinary Admin pages do not render the contact button.

Admin location: **Admin ? Website Content ? Global: contact, navigation & footer ? WhatsApp contact** (`/admin/[operatorId]/content`). Controls include enable/disable, international business number, optional message and label, desktop visibility and mobile visibility. Save Draft stays private; Publish applies this section and all previously saved website drafts through the existing publishing contract. Refresh public pages after publishing; open tabs do not receive background configuration updates.

Public component: `src/components/public/whatsapp-contact.tsx`; styles: `whatsapp-contact.module.css`; validation/link/placement helpers: `src/modules/content/whatsapp.ts`. The link uses only configured digits and URL-encoded message. Empty optional messages omit the query string. Invalid or absent phone numbers cannot be enabled and cannot produce a public link. Validation checks international number shape, not whether WhatsApp has registered that number. Existing documents default to disabled with an empty number. No actual business number was invented.

Migration `20261005000200_whatsapp_contact.sql` extends the existing validator, retaining the previous contract in a private helper. It does not rewrite content records or grant new write access. Existing operator-scoped `content.manage` authorization and Save Draft/Publish RPC remain authoritative (owner/admin/content_editor; operations excluded).

## Placement and accessibility

The fixed bottom-right WhatsApp link has an accessible name, keyboard focus indication, white actual WhatsApp glyph, green background and safe-area offsets. Mobile uses a 52×52px circle; desktop uses a labeled pill (56px measured height). It moves above intersecting Live Map frames and sticky booking controls with a 12px clearance. If there is insufficient room below the header, it hides until a safe position returns. It also hides during open dialogs, mobile navigation and focused mobile booking inputs. Placement uses coalesced scroll/resize and DOM observers, with cleanup, and no periodic polling. No booking or independent map engine was changed.

The standard link follows [WhatsApp click-to-chat documentation](https://faq.whatsapp.com/5913398998672934). The inline glyph comes from the [Simple Icons WhatsApp SVG](https://github.com/simple-icons/simple-icons/blob/develop/icons/whatsapp.svg); Simple Icons assets are CC0. No runtime third-party icon request occurs.

## Verification

PASS below means local implementation evidence, not hosted deployment or physical-device certification.

| Requested check | Result | Evidence |
|---|---|---|
| WHATSAPP ADMIN SETTINGS | PASS | Actual WebsiteWorkspace Global tab and six-field editor inspected in development fixture. |
| PUBLIC WHATSAPP BUTTON | PASS | Actual component renders a standard wa.me link; disabled/invalid settings remove it. |
| ADMIN ? PUBLIC SYNCHRONIZATION | PASS | Local database RPC tests cover draft isolation, publish, changed phone/message and disabling; public consumer uses published content. |
| PHONE VALIDATION | PASS | TypeScript and SQL validation parity tested, including empty and invalid enabled numbers. |
| PRE-FILLED MESSAGE | PASS | Unicode/encoding tests; browser `Hello & thanks!` produces `Hello%20%26%20thanks!`; optional empty message tested. |
| DESKTOP RESPONSIVENESS | PASS | 768, 1024, 1440 and 1920px viewport checks; desktop visibility toggle verified. |
| MOBILE RESPONSIVENESS | PASS | 320, 375, 390 and 430px viewport checks; 52px target, no document overflow, mobile visibility toggle verified. |
| LIVE MAP OVERLAP CHECK | PASS | Actual read-only iframe inspected; mobile DOM rectangles showed zero intersection and 12px clearance; desktop screenshot inspected; no-space geometry tested. |
| BOOKING UI OVERLAP CHECK | PASS | Actual booking dialog hides link; generic dialog/mobile menu checks passed; sticky-control geometry tested with synthetic rectangles. |
| ADMIN SECURITY / RLS | PASS | Existing mutation RPC denies anonymous/browser execution and unauthorized operations role; operator-scoped authorization retained. |

Full `npm test`: **317 passed, 0 failed, 0 skipped** (11 source ownership, 17 identity, 111 integrations, 154 database, 24 PostgreSQL). Six targeted WhatsApp tests also pass separately and are included in the full-chain total. Typecheck and lint pass. Production build passes from an isolated current-source copy. Logs are local under `private/whatsapp-icons-*.log`. Development-only `/dev/whatsapp-preview` uses a synthetic number and returns not-found outside development; no settings were saved through its UI.

Limitations: no real message was sent, no WhatsApp app handoff was performed, and physical iPhone/Android safe-area/keyboard behavior remains unverified. Hosted authenticated save/publish acceptance remains pending deployment. The number must belong to the intended business account. No production database writes, email changes, deployment or commit occurred.

## Shared icons

The exact user-supplied SVG is retained as `public/brand/site-icon-source.svg`. `scripts/generate-site-icons.mjs` preserves its artwork/colors and crops only surplus background to square viewBox `60 151 300 300`, with space for rounded/maskable icons. It generates SVG, 32/180/192/512px PNG, 180px Apple touch icon and ICO with 16/32/48px entries. Existing admin icon URLs also carry the same artwork.

Root metadata supplies the same favicon and Apple touch icon to public and Admin pages. Public and Admin manifests both reference the shared 192/512px icons; the Admin manifest retains its separate start URL/scope. Admin push notifications use the same shared icon. Public `/` and `/admin` HTTP responses were checked for matching icon links; all icon/manifest endpoints returned 200. PNG dimensions were verified and the generated artwork visually inspected. The retained original matches the supplied file byte-for-byte.

Existing phone shortcuts may keep a cached icon until removed and added again after deployment. Physical Home Screen installation is not certified by the local metadata and image checks.

## Release steps

Apply existing migrations in order, including `20261005000200_whatsapp_contact.sql`, before deploying the new editor and publishing WhatsApp fields. Deploy the verified code/assets, then enter the real business number, save/preview and publish. Verify on the hosted site and a physical phone. WhatsApp is intentionally disabled by default until configured.

