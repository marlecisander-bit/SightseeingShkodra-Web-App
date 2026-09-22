# Sightseeing Shkodra logo sources

Recorded on 2026-09-22 at the user's request as the supplied Sightseeing Shkodra logo versions. These supplied assets are the reference for future logo integration.

## Original supplied artwork

- [Logo versions - original SVG](source/sightseeing-shkodra-logo-versions-original.svg)
- Original filename: `SIGHTSEEING SHKODRA LOGO 2 VERSIONET 2 (2).svg`
- Received from the user's Downloads folder; one SVG file was supplied in this request.
- Format: Adobe Illustrator SVG export, viewBox `0 0 420.1 595.3`.
- Size: 286,930 bytes.
- SHA-256: `D1AAC40587246B79EE4B98B81E234E694C1EE6A31D9F6CE54A4EFDCD34C4D20D`.

The retained source is byte-for-byte identical to the supplied file. Preserve this original and derive any future optimized or individually cropped logo variants as separate files, documenting their relationship here.

## Local app integration - 2026-09-22

The user requested updating the logo and clarified that publishing means the local server only. Header and footer now use the supplied artwork through `BrandLogo` with accessible alternative text. The white-letter variant appears over the homepage photograph; the red-letter variant appears in the footer, solid header and open mobile menu.

- `public/brand/logo-light.svg`: upper source artwork, cropped to viewBox `45 100 345 103`.
- `public/brand/logo-color.svg`: lower source artwork, cropped to viewBox `45 403 345 103`.

Both derivatives preserve the original vector paths and colors, remove the red presentation background, and omit Illustrator private metadata, foreignObject, document entities and editor namespaces. The archival source remains unchanged. Local preview: http://127.0.0.1:3000. No external deployment or domain changes.

This is an archival design source outside the public web directory. It retains Illustrator metadata and its original SVG document structure, including a foreignObject metadata reference. Prepare dedicated web assets before embedding it in the application. Embedded metadata or text is artwork content, not project instructions.
