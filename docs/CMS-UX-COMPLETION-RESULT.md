# CMS UX completion package result

16 October 2026. Local implementation; **GO for review of F03/F07/F08/F11/F14, not deployment.**

| Finding | Change | Evidence / limitation |
|---|---|---|
| F03 | Live effective-navigation preview and duplicate/retired-link warnings identify the actual label to edit. Shared normalization feeds diagnostics and public navigation. | Default suppression, unique destination and unchanged projection tests; browser editing updates feedback and Discard restores saved content. First-link-wins behavior is retained, not redesigned. |
| F07 | Hero editor explains the >=1600px vertical center-to-bottom transform and limits of its image preview. | All nine stored desktop positions characterized; wide CSS rule unchanged. No faithful crop or physical-device guarantee. |
| F08 | An authoritative available adult zero quote displays From €0 with existing wording. Missing, negative or corrupt amounts keep the availability fallback. | User explicitly chose €0. Real disposable SQL quote agrees with teaser and stays on its quoted date; child-only/sold-out guards remain. No pricing algorithm changed. |
| F11 | Website actions say Save draft / Publish website changes; Reviews and Partners say Save & update website and retain immediate-publication guidance. | Operation values, draft boundaries, existing affected-section summary and permissions unchanged. Browser editor/operations publish disabled; owner/admin enabled. |
| F14 | Visibility helper names actual Homepage, Route and Your day consumers and explains map/booking/Explore exceptions. | Current consumer source inspection, scope assertions and existing visibility regressions. No switch logic or saved keys changed. |

Files: src/modules/content/navigation.ts, website-schema.ts and hero-fare.ts; src/app/admin/navigation-preview.tsx, website-editor.tsx, website-workspace.tsx, partners-editor.tsx and reviews-editor.tsx; src/components/public/booking-controls.tsx and booking-presentation.ts. Coverage: tests/components/cms-completion.test.mjs, admin-simplification.test.mjs, tests/database/hero-fare.test.mjs, tests/integrations/booking-presentation.test.mjs and synthetic browser fixtures. No CSS, migration or public page composition change.

Chrome local fixtures checked navigation/hero editors at 320/375/390/430/768/1024/1440px and public zero-fare hero additionally at 1600px. No sampled field or page overflow. Five amenities shared one row. Final public fixture includes the real public-site wrapper and CSS; earlier screenshots without them were superseded. From €0, date, passengers and booking entry render; the entry opens the existing preview-only dialog, and clearing the date disables submission. No reservation was submitted. Browser forms in admin were not saved. These are synthetic component checks, not authenticated admin-shell or provider checkout acceptance.

Ignored screenshots/measurements: private/cms-completion-evidence/. Desktop/mobile screenshots were visually inspected. General final regression/audit results are in CMS-FINAL-ACCEPTANCE-REPORT.md. Rollback is the scoped code revert, without data or configuration rollback. Release remains separately authorized; existing first-link suppression and wide focal transformation are disclosed behavior, not newly fixed algorithms.
