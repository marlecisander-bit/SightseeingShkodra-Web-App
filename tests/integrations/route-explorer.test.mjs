import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshRoutePosition, recentRoutePosition, routeBoarding, routeEta, routeItinerary } from '../../src/modules/tracking/route-itinerary.ts';

const point = (id, number) => ({ id, name: id, number, kind: 'stop', coordinate: [42, 19] });
const lines = [[[42, 19], [42.1, 19.1]]];
const publishedMap = { state: 'ready', points: [point('b', '2'), point('a', '1')], routes: [
  { id: 'loop', name: 'Loop', color: '#a91223', lines, stopSequence: ['a', 'b', 'a'] },
] };

test('map uses the published route and stop order independently of booking', () => {
  const route = routeItinerary(null, publishedMap, []);
  assert.deepEqual(route.stops.map(stop => stop.id), ['a', 'b']);
  assert.deepEqual(route.lines, lines);
});
test('keeps published geometry and numbered stops when the route has no explicit sequence', () => {
  const map = { ...publishedMap, routes: [{ ...publishedMap.routes[0], stopSequence: undefined }] };
  assert.deepEqual(routeItinerary(null, map, []).stops.map(stop => stop.id), ['a', 'b']);
  assert.deepEqual(routeItinerary(null, { ...map, points: [] }, []).lines, lines);
});
test('keeps ordered planner stops if map data is unavailable', () => {
  const route = routeItinerary([{ id: 'a', label: 'Stop 1 - Lake' }], undefined, []);
  assert.deepEqual(route.stops, [{ id: 'a', name: 'Lake', place: undefined }]);
});
test('boarding uses verified configured pickup and honors later meeting point changes', () => {
  const meeting = { name: 'Meeting point', directions: '', label: 'Directions', stopId: null };
  const verified = routeBoarding({ ...meeting, url: 'https://maps.app.goo.gl/rssrPnaBYZVWp316A' });
  assert.equal(verified.name, 'Hotel Rozafa / Democracy Square');
  assert.match(verified.url, /destination=42.067722%2C19.512861/);
  const updated = routeBoarding({ ...meeting, name: 'New stop', url: 'https://www.google.com/maps/dir/?destination=42,19' });
  assert.deepEqual(updated.coordinate, [42, 19]);
  assert.equal(updated.name, 'New stop');
});
test('tracking hides expired and future observations', () => {
  const position = { vehicleId: 'van', lat: 42, lng: 19, updatedAt: '2026-11-24T08:00:00Z' };
  const observed = Date.parse(position.updatedAt);
  assert.equal(freshRoutePosition(position, observed + 1000), position);
  assert.equal(freshRoutePosition(position, observed + 90000), null);
  assert.equal(freshRoutePosition(position, observed - 1000), null);
  assert.equal(freshRoutePosition(null), null);
});

test('only an upstream valid next-stop estimate is displayed', () => {
  const journey = { confidence: { eta: 'valid' }, stops: [{ state: 'next', eta: '~2 min' }] };
  assert.equal(routeEta(journey), '~2 min');
  assert.equal(routeEta({ ...journey, confidence: { eta: 'historical' } }), null);
  assert.equal(routeEta(null), null);
});

test('keeps a valid recent stale fix separate from live tracking for up to ten minutes', () => {
  const position = { vehicleId: 'van', lat: 42, lng: 19, updatedAt: '2026-11-24T08:00:00Z' };
  const observed = Date.parse(position.updatedAt);
  assert.equal(freshRoutePosition(position, observed + 328000), null);
  assert.equal(recentRoutePosition(position, observed + 328000), position);
  assert.equal(recentRoutePosition(position, observed + 600000), null);
  assert.equal(recentRoutePosition(position, observed - 1000), null);
});
