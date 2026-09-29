import { registerHooks } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Node does not render CSS; browser acceptance verifies the actual stylesheet.
registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'module', source: 'export default {}', shortCircuit: true };
  return next(url, context);
} });
const { ExpandableText } = await import('../../src/components/public/expandable-text.tsx');

test('full editorial content occurs once and stays visible without JavaScript', () => {
  const text = 'A complete description.\nAnother paragraph with its original punctuation. '.repeat(30);
  const html = renderToStaticMarkup(React.createElement(ExpandableText, { text }));
  assert.ok(html.includes(text));
  assert.equal(html.split(text).length - 1, 1);
  assert.ok(!html.includes('data-collapsed'));
  assert.ok(!html.includes('<button'));
});

test('short content has no misleading server-rendered expansion action', () => {
  const html = renderToStaticMarkup(React.createElement(ExpandableText, { text: 'A short description.' }));
  assert.match(html, /<p[^>]*>A short description\.<\/p>/);
  assert.ok(!html.includes('<button'));
});

test('reviews preserve quotation semantics and escape CMS markup', () => {
  const html = renderToStaticMarkup(React.createElement(ExpandableText, { text: '<script>unsafe</script>', as: 'blockquote' }));
  assert.match(html, /<blockquote/);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});
