# Website and More ownership — 8 November 2026

Owner requested public webpage functionality under Website and settings under More. Local implementation only; no publication or hosted mutation.

| Function | Sole management area / entry |
| --- | --- |
| Public business profile, footer, contact/social links | Website → Business profile & footer; existing footer editor |
| Public WhatsApp number, default message and visibility | Website → WhatsApp contact; existing WhatsApp editor |
| Pages, navigation, search, privacy and terms | Website; existing document/editor/publication flow |
| Reviews, partners and destination content | Website; existing dedicated entity editors |
| Product details, fares and booking-card publication | Products; previously approved unified product ownership preserved |
| Booking meeting point | More → Booking settings links to existing Calendar operational setting |
| Device alerts and email delivery | More; existing protected notification/email screens |
| Workspace selection and sign out | More → Account |
| Independent operational Live Map | Calendar → existing external map controls |

Removed duplicate public-content shortcuts and public-site link from More. Removed its redundant Live Map shortcut; Calendar retains access. Website's broad Navigation & contact card is now focused Navigation plus explicit contact cards, all opening existing sections. Existing #admin-nav=business/whatsapp links remain compatible and now select Website navigation. No entities, data, forms, permissions or publication boundaries duplicated. Restricted staff retain existing capabilities; sensitive contact editors remain owner-only.

Verification: 185 component and 25 identity/navigation tests pass, including ownership, legacy context selection and restricted-role assertions. Lint, route type generation, TypeScript, production build and git diff --check pass. Evidence in evidence/website-more-20261108/. No fresh live account/browser or physical Safari acceptance claimed. Previous product-button/required-phone work remains local and preserved; independent map source/configuration unchanged.
