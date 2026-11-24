import type { MeetingPoint } from '../booking/meeting-point';
import type { DayPlannerData } from '../content/day-planner';
import type { JourneySnapshot } from './journey-contract';
import type { Position } from './positions';
import type { Coordinate, PublishedMap } from './published-map';

export type RoutePlace = { id: string; name: string; text: string; link: string; stopId?: string | null; image?: string; alt?: string };
export type RouteStop = { id: string; name: string; coordinate?: Coordinate; description?: string; place?: RoutePlace };
export type RouteBoarding = { stopId?: string | null; name: string; directions: string; coordinate?: Coordinate; url: string };

export const routeLivePositionMs = 90_000;
export const routeLastKnownPositionMs = 600_000;

export function freshRoutePosition(position?: Position | null, now = Date.now()) {
  const age = position ? now - Date.parse(position.updatedAt) : NaN;
  return position && Number.isFinite(age) && age >= 0 && age < routeLivePositionMs ? position : null;
}

// The companion also limits historical GPS context to ten minutes.
export function recentRoutePosition(position?: Position | null, now = Date.now()) {
  const age = position ? now - Date.parse(position.updatedAt) : NaN;
  return position && Number.isFinite(age) && age >= 0 && age < routeLastKnownPositionMs ? position : null;
}

export function routeEta(journey?: JourneySnapshot | null) {
  return journey?.confidence?.eta === 'valid' ?
    journey.stops.find(stop => stop.state === 'next' && stop.eta)?.eta ?? null : null;
}

export function routeItinerary(publishedStops: DayPlannerData['stops'], map: PublishedMap | undefined, places: RoutePlace[]) {
  const routes = map?.routes ?? [];
  const points = (map?.points ?? []).filter(point => point.kind === 'stop');
  const byId = new Map(points.map(point => [point.id, point]));
  const orderedIds = [...new Set(routes.flatMap(route => route.stopSequence ?? []))];
  const routeOrder = orderedIds.flatMap(id => byId.get(id) ?? []);
  const inRouteOrder = new Set(routeOrder.map(point => point.id));
  const remaining = points.filter(point => !inRouteOrder.has(point.id))
    .sort((a, b) => (Number(a.number) || Infinity) - (Number(b.number) || Infinity));
  const orderedPoints = [...routeOrder, ...remaining];
  const placeFor = (id: string) => places.find(place => place.stopId === id);
  const stops: RouteStop[] = orderedPoints.length
    ? orderedPoints.map(point => ({
      id: point.id, name: point.name, coordinate: point.coordinate,
      description: point.description, place: placeFor(point.id),
    }))
    : (publishedStops ?? []).map(stop => ({
      id: stop.id, name: stop.label.replace(/^Stop \d+ - /, ''), place: placeFor(stop.id),
    }));
  return { stops, lines: routes.flatMap(route => route.lines) };
}

export function nearestRouteStop(location: Coordinate, stops: RouteStop[]) {
  const radians = Math.PI / 180;
  let nearest: { stop: RouteStop; coordinate: Coordinate; distance: number } | null = null;
  for (const stop of stops) {
    if (!stop.coordinate) continue;
    const [latitude, longitude] = stop.coordinate;
    const a = Math.sin((latitude - location[0]) * radians / 2) ** 2 +
      Math.cos(location[0] * radians) * Math.cos(latitude * radians) *
      Math.sin((longitude - location[1]) * radians / 2) ** 2;
    const distance = 12_742_000 * Math.asin(Math.sqrt(Math.min(a, 1)));
    if (!nearest || distance < nearest.distance) nearest = { stop, coordinate: stop.coordinate, distance };
  }
  return nearest;
}

export function routeBoarding(meeting: MeetingPoint | null, map?: PublishedMap): RouteBoarding | null {
  if (!meeting) return null;
  const bound = meeting.stopId ? map?.points.find(point => point.id === meeting.stopId && point.kind === 'stop') : undefined;
  const url = new URL(meeting.url);
  const verifiedPickup = url.href === 'https://maps.app.goo.gl/rssrPnaBYZVWp316A';
  const target = url.searchParams.get('destination') ?? url.searchParams.get('query') ?? url.searchParams.get('q');
  const match = target?.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  const parsed: Coordinate | undefined = match ? [Number(match[1]), Number(match[2])] : undefined;
  const coordinate: Coordinate | undefined = parsed && Math.abs(parsed[0]) <= 90 && Math.abs(parsed[1]) <= 180
    ? parsed : verifiedPickup ? [42.067722, 19.512861] : bound?.coordinate;
  return { stopId: meeting.stopId, name: verifiedPickup && meeting.name === 'Meeting point' ? 'Hotel Rozafa / Democracy Square' : meeting.name,
    directions: meeting.directions, coordinate,
    url: coordinate ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coordinate.join(','))}` : meeting.url };
}
