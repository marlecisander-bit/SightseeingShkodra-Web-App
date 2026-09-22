import { BookingBar, BookButton } from "@/components/public/booking";
import {
  ActionLink,
  Media,
  PreviewNote,
  SectionHeading,
} from "@/components/public/ui";
import { RoutePreview, TrackingShell } from "@/components/public/route-preview";
import { experience } from "@/modules/public-preview/contracts";

export default function Tour() {
  return (
    <main id="main-content" className="p-subpage p-container">
      <PreviewNote />
      <div className="p-tour-grid">
        <div>
          <p className="p-eyebrow">ONE DAY. YOUR OWN WAY.</p>
          <h1>{experience.title}</h1>
          <p className="p-lead">
            City streets, wide-open views and a lakeside pause. A day made for
            following your curiosity.
          </p>
          <Media
            src="/images/castle.webp"
            alt="Rozafa Castle overlooking Shkodra"
            hero
          />
          <nav className="p-section-nav" aria-label="Tour sections">
            <a href="#tour-route">Route</a>
            <a href="#included">Included</a>
            <a href="#timetable">Timetable</a>
            <a href="#tour-live">Live map</a>
            <a href="#how">How it works</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
          </nav>
        </div>
        <aside className="p-booking-card">
          <p className="p-eyebrow">YOUR SHKODRA DAY</p>
          <h2>{experience.price}</h2>
          <p>Daily ticket · Details before launch</p>
          <BookButton>Choose your day</BookButton>
          <p className="p-preview">
            Explore the preview. No reservation is made.
          </p>
        </aside>
      </div>
      <section id="tour-route" className="p-section">
        <SectionHeading
          eyebrow="GET TO KNOW THE PLACES"
          title="Leave space for discovery."
        />
        <RoutePreview />
      </section>
      <section id="included" className="p-section p-narrow">
        <SectionHeading eyebrow="THE DETAILS" title="A simple day out." />
        <p>{experience.inclusions}</p>
        <p>
          Ticket validity, accessibility, attraction admission and the final
          route will be shown here before sales open.
        </p>
      </section>
      <section id="timetable" className="p-section">
        <SectionHeading eyebrow="PLAN YOUR DAY" title="Timetable & boarding." />
        <div className="p-empty">
          <h3>{experience.frequency}</h3>
          <p>
            Operating hours, frequency and exact boarding points are not
            published yet.
          </p>
        </div>
      </section>
      <section id="tour-live" className="p-section">
        <SectionHeading
          eyebrow="STAY CLOSE TO YOUR NEXT RIDE"
          title="Your van, when you need it."
        />
        <TrackingShell />
        <ActionLink href="/live">Open live map</ActionLink>
      </section>
      <section id="how" className="p-section p-narrow">
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="Choose. Hop on. Explore."
        />
        <p>
          Choose your day and guests, find your boarding point, then take the
          day at your pace. Track the van before returning to the route.
        </p>
        <BookingBar />
      </section>
      <section id="reviews" className="p-section">
        <SectionHeading
          eyebrow="TRAVELER STORIES"
          title="Good days deserve good stories."
        />
        <p>Genuine, attributed reviews will appear here when available.</p>
      </section>
      <section id="faq" className="p-section p-faq">
        <SectionHeading
          eyebrow="GOOD TO KNOW"
          title="A few questions, answered."
        />
        <details>
          <summary>Can I book now?</summary>
          <p>
            Not yet. This website is a preview. You can explore the booking
            screens without reserving seats or paying.
          </p>
        </details>
        <details>
          <summary>Where do I board?</summary>
          <p>
            Exact boarding points and departure times will be published with the
            final timetable.
          </p>
        </details>
        <details>
          <summary>Are entrance tickets included?</summary>
          <p>
            Inclusions and attraction fees will be confirmed on this page before
            booking opens.
          </p>
        </details>
        <details>
          <summary>Can I see the van live?</summary>
          <p>
            The live map is not connected yet. We will only display location and
            arrival estimates when reliable data is available.
          </p>
        </details>
      </section>
    </main>
  );
}
