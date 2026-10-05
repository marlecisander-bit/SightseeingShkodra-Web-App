import { ExpandableText } from "./expandable-text";
import { BookingPriceIndicator } from "./booking-controls";
import type { DayPlannerData } from "@/modules/content/day-planner";
import { DayPlannerStrip } from "./day-planner-strip";
import { HomepageHero } from "./homepage-hero";
import { GuestReviews } from "./guest-reviews";
import { defaultReviewSettings, type ReviewSelection } from "@/modules/content/reviews";
import { PublicBookingLink as Link } from "./booking";
import { ActionLink, Media, PreviewNote, SectionHeading } from "./ui";
import { RoutePreview } from "./route-preview";
import { HomepageMapDisclosure } from "./live-map-embed";
import { visibleWebsiteLink, homepageVisible, resolveWebsiteLink, websitePlaces, type WebsiteContent } from "@/modules/content/website-schema";
import type { Homepage } from "@/modules/content/homepage";

export function HomepageView({ home, content: c, reviews = {reviews:[],settings:defaultReviewSettings}, places, planner }: { planner?:DayPlannerData; home: Homepage; content: WebsiteContent; reviews?: ReviewSelection; places?: ReturnType<typeof websitePlaces> }) {
  const destinations = places ?? websitePlaces(c);
  const TimetableHeading = homepageVisible(c,"live") ? "h3" : "h2";
  return <main id="main-content" className={`p-home${homepageVisible(c,"hero") ? "" : " p-home-no-hero"}`}>
    {!homepageVisible(c,"hero") && <h1 className="p-screen-reader-only">{home.product?.title ?? c["seo.title"]}</h1>}
    {homepageVisible(c,"hero") && <HomepageHero content={c} fare={home.heroFare} productTitle={home.product?.title} stopCount={homepageVisible(c,"route") ? planner?.stops?.length : undefined}/>}
    {homepageVisible(c,"intro") && <section id="home-intro" className="p-section p-container p-home-how" aria-label="How it works">
      <SectionHeading eyebrow={c["how.eyebrow"]} title={c["how.title"]}/>
      <ol>{[0,1,2,3].map(i=><li key={i}><span aria-hidden="true">0{i+1}</span><div><h3>{c[`how.${i}.title`]}</h3></div></li>)}</ol>
      <details className="p-home-how-details"><summary>More about your day</summary>{[0,1,2,3].map(i=><p key={i}><strong>{c[`how.${i}.title`]}.</strong> {c[`how.${i}.text`]}</p>)}</details>
      {homepageVisible(c,"route") && <Link className="p-text-link" href="#route">View route &amp; stops</Link>}
    </section>}
    {homepageVisible(c,"route") && <section id="route" className="p-section p-container p-home-stops" aria-label="Route and stops">
      <p className="p-eyebrow">Route &amp; stops</p>
      <h2>{planner?.stops?.length ? `${planner.stops.length} ${planner.stops.length===1?"stop":"stops"} around Shkodra` : "Explore the route"}</h2>
      {planner?.stops?.length ? <ol>{planner.stops.map((stop,i)=><li key={stop.id}><span aria-hidden="true">{String(i+1).padStart(2,"0")}</span><Link href="/route">{stop.label}</Link></li>)}</ol> : <p>View the published boarding points on the route page.</p>}
      <ActionLink href="/route">View Route &amp; Live Map</ActionLink>
    </section>}
    {(homepageVisible(c,"live") || homepageVisible(c,"departures")) && <section className="p-section p-home-service" aria-label="Live service">
      <div className="p-container p-home-service-grid" data-live={homepageVisible(c,"live")}>{homepageVisible(c,"live") && <div>
        {homepageVisible(c,"live") && <><p className="p-eyebrow">{c["live.eyebrow"]}</p><h2>{c["live.title"]} {" "}<em>{c["live.emphasis"]}</em></h2><p>{c["live.text"]}</p></>}
        {homepageVisible(c,"live") && <ActionLink href="/route">{c["live.linkLabel"]}</ActionLink>}
      </div>}<div>
        {homepageVisible(c,"departures") && <details className="p-home-timetable"><summary>{c["departures.eyebrow"]}</summary><TimetableHeading>{c["departures.title"]}</TimetableHeading></details>}
        <DayPlannerStrip initial={planner} heroSummaryTarget={homepageVisible(c,"hero") ? "home-hero-service" : undefined} service showSchedule={homepageVisible(c,"departures")} showLive={homepageVisible(c,"live")}/>
        {homepageVisible(c,"departures") && <Link className="p-text-link" href="/tour#timetable">{c["departures.linkLabel"]}</Link>}
        {homepageVisible(c,"live") && <HomepageMapDisclosure/>}
      </div></div>
    </section>}
    {homepageVisible(c,"intro") && <section id="home-experience" className="p-section p-container p-intro">
      {home.state==="unavailable" && <p role="alert" className="p-empty">Tour information is temporarily unavailable. Please try again later.</p>}
      {(home.state==="empty" || home.state==="unconfigured") && <p className="p-preview">Our tour and timetable have not been published yet. The places below are inspiration for your visit.</p>}
      <SectionHeading eyebrow={c["intro.eyebrow"]} title={c["intro.title"]}>
        <ExpandableText text={c["intro.text"]}/>
        {visibleWebsiteLink(c["intro.link"],c) && <Link className="p-text-link" href={resolveWebsiteLink(c["intro.link"])}>{c["intro.linkLabel"]}</Link>}
      </SectionHeading>
    </section>}
    {homepageVisible(c,"route") && <section id="home-highlights" className="p-section p-container">
      <SectionHeading eyebrow={c["route.eyebrow"]} title={c["route.title"]}><ExpandableText text={c["route.text"]}/></SectionHeading>
      <RoutePreview places={destinations} showNote={false}/>
    </section>}
    {homepageVisible(c,"notebook") && <section className="p-section p-container">
      <SectionHeading eyebrow={c["notebook.eyebrow"]} title={c["notebook.title"]}><Link className="p-text-link" href="/explore">{c["notebook.linkLabel"]}</Link></SectionHeading>
      <div className="p-editorial">{destinations.map(place=><Link href={place.link} key={place.id}><Media src={place.image} alt={place.alt}/><p className="p-eyebrow">{place.tag}</p><h3>{place.name}</h3><span className="p-text-link">{c["notebook.0.linkLabel"]}</span></Link>)}</div>
    </section>}
    {home.product && <section id="home-ticket" className="p-section p-container" aria-label="Daily ticket">
      <div className="p-home-ticket"><div><p className="p-eyebrow">Daily ticket</p><h2>{home.product.title}</h2>
        {home.product.description && <ExpandableText text={home.product.description}/>}
        {home.product.inclusions && <><h3>{c["tourPage.includedTitle"]}</h3><ExpandableText text={home.product.inclusions} collapsedLines={{mobile:3,tablet:4,desktop:6}} className="p-ticket-inclusions"/></>}
        <Link className="p-text-link" href="/tour#included">View ticket details</Link>
      </div><div className="p-home-ticket-action"><BookingPriceIndicator amount={home.heroFare?.amount} date={home.heroFare?.date} currency={home.heroFare?.currency}/><ActionLink href="/book" className="p-button-booking">{c["hero.book"]}</ActionLink><PreviewNote/><Link className="p-text-link" href="/faq">Questions? View FAQ</Link></div></div>
    </section>}
    {homepageVisible(c,"reviews") && <GuestReviews selection={reviews} eyebrow={c["reviews.eyebrow"]} title={c["reviews.title"]} subtitle={c["reviews.text"]}/>}
  </main>;
}
