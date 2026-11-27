import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expireRouteStatus, routePublicStatus, routeStatusDeadline } from '../../src/modules/tracking/route-status.ts';
import { seasonalServiceFacts } from '../../src/modules/content/seasonal-announcement.ts';

test('public tracking distinguishes open hours, closure, delay and expired last-known reports', () => {
  const now = Date.parse('2026-11-27T15:59:00Z');
  const position = { vehicleId: 'fixture', lat: 42, lng: 19, updatedAt: new Date(now - 1000).toISOString() };
  const data = { mapVersion: 121, snapshot: { positions: [position] }, journey: { movement: 'At stop' },
    serviceHours: { enabled: true, time_zone: 'Europe/Tirane', week: Array(7).fill({ open: '08:45', close: '17:00' }) } };
  const open = routePublicStatus(data, now);
  assert.equal(open.closed, false);
  assert.equal(open.movement, 'At stop');
  const priorMap = routePublicStatus({ ...data, snapshotMapVersion: 120 }, now);
  assert.equal(priorMap.position, null);
  assert.equal(priorMap.lastKnown, position);
  assert.equal(priorMap.journey, null);
  const delayed = expireRouteStatus(open, routeStatusDeadline(open));
  assert.equal(delayed.position, null);
  assert.equal(delayed.lastKnown, position);
  const closed = routePublicStatus(data, now + 60_000);
  assert.equal(closed.closed, true);
  assert.equal(closed.movement, null);
  assert.equal(closed.lastKnown, position);
  assert.equal(expireRouteStatus(closed, routeStatusDeadline(closed)).lastKnown, null);
  assert.equal(expireRouteStatus(open, now, true).position, null);
});

test('seasonal notice uses operational facts only when the declared service and itinerary match', () => {
  const now = new Date('2026-11-27T12:00Z');
  const content = { 'seasonal.enabled': 'true', 'seasonal.start': '2026-11-01', 'seasonal.end': '2027-03-31',
    'seasonal.popupTitle': 'Panorama Tour', 'seasonal.stops': 'The lake' };
  const planner = { date: '2026-11-27', product: { slug: 'panorama' }, title: 'Panorama Tour',
    times: ['11:00'], stops: [{ label: 'Stop 1 - The lake' }] };
  assert.deepEqual(seasonalServiceFacts(content, planner, now), { departures: '11:00', stops: ['The lake'] });
  assert.equal(seasonalServiceFacts({ ...content, 'seasonal.stops': 'Another stop' }, planner, now), null);
  assert.equal(seasonalServiceFacts(content, { ...planner, title: 'Another tour' }, now), null);
});
