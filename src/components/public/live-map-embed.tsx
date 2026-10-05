"use client";
import { Button, ButtonContent } from "@/components/ui/button";

import { useEffect, useState, useRef } from "react";
import styles from "./live-map.module.css";

import {parseJourney,type JourneySnapshot} from '@/modules/tracking/journey-contract';
import { publicMapBinding, publicMapUrl as mapUrl } from '@/modules/tracking/public-map-binding';
const mapOrigin = publicMapBinding.origin;

export function LiveMapEmbed({ priority = false, presentation = "compact", onJourney, selectedStopId }: { priority?: boolean; presentation?: "full" | "compact"; onJourney?:(snapshot:JourneySnapshot|null)=>void; selectedStopId?:string }) {
  const [reload, setReload] = useState(0);
  const frame=useRef<HTMLIFrameElement>(null);
  useEffect(()=>{
    if(!onJourney)return;
    let expires:ReturnType<typeof setTimeout>;
    const request=()=>frame.current?.contentWindow?.postMessage({type:"shkodra:request-journey"},mapOrigin);
    const handshake=setInterval(request,3000);
    const receive=(event:MessageEvent)=>{if(event.origin!==mapOrigin||event.source!==frame.current?.contentWindow)return;const snapshot=parseJourney(event.data);if(!snapshot)return;clearInterval(handshake);onJourney(snapshot);clearTimeout(expires);expires=setTimeout(()=>onJourney(null),45000);};
    window.addEventListener('message',receive);
    request();
    return()=>{window.removeEventListener('message',receive);clearTimeout(expires);clearInterval(handshake);};
  },[onJourney,reload]);
  useEffect(()=>{if(selectedStopId)frame.current?.contentWindow?.postMessage({type:'shkodra:select-stop',id:selectedStopId},mapOrigin);},[selectedStopId]);
  const [loaded, setLoaded] = useState(false);
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
      onLoad={() => {setLoaded(true);if(onJourney)frame.current?.contentWindow?.postMessage({type:'shkodra:request-journey'},mapOrigin);}}
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
    {onJourney ? <details className={styles.help}><summary>Map help</summary>
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => { onJourney?.(null); setLoaded(false); setSlow(false); setReload(value => value + 1); }}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp} role="status">{!loaded ? slow ? "The map is taking longer to load. Try reloading or open it in a new tab." : "Loading live map..." : "If the background stays grey, reload the map to try loading it again."}</p>
    </details> : <>
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => { setLoaded(false); setSlow(false); setReload(value => value + 1); }}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp} role="status">{!loaded ? slow ? "The map is taking longer to load. Try reloading or open it in a new tab." : "Loading live map..." : "If the background stays grey, reload the map to try loading it again."}</p>
    </>}

  </div>;
}
