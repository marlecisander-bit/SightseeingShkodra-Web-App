import { FaqPage } from '@/components/public/faq-page';
import { getFaqInclusions } from '@/modules/content/faq-server';
import { getWebsitePublication } from '@/modules/content/website-server';
import { pageMetadata } from '@/modules/content/seo';

export async function generateMetadata() {
  const { content, published } = await getWebsitePublication();
  return pageMetadata('/faq', content['tourPage.faqTitle'], 'Questions about booking, boarding, ticket inclusions and live tracking.', published);
}

export default async function Faq() {
  const [{ content }, inclusions] = await Promise.all([getWebsitePublication(), getFaqInclusions()]);
  return <FaqPage content={content} inclusions={inclusions} />;
}
