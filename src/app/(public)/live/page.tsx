import type { Metadata } from "next";
import { RoutePreview } from "@/components/public/route-preview";
import styles from "./live-map.module.css";
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
      <iframe
        className={styles.map}
        src="https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra&embed=1"
        title="Sightseeing Shkodra live van map"
        loading="lazy"
        allow="geolocation"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <p>
        If the map does not load, {" "}
        <a href="https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra" target="_blank" rel="noopener noreferrer">open the live map in a new tab</a>.
      </p>
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
