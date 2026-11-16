# Balanced mobile product cards — 16 November 2026

Local only; no publication.

The previous photo-alignment fix shared both photo and body rows. The inactive seasonal-break panel dictated the body height, leaving the active card’s extra space above its auto-margined price. The reference-like 440×772 WebKit viewport measured about 90px of blank space.

The existing phone-only CSS now gives both photos a 16:9 width-based frame and lets each card’s text take its natural height. The rail aligns cards at the top; the price follows amenities with normal spacing. Photo cropping/grayscale, status, prices, booking/actions, horizontal swipe and pagination remain. Cards may have different overall heights because their content differs. On short screens content remains available through normal vertical scrolling. No fixed card height or resizing animation was introduced.

At 440×772 the photos grow from approximately 123px to 217px, while the active card’s amenities-to-price gap falls from 90px to 8px. All seven active and eight inactive amenities remain visible, as before. The existing photo minimum/flex metadata used by amenity fitting is retained; no amenities JavaScript change is needed.

Chromium/WebKit actual-content browser-only candidate checks pass at eight viewport sizes (16 cases): equal photos, reduced spacing, unchanged amenity counts, stable dimensions through scrolling and unchanged tablet/desktop geometry. These checks apply the candidate CSS only inside an isolated browser tab; hosted source is unchanged. The local development fixture directly compiles the existing hero/cards with representative active/inactive data and passes 14 geometry cases. All 198 component tests, lint/types and Webpack build pass. Physical iPhone hardware was unavailable.

Review: candidate-webkit-active.png and candidate-webkit-inactive.png. Source change is limited to product-booking-cards.module.css; the development fixture was expanded for representative amenities and inactive content. No database, map, CMS or booking-logic change.
