'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { BookButton, useBooking } from './booking';
import { RouteControlIcon } from './route-control-icon';
import { ProductBookingLink } from './product-booking-link';
import { plannerClock, type DayPlannerData } from '@/modules/content/day-planner';
import { freshRoutePosition, nearbyBoardingAccuracy, walkingBoarding, lastKnownRoutePosition, routeLivePositionMs, type RouteBoarding, type RouteStop } from '@/modules/tracking/route-itinerary';
import type { Coordinate, PublishedMap } from '@/modules/tracking/published-map';
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

type VisitorLocation = { coordinate: Coordinate; accuracy: number };

type Panel = 'stops' | 'departures' | 'stop' | 'boarding' | 'tracking' | 'location' | null;

export function RouteExplorer({ planner, routeTitle, routes, stops, boarding, mapVersion, initialPosition, initialLastKnown = null, initialEta = null, initialMovement = null, initialObservedAt = null }: {
  planner: DayPlannerData; routeTitle: string; routes: PublishedMap['routes']; stops: RouteStop[];
  boarding: RouteBoarding | null; mapVersion: string | number | null; initialPosition: Position | null; initialLastKnown?: Position | null; initialEta?: string | null; initialMovement?: string | null; initialObservedAt?: string | null;
}) {
  const { products } = useBooking();
  const activeProduct = products.find(product => product.active !== false && product.slug === planner.product?.slug);
  const [panel, setPanel] = useState<Panel>(null);
  const [selection, select] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  const [zoom, setZoom] = useState<{delta: number} | null>(null);
  const [live, setLive] = useState({ position: initialPosition, lastKnown: initialLastKnown, eta: initialEta, movement: initialMovement });
  const panelClose = useRef<HTMLButtonElement>(null);
  const previousControl = useRef<HTMLElement | null>(null);
  const [findVehicle, setFindVehicle] = useState(0);
  const [allowArrivalFocus, setAllowArrivalFocus] = useState(true);
  const [visitor, setVisitor] = useState<VisitorLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const locationRequest = useRef(0);
  const [times, setTimes] = useState(planner.times);
  const [scheduleLoaded, setScheduleLoaded] = useState(planner.times !== null);
  const [observedAt, setObservedAt] = useState(initialObservedAt);
  const selectedIndex = stops.findIndex(stop => stop.id === selection);
  const selected = stops[selectedIndex];
  const canvasSelection = panel === 'stop' || panel === 'boarding' ? selection : null;
  const stopsPanelOpen = panel === 'stops' || panel === 'stop' || panel === 'boarding' || panel === 'departures';
  const scheduleProduct = planner.product?.slug;
  const pickup = walkingBoarding(planner.product?.mode, boarding, stops, visitor);
  const selectedPhoto = selected?.design?.photoUrl ?? selected?.place?.image;
  const canTrack = routes.length > 0 && mapVersion !== null;
  const vehicle = canTrack ? live.position : null;
  const lastKnownVehicle = canTrack && !vehicle ? live.lastKnown : null;
  const lastKnownTime = observedAt ? new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tirane',
  }).format(new Date(observedAt)) : null;


  useEffect(() => {
    if (!canTrack) return;
    const controller = new AbortController();
    let busy = false;
    let expires: ReturnType<typeof setTimeout> | undefined;
    const expire = (position: Position | null) => {
      clearTimeout(expires);
      if (!position) return;
      expires = setTimeout(() => {
        setLive({ position: null, lastKnown: position, eta: null, movement: null });
      }, Math.max(0, Date.parse(position.updatedAt) + routeLivePositionMs - Date.now()));
    };
    async function refresh() {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const reply = await fetch('/api/public/route-tracking', { signal: controller.signal, cache: 'no-store' });
        if (!reply.ok) throw Error('Tracking unavailable');
        const data = await reply.json();
        if (controller.signal.aborted) return;
        if (data.mapVersion == null) throw Error('Tracking unavailable');
        const lastPosition = data.mapVersion === mapVersion
          ? lastKnownRoutePosition(data.position ?? data.lastKnown) : null;
        const position = freshRoutePosition(lastPosition);
        const eta = position && typeof data.eta === 'string' && data.eta.length <= 80 ? data.eta : null;
        const movement = position && typeof data.movement === 'string' && data.movement.length <= 180 ? data.movement : null;
        setLive(current => ({
          position,
          lastKnown: position ? null : lastPosition ?? (data.mapVersion === mapVersion
            ? lastKnownRoutePosition(current.position ?? current.lastKnown) : null),
          eta, movement,
        }));
        if (data.mapVersion === mapVersion && typeof data.observedAt === 'string' && Number.isFinite(Date.parse(data.observedAt))) {
          setObservedAt(data.observedAt);
        }
        expire(position);
      } catch {
        if (!controller.signal.aborted) {
          clearTimeout(expires);
          setLive(current => ({ position: null, lastKnown: lastKnownRoutePosition(current.position ?? current.lastKnown), eta: null, movement: null }));
        }
      } finally { busy = false; }
    }
    expire(initialPosition);
    void refresh();
    const timer = setInterval(refresh, 10_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); clearInterval(timer); clearTimeout(expires); document.removeEventListener('visibilitychange', refresh); };
  }, [canTrack, initialLastKnown, initialPosition, mapVersion]);

  useEffect(() => {
    if (panel !== 'departures') return;
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
      finally {
        busy = false;
        if (!controller.signal.aborted) setScheduleLoaded(true);
      }
    }
    void refresh();
    const timer = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [panel, scheduleProduct]);

  function show(next: Exclude<Panel, null>, id: string | null = null) {
    if (next !== 'location') locationRequest.current += 1;
    const active = document.activeElement;
    if (active instanceof HTMLElement && !active.closest('#route-panel')) previousControl.current = active;
    select(id);
    setPanel(next);
  }
  function choose(id: string) {
    const boardingId = id === 'boarding' || (boarding?.coordinate && id === boarding.stopId);
    show(boardingId ? 'boarding' : 'stop', boardingId ? 'boarding' : id);
  }
  function close(restoreFocus = true) {
    locationRequest.current += 1;
    setPanel(null);
    select(null);
    if (restoreFocus) previousControl.current?.focus({ preventScroll: true });
  }
  function findMe() {
    show('location');
    setVisitor(null);
    if (!navigator.geolocation) {
      setLocationMessage('Your browser does not provide location access.');
      return;
    }
    setLocationMessage('Finding your location…');
    const request = ++locationRequest.current;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (request !== locationRequest.current) return;
      const { latitude, longitude, accuracy } = coords;
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
          !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
          !Number.isFinite(accuracy) || accuracy < 0) {
        setLocationMessage('Could not get a usable location. Try again.');
        return;
      }
      setVisitor({ coordinate: [latitude, longitude], accuracy });
      setLocationMessage(planner.product?.mode === 'whole_day' && accuracy > nearbyBoardingAccuracy
        ? 'Your location is too approximate to choose a nearby stop.' : '');
    }, error => {
      if (request !== locationRequest.current) return;
      setLocationMessage(error.code === 1
        ? 'Location access is off. Allow location in your browser to use Find me.'
        : 'Could not find your location. Try again.');
    }, { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 });
  }

  useEffect(() => () => { locationRequest.current += 1; }, []);
  useEffect(() => {
    if (panel) panelClose.current?.focus({ preventScroll: true });
  }, [panel]);

  return <main id="main-content" data-route-explorer className={styles.page}
    onPointerDownCapture={() => setAllowArrivalFocus(false)}
    onWheelCapture={() => setAllowArrivalFocus(false)}
    onKeyDownCapture={() => setAllowArrivalFocus(false)}
    onKeyDown={event => {
    if (event.key === 'Escape' && panel) close();
  }}>
    <div className={styles.workspace}>
      <div className={styles.map}>
        <MapBoundary><Map routes={routes} stops={stops} boarding={boarding} vehicle={vehicle} lastKnownVehicle={lastKnownVehicle} findVehicle={findVehicle} allowArrivalFocus={allowArrivalFocus}
          selected={canvasSelection} visitor={visitor} centerVisitor={panel === 'location'} reset={reset} zoom={zoom} onSelect={choose} /></MapBoundary>
        <header className={styles.tour} data-map-obstacle>
          <h1>{routeTitle}</h1>
        </header>
        <div className={styles.mapTools} role="group" aria-label="Map view" data-map-obstacle data-map-tools>
          <div className={styles.zoomControls}>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom({ delta: 1 })}>+</button>
            <button type="button" aria-label="Zoom out" onClick={() => setZoom({ delta: -1 })}>−</button>
          </div>
          <button type="button" onClick={() => { close(false); setVisitor(null); setReset(value => value + 1); }}>
            <RouteControlIcon name="route" />Full route
          </button>
        </div>
      </div>
      {panel && <section className={`${styles.panel} ${panel === 'boarding' || panel === 'location' ? styles.boardingPanel : ''}`} id="route-panel" aria-label={panel === 'stop' ? selected?.name : panel === 'location' ? 'Boarding directions' : panel === 'tracking' ? 'Tracking details' : panel} data-map-obstacle>
        <button ref={panelClose} className={styles.close} type="button" aria-label="Close panel" onClick={() => close()}>×</button>
        <div className={styles.panelBody} data-panel-scroll>
          {panel === 'stop' && selected && <>
            <div className={styles.stopDetail}>
              {selectedPhoto && <Image unoptimized src={selectedPhoto} alt={selected.place?.alt ?? ''} width={88} height={68} />}
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
            {boarding && !stops.some(stop => stop.id === boarding.stopId) &&
              <button type="button" onClick={() => choose('boarding')}>Boarding point</button>}
            <button type="button" onClick={() => show('departures')}>View departures</button>
          </>}
          {panel === 'location' && <>
            <p className={styles.kicker}>Boarding point</p>
            <h2>{pickup?.name ?? 'Boarding details unavailable'}</h2>
            {pickup?.directions && <p>{pickup.directions}</p>}
            {pickup?.url && <a className={styles.directions} href={pickup.url} target="_blank" rel="noopener noreferrer">
              {pickup.walking ? 'Walking directions' : 'Get directions'}
            </a>}
            {locationMessage && <p className={styles.locationStatus} role="status">{locationMessage}</p>}
          </>}
          {panel === 'tracking' && <><h2>Tracking details</h2>
            <p role="status">{vehicle ? live.movement ?? 'Van location live' : lastKnownVehicle ? 'Showing the last known van position. Live updates are unavailable.' : 'Live location unavailable'}</p>
            {lastKnownTime && <p>Last GPS update at {lastKnownTime}, Shkodra time.</p>}
            {vehicle && live.eta && <p>Next stop in {live.eta}.</p>}
          </>}
          {panel === 'departures' && <><h2>Departures</h2>{planner.product && <p>{planner.title}</p>}<p>Today · Shkodra local time</p>
            {times?.length ? <ul className={styles.times}>{times.map(time => <li key={time}><time>{time}</time></li>)}</ul>
              : <p>{times ? 'No service scheduled today.' : scheduleLoaded ? 'The timetable is currently unavailable.' : 'Loading the timetable…'}</p>}
            <p>Scheduled departures. Seats are confirmed in booking.</p>
            {activeProduct ? <ProductBookingLink className="p-button p-button-booking" product={activeProduct}>Check availability</ProductBookingLink>
              : <BookButton>Check availability</BookButton>}
          </>}
        </div>
      </section>}
      <nav className={styles.bar} aria-label="Map controls" data-map-obstacle>
        <button type="button" aria-controls={stopsPanelOpen ? 'route-panel' : undefined} aria-expanded={stopsPanelOpen}
          onClick={() => panel === 'stops' ? close() : show('stops')}><RouteControlIcon name="stops" />Stops</button>
        <button type="button" aria-expanded={panel === 'location'} aria-controls={panel === 'location' ? 'route-panel' : undefined} onClick={() => panel === 'location' ? close() : findMe()}><RouteControlIcon name="me" />Find me</button>
        <button type="button" aria-expanded={panel === 'tracking'} aria-controls={panel === 'tracking' ? 'route-panel' : undefined} onClick={() => {
          if (panel === 'tracking') { close(); return; }
          show('tracking');
          if (vehicle) setFindVehicle(value => value + 1);
        }}><RouteControlIcon name="van" />Find van</button>
      </nav>
    </div>
  </main>;
}
