import type { Viewport } from 'next';
import { getWebsitePublication } from '@/modules/content/website-server';
import { getPublicDestinations } from '@/modules/content/destinations-server';
import { getBookableProducts } from '@/modules/booking/products-server';
import { getDestinationStops } from '@/modules/content/destination-stops-server';
import { plannerClock, type DayPlannerData } from '@/modules/content/day-planner';
import { editorialMetadata } from '@/modules/content/seo';
import { getCurrentMeetingPoint } from '@/modules/booking/meeting-point-server';
import { readPublicMap } from '@/modules/tracking/public-map-server';
import { routeItinerary } from '@/modules/tracking/route-itinerary';
import { routePublicStatus } from '@/modules/tracking/route-status';
import { RouteExplorer } from '@/components/public/route-explorer';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export async function generateMetadata() {
  const { content, published } = await getWebsitePublication();
  return editorialMetadata('/route', 'routePage', content, published);
}
export default async function RoutePage() {
  const [products, places, meeting, tracking, content] = await Promise.all([
    getBookableProducts().catch(() => []), getPublicDestinations().catch(() => []), getCurrentMeetingPoint(), readPublicMap(undefined, true), getWebsitePublication().then(result => result.content),
  ]);
  const product = products.find(offer => offer.active && offer.primary) ?? products.find(offer => offer.active);
  const planner: DayPlannerData = {
    date: plannerClock().date, title: product?.title ?? 'View tickets',
    product: product && { slug: product.slug, mode: product.mode, minutes: product.minutes },
    times: null, fares: [], stops: null,
  };
  const routePlaces = places.filter(place => place.showOnPage);
  const { stops } = routeItinerary(null, tracking?.map, routePlaces);
  const fallback = stops.length ? null : await getDestinationStops(process.env.PUBLIC_OPERATOR_ID ?? '');
  return <RouteExplorer planner={planner} initialMap={tracking?.map} initialStatus={routePublicStatus(tracking)}
    places={routePlaces} fallbackStops={fallback?.stops ?? null} meeting={meeting} content={content} />;
}
