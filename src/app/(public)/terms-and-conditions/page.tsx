import {getPublishedWebsite} from '@/modules/content/website-server';
import {pageMetadata} from '@/modules/content/seo';
import {LegalPage} from '@/components/public/legal-page';
export async function generateMetadata(){const c=await getPublishedWebsite();return pageMetadata('/terms-and-conditions','Terms & Conditions | Sightseeing Shkodra','Ticket validity, booking and service terms for Sightseeing Shkodra panorama tours and the hop-on hop-off Daily Ticket.',c['legal.terms.status']==='published'&&!!c['legal.terms.text']?.trim());}
export default async function Page(){return <LegalPage content={await getPublishedWebsite()} kind="terms"/>;}
