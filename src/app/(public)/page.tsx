import {timeHomepage} from '@/modules/diagnostics/homepage-server-timing';
import {preloadHomepageHero} from '@/components/public/homepage-hero-images';
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
  return timeHomepage('metadata',async()=>{
  const { content: c, published } = await timeHomepage('metadata.publication.await',()=>getWebsitePublication());
  return websiteMetadata(c,published);
  });
}
export default async function Home() {
  return timeHomepage('page',async()=>{
  const publication = await timeHomepage('page.publication.await',()=>getWebsitePublication());
  if (!publication.published) return <main id="main-content" className="p-section p-container"><p role="alert">Website content is temporarily unavailable. Please try again later.</p></main>;
  const content = publication.content;
  timeHomepage('hero.preload.register',()=>preloadHomepageHero(content));
  const [home, reviews, planner, places, partners,products] = await timeHomepage('page.data.await',()=>Promise.all([timeHomepage('page.home.await',()=>getHomepage()),timeHomepage('page.reviews.await',()=>getPublicReviews()),timeHomepage('page.planner.await',()=>getDayPlanner()),timeHomepage('page.places.await',()=>getPublicDestinations()),timeHomepage('page.partners.await',()=>loadPublicPartners(homepageVisible(content,"partners"))),timeHomepage('page.products.await',()=>getBookableProducts().catch(()=>[]))]));
  timeHomepage('page.jsx.ready',()=>undefined);
  return <HomepageView products={products} partners={partners} planner={planner} home={home} content={content} reviews={reviews} places={places.filter(d=>d.showOnHomepage)} />;
  });
}
