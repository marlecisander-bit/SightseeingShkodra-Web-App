import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getHomepage } from '@/modules/content/homepage-server';
import { getPublishedWebsite } from '@/modules/content/website-server';
import { pageMetadata } from '@/modules/content/seo';
import { TourView } from '@/components/public/editorial-pages';
export async function generateMetadata(){const {product:p}=await getHomepage();const m=pageMetadata('/tour',p?.metaTitle??p?.title??'Day tour | Sightseeing Shkodra',p?.description??'Tour information',Boolean(p));return {...m,openGraph:{...m.openGraph,...(p?.ogImage?{images:[{url:p.ogImage,alt:p.ogImageAlt??''}]}:{})}};}
export default async function Tour(){const [tour,c,places]=await Promise.all([getHomepage(),getPublishedWebsite(),getPublicDestinations()]);return <TourView tour={tour} c={c} places={places.filter(d=>d.showOnPage)}/>;}
