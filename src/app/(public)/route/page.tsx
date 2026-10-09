import {getHomepage} from '@/modules/content/homepage-server';
import { getWebsitePublication, getPublishedWebsite } from '@/modules/content/website-server';
import { getPublicDestinations } from '@/modules/content/destinations-server';
import { getDayPlanner } from '@/modules/content/day-planner-server';
import { editorialMetadata } from '@/modules/content/seo';
import { RouteJourney } from '@/components/public/route-journey';
export async function generateMetadata(){const {content,published}=await getWebsitePublication();return editorialMetadata('/route','routePage',content,published);}
export default async function RoutePage(){const [content,planner,places,home]=await Promise.all([getPublishedWebsite(),getDayPlanner(),getPublicDestinations().catch(()=>[]),getHomepage()]);return <RouteJourney content={content} product={home.product} fare={home.heroFare} initial={planner} places={places.filter(p=>p.showOnPage)}/>;}
