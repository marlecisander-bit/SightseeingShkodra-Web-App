"use client";
import { Button, ButtonContent } from "@/components/ui/button";

import { useEffect, useState, useRef } from "react";
import styles from "./live-map.module.css";

import {type JourneySnapshot} from '@/modules/tracking/journey-contract';
import { publicMapBinding, publicMapUrl as mapUrl } from '@/modules/tracking/public-map-binding';
const mapOrigin = publicMapBinding.origin;
import { connectJourneyBridge } from "@/modules/tracking/journey-bridge";

export function LiveMapEmbed({ priority = false, presentation = "compact", collapseRecovery = false, onJourney, selectedStopId }: { priority?: boolean; collapseRecovery?: boolean; presentation?: "full" | "compact"; onJourney?:(snapshot:JourneySnapshot|null,reason?:'stale'|'loading')=>void; selectedStopId?:string }) {
  const [reload, setReload] = useState(0);
  const frame=useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const bridge = useRef<ReturnType<typeof connectJourneyBridge> | null>(null);
  useEffect(()=>{
    const connection = connectJourneyBridge(window, () => frame.current?.contentWindow ?? null, mapOrigin,
      (snapshot, reason) => { setReady(snapshot !== null); onJourney?.(snapshot, reason); });
    bridge.current = connection;
    return () => { connection.dispose(); bridge.current = null; };
  },[onJourney,reload]);
  useEffect(()=>{if(selectedStopId)frame.current?.contentWindow?.postMessage({type:'shkodra:select-stop',version:1,id:selectedStopId},mapOrigin);},[selectedStopId,ready]);

  const [slow, setSlow] = useState(false);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(timer);
  }, [reload]);
  return <div className={`interactive-widget ${styles.embed}`} data-presentation={presentation} data-journey={!!onJourney}>
    <div className={styles.viewport}>
    <iframe
      key={reload}
      ref={frame}
      onLoad={() => { bridge.current?.reset(); if(selectedStopId)frame.current?.contentWindow?.postMessage({type:"shkodra:select-stop",version:1,id:selectedStopId},mapOrigin); }}
      className={styles.map}
      src={`${mapUrl}&embed=1&presentation=${presentation}`}
      tabIndex={presentation === "full" || interactive ? 0 : -1}
      style={presentation === "compact" && !interactive ? { pointerEvents: "none" } : undefined}
      title="Sightseeing Shkodra live van map"
      loading={priority ? "eager" : "lazy"}
      allow="geolocation"
      referrerPolicy="strict-origin-when-cross-origin"
    />
    {!ready && <p className={styles.loading} role="status">{slow ? "Map connection unavailable. Use Map help to retry or open the live map." : "Connecting to live map…"}</p>}
    {presentation === "compact" && !interactive && <div className={styles.scrollSurface} aria-hidden="true" />}
    </div>
    {presentation === "compact" && <div className={styles.interaction}><Button type="button" aria-pressed={interactive} onClick={() => setInteractive(value => !value)}>{interactive ? "Done interacting" : "Interact with map"}</Button><span>{interactive ? "Pan and zoom the map, or finish to scroll the page." : "Scroll freely, or enable map controls."}</span></div>}
    {onJourney || collapseRecovery ? <details className={styles.help}><summary>Map help</summary>
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => { onJourney?.(null,'loading'); setReady(false); setSlow(false); setReload(value => value + 1); }}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp} role="status">{!ready ? slow ? "The map is taking longer to load. Try reloading or open it in a new tab." : "Loading live map..." : "If the background stays grey, reload the map to try loading it again."}</p>
    </details> : <>
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => { setReady(false); setSlow(false); setReload(value => value + 1); }}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp} role="status">{!ready ? slow ? "The map is taking longer to load. Try reloading or open it in a new tab." : "Loading live map..." : "If the background stays grey, reload the map to try loading it again."}</p>
    </>}

  </div>;
}
