import { freshRoutePosition, lastKnownRoutePosition, routeEta, routeLivePositionMs } from './route-itinerary';
import { withinTrackingHours } from './service-hours';
import type { readPublicMap } from './public-map-server';

const historyMs = 600_000;

export function routePublicStatus(data: Awaited<ReturnType<typeof readPublicMap>>, now = Date.now()) {
  const observed = lastKnownRoutePosition(data?.snapshot.positions[0], now);
  const closed = withinTrackingHours(data?.serviceHours ?? null, new Date(now)) === false;
  const versionMismatch = data?.snapshotMapVersion != null && String(data.snapshotMapVersion) !== String(data.mapVersion);
  const position = closed || versionMismatch ? null : freshRoutePosition(observed, now);
  const lastKnown = observed && !position && now - Date.parse(observed.updatedAt) < historyMs ? observed : null;
  return {
    mapVersion: data?.mapVersion ?? null,
    closed,
    position,
    lastKnown,
    observedAt: observed?.updatedAt ?? null,
    movement: position ? data?.journey?.movement ?? null : null,
    eta: position ? routeEta(data?.journey) : null,
    journey: position ? data?.journey ?? null : null,
  };
}

export type RouteStatus = ReturnType<typeof routePublicStatus>;

export function expireRouteStatus(status: RouteStatus, now = Date.now(), disconnected = false): RouteStatus {
  const observed = status.position ?? status.lastKnown;
  const age = observed ? now - Date.parse(observed.updatedAt) : Infinity;
  const position = !disconnected && age >= 0 && age < routeLivePositionMs ? status.position : null;
  return {
    ...status,
    position,
    lastKnown: !position && age >= 0 && age < historyMs ? observed : null,
    movement: position ? status.movement : null,
    eta: position ? status.eta : null,
    journey: position ? status.journey : null,
  };
}

export function routeStatusDeadline(status: RouteStatus) {
  const observed = status.position ?? status.lastKnown;
  return observed ? Date.parse(observed.updatedAt) + (status.position ? routeLivePositionMs : historyMs) : null;
}
