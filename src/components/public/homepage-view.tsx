import { ExpandableText } from "./expandable-text";
import { bookingDate } from "./booking-presentation";
import type {DayPlannerData} from '@/modules/content/day-planner';
import { DayPlannerStrip } from './day-planner-strip';
import { HomepageHero } from "./homepage-hero";
import { GuestReviews } from "./guest-reviews";
import { defaultReviewSettings, type ReviewSelection } from "@/modules/content/reviews";
import { PublicBookingLink as Link } from "./booking";

import {
  ActionLink,
  Media,
  PreviewNote,
  SectionHeading,
} from "@/components/public/ui";
import { RoutePreview } from "@/components/public/route-preview";
import { LiveMapEmbed } from "@/components/public/live-map-embed";
import { visibleWebsiteLink, homepageVisible, resolveWebsiteLink, websitePlaces, type WebsiteContent } from "@/modules/content/website-schema";
import type { Homepage } from "@/modules/content/homepage";


export function HomepageView({ home, content: c, reviews = {reviews:[],settings:defaultReviewSettings}, places, planner }: { planner?:DayPlannerData; home: Homepage; content: WebsiteContent; reviews?: ReviewSelection; places?: ReturnType<typeof websitePlaces> }) {
  const destinations = places ?? websitePlaces(c);


  return (
    <main id="main-content" className={`p-home${homepageVisible(c, "hero") ? "" : " p-home-no-hero"}`}>
      {homepageVisible(c, "hero") && <HomepageHero content={c} fare={home.heroFare}/>}
{homepageVisible(c, "intro") && <section id="home-intro" className="p-section p-container p-intro">
        <PreviewNote />
        {home.state === "unavailable" && (
          <p role="alert" className="p-empty">
            Tour information is temporarily unavailable. Please try again later.
          </p>
        )}
        {(home.state === "empty" || home.state === "unconfigured") && (
          <p className="p-preview">
            Our tour and timetable have not been published yet. The places below
            are inspiration for your visit.
          </p>
        )}
        <SectionHeading
          eyebrow={c["intro.eyebrow"]}
          title={c["intro.title"]}
        >
          <ExpandableText text={c["intro.text"]} />
          {visibleWebsiteLink(c["intro.link"], c) && <Link className="p-text-link" href={resolveWebsiteLink(c["intro.link"])}>{c["intro.linkLabel"]}</Link>}
        </SectionHeading>
        <DayPlannerStrip initial={planner} />
      </section>}
      {homepageVisible(c, "route") && <section id="route" className="p-section p-container">
        <SectionHeading
          eyebrow={c["route.eyebrow"]}
          title={c["route.title"]}
        >
            <ExpandableText text={c["route.text"]} />
        </SectionHeading>
        <RoutePreview places={destinations} showNote={false} />
      </section>}
      {homepageVisible(c, "live") && <section className="p-live-section">
        <div className="p-container p-live-grid">
          <div>
            <p className="p-eyebrow">{c["live.eyebrow"]}</p>
            <h2>
              {c["live.title"]}
              <br />
              <em>{c["live.emphasis"]}</em>
            </h2>
            <p>
              {c["live.text"]}
            </p>
            <ActionLink href="/route">{c["live.linkLabel"]}</ActionLink>
          </div>
          <LiveMapEmbed />
        </div>
      </section>}
      {homepageVisible(c, "departures") && <section className="p-section p-container p-departures">
        <SectionHeading
          eyebrow={c["departures.eyebrow"]}
          title={c["departures.title"]}
        >
          <Link className="p-text-link" href="/tour#timetable">
            {c["departures.linkLabel"]}
          </Link>
        </SectionHeading>
        <div className="p-empty">
          {home.schedule === "ready" ? (
            <>
              <strong>{home.frequency}</strong>
              <p>
                {home.date?bookingDate(home.date):"Choose a date"} · Local Shkodra time. Scheduled departures; check availability for your selected date.
              </p>
              {home.departures.length > 0 && (
                <ul
                  className="p-departure-times"
                  aria-label="Upcoming departures today"
                >
                  {home.departures.slice(0, 6).map((departure, index) => (
                    <li key={`${departure.time}-${index}`}>
                      <time dateTime={`${home.date}T${departure.time}`}>
                        {departure.time}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
              {home.departures.length > 6 && (
                <p>Showing the next six departures.</p>
              )}
            </>
          ) : (
            <>
              <strong>Departures will be published here.</strong>
              <p>
                No timetable is available yet. Check back before planning your
                journey.
              </p>
            </>
          )}
        </div>
      </section>}
      {homepageVisible(c, "reviews") && <GuestReviews selection={reviews} eyebrow={c["reviews.eyebrow"]} title={c["reviews.title"]} subtitle={c["reviews.text"]} />}
      {homepageVisible(c, "notebook") && <section className="p-section p-container">
        <SectionHeading
          eyebrow={c["notebook.eyebrow"]}
          title={c["notebook.title"]}
        >
          <Link className="p-text-link" href="/explore">
            {c["notebook.linkLabel"]}
          </Link>
        </SectionHeading>
        <div className="p-editorial">
          {destinations.map(
            (place) => (
              <Link
                href={
                  place.link
                }
                key={place.id}
              >
                <Media src={place.image} alt={place.alt} />
                <p className="p-eyebrow">{place.tag}</p>
                <h3>{place.name}</h3>
                <span className="p-text-link">{c["notebook.0.linkLabel"]}</span>
              </Link>
            ),
          )}
        </div>
      </section>}
    </main>
  );
}

