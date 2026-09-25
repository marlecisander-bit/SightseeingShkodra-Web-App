# Homepage hero image rendering

2026-09-25. Local CSS-only correction requested by the owner.

## Audit

HomepageHero renders CMS desktop/mobile sources through getImageProps and picture. Existing quality 75 responsive image optimization resizes/encodes images; no brightness, contrast or saturation transformations were configured. Original CMS assets and upload processing were not modified.

The active .p-hero-v2::before combined two full-image gradients: a vertical #0008 top / transparent middle / #000b bottom gradient and a horizontal #0009 left / #0003 / #0001 right gradient. At the bottom-left their combined opacity approached 85%. Earlier generic hero desktop/mobile overlay declarations were overridden by this V2 rule, rather than creating additional pseudo-elements. No additional hero overlay div or image filter was found. The transparent header had a text shadow; the Track live control had its own translucent background, confined to that button.

## Correction

Removed the V2 pseudo-element entirely using content:none. Explicitly retain filter:none, opacity:1 and normal blend modes on the image/picture/media. Small shadows immediately behind text support headline, descriptive text, amenities, discovery link and transparent-header navigation (including the mobile menu). No gradients remain over the homepage photograph. Existing button backgrounds, other-page overlays and solid-header scroll state remain unchanged.

Only src/app/(public)/public.css and implementation/status documentation changed for this task. Image sources, crop, dimensions, responsive breakpoints, typography sizing, content, layout and backend logic were not changed.

## Verification

Actual Chrome homepage screenshots inspected at 1920x1080, 1440x900, 1366x768, 390x844, 393x852, 430x932 and 768x1024. Computed pseudo-element content is none, image filter is none, and all images completed loading. No horizontal overflow. Photo colors are unobscured, the lower photo has no added black band, and text has localized readability support. Mobile uses its existing separate CMS image. Viewport override reset afterward. This is visual inspection, not a formal contrast certification for every possible future CMS photograph.
