import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareWebsiteImage, IMAGE_UPLOAD_BYTES } from '../../src/modules/content/image-upload.ts';

test('oversized section images fail locally with size and remedy', async () => {
  const file = new File([new Uint8Array(IMAGE_UPLOAD_BYTES + 1024 * 1024)], 'large.png');
  await assert.rejects(prepareWebsiteImage(file, false), /9.0 MB.*maximum.*8 MB.*compress/);
});

test('small originals pass through unchanged', async () => {
  const file = new File(['image'], 'small.png');
  assert.equal(await prepareWebsiteImage(file, true), file);
  assert.equal(await prepareWebsiteImage(file, false), file);
});

test('large hero is optimized instead of rejected by original size', async () => {
  const priorBitmap = globalThis.createImageBitmap;
  const priorDocument = globalThis.document;
  let closed = false;
  globalThis.createImageBitmap = async () => ({ width: 8000, height: 4000, close() { closed = true; } });
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage() {} }), toBlob(callback) { callback(new Blob(['optimized'], { type: 'image/webp' })); } };
  globalThis.document = { createElement: () => canvas };
  try {
    const result = await prepareWebsiteImage(new File([new Uint8Array(10 * 1024 * 1024)], 'hero.png'), true);
    assert.equal(result.type, 'image/webp');
    assert.equal(canvas.width, 3840);
    assert.equal(canvas.height, 1920);
    assert.ok(result.size < IMAGE_UPLOAD_BYTES);
    assert.equal(closed, true);
  } finally {
    globalThis.createImageBitmap = priorBitmap;
    globalThis.document = priorDocument;
  }
});
