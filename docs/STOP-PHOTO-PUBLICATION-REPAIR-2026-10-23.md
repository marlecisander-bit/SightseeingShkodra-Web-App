# Stop photo publication repair — 23 October 2026

The owner reported an uploaded stop photo missing publicly. Reproduced with the authenticated production admin: Stop 1 Start/Stop was a saved draft with its image present, but empty image description, short description, search title and search description. Publish returned an unclear validation error while three required fields remained collapsed. No image caching or stop association failure was observed.

Used the existing canonical destination editor to fill only those four required fields with factual Start/Stop text and publish record 12a842b6-1f2c-4e5a-b80c-08f29a6121e9. Preserved the owner's image, name, slug, map association and visibility. Admin confirmed Published. A fresh public /route loaded the optimized uploaded image successfully (naturalWidth > 0) with the new description. This was a hosted CMS publication through existing authenticated permissions; no schema, booking, GPS or external-map changes.

Local editor repair: show all required publication fields outside optional details; show exact missing-field labels; validate before calling the server while allowing incomplete private drafts. Reuses existing server validation and save/upload actions. Five focused component tests pass, including interactive incomplete-draft Publish suppression and Save Draft persistence; lint and typecheck pass in the clean release worktree. Editor code is prepared locally and has not been pushed or deployed by this repair task.

Working source retained in both the original workspace and /private/tmp/shkodra-journey-release-20261023. Existing unrelated dirty files preserved.
