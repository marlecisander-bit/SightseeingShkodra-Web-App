import { getPublishedWebsite } from '@/modules/content/website-server';
import { getPublicDestinations } from '@/modules/content/destinations-server';
import { getDayPlanner } from '@/modules/content/day-planner-server';
import { pageMetadata } from '@/modules/content/seo';
import { RouteJourney } from '@/components/public/route-journey';
export function generateMetadata(){return pageMetadata('/route','Route & Live Map | Sightseeing Shkodra','Follow the Sightseeing Shkodra van live, check the route, stops and daily departures, and plan your day.');}
export default async function RoutePage(){const [content,planner,places]=await Promise.all([getPublishedWebsite(),getDayPlanner(),getPublicDestinations().catch(()=>[])]);return <RouteJourney content={content} initial={planner} places={places.filter(p=>p.showOnPage)}/>;}
