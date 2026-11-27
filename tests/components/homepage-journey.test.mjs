import { registerHooks } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';

registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'module', source: 'export default {}', shortCircuit: true };
  return next(url, context);
} });
const { HomepageJourneyProvider, useHomepageJourney } = await import('../../src/components/public/homepage-journey.tsx');

test('homepage starts native tracking near the route and recovers on reconnect without an iframe', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
  const names = ['window', 'document', 'navigator', 'Event', 'IntersectionObserver', 'IS_REACT_ACT_ENVIRONMENT', 'fetch'];
  const saved = names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  const originals = { fetch: globalThis.fetch };
  let intersect;
  let calls = 0;
  let offline = false;
  let closed = false;
  let state;
  const observe = class {
    constructor(callback) { intersect = callback; }
    observe(target) { assert.equal(target.id, 'route'); }
    disconnect() {}
  };
  const values = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    Event: dom.window.Event, IntersectionObserver: observe, IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async url => {
      assert.equal(url, '/api/public/route-tracking');
      calls++;
      if (offline) throw Error('Offline');
      const updatedAt = new Date().toISOString();
      const position = { vehicleId: 'demo', lat: 42, lng: 19, updatedAt };
      return Response.json({ mapVersion: 1, closed, position: closed ? null : position, lastKnown: null,
        observedAt: updatedAt, eta: null, movement: 'At stop',
        journey: closed ? null : { movement: 'At stop' } });
    } };
  for (const [name] of saved) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: values[name] });
  window.IntersectionObserver = observe;
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  function Observe() { state = useHomepageJourney(); return React.createElement('section', { id: 'route' }); }
  try {
    await act(() => root.render(React.createElement(HomepageJourneyProvider, null, React.createElement(Observe))));
    assert.equal(calls, 0);
    await act(async () => intersect([{ isIntersecting: true }]));
    assert.equal(calls, 1);
    assert.equal(state.journey.movement, 'At stop');
    assert.equal(document.querySelector('iframe'), null);
    offline = true;
    await act(async () => window.dispatchEvent(new Event('online')));
    assert.equal(state.stale, true);
    offline = false;
    closed = true;
    await act(async () => window.dispatchEvent(new Event('online')));
    assert.equal(state.stale, false);
    assert.equal(state.closed, true);
    assert.equal(state.journey, null);
  } finally {
    await act(() => root.unmount());
    dom.window.close();
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
    globalThis.fetch = originals.fetch;
  }
});
