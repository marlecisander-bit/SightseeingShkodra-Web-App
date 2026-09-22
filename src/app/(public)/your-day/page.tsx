import Link from "next/link";
import { ActionLink, SectionHeading } from "@/components/public/ui";
import { TrackingShell } from "@/components/public/route-preview";
import { destinations } from "@/modules/public-preview/contracts";
export default function YourDay() {
  return (
    <main id="main-content" className="p-subpage p-container">
      <p className="p-eyebrow">YOUR TRAVEL COMPANION</p>
      <h1>Your Shkodra day.</h1>
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
              Your ticket QR will appear
              <br />
              after confirmed payment.
            </p>
          </div>
          <button className="p-button" disabled>
            Ticket not issued
          </button>
        </section>
        <div>
          <TrackingShell />
          <ActionLink href="/live">Track van</ActionLink>
          <nav className="p-section-nav" aria-label="Travel support">
            <Link href="/tour#timetable">Timetable & boarding</Link>
            <Link href="/tour#faq">Help & questions</Link>
          </nav>
        </div>
      </div>
      <section className="p-section">
        <SectionHeading
          eyebrow="THE DAY AHEAD"
          title="One place leads to another."
        />
        <p className="p-preview">
          Illustrative journey · Route and progress are not live.
        </p>
        <ol className="p-journey">
          {destinations.map((place) => (
            <li key={place.id}>
              <Link href={`/explore#${place.id}`}>{place.name} ↗</Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
