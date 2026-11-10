"use client";
import { Button, ButtonContent } from "@/components/ui/button";

import { useEffect, useState, useRef } from "react";
import styles from "./live-map.module.css";

import {EmbeddedMapStatus} from './embedded-map-status';
import {type JourneySnapshot} from '@/modules/tracking/journey-contract';
import { publicMapBinding, publicMapUrl, websiteExternalStatusEnabled, localMapPreviewEnabled } from '@/modules/tracking/public-map-binding';
import { connectJourneyBridge } from "@/modules/tracking/journey-bridge";

export function LiveMapEmbed({ priority = false, presentation = "compact", collapseRecovery = false, onJourney, selectedStopId, localPreview = false, background = false, configuredStops = [] }: { configuredStops?:{id:string;label:string}[]; priority?: boolean; collapseRecovery?: boolean; presentation?: "full" | "compact"; onJourney?:(snapshot:JourneySnapshot|null,reason?:'stale'|'loading')=>void; selectedStopId?:string; localPreview?:boolean; background?:boolean }) {
  // Fixed loopback paired preview only; production always uses the canonical binding.
  const preview = process.env.NODE_ENV === 'development' && (localPreview || localMapPreviewEnabled);
  const externalStatus = preview || websiteExternalStatusEnabled;
  const mapOrigin = preview ? 'http://127.0.0.1:4199' : publicMapBinding.origin;
  const mapUrl = preview ? `${mapOrigin}/live-map.html?project=sightseeing-shkodra` : publicMapUrl;
  const container = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(!background);
  useEffect(() => {
    if (!background) return;
    // The passive source is hidden: observe the visible route section instead.
    const target = background ? document.getElementById('route') : container.current;
    if (!target || !('IntersectionObserver' in window)) { setInitialized(true); return; }
    // At the homepage's initial scroll position the route can sit exactly at
    // the fold. Do not let the look-ahead margin start it during hero loading.
    let approached = window.scrollY > 0 || target.getBoundingClientRect().top < window.innerHeight;
    const initialize = () => { setInitialized(true); observer.disconnect(); window.removeEventListener('scroll', approach); };
    const observer = new IntersectionObserver(entries => {
      if (approached && entries.some(entry => entry.isIntersecting)) initialize();
    }, { rootMargin: '400px 0px' });
    const approach = () => {
      approached = true;
      window.removeEventListener('scroll', approach);
      if (target.getBoundingClientRect().top < window.innerHeight + 400) initialize();
    };
    observer.observe(target);
    if (!approached) window.addEventListener('scroll', approach, {passive:true});
    return () => { observer.disconnect(); window.removeEventListener('scroll', approach); };
  }, [background]);
  const [reload, setReload] = useState(0);
  const [loadCycle, setLoadCycle] = useState(0);
  const frame=useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [lastStops,setLastStops] = useState<{id:string;label:string}[]>([]);
  const [journey, setJourney] = useState<JourneySnapshot|null>(null);
  const [statusReason, setStatusReason] = useState<'stale'|'loading'>('loading');
  const bridge = useRef<ReturnType<typeof connectJourneyBridge> | null>(null);
  useEffect(()=>{
    if (!initialized) return;
    const connection = connectJourneyBridge(window, () => frame.current?.contentWindow ?? null, mapOrigin,
      (snapshot, reason) => { if(snapshot?.embeddedDisplay?.stops.length)setLastStops(snapshot.embeddedDisplay.stops.map(s=>({id:s.id,label:s.name}))); setReady(snapshot !== null); setJourney(snapshot); setStatusReason(reason??'loading'); onJourney?.(snapshot, reason); }, externalStatus);
    bridge.current = connection;
    return () => { connection.dispose(); bridge.current = null; if(background)onJourney?.(null,'loading'); };
  },[initialized,onJourney,reload,mapOrigin,externalStatus,background]);
  useEffect(()=>{if(selectedStopId)frame.current?.contentWindow?.postMessage({type:'shkodra:select-stop',version:1,id:selectedStopId},mapOrigin);},[selectedStopId,ready,mapOrigin]);

  const [slow, setSlow] = useState(false);
  // A passive homepage source has no reload button. Recreate its single iframe
  // after connectivity returns; normal message expiry/handshake retries stay in the bridge.
  useEffect(()=>{
    if(!background || !initialized)return;
    const reconnect=()=>{onJourney?.(null,'loading');setReady(false);setJourney(null);setStatusReason('loading');setSlow(false);setReload(value=>value+1);};
    window.addEventListener('online',reconnect);
    return()=>window.removeEventListener('online',reconnect);
  },[background,initialized,onJourney]);

  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(timer);
  }, [initialized,reload,loadCycle]);
  return <div ref={container} data-map-initialized={initialized} className={`interactive-widget ${styles.embed}${background?` ${styles.background}`:""}`} aria-hidden={background||undefined} inert={background||undefined} data-journey-source={background||undefined} data-presentation={presentation} data-journey={!!onJourney}>
    {!background&&preview&&<p role="note">Local paired preview · simulated tracking data</p>}
    <div className={styles.surface}>
    {!background&&externalStatus&&<EmbeddedMapStatus snapshot={journey} configuredStops={configuredStops.length?configuredStops:lastStops} display={journey?.embeddedDisplay} reason={statusReason} unavailable={slow} onStop={id=>frame.current?.contentWindow?.postMessage({type:"shkodra:select-stop",version:1,id},mapOrigin)}/>}
    <div className={styles.viewport}>
    {initialized ? <iframe
      key={reload}
      ref={frame}
      onLoad={() => { setSlow(false); setLoadCycle(value=>value+1); bridge.current?.reset(); if(selectedStopId)frame.current?.contentWindow?.postMessage({type:"shkodra:select-stop",version:1,id:selectedStopId},mapOrigin); }}
      className={styles.map}
      src={`${mapUrl}&embed=1${externalStatus?"&websiteStatus=external-v1":""}&presentation=${presentation}`}
      tabIndex={!background && interactive ? 0 : -1}
      inert={background || !interactive || undefined}
      style={background || !interactive ? { pointerEvents: "none" } : undefined}
      title="Sightseeing Shkodra live van map"
      loading={background||priority ? "eager" : "lazy"}
      allow="geolocation"
      referrerPolicy="strict-origin-when-cross-origin"
    /> : <div className={`${styles.map} ${styles.placeholder}`} role="status">Live map loads as you approach this section.</div>}

    {!background && !interactive && <div className={styles.scrollSurface} aria-hidden="true" />}
    </div>
    </div>
    {!background && <div className={styles.interaction}><Button type="button" aria-pressed={interactive} onClick={() => setInteractive(value => !value)}>{interactive ? "Done interacting" : "Interact with map"}</Button><span>{interactive ? "Pan and zoom the map, or finish to scroll the page." : "Scroll freely, or enable map controls."}</span></div>}
    {!background && (onJourney || collapseRecovery ? <details className={styles.help}><summary>Map help</summary>
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
    </>)}

  </div>;
}
