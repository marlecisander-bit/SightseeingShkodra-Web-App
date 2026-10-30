import {ProductBookingCards} from './product-booking-cards';
import type {BookableProduct} from '@/modules/booking/products';
import { PartnersSection } from './partners-section';
import type {Partner} from '@/modules/content/partners';
import {HomepageJourney,HomepageJourneyProvider} from './homepage-journey';
import {routeHeading} from '@/modules/content/editorial-fields';
import type { DayPlannerData } from "@/modules/content/day-planner";
import { HomepageHero } from "./homepage-hero";
import { GuestReviews } from "./guest-reviews";
import { defaultReviewSettings, type ReviewSelection } from "@/modules/content/reviews";
import { ActionLink } from "./ui";
import { homepageVisible, websitePlaces, type WebsiteContent } from "@/modules/content/website-schema";
import type { Homepage } from "@/modules/content/homepage";

export function HomepageView({ home, content: c, reviews = {reviews:[],settings:defaultReviewSettings}, places, planner, partners = [],products = [],preview=false }: { products?:BookableProduct[]; preview?:boolean; partners?:Partner[]; planner?:DayPlannerData; home: Homepage; content: WebsiteContent; reviews?: ReviewSelection; places?: ReturnType<typeof websitePlaces> }) {
  const destinations = places ?? websitePlaces(c);
  const offers=products.length?products:home.product?[{id:home.product.id,title:home.product.title,slug:home.product.slug,mode:'selected_departure' as const,minutes:120}]:[];
  const cards=offers.map(p=>p.id===home.product?.id&&!p.card?{...p,card:{image:c['hero.desktop'],alt:c['hero.alt'],description:c['hero.description']??'',order:0,enabled:true}}:p);
  return <HomepageJourneyProvider><main id="main-content" className={`p-home${homepageVisible(c,"hero") ? "" : " p-home-no-hero"}`}>
    {!homepageVisible(c,"hero") && <h1 className="p-screen-reader-only">{home.product?.title ?? c["seo.title"]}</h1>}
    {homepageVisible(c,"hero") && <HomepageHero content={c} fare={home.heroFare} productTitle={home.product?.title} stopCount={homepageVisible(c,"route") ? planner?.stops?.length : undefined}/>}
    <ProductBookingCards products={cards} content={c} preview={preview} fares={home.product&&home.heroFare?{[home.product.id]:home.heroFare}:{}}/>
    {homepageVisible(c,"route") && <section id="route" className="p-section p-container p-home-stops" aria-label="Route and stops">
      <div className="p-home-route-heading"><div><p className="p-eyebrow">{c["homeRoute.eyebrow"]}</p>
      <h2>{routeHeading(c["homeRoute.title"],planner?.stops?.length)}</h2><p>{c["homeRoute.text"]}</p></div><ActionLink href="/route">{c["homeRoute.action"]}</ActionLink></div>
      <HomepageJourney stops={planner?.stops??[]} places={destinations} learnLabel={c['labels.destination']}/>
    </section>}
    {homepageVisible(c,"reviews") && <GuestReviews labels={c} selection={reviews} eyebrow={c["reviews.eyebrow"]} title={c["reviews.title"]} subtitle={c["reviews.text"]}/>}
    <PartnersSection content={c} partners={partners}/>
  </main></HomepageJourneyProvider>;
}
