import Link from "next/link";
import { BookButton, BookingBar } from "@/components/public/booking";
import {
  ActionLink,
  Media,
  PreviewNote,
  SectionHeading,
} from "@/components/public/ui";
import { RoutePreview, TrackingShell } from "@/components/public/route-preview";
import { destinations } from "@/modules/public-preview/contracts";
import { getHomepage } from "@/modules/content/homepage-server";
import { PublishedStops } from "@/components/public/published-stops";
import type { Metadata } from "next";

const excerpt = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomepage();
  const hero = home.content["homepage-hero"];
  return {
    title: hero?.metaTitle ?? "Sightseeing Shkodra",
    description:
      hero?.metaDescription ??
      "Discover Shkodra. Tour details and booking information coming soon.",
  };
}
export default async function Home() {
  const home = await getHomepage();
  const hero = home.content["homepage-hero"];
  const intro = home.content["homepage-intro"];
  const final = home.content["homepage-final"];
  const routeFacts = home.product?.stops.length
    ? `${home.product.stops.length} published stops`
    : "Route to be announced";
  return (
    <main id="main-content" className="p-home">
      <section
        className={`p-hero ${hero || home.product ? "p-hero-managed" : ""}`}
      >
        <Media
          src="/images/lake.webp"
          alt="The Buna River and Lake Shkodra stretching towards the mountains, viewed from Rozafa Castle"
          hero
        />
        <div className="p-hero-content">
          <p className="p-eyebrow">SHKODËR, ALBANIA · GO A LITTLE FURTHER</p>
          {hero ? (
            <h1>{excerpt(hero.title, 100)}</h1>
          ) : (
            <h1>
              Discover Shkodra.
              <br />
              <em>Your way.</em>
            </h1>
          )}
          {hero || home.product?.description ? (
            <p className="p-content-text">
              {excerpt(hero?.text ?? home.product!.description!, 300)}
            </p>
          ) : (
            <p>
              A day between the city, the castle and the lake.
              <br />
              Hop on. Wander off. Make it yours.
            </p>
          )}
          <div className="p-actions">
            <BookButton>Book your day</BookButton>
            <Link className="p-hero-track" href="/live">
              <span aria-hidden="true">◎</span> Track live ↗
            </Link>
          </div>
        </div>
        <div className="p-hero-bottom">
          <span>{home.price} · Booking opens soon</span>
          <span>{routeFacts}</span>
          <a href="#booking">Discover your day ↓</a>
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
          eyebrow="A DAY WITH POSSIBILITIES"
          title={
            intro?.title ??
            home.product?.title ??
            "One ticket. One day.\nShkodra at your pace."
          }
        >
          {intro ? (
            <p className="p-content-text">{excerpt(intro.text, 700)}</p>
          ) : (
            <p>
              A coffee in the old town. A castle above the rivers. An unhurried
              afternoon by the lake. Leave space for the moments you didn’t
              plan.
            </p>
          )}
          <Link className="p-text-link" href="/tour">
            Meet your day tour ↗
          </Link>
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
                ? "See published boarding stops below"
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
            <small>Live tracking coming soon</small>
          </div>
        </div>
      </section>
      <section id="route" className="p-section p-container">
        <SectionHeading
          eyebrow="THE PLACES BETWEEN"
          title="A route worth taking."
        >
          <p>
            Get to know the places that make Shkodra, Shkodra. Pick a
            destination and imagine your day.
          </p>
        </SectionHeading>
        {home.product ? (
          <PublishedStops stops={home.product.stops} />
        ) : (
          <RoutePreview />
        )}
      </section>
      <section className="p-section p-container" id="destinations">
        <SectionHeading
          eyebrow="FOUR REASONS TO LINGER"
          title="Stay curious. Stay a little longer."
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
                href={`/explore#${place.id}`}
                aria-label={`Discover ${place.name}`}
              >
                <Media src={place.image} alt={place.alt} />
              </Link>
              <p className="p-eyebrow">{place.tag}</p>
              <h3>
                {home.content[`explore-${place.id}`]?.title ?? place.name}
              </h3>
              <p>
                {excerpt(
                  home.content[`explore-${place.id}`]?.text ?? place.text,
                  260,
                )}
              </p>
              <Link className="p-text-link" href={`/explore#${place.id}`}>
                Discover {place.name} ↗
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="p-live-section">
        <div className="p-container p-live-grid">
          <div>
            <p className="p-eyebrow">YOUR DAY, WITHOUT THE GUESSWORK</p>
            <h2>
              More time here.
              <br />
              <em>Less time waiting.</em>
            </h2>
            <p>
              When you’re ready for your next stop, find your van. Live tracking
              will keep the journey close at hand.
            </p>
            <ActionLink href="/live">Open live map</ActionLink>
          </div>
          <TrackingShell />
        </div>
      </section>
      <section className="p-section p-container">
        <SectionHeading
          eyebrow="IT’S YOUR DAY"
          title="Keep it beautifully simple."
        />
        <ol className="p-how">
          {[
            ["Choose your day", "One daily ticket. Room for your own plans."],
            ["Hop on", "Find your boarding point and settle in."],
            [
              "Follow your curiosity",
              "Step off and enjoy the places you came for.",
            ],
            ["Find your next ride", "Check the live map and hop back on."],
          ].map(([title, text], i) => (
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
          eyebrow="TODAY, AT A GLANCE"
          title="Where will the day take you?"
        >
          <Link className="p-text-link" href="/tour#timetable">
            Timetable & boarding ↗
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
        <p className="p-eyebrow">DAYS WORTH SHARING</p>
        <h2>Your stories belong here.</h2>
        <p>
          Traveler reviews will appear here with their original sources.
          <br />
          Until then, let the places speak for themselves.
        </p>
      </section>
      <section className="p-section p-container">
        <SectionHeading
          eyebrow="THE LOCAL NOTEBOOK"
          title="A little more Shkodra."
        >
          <Link className="p-text-link" href="/explore">
            Explore the guide ↗
          </Link>
        </SectionHeading>
        <div className="p-editorial">
          {[destinations[0], destinations[1], destinations[2]].map(
            (place, i) => (
              <Link href={`/explore#${place.id}`} key={place.id}>
                <Media src={place.image} alt={place.alt} />
                <p className="p-eyebrow">
                  {
                    ["A DAY IN THE CITY", "ABOVE IT ALL", "THE SLOW AFTERNOON"][
                      i
                    ]
                  }
                </p>
                <h3>
                  {
                    [
                      "How would you spend a day in Shkodra?",
                      "Make time for Rozafa.",
                      "Meet the lake. Forget the hurry.",
                    ][i]
                  }
                </h3>
                <span className="p-text-link">Take a closer look ↗</span>
              </Link>
            ),
          )}
        </div>
      </section>
      <section className="p-final">
        <Media
          src="/images/castle.webp"
          alt="Rozafa Castle and the green landscape around Shkodra"
        />
        <div>
          <p className="p-eyebrow">LESS RUSH. MORE SHKODRA.</p>
          {final ? (
            <>
              <h2>{excerpt(final.title, 100)}</h2>
              <p className="p-content-text">{excerpt(final.text, 300)}</p>
            </>
          ) : (
            <h2>
              A day you’ll
              <br />
              <em>make your own.</em>
            </h2>
          )}
          <BookButton>Book your day</BookButton>
          <PreviewNote />
        </div>
      </section>
    </main>
  );
}
