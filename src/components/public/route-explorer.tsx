'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { BookButton, useBooking } from './booking';
import { ProductBookingLink } from './product-booking-link';
import { plannerClock, type DayPlannerData } from '@/modules/content/day-planner';
import { freshRoutePosition, recentRoutePosition, routeLastKnownPositionMs, routeLivePositionMs, type RouteBoarding, type RouteStop } from '@/modules/tracking/route-itinerary';
import type { Coordinate } from '@/modules/tracking/published-map';
import type { Position } from '@/modules/tracking/positions';
import styles from './route-explorer.module.css';

const Map = dynamic(() => import('./route-explorer-map'), {
  ssr: false, loading: () => <p className={styles.loading} role="status">Loading map…</p>,
});

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p className={styles.loading} role="status">The map is temporarily unavailable. Stops and departures are still available below.</p> : this.props.children;
  }
}

type Panel = 'stops' | 'departures' | 'stop' | 'boarding' | 'tracking' | null;

export function RouteExplorer({ planner, routeTitle, lines, stops, boarding, mapVersion, initialPosition, initialLastKnown = null, initialEta = null, initialMovement = null, initialObservedAt = null }: {
  planner: DayPlannerData; routeTitle: string; lines: Coordinate[][]; stops: RouteStop[];
  boarding: RouteBoarding | null; mapVersion: string | number | null; initialPosition: Position | null; initialLastKnown?: Position | null; initialEta?: string | null; initialMovement?: string | null; initialObservedAt?: string | null;
}) {
  const { products } = useBooking();
  const activeProduct = products.find(product => product.active !== false && product.slug === planner.product?.slug);
  const [panel, setPanel] = useState<Panel>(null);
  const [selection, select] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  const [live, setLive] = useState({ position: initialPosition, lastKnown: initialLastKnown, eta: initialEta, movement: initialMovement });
  const [zoom, setZoom] = useState({ delta: 0, request: 0 });
  const panelClose = useRef<HTMLButtonElement>(null);
  const previousControl = useRef<HTMLElement | null>(null);
  const [findVehicle, setFindVehicle] = useState(0);
  const [times, setTimes] = useState(planner.times);
  const [observedAt, setObservedAt] = useState(initialObservedAt);
  const selectedIndex = stops.findIndex(stop => stop.id === selection);
  const selected = stops[selectedIndex];
  const canvasSelection = panel === 'stop' || panel === 'boarding' ? selection : null;
  const scheduleProduct = planner.product?.slug;
  const canTrack = lines.length > 0 && mapVersion !== null;
  const vehicle = canTrack ? live.position : null;
  const lastKnownTime = observedAt ? new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tirane',
  }).format(new Date(observedAt)) : null;


  useEffect(() => {
    if (!canTrack) return;
    const controller = new AbortController();
    let busy = false;
    let expires: ReturnType<typeof setTimeout> | undefined;
    const expire = (lastPosition: Position | null, fresh: boolean) => {
      clearTimeout(expires);
      if (!lastPosition) return;
      const observed = Date.parse(lastPosition.updatedAt);
      expires = setTimeout(() => {
        if (fresh) {
          setLive({ position: null, lastKnown: recentRoutePosition(lastPosition), eta: null, movement: null });
          expire(lastPosition, false);
        } else {
          setLive({ position: null, lastKnown: null, eta: null, movement: null });
        }
      }, Math.max(0, observed + (fresh ? routeLivePositionMs : routeLastKnownPositionMs) - Date.now()));
    };
    async function refresh() {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const reply = await fetch('/api/public/route-tracking', { signal: controller.signal, cache: 'no-store' });
        if (!reply.ok) throw Error('Tracking unavailable');
        const data = await reply.json();
        if (controller.signal.aborted) return;
        const lastPosition = data.mapVersion === mapVersion
          ? recentRoutePosition(data.position ?? data.lastKnown) : null;
        const position = freshRoutePosition(lastPosition);
        const eta = position && typeof data.eta === 'string' && data.eta.length <= 80 ? data.eta : null;
        const movement = position && typeof data.movement === 'string' && data.movement.length <= 180 ? data.movement : null;
        setLive({ position, lastKnown: position ? null : lastPosition, eta, movement });
        if (data.mapVersion === mapVersion && typeof data.observedAt === 'string' && Number.isFinite(Date.parse(data.observedAt))) {
          setObservedAt(data.observedAt);
        }
        expire(lastPosition, !!position);
      } catch {
        if (!controller.signal.aborted) {
          setLive(current => ({ position: null, lastKnown: recentRoutePosition(current.position ?? current.lastKnown), eta: null, movement: null }));
        }
      } finally { busy = false; }
    }
    const initial = recentRoutePosition(initialPosition ?? initialLastKnown);
    expire(initial, !!freshRoutePosition(initial));
    void refresh();
    const timer = setInterval(refresh, 10_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); clearInterval(timer); clearTimeout(expires); document.removeEventListener('visibilitychange', refresh); };
  }, [canTrack, initialLastKnown, initialPosition, mapVersion]);

  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    async function refresh() {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const response = await fetch('/api/public/day-planner', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw Error('Schedule unavailable');
        const next: DayPlannerData = await response.json();
        if (!controller.signal.aborted) setTimes(next.date === plannerClock().date && next.product?.slug === scheduleProduct ? next.times : null);
      } catch { if (!controller.signal.aborted) setTimes(null); }
      finally { busy = false; }
    }
    const timer = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [scheduleProduct]);

  function show(next: Exclude<Panel, null>, id: string | null = null) {
    if (!panel) previousControl.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    select(id);
    setPanel(next);
  }
  function choose(id: string) {
    const boardingId = id === 'boarding' || (boarding?.coordinate && id === boarding.stopId);
    show(boardingId ? 'boarding' : 'stop', boardingId ? 'boarding' : id);
  }
  function close(restoreFocus = true) {
    setPanel(null);
    select(null);
    if (restoreFocus) previousControl.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (panel) panelClose.current?.focus({ preventScroll: true });
  }, [panel]);

  return <main id="main-content" data-route-explorer className={styles.page} onKeyDown={event => {
    if (event.key === 'Escape' && panel) close();
  }}>
    <div className={styles.workspace}>
      <div className={styles.map}>
        <MapBoundary><Map lines={lines} stops={stops} boarding={boarding} vehicle={vehicle} findVehicle={findVehicle}
          selected={canvasSelection} reset={reset} zoom={zoom} onSelect={choose} /></MapBoundary>
        <header className={styles.tour} data-map-obstacle>
          <h1>{routeTitle}</h1>
          <button className={styles.trackingButton} type="button" aria-label="Tracking details"
            onClick={() => panel === 'tracking' ? close() : show('tracking')}
            aria-expanded={panel === 'tracking'}>i</button>
        </header>
        <div className={styles.mapControls} data-map-obstacle aria-label="Map controls">
          <div className={styles.mapActions}>
            {vehicle && <button type="button" onClick={() => setFindVehicle(value => value + 1)}>Live van</button>}
            <button type="button" onClick={() => { close(false); setReset(value => value + 1); }}>Full route</button>
          </div>
          <div className={styles.zoom}>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom(previous => ({ delta: 1, request: previous.request + 1 }))}>+</button>
            <button type="button" aria-label="Zoom out" onClick={() => setZoom(previous => ({ delta: -1, request: previous.request + 1 }))}>−</button>
          </div>
        </div>
      </div>
      {panel && <section className={styles.panel} id="route-panel" aria-label={panel === 'stop' ? selected?.name : panel}>
        <button ref={panelClose} className={styles.close} type="button" aria-label="Close panel" onClick={() => close()}>×</button>
        {panel === 'stop' && selected && <>
          <div className={styles.stopDetail}>
            {selected.place?.image && <Image unoptimized src={selected.place.image} alt={selected.place.alt ?? ''} width={88} height={68} />}
            <div><p className={styles.kicker}>Stop {selectedIndex + 1} of {stops.length}</p><h2>{selected.place?.name ?? selected.name}</h2>
              {(selected.place?.text || selected.description) && <p>{selected.place?.text || selected.description}</p>}
              {selected.place?.link?.startsWith('/explore/') && <a href={selected.place.link}>Visitor guide</a>}
            </div>
          </div>
          <div className={styles.sequence}>
            <button type="button" disabled={selectedIndex === 0} onClick={() => choose(stops[selectedIndex - 1].id)}>Previous</button>
            <button type="button" disabled={selectedIndex === stops.length - 1} onClick={() => choose(stops[selectedIndex + 1].id)}>Next</button>
          </div>
        </>}
        {panel === 'boarding' && <><p className={styles.kicker}>Start here</p><h2>{boarding?.name ?? 'Boarding point'}</h2>
          {boarding?.directions && <p>{boarding.directions}</p>}
          {boarding ? <a className={styles.directions} href={boarding.url} target="_blank" rel="noopener noreferrer">Get directions</a> : <p>Boarding details are currently unavailable.</p>}
        </>}
        {panel === 'stops' && <><h2>Stops</h2>
          {stops.length ? <ol className={styles.stops}>{stops.map((stop, index) => <li key={stop.id}>
            <button type="button" onClick={() => choose(stop.id)}><b>{index + 1}</b> {boarding?.stopId === stop.id ? 'Start here' : stop.place?.name ?? stop.name}</button>
          </li>)}</ol> : <p>The itinerary is currently unavailable.</p>}
        </>}
        {panel === 'tracking' && <><h2>Tracking details</h2>
          <p role="status">{vehicle ? live.movement ?? 'Van location live' : 'Live location unavailable'}</p>
          {lastKnownTime && <p>Last GPS update at {lastKnownTime}, Shkodra time.</p>}
          {vehicle && live.eta && <p>Next stop in {live.eta}.</p>}
        </>}
        {panel === 'departures' && <><h2>Departures</h2>{planner.product && <p>{planner.title}</p>}<p>Today · Shkodra local time</p>
          {times?.length ? <ul className={styles.times}>{times.map(time => <li key={time}><time>{time}</time></li>)}</ul>
            : <p>{times ? 'No service scheduled today.' : 'The timetable is currently unavailable.'}</p>}
          <p>Scheduled departures. Seats are confirmed in booking.</p>
          {activeProduct ? <ProductBookingLink className="p-button p-button-booking" product={activeProduct}>Check availability</ProductBookingLink>
            : <BookButton>Check availability</BookButton>}
        </>}
      </section>}
      <nav className={styles.bar} aria-label="Tour map panels">
        <button type="button" aria-controls={panel ? 'route-panel' : undefined} aria-expanded={panel === 'stops'} onClick={() => panel === 'stops' ? close() : show('stops')}>Stops</button>
        <button type="button" aria-controls={panel ? 'route-panel' : undefined} aria-expanded={panel === 'boarding'} onClick={() => panel === 'boarding' ? close() : choose('boarding')}>Start here</button>
        <button type="button" aria-controls={panel ? 'route-panel' : undefined} aria-expanded={panel === 'departures'} onClick={() => panel === 'departures' ? close() : show('departures')}>Departures</button>
      </nav>
    </div>
  </main>;
}
