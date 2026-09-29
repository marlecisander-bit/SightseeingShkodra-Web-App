// Validate actual browser measurements, not CSS source strings.
// Usage: node scripts/check-hero-composition.mjs <geometry.json>
// Evidence is captured from the local browser before/after the change.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const evidence = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const required = [320, 375, 390, 393, 430, 700, 701, 768, 820, 844, 1440];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1, `${a} differs from ${b}`);
for (const width of required) {
  const m = evidence.after.find(row => row.width === width);
  assert.ok(m, `Missing ${width}px browser evidence`);
  assert.equal(m.overflow, false, `${width}: document overflow`);
  assert.ok(m.image.naturalWidth > 0, `${width}: image not loaded`);
  assert.equal(m.image.fit, 'cover');
  if (width > 900) continue;
  for (const name of ['price', 'book', 'track']) {
    assert.ok(m[name].y >= m.media.y && m[name].bottom <= m.media.bottom,
      `${width}: ${name} outside photograph`);
  }
  assert.ok(m.discover.y >= m.media.bottom, `${width}: Discover inside photograph`);
  assert.ok(m.media.bottom - m.track.bottom >= 16, `${width}: missing photo ending`);
  assert.ok(m.price.y - m.copy.bottom <= 245, `${width}: unbounded visual region`);
  assert.ok(m.book.height >= 44 && m.track.height >= 44);
  if (width > 430) continue;
  const old = evidence.before.find(row => row.width === width);
  assert.ok(old.media.height - m.media.height >= 300, `${width}: insufficient height reduction`);
  assert.ok(old.price.y - m.price.y >= 300, `${width}: commercial block still too low`);
  // Manually identified roof/wheel bounds (52%–77% of source height) in the
  // current CMS portrait f628eb0f...png. This is a photograph-specific visual
  // landmark check, not object detection or a guarantee for replacement photos.
  assert.ok(m.image.src.includes('f628eb0f-d98c-43c8-bb3f-d2572299f765'));
  assert.equal(m.image.position, '50% 50%');
  const b = m.image.box;
  const scale = Math.max(b.width / m.image.naturalWidth, b.height / m.image.naturalHeight);
  const renderedHeight = m.image.naturalHeight * scale;
  const imageTop = b.y + (b.height - renderedHeight) / 2;
  const roof = imageTop + renderedHeight * 0.52;
  const wheels = imageTop + renderedHeight * 0.77;
  assert.ok(roof - m.copy.bottom <= 140, `${width}: too much sky above van`);
  assert.ok(roof < m.price.y && roof < m.height, `${width}: van appears too late`);
  assert.ok(wheels < m.track.y, `${width}: vehicle not visible before Track`);
  assert.ok(wheels - roof >= 150, `${width}: vehicle too small`);
  console.log(`${width}: roof≈${Math.round(roof)}, copy end=${Math.round(m.copy.bottom)}, price=${Math.round(m.price.y)}, photo end=${Math.round(m.media.bottom)}`);
}
const desktop = evidence.after.find(row => row.width === 1440);
const baseline = evidence.before.find(row => row.width === 1440);
for (const name of ['hero', 'media', 'copy', 'price', 'book', 'track', 'discover']) {
  for (const key of ['x', 'y', 'width', 'height']) close(desktop[name][key], baseline[name][key]);
}
assert.ok(evidence.stability.length >= 4);
for (const m of evidence.stability) {
  for (const name of ['media', 'copy', 'price', 'book', 'track', 'discover']) {
    close(m[name].y, evidence.stability[0][name].y);
    close(m[name].height, evidence.stability[0][name].height);
  }
}
console.log('PASS: 11 viewport cases, desktop baseline and four browser-height simulations. Physical devices remain untested.');
