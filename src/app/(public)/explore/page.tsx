import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getPublishedWebsite } from '@/modules/content/website-server';
import { pageMetadata } from '@/modules/content/seo';
import { ExploreView } from '@/components/public/editorial-pages';
export async function generateMetadata(){const c=await getPublishedWebsite();return pageMetadata('/explore',c['explorePage.title'],c['explorePage.text']);}
export default async function Explore(){const [c,places]=await Promise.all([getPublishedWebsite(),getPublicDestinations()]);return <ExploreView c={c} places={places.filter(d=>d.showOnPage)}/>;}
