import { getPublicDestinations } from "@/modules/content/destinations-server";
import { PageIntro } from "@/components/public/page-intro";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionLink, SectionHeading } from "@/components/public/ui";
import { LiveMapEmbed } from "@/components/public/live-map-embed";

import { getPublishedWebsite } from "@/modules/content/website-server";
export const metadata: Metadata = {
  title: "Your day preview | Sightseeing Shkodra",
};

export default async function YourDay() {
  const c=await getPublishedWebsite(),destinations=(await getPublicDestinations()).filter(d=>d.showOnPage);
  return (
    <main id="main-content" className="p-subpage p-container">
      <PageIntro content={c} prefix="dayPage"/>
      <p className="p-preview">
        Sample ticket screen · No booking exists. Not valid for travel.
      </p>
      <div className="p-companion">
        <section className="p-ticket" aria-label="Sample ticket">
          <span className="p-eyebrow">SAMPLE / NOT VALID</span>
          <h2>The Shkodra day tour</h2>
          <dl>
            <div>
              <dt>Guests</dt>
              <dd>Sample guest</dd>
            </div>
            <div>
              <dt>Validity</dt>
              <dd>No date assigned</dd>
            </div>
            <div>
              <dt>Booking status</dt>
              <dd>Preview only</dd>
            </div>
          </dl>
          <div
            className="p-qr-placeholder"
            aria-label="Ticket QR placeholder, not scannable"
          >
            <span aria-hidden="true">▧</span>
            <p>
              Sample QR placeholder. Not valid for travel.
              <br />
              Payment for confirmed bookings is due at the meeting point.
            </p>
          </div>
          <Button className="p-button" disabled>
            Ticket not issued
          </Button>
        </section>
        <div>
          <LiveMapEmbed />
          <ActionLink href="/live">Track van</ActionLink>
          <nav className="p-section-nav" aria-label="Travel support">
            <Link href="/tour#timetable">Timetable & boarding</Link>
            <Link href="/tour#faq">Help & questions</Link>
          </nav>
        </div>
      </div>
      <section className="p-section">
        <SectionHeading
          eyebrow={c["route.eyebrow"]}
          title={c["route.title"]}
        />
        <p className="p-preview">
          Illustrative journey · Route and progress are not live.
        </p>
        <ol className="p-journey">
          {destinations.map((place) => (
            <li key={place.id}>
              <Link href={`/explore#${place.id}`}>{place.name}</Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
