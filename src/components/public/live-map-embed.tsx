"use client";
import { Button, ButtonContent } from "@/components/ui/button";

import { useEffect, useState } from "react";
import styles from "./live-map.module.css";

const mapUrl = "https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra";

export function LiveMapEmbed({ priority = false }: { priority?: boolean }) {
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(timer);
  }, [reload]);
  return <div className={`interactive-widget ${styles.embed}`}>
    <iframe
      key={reload}
      onLoad={() => setLoaded(true)}
      className={styles.map}
      src={`${mapUrl}&embed=1`}
      title="Sightseeing Shkodra live van map"
      loading={priority ? "eager" : "lazy"}
      allow="geolocation"
      referrerPolicy="strict-origin-when-cross-origin"
    />
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => { setLoaded(false); setSlow(false); setReload(value => value + 1); }}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp} role="status">{!loaded ? slow ? "The map is taking longer to load. Try reloading or open it in a new tab." : "Loading live map..." : "If the background stays grey, reload the map to try loading it again."}</p>
  </div>;
}
