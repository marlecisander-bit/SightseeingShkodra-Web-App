# Compact product actions and required booking phone — 8 November 2026

Local implementation only; no commit, push, deployment, hosted configuration or migration.

Product cards keep Manage, Move up and Move down in one compact row. Form/fieldset spacing is removed within this row; 44px touch targets remain. Synthetic Chromium checks using the actual admin/product styles at 320, 390, 768 and 1440px show aligned actions and no horizontal overflow. Physical Safari was not tested.

Public checkout requires a phone number with + and international country prefix in both the form and API. Spaces, parentheses and hyphens normalize to the existing stored contact field. Missing/local/malformed numbers are rejected before order creation. Copy suggests the customer's WhatsApp number when available. Admin booking details offer Open WhatsApp for valid international numbers; opening it sends no message and does not verify WhatsApp membership. Historical contacts and staff booking rules remain compatible; no schema change.

Validation: all 724 tests pass (185 component, 24 identity, 259 integration, 221 database, 28 PostgreSQL, 7 CMS verification). Lint, generated route types, TypeScript, production build and git diff --check pass. Tests cover required form entry, actual API rejection/normalization and WhatsApp links/legacy contacts. Evidence: evidence/product-actions-phone-20261108/. Full-suite results describe the shared local tree, including pre-existing work; they are not an isolated publication candidate. Independent Live Map unchanged.
