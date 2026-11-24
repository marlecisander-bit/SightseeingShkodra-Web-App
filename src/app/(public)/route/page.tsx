import type { Viewport } from 'next';
import { getWebsitePublication, getPublishedWebsite } from '@/modules/content/website-server';
import { getPublicDestinations } from '@/modules/content/destinations-server';
import { getDayPlanner } from '@/modules/content/day-planner-server';
import { editorialMetadata } from '@/modules/content/seo';
import { getCurrentMeetingPoint } from '@/modules/booking/meeting-point-server';
import { seasonalActive } from '@/modules/content/seasonal-announcement';
import { readPublicMap } from '@/modules/tracking/public-map-server';
import { routeBoarding, routeItinerary, freshRoutePosition, routeEta } from '@/modules/tracking/route-itinerary';
import { RouteExplorer } from '@/components/public/route-explorer';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export async function generateMetadata() {
  const { content, published } = await getWebsitePublication();
  return editorialMetadata('/route', 'routePage', content, published);
}
export default async function RoutePage() {
  const [content, planner, places, meeting, tracking] = await Promise.all([
    getPublishedWebsite(), getDayPlanner(), getPublicDestinations().catch(() => []), getCurrentMeetingPoint(), readPublicMap(),
  ]);
  const seasonal = planner.product?.mode === 'selected_departure' && seasonalActive(content);
  const names = seasonal ? content['seasonal.stops'].split('\n').map(name => name.trim()).filter(Boolean) : [];
  const { lines, stops } = routeItinerary(planner, tracking?.map, names, places.filter(place => place.showOnPage));
  const minutes = planner.product?.minutes ?? 0;
  const duration = minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}` : `${minutes} min`;
  const summary = seasonal && minutes ? `${duration} · ${stops.length} photo stops` : '';
  const initialPosition = lines.length ? freshRoutePosition(tracking?.snapshot.positions[0]) : null;
  return <RouteExplorer planner={planner} summary={summary} lines={lines} stops={stops}
    boarding={routeBoarding(meeting, tracking?.map)} mapVersion={tracking?.mapVersion ?? null}
    initialPosition={initialPosition} initialEta={initialPosition ? routeEta(tracking?.journey) : null} />;
}
