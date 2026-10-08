import { FaqPage } from '@/components/public/faq-page';
import { getFaqInclusions } from '@/modules/content/faq-server';
import { getWebsitePublication } from '@/modules/content/website-server';
import { editorialMetadata } from '@/modules/content/seo';

export async function generateMetadata() {
  const { content, published } = await getWebsitePublication();
  return editorialMetadata('/faq', 'faqPage', content, published);
}

export default async function Faq() {
  const [{ content }, inclusions] = await Promise.all([getWebsitePublication(), getFaqInclusions()]);
  return <FaqPage content={content} inclusions={inclusions} />;
}
