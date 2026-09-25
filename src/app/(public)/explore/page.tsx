import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getHomepage } from '@/modules/content/homepage-server';
import { getPublishedWebsite } from '@/modules/content/website-server';
import { pageMetadata } from '@/modules/content/seo';
import { ExploreView } from '@/components/public/editorial-pages';
export async function generateMetadata(){const c=await getPublishedWebsite();return pageMetadata('/explore',c['explorePage.title'],c['explorePage.text']);}
export default async function Explore(){const [home,c]=await Promise.all([getHomepage(),getPublishedWebsite()]);return <ExploreView home={home} c={c} places={(await getPublicDestinations()).filter(d=>d.showOnPage)}/>;}
