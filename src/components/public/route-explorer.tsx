'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Component, useEffect, useState, type ReactNode } from 'react';
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

type Panel = 'stops' | 'departures' | 'stop' | 'boarding' | null;

export function RouteExplorer({ planner, lines, stops, boarding, mapVersion, initialPosition, initialLastKnown = null, initialEta = null, initialMovement = null }: {
  planner: DayPlannerData; lines: Coordinate[][]; stops: RouteStop[];
  boarding: RouteBoarding | null; mapVersion: string | number | null; initialPosition: Position | null; initialLastKnown?: Position | null; initialEta?: string | null; initialMovement?: string | null;
}) {
  const { products } = useBooking();
  const activeProduct = products.find(product => product.active !== false && product.slug === planner.product?.slug);
  const [panel, setPanel] = useState<Panel>(null);
  const [selection, select] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  const [live, setLive] = useState({ position: initialPosition, lastKnown: initialLastKnown, eta: initialEta, movement: initialMovement });
  const [showLastKnown, setShowLastKnown] = useState(true);
  const [findVehicle, setFindVehicle] = useState(0);
  const [times, setTimes] = useState(planner.times);
  const selectedIndex = stops.findIndex(stop => stop.id === selection);
  const selected = stops[selectedIndex];
  const canvasSelection = panel === 'stop' || panel === 'boarding' ? selection : null;
  const scheduleProduct = planner.product?.slug;
  const canTrack = lines.length > 0 && mapVersion !== null;
  const vehicle = canTrack ? live.position ?? (showLastKnown ? live.lastKnown : null) : null;


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

  function choose(id: string) {
    select(id);
    setPanel(id === 'boarding' ? 'boarding' : 'stop');
  }
  function close() { setPanel(null); select(null); }

  return <main id="main-content" data-route-explorer className={styles.page} onKeyDown={event => {
    if (event.key === 'Escape' && panel) close();
  }}>
    <div className={styles.workspace}>
      <div className={styles.map}>
        <MapBoundary><Map lines={lines} stops={stops} boarding={boarding} vehicle={vehicle} findVehicle={findVehicle}
          vehicleHistorical={showLastKnown && !live.position && !!live.lastKnown}
          selected={canvasSelection} reset={reset} onSelect={choose} /></MapBoundary>
        <header className={styles.tour}>
          <h1>Route &amp; Live Map</h1>
          {stops.length > 0 && <p>{stops.length} published stops</p>}
          {!lines.length && <p>Route line unavailable</p>}
          <p role="status">{live.position
            ? `${live.movement ?? 'Van location live'}${live.eta ? ` · Next stop in ${live.eta}` : ''}`
            : live.lastKnown && showLastKnown ? 'Last known van location · Waiting for fresh GPS'
              : canTrack ? 'Waiting for a fresh GPS update' : 'Live location unavailable'}</p>
          <div className={styles.vehicleActions}>
            {vehicle && <button className={styles.lastKnown} type="button" onClick={() => setFindVehicle(value => value + 1)}>Find van</button>}
            {canTrack && !live.position && live.lastKnown && <button className={styles.lastKnown} type="button"
              aria-pressed={showLastKnown} onClick={() => setShowLastKnown(value => !value)}>
              {showLastKnown ? 'Hide last known location' : 'Show last known location'}
            </button>}
          </div>
        </header>
        <button className={styles.full} type="button" onClick={() => { close(); setReset(value => value + 1); }}>Full route</button>
      </div>
      {panel && <section className={styles.panel} id="route-panel" aria-label={panel === 'stop' ? selected?.name : panel}>
        <button className={styles.close} type="button" aria-label="Close panel" onClick={close}>×</button>
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
          {boarding ? <a href={boarding.url} target="_blank" rel="noopener noreferrer">Get directions</a> : <p>Boarding details are currently unavailable.</p>}
        </>}
        {panel === 'stops' && <><h2>Stops</h2>
          <button type="button" onClick={() => choose('boarding')}>Start here</button>
          {stops.length ? <ol className={styles.stops}>{stops.map((stop, index) => <li key={stop.id}>
            <button type="button" onClick={() => choose(stop.id)}><b>{index + 1}</b> {stop.name}</button>
          </li>)}</ol> : <p>The itinerary is currently unavailable.</p>}
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
        <button type="button" aria-controls={panel ? 'route-panel' : undefined} aria-expanded={panel === 'stops'} onClick={() => panel === 'stops' ? close() : setPanel('stops')}>Stops</button>
        <button type="button" aria-controls={panel ? 'route-panel' : undefined} aria-expanded={panel === 'boarding'} onClick={() => panel === 'boarding' ? close() : choose('boarding')}>Start here</button>
        <button type="button" aria-controls={panel ? 'route-panel' : undefined} aria-expanded={panel === 'departures'} onClick={() => panel === 'departures' ? close() : setPanel('departures')}>Departures</button>
      </nav>
    </div>
  </main>;
}
