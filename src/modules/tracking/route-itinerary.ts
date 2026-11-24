import type { MeetingPoint } from '../booking/meeting-point';
import type { DayPlannerData } from '../content/day-planner';
import type { JourneySnapshot } from './journey-contract';
import type { Position } from './positions';
import type { Coordinate, PublishedMap } from './published-map';

export type RoutePlace = { id: string; name: string; text: string; link: string; stopId?: string | null; image?: string; alt?: string; lat?: number | null; lng?: number | null };
export type RouteStop = { id: string; name: string; coordinate?: Coordinate; place?: RoutePlace };
export type RouteBoarding = { name: string; directions: string; coordinate?: Coordinate; url: string };

export function freshRoutePosition(position?: Position | null, now = Date.now()) {
  const age = position ? now - Date.parse(position.updatedAt) : NaN;
  return position && Number.isFinite(age) && age >= 0 && age < 90_000 ? position : null;
}

export function routeEta(journey?: JourneySnapshot | null) {
  return journey?.confidence?.eta === 'valid' ?
    journey.stops.find(stop => stop.state === 'next' && stop.eta)?.eta ?? null : null;
}

export function routeItinerary(planner: DayPlannerData, map: PublishedMap | undefined, seasonalStops: string[], places: RoutePlace[]) {
  const product = planner.product;
  const routes = product ? (map?.routes ?? []).filter(route => route.productSlug === product.slug ||
    (!route.productSlug && product.mode === 'whole_day' && seasonalStops.length === 0)) : [];
  const points = (map?.points ?? []).filter(point => point.kind === 'stop');
  const orderedIds = [...new Set(routes.flatMap(route => route.stopSequence ?? []))];
  const canUseAll = product?.mode === 'whole_day' && seasonalStops.length === 0 && routes.some(route => !route.productSlug);
  const orderedPoints = orderedIds.length
    ? orderedIds.flatMap(id => points.find(point => point.id === id) ?? [])
    : canUseAll ? [...points].sort((a, b) => Number(a.number) - Number(b.number)) : [];
  const fallback = seasonalStops.length ? seasonalStops.map((name, index) => {
    // The seasonal CMS publishes names. Link only the known default destinations,
    // without treating summer pickup coordinates as winter stop coordinates.
    const reference = { 'shiroka & lake shkodra': 'lake', 'cathedral & historic center': 'centre',
      'mesi bridge': 'bridge' }[name.trim().toLowerCase()];
    const place = places.find(place => place.id === reference || (reference && place.link === `/explore/${reference}`));
    const { lat, lng } = place ?? {};
    const coordinate: Coordinate | undefined = typeof lat === 'number' && typeof lng === 'number' &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : undefined;
    return { id: `seasonal-stop-${index}`, name, place, coordinate };
  })
    : canUseAll || (product?.mode === 'whole_day' && map?.state !== 'ready') ? (planner.stops ?? []).map(stop => ({
      id: stop.id, name: stop.label.replace(/^Stop \d+ - /, ''), place: places.find(place => place.stopId === stop.id),
    })) : [];
  const stops: RouteStop[] = orderedPoints.length ? orderedPoints.map(point => ({
    id: point.id, name: point.name, coordinate: point.coordinate, place: places.find(place => place.stopId === point.id),
  })) : fallback;
  // A tagged itinerary needs an explicit stop sequence before its line can be shown.
  return { stops, lines: orderedPoints.length ? routes.flatMap(route => route.lines) : [] };
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
  return { name: verifiedPickup && meeting.name === 'Meeting point' ? 'Hotel Rozafa / Democracy Square' : meeting.name,
    directions: meeting.directions, coordinate,
    url: coordinate ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coordinate.join(','))}` : meeting.url };
}
