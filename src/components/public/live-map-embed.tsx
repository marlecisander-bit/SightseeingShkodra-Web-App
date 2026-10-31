"use client";
import { Button, ButtonContent } from "@/components/ui/button";

import { useEffect, useState, useRef } from "react";
import styles from "./live-map.module.css";

import {EmbeddedMapStatus} from './embedded-map-status';
import {type JourneySnapshot} from '@/modules/tracking/journey-contract';
import { publicMapBinding, publicMapUrl, websiteExternalStatusEnabled, localMapPreviewEnabled } from '@/modules/tracking/public-map-binding';
import { connectJourneyBridge } from "@/modules/tracking/journey-bridge";

export function LiveMapEmbed({ priority = false, presentation = "compact", collapseRecovery = false, onJourney, selectedStopId, localPreview = false }: { priority?: boolean; collapseRecovery?: boolean; presentation?: "full" | "compact"; onJourney?:(snapshot:JourneySnapshot|null,reason?:'stale'|'loading')=>void; selectedStopId?:string; localPreview?:boolean }) {
  // Fixed loopback paired preview only; production always uses the canonical binding.
  const preview = process.env.NODE_ENV === 'development' && (localPreview || localMapPreviewEnabled);
  const externalStatus = preview || websiteExternalStatusEnabled;
  const mapOrigin = preview ? 'http://127.0.0.1:4199' : publicMapBinding.origin;
  const mapUrl = preview ? `${mapOrigin}/live-map.html?project=sightseeing-shkodra` : publicMapUrl;
  const [reload, setReload] = useState(0);
  const [loadCycle, setLoadCycle] = useState(0);
  const frame=useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [journey, setJourney] = useState<JourneySnapshot|null>(null);
  const [statusReason, setStatusReason] = useState<'stale'|'loading'>('loading');
  const bridge = useRef<ReturnType<typeof connectJourneyBridge> | null>(null);
  useEffect(()=>{
    const connection = connectJourneyBridge(window, () => frame.current?.contentWindow ?? null, mapOrigin,
      (snapshot, reason) => { setReady(snapshot !== null); setJourney(snapshot); if(reason)setStatusReason(reason); onJourney?.(snapshot, reason); }, externalStatus);
    bridge.current = connection;
    return () => { connection.dispose(); bridge.current = null; };
  },[onJourney,reload,mapOrigin,externalStatus]);
  useEffect(()=>{if(selectedStopId)frame.current?.contentWindow?.postMessage({type:'shkodra:select-stop',version:1,id:selectedStopId},mapOrigin);},[selectedStopId,ready,mapOrigin]);

  const [slow, setSlow] = useState(false);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(timer);
  }, [reload,loadCycle]);
  return <div className={`interactive-widget ${styles.embed}`} data-presentation={presentation} data-journey={!!onJourney}>
    {preview&&<p role="note">Local paired preview · simulated tracking data</p>}
    {externalStatus&&<EmbeddedMapStatus display={journey?.embeddedDisplay} reason={statusReason} unavailable={slow} onStop={id=>frame.current?.contentWindow?.postMessage({type:"shkodra:select-stop",version:1,id},mapOrigin)}/>}
    <div className={styles.viewport}>
    <iframe
      key={reload}
      ref={frame}
      onLoad={() => { setSlow(false); setLoadCycle(value=>value+1); bridge.current?.reset(); if(selectedStopId)frame.current?.contentWindow?.postMessage({type:"shkodra:select-stop",version:1,id:selectedStopId},mapOrigin); }}
      className={styles.map}
      src={`${mapUrl}&embed=1${externalStatus?"&websiteStatus=external-v1":""}&presentation=${presentation}`}
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
    {onJourney || collapseRecovery ? <details className={styles.help}><summary>Map help</summary>
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => { onJourney?.(null,'loading'); setReady(false); setJourney(null); setStatusReason('loading'); setSlow(false); setReload(value => value + 1); }}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp} role="status">{!ready ? slow ? "The map is taking longer to load. Try reloading or open it in a new tab." : "Loading live map..." : "If the background stays grey, reload the map to try loading it again."}</p>
    </details> : <>
    <div className={`widget-action-bar ${styles.recovery}`}>
      <Button type="button" onClick={() => { setReady(false); setJourney(null); setStatusReason('loading'); setSlow(false); setReload(value => value + 1); }}>Reload map</Button>
      <a className={`ss-button ${styles.secondary}`} href={mapUrl} target="_blank" rel="noopener noreferrer"><ButtonContent>Open map in a new tab</ButtonContent></a>
    </div>
    <p className={styles.recoveryHelp} role="status">{!ready ? slow ? "The map is taking longer to load. Try reloading or open it in a new tab." : "Loading live map..." : "If the background stays grey, reload the map to try loading it again."}</p>
    </>}

  </div>;
}
