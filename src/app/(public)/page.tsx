import {getBookableProducts} from '@/modules/booking/products-server';
import {loadPublicPartners} from '@/modules/content/partners-server';
import {homepageVisible} from '@/modules/content/website-schema';
import {getDayPlanner} from '@/modules/content/day-planner-server';
import { getPublicDestinations } from "@/modules/content/destinations-server";
import { getPublicReviews } from "@/modules/content/reviews-server";
import { getHomepage } from "@/modules/content/homepage-server";
import { getWebsitePublication } from "@/modules/content/website-server";
import { HomepageView } from "@/components/public/homepage-view";
import { websiteMetadata } from "@/modules/content/seo";
export async function generateMetadata() {
  const { content: c, published } = await getWebsitePublication();
  return websiteMetadata(c,published);
}
export default async function Home() {
  const publication = await getWebsitePublication();
  if (!publication.published) return <main id="main-content" className="p-section p-container"><p role="alert">Website content is temporarily unavailable. Please try again later.</p></main>;
  const content = publication.content;
  const [home, reviews, planner, places, partners,products] = await Promise.all([getHomepage(), getPublicReviews(), getDayPlanner(), getPublicDestinations(), loadPublicPartners(homepageVisible(content,"partners")),getBookableProducts().catch(()=>[])]);
  return <HomepageView products={products.filter(p=>!p.primary&&p.id!==home.product?.id)} partners={partners} planner={planner} home={home} content={content} reviews={reviews} places={places.filter(d=>d.showOnHomepage)} />;
}
