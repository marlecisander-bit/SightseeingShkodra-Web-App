import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshRoutePosition, nearestRouteStop, lastKnownRoutePosition, routeBoarding, routeEta, routeItinerary, walkingBoarding, walkingToNearestStop } from '../../src/modules/tracking/route-itinerary.ts';

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
  const verified = routeBoarding({ ...meeting, stopId: 'boarding-stop', url: 'https://maps.app.goo.gl/rssrPnaBYZVWp316A' });
  assert.equal(verified.stopId, 'boarding-stop');
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

test('keeps older valid fixes separate from live tracking', () => {
  const position = { vehicleId: 'van', lat: 42, lng: 19, updatedAt: '2026-11-24T08:00:00Z' };
  const observed = Date.parse(position.updatedAt);
  assert.equal(freshRoutePosition(position, observed + 328000), null);
  assert.equal(lastKnownRoutePosition(position, observed + 328000), position);
  assert.equal(lastKnownRoutePosition(position, observed + 3600000), position);
  assert.equal(lastKnownRoutePosition(position, observed - 1000), null);
});

test('finds the nearest located stop and ignores entries without coordinates', () => {
  const stops = [
    { id: 'unknown', name: 'Unknown' },
    { id: 'lake', name: 'Lake', coordinate: [42.05, 19.48] },
    { id: 'centre', name: 'Centre', coordinate: [42.068, 19.512] },
  ];
  const result = nearestRouteStop([42.068, 19.511], stops);
  assert.equal(result.stop.id, 'centre');
  assert(result.distance > 70 && result.distance < 90);
  assert.equal(nearestRouteStop([42.068, 19.511], stops.slice(0, 1)), null);
});

test('walking boards fixed tours at the configured pickup and hop-on hop-off at an eligible stop', () => {
  const boarding = { stopId: 'centre', name: 'Hotel Rozafa', directions: 'Democracy Square',
    coordinate: [42.067722, 19.512861], url: 'https://www.google.com/maps' };
  const stops = [{ id: 'centre', name: 'Start', coordinate: [42.068,19.513] },
    { id: 'lake', name: 'Shiroka', coordinate: [42.048,19.472] }, { id: 'unknown', name: 'Unlocated' }];
  const visitor = { coordinate: [42.048,19.472], accuracy: 12 };
  const fixed = walkingBoarding('selected_departure', boarding, stops, visitor);
  assert.equal(fixed.name, 'Hotel Rozafa');
  assert.equal(new URL(fixed.url).searchParams.get('destination'), '42.067722,19.512861');
  assert.equal(new URL(fixed.url).searchParams.get('travelmode'), 'walking');
  assert.equal(walkingBoarding('whole_day', boarding, stops, visitor).name, 'Shiroka');
  assert.equal(walkingBoarding('whole_day', boarding, stops, {...visitor, accuracy: 300}).name, 'Hotel Rozafa');
  assert.equal(walkingBoarding('whole_day', boarding, stops, null).name, 'Hotel Rozafa');
  assert.equal(walkingBoarding('whole_day', boarding, stops, { coordinate: [42.068,19.513], accuracy: 12 }).url, fixed.url);
});

test('live vehicle fixes reject invalid coordinates even when the timestamp is fresh', () => {
  const position = { vehicleId: 'van', lat: 91, lng: 19, updatedAt: new Date().toISOString() };
  assert.equal(freshRoutePosition(position), null);
  assert.equal(lastKnownRoutePosition({...position, lat: 42, lng: NaN}), null);
});

test('Find me links the visitor to the nearest mapped stop on foot', () => {
  const stops = [
    { id: 'unmapped', name: 'Unmapped' },
    { id: 'centre', name: 'Centre', coordinate: [42.068, 19.512] },
    { id: 'lake', name: 'Lake', coordinate: [42.048, 19.472] },
  ];
  const visitor = { coordinate: [42.049, 19.473], accuracy: 20 };
  const nearest = walkingToNearestStop(stops, visitor);
  assert.equal(nearest.stop.id, 'lake');
  const url = new URL(nearest.url);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('origin'), '42.049,19.473');
  assert.equal(url.searchParams.get('destination'), '42.048,19.472');
  assert.equal(url.searchParams.get('travelmode'), 'walking');
  assert.equal(walkingToNearestStop(stops, { ...visitor, accuracy: 300 }), null);
  assert.equal(walkingToNearestStop(stops.slice(0, 1), visitor), null);
});
