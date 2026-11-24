import assert from 'node:assert/strict';
import test from 'node:test';
import { projectNativeJourney } from '../../src/modules/tracking/native-journey.ts';

const observed = '2026-11-24T12:00:00.000Z';
const now = Date.parse(observed) + 5000;
const map = { state: 'ready', routes: [], points: [1, 2, 3].map(number => ({
  id: 'stop-' + number, number: String(number), name: 'Stop ' + number, kind: 'stop', coordinate: [42, 19],
})) };
const fixture = () => ({
  position: { source_run_id: 'run', source_recorded_at: observed, accuracy_m: 10 },
  stop: { project_id: 'project', vehicle_id: 'van', map_version_id: 1,
    expected_next_stop_id: 'stop-3', last_completed_stop_id: 'stop-1',
    operational_state: { version: 3, mapVersion: 1, sourceRun: 'run', timestamp: observed,
      currentStop: null, nextStop: 3, lastDeparted: 1, movement: 'MOVING', etaSeconds: 120 },
  },
  eta: { map_version_id: 1, next_stop_number: 3, calculated_at: observed, eta_seconds: 120, confidence: 'HIGH' },
});
const project = (snapshot, time = now) => projectNativeJourney(snapshot, map, 1, 'project', 'van', time);

test('uses published stop IDs and never infers a skipped stop was visited', () => {
  const journey = project(fixture());
  assert.deepEqual(journey.stops.map(({ state, eta }) => [state, eta]), [
    ['departed', ''], ['upcoming', ''], ['next', '~2 min'],
  ]);
});
test('drops estimates with mismatched provenance and expires stale progress', () => {
  const snapshot = fixture();
  snapshot.eta.next_stop_number = 2;
  assert.equal(project(snapshot).confidence.eta, 'unavailable');
  assert.equal(project(snapshot, Date.parse(observed) + 90_000), null);
  snapshot.stop.operational_state.sourceRun = 'old-run';
  assert.equal(project(snapshot), null);
});
test('shows a confirmed stationary stop without an arrival countdown', () => {
  const snapshot = fixture();
  snapshot.stop.current_stop_id = 'stop-2';
  Object.assign(snapshot.stop.operational_state, { currentStop: 2, movement: 'STATIONARY', outside: 0 });
  const journey = project(snapshot);
  assert.equal(journey.phase, 'PARKED');
  assert.equal(journey.stops[1].state, 'current');
  assert.equal(journey.stops[2].eta, '');
});
