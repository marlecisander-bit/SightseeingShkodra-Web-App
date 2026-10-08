import {routeHeading} from '@/modules/content/editorial-fields';
import { ExpandableText } from "./expandable-text";
import { BookingPriceIndicator } from "./booking-controls";
import type { DayPlannerData } from "@/modules/content/day-planner";
import { DayPlannerStrip } from "./day-planner-strip";
import { HomepageHero } from "./homepage-hero";
import { GuestReviews } from "./guest-reviews";
import { defaultReviewSettings, type ReviewSelection } from "@/modules/content/reviews";
import { PublicBookingLink as Link } from "./booking";
import { ActionLink, Media, PreviewNote, SectionHeading } from "./ui";
import { HomepageMapDisclosure } from "./live-map-embed";
import { homepageVisible, websitePlaces, type WebsiteContent } from "@/modules/content/website-schema";
import type { Homepage } from "@/modules/content/homepage";

export function HomepageView({ home, content: c, reviews = {reviews:[],settings:defaultReviewSettings}, places, planner }: { planner?:DayPlannerData; home: Homepage; content: WebsiteContent; reviews?: ReviewSelection; places?: ReturnType<typeof websitePlaces> }) {
  const destinations = places ?? websitePlaces(c);
  const TimetableHeading = homepageVisible(c,"live") ? "h3" : "h2";
  return <main id="main-content" className={`p-home${homepageVisible(c,"hero") ? "" : " p-home-no-hero"}`}>
    {!homepageVisible(c,"hero") && <h1 className="p-screen-reader-only">{home.product?.title ?? c["seo.title"]}</h1>}
    {homepageVisible(c,"hero") && <HomepageHero content={c} fare={home.heroFare} productTitle={home.product?.title} stopCount={homepageVisible(c,"route") ? planner?.stops?.length : undefined}/>}
    {homepageVisible(c,"route") && <section id="route" className="p-section p-container p-home-stops" aria-label="Route and stops">
      <div className="p-home-route-heading"><div><p className="p-eyebrow">{c["homeRoute.eyebrow"]}</p>
      <h2>{routeHeading(c["homeRoute.title"],planner?.stops?.length)}</h2><p>{c["homeRoute.text"]}</p></div><ActionLink href="/route">{c["homeRoute.action"]}</ActionLink></div>
      {planner?.stops?.length ? <ol>{planner.stops.map((stop,i)=><li key={stop.id}><span aria-hidden="true">{String(i+1).padStart(2,"0")}</span><Link href="/route">{stop.label}</Link></li>)}</ol> : null}
    </section>}
    {(homepageVisible(c,"live") || homepageVisible(c,"departures")) && <section className="p-section p-home-service" aria-label="Live service">
      <div className="p-container p-home-service-grid" data-live={homepageVisible(c,"live")}>{homepageVisible(c,"live") && <div>
        {homepageVisible(c,"live") && <><p className="p-eyebrow">{c["live.eyebrow"]}</p><h2>{c["live.title"]} {" "}<em>{c["live.emphasis"]}</em></h2><p>{c["live.text"]}</p></>}
        {homepageVisible(c,"live") && <ActionLink href="/route">{c["live.linkLabel"]}</ActionLink>}
      </div>}<div>
        {homepageVisible(c,"departures") && <details className="p-home-timetable"><summary>{c["departures.eyebrow"]}</summary><TimetableHeading>{c["departures.title"]}</TimetableHeading></details>}
        <DayPlannerStrip initial={planner} ticketSummaryTarget={home.product?"home-ticket-service":undefined} heroSummaryTarget={homepageVisible(c,"hero") ? "home-hero-service" : undefined} service showSchedule={homepageVisible(c,"departures")} showLive={homepageVisible(c,"live")}/>
        {homepageVisible(c,"departures") && <Link className="p-text-link" href="/tour#timetable">{c["departures.linkLabel"]}</Link>}
        {homepageVisible(c,"live") && <HomepageMapDisclosure/>}
      </div></div>
    </section>}
    {homepageVisible(c,"notebook") && <section className="p-section p-container">
      <SectionHeading eyebrow={c["notebook.eyebrow"]} title={c["notebook.title"]}><Link className="p-text-link" href="/explore">{c["notebook.linkLabel"]}</Link></SectionHeading>
      <div className="p-editorial">{destinations.map(place=><Link href={place.link} key={place.id}><Media src={place.image} alt={place.alt}/><p className="p-eyebrow">{place.tag}</p><h3>{place.name}</h3><span className="p-text-link">{c["notebook.0.linkLabel"]}</span></Link>)}</div>
    </section>}
    {home.product && homepageVisible(c,"intro") && <section id="home-ticket" className="p-section p-container" aria-label="Daily ticket">
      <div className="p-home-ticket p-daily-ticket"><div><p className="p-eyebrow">{c["intro.eyebrow"]}</p><h2>{homepageVisible(c,"intro")?c["intro.title"]:home.product.title}</h2><h3>{home.product.title}</h3>
        {home.product.description && <ExpandableText text={home.product.description}/>}
        {home.product.inclusions && <><h3 className="p-ticket-inclusions-heading">{c["tourPage.includedTitle"]}</h3><ExpandableText text={home.product.inclusions} collapsedLines={{mobile:3,tablet:4,desktop:6}} className="p-ticket-inclusions"/></>}
        <div className="p-ticket-support">{homepageVisible(c,"route")&&!!planner?.stops?.length&&<p>{planner?.stops?.length} stops · Live van tracking</p>}{homepageVisible(c,"departures")&&<p id="home-ticket-service"/>}</div><Link className="p-text-link" href="/tour#included">{c["labels.ticket"]}</Link>
      </div><div className="p-home-ticket-action p-ticket-action"><BookingPriceIndicator amount={home.heroFare?.amount} date={home.heroFare?.date} currency={home.heroFare?.currency}/><ActionLink href="/book" className="p-button-booking">{c["hero.book"]}</ActionLink><PreviewNote/><Link className="p-text-link" href="/faq">{c["labels.faq"]}</Link></div></div>
    </section>}
    {homepageVisible(c,"reviews") && <GuestReviews labels={c} selection={reviews} eyebrow={c["reviews.eyebrow"]} title={c["reviews.title"]} subtitle={c["reviews.text"]}/>}
  </main>;
}
