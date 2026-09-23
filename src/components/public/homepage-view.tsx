import Link from "next/link";
import { BookButton, BookingBar } from "@/components/public/booking";
import {
  ActionLink,
  Media,
  PreviewNote,
  SectionHeading,
} from "@/components/public/ui";
import { RoutePreview } from "@/components/public/route-preview";
import { LiveMapEmbed } from "@/components/public/live-map-embed";
import { websitePlaces, type WebsiteContent } from "@/modules/content/website-schema";
import type { Homepage } from "@/modules/content/homepage";


const excerpt = (value: string, length: number) => value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
export function HomepageView({ home, content: c }: { home: Homepage; content: WebsiteContent }) {
  const destinations = websitePlaces(c);
  const routeFacts = "View route on the live map";
  return (
    <main id="main-content" className="p-home">
      <section
        className="p-hero"
      >
        <Media
          src={c["hero.desktop"]} mobileSrc={c["hero.mobile"]}
          alt={c["hero.alt"]}
          hero
        />
        <div className="p-hero-content">
          <p className="p-eyebrow">{c["hero.eyebrow"]}</p>
          <h1>{c["hero.title"]}<br /><em>{c["hero.emphasis"]}</em></h1>
          <p>{c["hero.description"]}<br />{c["hero.subtitle"]}</p>
          <div className="p-actions">
            <BookButton>{c["hero.book"]}</BookButton>
            <Link className="p-hero-track" href="/live">
              <span aria-hidden="true">◎</span> {c["hero.track"]} ↗
            </Link>
          </div>
        </div>
        <div className="p-hero-bottom">
          <span>{home.price} · Booking opens soon</span>
          <span>{routeFacts}</span>
          <a href="#booking">{c["hero.discover"]} ↓</a>
        </div>
      </section>
      <div className="p-container">
        <BookingBar facts={home} />
      </div>
      <section className="p-section p-container p-intro">
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
          <p>{c["intro.text"]}</p>
          <Link className="p-text-link" href={c["intro.link"]}>{c["intro.linkLabel"]} ↗</Link>
        </SectionHeading>
        <div className="p-facts">
          <div>
            <span>01 / HOP ON</span>
            <strong>{home.price}</strong>
            <small>
              {home.product?.title ?? "Ticket details before launch"}
            </small>
          </div>
          <div>
            <span>02 / EXPLORE</span>
            <strong>{routeFacts}</strong>
            <small>
              {home.product
                ? "See boarding stops in the live map"
                : "Discover the places below"}
            </small>
          </div>
          <div>
            <span>03 / HOP BACK ON</span>
            <strong>{home.frequency}</strong>
            <small>
              {home.timezone
                ? `Local time · ${home.timezone}`
                : "Operating details before launch"}
            </small>
          </div>
          <div>
            <span>ALWAYS CLOSE BY</span>
            <strong>Follow your van</strong>
            <small>View the live van map</small>
          </div>
        </div>
      </section>
      <section id="route" className="p-section p-container">
        <SectionHeading
          eyebrow={c["route.eyebrow"]}
          title={c["route.title"]}
        >
          <p>
            {c["route.text"]}
          </p>
        </SectionHeading>
        <RoutePreview places={destinations} />
      </section>
      <section className="p-section p-container" id="destinations">
        <SectionHeading
          eyebrow={c["destinations.eyebrow"]}
          title={c["destinations.title"]}
        />
        <div className="p-stories">
          {[
            destinations[2],
            destinations[1],
            destinations[0],
            destinations[3],
          ].map((place, i) => (
            <article
              key={place.id}
              className={i % 2 ? "p-story p-story-offset" : "p-story"}
            >
              <Link
                href={
                  place.link
                }
                aria-label={`Discover ${place.name}`}
              >
                <Media src={place.image} alt={place.alt} />
              </Link>
              <p className="p-eyebrow">{place.tag}</p>
              <h3>
                {place.name}
              </h3>
              <p>
                {excerpt(
                  place.text,
                  260,
                )}
              </p>
              <Link
                className="p-text-link"
                href={
                  place.link
                }
              >
                Discover {place.name} ↗
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="p-live-section">
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
            <ActionLink href="/live">{c["live.linkLabel"]}</ActionLink>
          </div>
          <LiveMapEmbed />
        </div>
      </section>
      <section className="p-section p-container">
        <SectionHeading
          eyebrow={c["how.eyebrow"]}
          title={c["how.title"]}
        />
        <ol className="p-how">
          {[0, 1, 2, 3].map(i => [c[`how.${i}.title`], c[`how.${i}.text`]]).map(([title, text], i) => (
            <li key={title}>
              <span>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="p-container p-departures">
        <SectionHeading
          eyebrow={c["departures.eyebrow"]}
          title={c["departures.title"]}
        >
          <Link className="p-text-link" href="/tour#timetable">
            {c["departures.linkLabel"]} ↗
          </Link>
        </SectionHeading>
        <div className="p-empty">
          {home.schedule === "ready" ? (
            <>
              <strong>{home.frequency}</strong>
              <p>
                {home.date} · {home.timezone}. Scheduled times; booking is not
                open yet.
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
      </section>
      <section className="p-section p-container p-review">
        <p className="p-eyebrow">{c["reviews.eyebrow"]}</p>
        <h2>{c["reviews.title"]}</h2>
        <p>
          {c["reviews.text"]}
          <br />
          {c["reviews.second"]}
        </p>
      </section>
      <section className="p-section p-container">
        <SectionHeading
          eyebrow={c["notebook.eyebrow"]}
          title={c["notebook.title"]}
        >
          <Link className="p-text-link" href="/explore">
            {c["notebook.linkLabel"]} ↗
          </Link>
        </SectionHeading>
        <div className="p-editorial">
          {[destinations[0], destinations[1], destinations[2]].map(
            (place, i) => (
              <Link
                href={
                  place.link
                }
                key={place.id}
              >
                <Media src={place.image} alt={place.alt} />
                <p className="p-eyebrow">{c[`notebook.${i}.tag`]}</p>
                <h3>{c[`notebook.${i}.title`]}</h3>
                <span className="p-text-link">{c[`notebook.${i}.linkLabel`]} ↗</span>
              </Link>
            ),
          )}
        </div>
      </section>
      <section className="p-final">
        <Media
          src={c["final.image"]}
          alt={c["final.alt"]}
        />
        <div>
          <p className="p-eyebrow">{c["final.eyebrow"]}</p>
          <h2>{c["final.title"]}<br /><em>{c["final.emphasis"]}</em></h2>
          <BookButton>{c["final.book"]}</BookButton>
          <PreviewNote />
        </div>
      </section>
    </main>
  );
}
