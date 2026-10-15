import { PartnersSection } from './partners-section';
import type {Partner} from '@/modules/content/partners';
import {SightseeingStopsExperience} from './sightseeing-stops-experience';
import {routeHeading} from '@/modules/content/editorial-fields';
import type { DayPlannerData } from "@/modules/content/day-planner";
import { DayPlannerStrip } from "./day-planner-strip";
import { HomepageHero } from "./homepage-hero";
import { GuestReviews } from "./guest-reviews";
import { defaultReviewSettings, type ReviewSelection } from "@/modules/content/reviews";
import { PublicBookingLink as Link } from "./booking";
import { FinalBookingInvitation, ActionLink, Media, SectionHeading } from "./ui";
import { HomepageMapDisclosure } from "./live-map-embed";
import { homepageVisible, websitePlaces, type WebsiteContent } from "@/modules/content/website-schema";
import type { Homepage } from "@/modules/content/homepage";

export function HomepageView({ home, content: c, reviews = {reviews:[],settings:defaultReviewSettings}, places, planner, partners = [] }: { partners?:Partner[]; planner?:DayPlannerData; home: Homepage; content: WebsiteContent; reviews?: ReviewSelection; places?: ReturnType<typeof websitePlaces> }) {
  const destinations = places ?? websitePlaces(c);
  const TimetableHeading = homepageVisible(c,"live") ? "h3" : "h2";
  return <main id="main-content" className={`p-home${homepageVisible(c,"hero") ? "" : " p-home-no-hero"}`}>
    {!homepageVisible(c,"hero") && <h1 className="p-screen-reader-only">{home.product?.title ?? c["seo.title"]}</h1>}
    {homepageVisible(c,"hero") && <HomepageHero content={c} fare={home.heroFare} productTitle={home.product?.title} stopCount={homepageVisible(c,"route") ? planner?.stops?.length : undefined}/>}
    {homepageVisible(c,"route") && <section id="route" className="p-section p-container p-home-stops" aria-label="Route and stops">
      <div className="p-home-route-heading"><div><p className="p-eyebrow">{c["homeRoute.eyebrow"]}</p>
      <h2>{routeHeading(c["homeRoute.title"],planner?.stops?.length)}</h2><p>{c["homeRoute.text"]}</p></div><ActionLink href="/route">{c["homeRoute.action"]}</ActionLink></div>
      <SightseeingStopsExperience mode="discover" layout="timeline" stops={planner?.stops??[]} places={destinations} learnLabel={c['labels.destination']}/>
    </section>}
    {(homepageVisible(c,"live") || homepageVisible(c,"departures")) && <section className="p-section p-home-service" aria-label="Live service">
      <div className="p-container p-home-service-grid" data-live={homepageVisible(c,"live")}>{homepageVisible(c,"live") && <div>
        {homepageVisible(c,"live") && <><p className="p-eyebrow">{c["live.eyebrow"]}</p><h2>{c["live.title"]} {" "}<em>{c["live.emphasis"]}</em></h2><p>{c["live.text"]}</p></>}
        {homepageVisible(c,"live") && <ActionLink href="/route">{c["live.linkLabel"]}</ActionLink>}
      </div>}<div>
        {homepageVisible(c,"departures") && <details className="p-home-timetable"><summary>{c["departures.eyebrow"]}</summary><TimetableHeading>{c["departures.title"]}</TimetableHeading></details>}
        <DayPlannerStrip initial={planner} heroSummaryTarget={homepageVisible(c,"hero") ? "home-hero-service" : undefined} service showSchedule={homepageVisible(c,"departures")} showLive={homepageVisible(c,"live")}/>
        {homepageVisible(c,"departures") && <Link className="p-text-link" href="/route#journey-departures">{c["departures.linkLabel"]}</Link>}
        {homepageVisible(c,"live") && <HomepageMapDisclosure/>}
      </div></div>
    </section>}
    {homepageVisible(c,"notebook") && <section className="p-section p-container">
      <SectionHeading eyebrow={c["notebook.eyebrow"]} title={c["notebook.title"]}><Link className="p-text-link" href="/explore">{c["notebook.linkLabel"]}</Link></SectionHeading>
      <div className="p-editorial">{destinations.map(place=><Link href={place.link} key={place.id}><Media src={place.image} alt={place.alt}/><p className="p-eyebrow">{place.tag}</p><h3>{place.name}</h3><span className="p-text-link">{c["notebook.0.linkLabel"]}</span></Link>)}</div>
    </section>}
    {homepageVisible(c,"reviews") && <GuestReviews labels={c} selection={reviews} eyebrow={c["reviews.eyebrow"]} title={c["reviews.title"]} subtitle={c["reviews.text"]}/>}
    <FinalBookingInvitation content={c} previewPathname="/"/>
    <PartnersSection content={c} partners={partners}/>
  </main>;
}
