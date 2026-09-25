"use client";
import { Button, ButtonContent } from "@/components/ui/button";

import { useState } from "react";
import styles from "./live-map.module.css";

const mapUrl = "https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra";

export function LiveMapEmbed() {
  const [reload, setReload] = useState(0);
  return <div className={`interactive-widget ${styles.embed}`}>
    <iframe
      key={reload}
      className={styles.map}
      src={`${mapUrl}&embed=1`}
      title="Sightseeing Shkodra live van map"
      loading="lazy"
      allow="geolocation"
      referrerPolicy="strict-origin-when-cross-origin"
    />
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => setReload(value => value + 1)}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp}>If the background stays grey, reload the map to try loading it again.</p>
  </div>;
}
