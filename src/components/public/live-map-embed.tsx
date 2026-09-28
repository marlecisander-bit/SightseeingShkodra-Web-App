"use client";
import { Button, ButtonContent } from "@/components/ui/button";

import { useEffect, useState } from "react";
import styles from "./live-map.module.css";

const mapUrl = "https://sightseeingshkodralivetrackingapp.netlify.app/live-map.html?project=sightseeing-shkodra";

export function LiveMapEmbed({ priority = false, presentation = "compact" }: { priority?: boolean; presentation?: "full" | "compact" }) {
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(timer);
  }, [reload]);
  return <div className={`interactive-widget ${styles.embed}`} data-presentation={presentation}>
    <div className={styles.viewport}>
    <iframe
      key={reload}
      onLoad={() => setLoaded(true)}
      className={styles.map}
      src={`${mapUrl}&embed=1&presentation=${presentation}`}
      tabIndex={presentation === "full" || interactive ? 0 : -1}
      style={presentation === "compact" && !interactive ? { pointerEvents: "none" } : undefined}
      title="Sightseeing Shkodra live van map"
      loading={priority ? "eager" : "lazy"}
      allow="geolocation"
      referrerPolicy="strict-origin-when-cross-origin"
    />
    {presentation === "compact" && !interactive && <div className={styles.scrollSurface} aria-hidden="true" />}
    </div>
    {presentation === "compact" && <div className={styles.interaction}><Button type="button" aria-pressed={interactive} onClick={() => setInteractive(value => !value)}>{interactive ? "Done interacting" : "Interact with map"}</Button><span>{interactive ? "Pan and zoom the map, or finish to scroll the page." : "Scroll freely, or enable map controls."}</span></div>}
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => { setLoaded(false); setSlow(false); setReload(value => value + 1); }}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp} role="status">{!loaded ? slow ? "The map is taking longer to load. Try reloading or open it in a new tab." : "Loading live map..." : "If the background stays grey, reload the map to try loading it again."}</p>
  </div>;
}
