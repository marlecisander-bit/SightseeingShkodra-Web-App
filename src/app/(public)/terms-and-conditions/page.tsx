import {getPublishedWebsite} from '@/modules/content/website-server';
import {pageMetadata} from '@/modules/content/seo';
import {LegalPage} from '@/components/public/legal-page';
export async function generateMetadata(){const c=await getPublishedWebsite();return pageMetadata('/terms-and-conditions','Terms & Conditions | Sightseeing Shkodra','Terms & Conditions',c['legal.terms.status']==='published'&&!!c['legal.terms.text']?.trim());}
export default async function Page(){return <LegalPage content={await getPublishedWebsite()} kind="terms"/>;}
