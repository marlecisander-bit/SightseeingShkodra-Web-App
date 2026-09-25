import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getPublishedWebsite } from '@/modules/content/website-server';
import { pageMetadata } from '@/modules/content/seo';
import { LiveView } from '@/components/public/editorial-pages';
export async function generateMetadata(){const c=await getPublishedWebsite();return pageMetadata('/live',c['live.title'],c['live.text']);}
export default async function Live(){return <LiveView c={await getPublishedWebsite()} places={(await getPublicDestinations()).filter(d=>d.showOnPage)}/>;}
