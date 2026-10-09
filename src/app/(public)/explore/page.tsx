import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getWebsitePublication, getPublishedWebsite } from '@/modules/content/website-server';
import { editorialMetadata } from '@/modules/content/seo';
import { ExploreView } from '@/components/public/editorial-pages';
export async function generateMetadata(){const {content,published}=await getWebsitePublication();return editorialMetadata('/explore','explorePage',content,published);}
export default async function Explore(){const [c,places]=await Promise.all([getPublishedWebsite(),getPublicDestinations()]);return <ExploreView c={c} places={places.filter(d=>d.showOnPage)}/>;}
