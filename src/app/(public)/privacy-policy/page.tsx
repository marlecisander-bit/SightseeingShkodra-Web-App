import {getPublishedWebsite} from '@/modules/content/website-server';
import {pageMetadata} from '@/modules/content/seo';
import {LegalPage} from '@/components/public/legal-page';
export async function generateMetadata(){const c=await getPublishedWebsite();return pageMetadata('/privacy-policy','Privacy Policy | Sightseeing Shkodra','Privacy Policy',c['legal.privacy.status']==='published'&&!!c['legal.privacy.text']?.trim());}
export default async function Page(){return <LegalPage content={await getPublishedWebsite()} kind="privacy"/>;}
