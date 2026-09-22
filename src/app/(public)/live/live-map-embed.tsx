"use client";

import { useState } from "react";
import styles from "./live-map.module.css";

const mapUrl = "https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra";

export function LiveMapEmbed() {
  const [reload, setReload] = useState(0);
  return <>
    <iframe
      key={reload}
      className={styles.map}
      src={`${mapUrl}&embed=1`}
      title="Sightseeing Shkodra live van map"
      loading="lazy"
      allow="geolocation"
      referrerPolicy="strict-origin-when-cross-origin"
    />
    <div className={styles.recovery}>
      <button type="button" onClick={() => setReload(value => value + 1)}>Reload map</button>
      <a href={mapUrl} target="_blank" rel="noopener noreferrer">Open map in a new tab</a>
    </div>
    <p>If the background stays grey, reload the map to try loading it again.</p>
  </>;
}
