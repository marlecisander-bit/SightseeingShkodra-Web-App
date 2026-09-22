import { TrackingShell, RoutePreview } from "@/components/public/route-preview";
import { SectionHeading, PreviewNote } from "@/components/public/ui";
export default function Live() {
  return (
    <main id="main-content" className="p-subpage p-container">
      <PreviewNote />
      <p className="p-eyebrow">YOUR NEXT RIDE, CLOSE AT HAND</p>
      <h1>
        More exploring.
        <br />
        <em>Less waiting.</em>
      </h1>
      <TrackingShell />
      <section className="p-section">
        <SectionHeading
          eyebrow="WHILE YOU’RE HERE"
          title="Find your next chapter."
        />
        <RoutePreview />
      </section>
    </main>
  );
}
