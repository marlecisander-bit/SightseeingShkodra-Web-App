import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getPublishedWebsite } from '@/modules/content/website-server';
import { editorialMetadata } from '@/modules/content/seo';
import { ExploreView } from '@/components/public/editorial-pages';
export async function generateMetadata(){const c=await getPublishedWebsite();return editorialMetadata('/explore','explorePage',c);}
export default async function Explore(){const [c,places]=await Promise.all([getPublishedWebsite(),getPublicDestinations()]);return <ExploreView c={c} places={places.filter(d=>d.showOnPage)}/>;}
