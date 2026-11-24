import type { Viewport } from 'next';
import { getWebsitePublication } from '@/modules/content/website-server';
import { getPublicDestinations } from '@/modules/content/destinations-server';
import { getDayPlanner } from '@/modules/content/day-planner-server';
import { editorialMetadata } from '@/modules/content/seo';
import { getCurrentMeetingPoint } from '@/modules/booking/meeting-point-server';
import { readPublicMap } from '@/modules/tracking/public-map-server';
import { routeBoarding, routeItinerary, freshRoutePosition, recentRoutePosition, routeEta } from '@/modules/tracking/route-itinerary';
import { RouteExplorer } from '@/components/public/route-explorer';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export async function generateMetadata() {
  const { content, published } = await getWebsitePublication();
  return editorialMetadata('/route', 'routePage', content, published);
}
export default async function RoutePage() {
  const [planner, places, meeting, tracking] = await Promise.all([
    getDayPlanner(), getPublicDestinations().catch(() => []), getCurrentMeetingPoint(), readPublicMap(),
  ]);
  const { lines, stops } = routeItinerary(planner.stops, tracking?.map, places.filter(place => place.showOnPage));
  const lastPosition = lines.length ? recentRoutePosition(tracking?.snapshot.positions[0]) : null;
  const initialPosition = freshRoutePosition(lastPosition);
  return <RouteExplorer planner={planner} lines={lines} stops={stops}
    boarding={routeBoarding(meeting, tracking?.map)} mapVersion={tracking?.mapVersion ?? null}
    initialPosition={initialPosition} initialLastKnown={initialPosition ? null : lastPosition}
    initialEta={initialPosition ? routeEta(tracking?.journey) : null} />;
}
