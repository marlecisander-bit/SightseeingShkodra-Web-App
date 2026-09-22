import type { Metadata } from "next";
import { RoutePreview } from "@/components/public/route-preview";
import { SharedMap } from "@/modules/tracking/shared-map";
import { SectionHeading, PreviewNote } from "@/components/public/ui";
export const metadata: Metadata = { title: "Live map | Sightseeing Shkodra" };

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
      <p>Live vehicle updates are not connected yet. Please confirm departure details with staff.</p>
      <SharedMap mode="view" snapshot={{state: "unavailable", positions: []}} publishedMap={{state: "empty", routes: [], points: []}} />
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
