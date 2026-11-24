import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshRoutePosition, routeBoarding, routeEta, routeItinerary } from '../../src/modules/tracking/route-itinerary.ts';

const itinerary = (mode, slug) => ({
  date: '2026-11-24', title: 'Tour', product: { slug, mode, minutes: 120 }, times: ['09:00'], fares: [],
  stops: [{ id: 'a', label: 'Stop 1 - Lake' }],
});
const point = (id, number) => ({ id, name: id, number, kind: 'stop', coordinate: [42, 19] });
const lines = [[[42, 19], [42.1, 19.1]]];
const summerMap = { state: 'ready', points: [point('b', '2'), point('a', '1')], routes: [
  { id: 'loop', name: 'Loop', color: '#a91223', lines, stopSequence: ['a', 'b', 'a'] },
] };

test('summer uses published order and drops the closing repeated stop', () => {
  const route = routeItinerary(itinerary('whole_day', 'daily'), summerMap, [], []);
  assert.deepEqual(route.stops.map(stop => stop.id), ['a', 'b']);
  assert.equal(route.lines.length, 1);
});
test('winter never uses the untagged summer route and can use an explicit product binding', () => {
  const winter = itinerary('selected_departure', 'panorama');
  const stops = ['Shiroka & Lake Shkodra', 'Cathedral & Historic Center', 'Mesi Bridge'];
  const fallback = routeItinerary(winter, summerMap, stops, []);
  assert.deepEqual(fallback.stops.map(stop => stop.name), stops);
  assert.deepEqual(fallback.lines, []);
  const tagged = { ...summerMap, routes: [{ ...summerMap.routes[0], productSlug: 'panorama', stopSequence: ['b', 'a'] }] };
  assert.deepEqual(routeItinerary(winter, tagged, stops, []).stops.map(stop => stop.id), ['b', 'a']);
  assert.deepEqual(routeItinerary(winter, tagged, stops, []).lines, lines);
});
test('keeps ordered planner stops if summer map data is unavailable', () => {
  const route = routeItinerary(itinerary('whole_day', 'daily'), undefined, [], []);
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
