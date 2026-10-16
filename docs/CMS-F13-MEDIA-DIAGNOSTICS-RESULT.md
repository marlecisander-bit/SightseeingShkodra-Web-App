# F13 read-only media diagnostics result

16 October 2026. **GO for local diagnostic review; no deletion or complete orphan inventory claim.**

New command: `npm run report:media -- /absolute/path/to/local-snapshot.json`. Input is supplied local JSON, optionally `{ "documents": { ... }, "objects": ["/images/example.webp"] }`. Include drafts, publications, retained/historical documents and all other relevant consumers in an approved local snapshot; an incomplete snapshot cannot prove an asset is unused. No hosted export, storage listing or production credential is required or performed by this tool.

scripts/report-media-usage.mjs refuses production/Preview environments, service bindings and remote URL inputs before processing. It rejects nonregular files and snapshots larger than 10 MiB, emits JSON to stdout, and never calls storage, HTTP or a database. scripts/cms-verification/media.mjs walks nested objects/arrays and historical JSON strings, records escaped reference paths, normalizes supported public website-media URLs/local /images paths, and removes URL query/fragment data. Listed unreferenced objects are labeled “Not referenced in supplied snapshot; retain pending complete review.” deletionAllowed is always false. Arbitrary remote image hosts/private bucket URLs and source-code references are outside this bounded inventory unless represented appropriately in supplied data; no binary size/duplicate detection is claimed.

Tests exercise draft/published/historical references, query stripping, retained unused objects, local CLI output, remote-input refusal and production refusal. No files are deleted by the command. Files: package.json; scripts/report-media-usage.mjs; scripts/cms-verification/media.mjs; tests/components/cms-completion.test.mjs.

Keep approved source images and use existing uploader guidance for replacements; do not delete a replaced upload merely because a current editor stopped showing it. Before any future cleanup, review all CMS entities, old publications/email commitments, code/static references and external consumers. Cleanup policy and cloud access require a separate decision. This diagnostic intentionally cannot authorize deletion.

Rollback is removing this local command/helper/test delta. Production data/configuration never changed.
