import type { JourneySnapshot, JourneyStop } from './journey-contract';
import type { PublishedMap } from './published-map';

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}

function stamp(value: unknown) {
  return typeof value === 'string' ? Date.parse(value) : NaN;
}

export function projectNativeJourney(
  value: unknown,
  map: PublishedMap,
  mapVersion: string | number | null,
  projectId: string,
  vehicleId: string,
  now = Date.now(),
): JourneySnapshot | null {
  const snapshot = record(value);
  const position = record(snapshot?.position);
  const stop = record(snapshot?.stop);
  const op = record(stop?.operational_state);
  const observed = stamp(position?.source_recorded_at);
  const age = now - observed;
  if (!position || !stop || !op || mapVersion === null || op.version !== 3 ||
      stop.project_id !== projectId || stop.vehicle_id !== vehicleId ||
      String(stop.map_version_id) !== String(mapVersion) || String(op.mapVersion) !== String(mapVersion) ||
      position.source_run_id == null || String(op.sourceRun) !== String(position.source_run_id) ||
      stamp(op.timestamp) !== observed || !Number.isFinite(age) || age < 0 || age >= 90_000 ||
      position.ui_observation_valid === false || op.skipCandidate != null ||
      (position.accuracy_m != null && (typeof position.accuracy_m !== 'number' ||
        !Number.isFinite(position.accuracy_m) || position.accuracy_m < 0 || position.accuracy_m > 50))) return null;

  const points = map.points.filter(point => point.kind === 'stop');
  const current = points.find(point => point.id === stop.current_stop_id && point.number === String(op.currentStop));
  const next = points.find(point => point.id === stop.expected_next_stop_id && point.number === String(op.nextStop));
  const parked = current && op.movement === 'STATIONARY' && op.outside === 0;
  const moving = next && op.currentStop === null && op.movement === 'MOVING';
  if (!parked && !moving) return null;

  const eta = record(snapshot?.eta);
  const seconds = op.etaSeconds;
  const etaMatches = snapshot?.eta == null
    ? stamp(op.etaCalculatedAt) === observed
    : !!eta && String(eta.map_version_id) === String(mapVersion) &&
      String(eta.next_stop_number) === next?.number && stamp(eta.calculated_at) === observed &&
      (eta.source_run_id == null || String(eta.source_run_id) === String(position.source_run_id)) &&
      (eta.vehicle_id == null || eta.vehicle_id === vehicleId) &&
      (eta.project_id == null || eta.project_id === projectId) &&
      (eta.confidence == null || eta.confidence === 'MEDIUM' || eta.confidence === 'HIGH') &&
      eta.eta_seconds === seconds;
  const showEta = moving && etaMatches && typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0;
  const departed = points.find(point => point.id === stop.last_completed_stop_id && point.number === String(op.lastDeparted));

  return {
    type: 'shkodra:journey', version: 1, unavailable: false,
    phase: parked ? 'PARKED' : 'EN_ROUTE',
    movement: parked ? `At stop: ${current.name}` : `Heading to: ${next!.name}`,
    statusValidUntil: new Date(observed + 90_000).toISOString(),
    lastObservationAt: new Date(observed).toISOString(),
    confidence: { position: 'live', eta: showEta ? 'valid' : 'unavailable' },
    stops: points.map((point): JourneyStop => ({
      id: point.id, number: point.number, label: point.name,
      state: parked && point === current ? 'current' : point === next ? 'next' : point === departed ? 'departed' : 'upcoming',
      eta: showEta && point === next ? seconds < 60 ? 'Less than 1 min' : `~${Math.round(seconds / 60)} min` : '',
    })),
  };
}
