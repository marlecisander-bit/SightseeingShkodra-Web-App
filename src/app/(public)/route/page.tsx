import type { Viewport } from 'next';
import { getWebsitePublication } from '@/modules/content/website-server';
import { getPublicDestinations } from '@/modules/content/destinations-server';
import { getBookableProducts } from '@/modules/booking/products-server';
import { getDestinationStops } from '@/modules/content/destination-stops-server';
import { plannerClock, type DayPlannerData } from '@/modules/content/day-planner';
import { editorialMetadata } from '@/modules/content/seo';
import { getCurrentMeetingPoint } from '@/modules/booking/meeting-point-server';
import { readPublicMap } from '@/modules/tracking/public-map-server';
import { routeBoarding, routeItinerary, freshRoutePosition, lastKnownRoutePosition, routeEta } from '@/modules/tracking/route-itinerary';
import { RouteExplorer } from '@/components/public/route-explorer';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export async function generateMetadata() {
  const { content, published } = await getWebsitePublication();
  return editorialMetadata('/route', 'routePage', content, published);
}
export default async function RoutePage() {
  const [products, places, meeting, tracking] = await Promise.all([
    getBookableProducts().catch(() => []), getPublicDestinations().catch(() => []), getCurrentMeetingPoint(), readPublicMap(),
  ]);
  const product = products.find(offer => offer.active && offer.primary) ?? products.find(offer => offer.active);
  const planner: DayPlannerData = {
    date: plannerClock().date, title: product?.title ?? 'View tickets',
    product: product && { slug: product.slug, mode: product.mode, minutes: product.minutes },
    times: null, fares: [], stops: null,
  };
  const routePlaces = places.filter(place => place.showOnPage);
  let { lines, stops } = routeItinerary(null, tracking?.map, routePlaces);
  if (!stops.length) {
    const fallback = await getDestinationStops(process.env.PUBLIC_OPERATOR_ID ?? '');
    ({ lines, stops } = routeItinerary(fallback.stops, tracking?.map, routePlaces));
  }
  const lastPosition = lines.length ? lastKnownRoutePosition(tracking?.snapshot.positions[0]) : null;
  const initialPosition = freshRoutePosition(lastPosition);
  return <RouteExplorer planner={planner} routeTitle={tracking?.map.routes[0]?.name ?? 'Tour route'} routes={tracking?.map.routes ?? []} stops={stops}
    boarding={routeBoarding(meeting, tracking?.map)} mapVersion={tracking?.mapVersion ?? null}
    initialPosition={initialPosition} initialLastKnown={initialPosition ? null : lastPosition}
    initialObservedAt={tracking?.snapshot.positions[0]?.updatedAt ?? null}
    initialMovement={initialPosition ? tracking?.journey?.movement ?? null : null}
    initialEta={initialPosition ? routeEta(tracking?.journey) : null} />;
}
