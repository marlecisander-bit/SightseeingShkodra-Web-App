'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookButton, useBooking } from './booking';
import { RouteControlIcon } from './route-control-icon';
import { ProductBookingLink } from './product-booking-link';
import { plannerClock, type DayPlannerData } from '@/modules/content/day-planner';
import { nearbyBoardingAccuracy, routeBoarding, routeItinerary, walkingBoarding, walkingToNearestStop, type RoutePlace } from '@/modules/tracking/route-itinerary';
import { expireRouteStatus, routeStatusDeadline, type RouteStatus } from '@/modules/tracking/route-status';
import { sectionVisible, type WebsiteContent } from '@/modules/content/website-schema';
import type { MeetingPoint } from '@/modules/booking/meeting-point';
import type { Coordinate, PublishedMap } from '@/modules/tracking/published-map';
import styles from './route-explorer.module.css';

const emptyRoutes: PublishedMap['routes'] = [];

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

export function RouteExplorer({ planner, initialMap, initialStatus, places, fallbackStops, meeting, content, preview = false, previewPanel = 'stops' }: {
  planner: DayPlannerData; initialMap?: PublishedMap; initialStatus: RouteStatus;
  places: RoutePlace[]; fallbackStops: DayPlannerData['stops']; meeting: MeetingPoint | null;
  content: WebsiteContent; preview?: boolean; previewPanel?: 'stops' | 'departures';
}) {
  const [data, setData] = useState({ map: initialMap, status: initialStatus });
  const [trackingError, setTrackingError] = useState(initialStatus.mapVersion === null);
  const refreshTracking = useRef<(() => void) | null>(null);
  const { map, status: live } = data;
  const { stops, pois } = useMemo(() => routeItinerary(fallbackStops, map, places), [fallbackStops, map, places]);
  const boarding = useMemo(() => routeBoarding(meeting, map), [meeting, map]);
  const routes = map?.routes ?? emptyRoutes;
  const showDepartures = sectionVisible(content, 'departures');
  const { products } = useBooking();
  const activeProduct = products.find(product => product.active !== false && product.slug === planner.product?.slug);
  const [requestedPanel, setPanel] = useState<Panel>(preview ? previewPanel : null);
  const [selection, select] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  const [zoom, setZoom] = useState<{delta: number} | null>(null);
  const panelClose = useRef<HTMLButtonElement>(null);
  const previousControl = useRef<HTMLElement | null>(null);
  const [findVehicle, setFindVehicle] = useState(0);
  const [followingVan, setFollowingVan] = useState(true);
  const [visitor, setVisitor] = useState<VisitorLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const locationRequest = useRef(0);
  const [times, setTimes] = useState(planner.times);
  const [scheduleLoaded, setScheduleLoaded] = useState(planner.times !== null);
  const observedAt = live.observedAt;
  const selectedIndex = stops.findIndex(stop => stop.id === selection);
  const selected = stops[selectedIndex];
  const selectedPoi = pois.find(poi => poi.id === selection);
  const panel = requestedPanel === 'stop' && !selected && !selectedPoi ? 'stops' : requestedPanel;
  const canvasSelection = panel === 'stop' || panel === 'boarding' ? selection : null;
  const stopsPanelOpen = panel === 'stops' || panel === 'stop' || panel === 'boarding' || panel === 'departures';
  const scheduleProduct = planner.product?.slug;
  const nearest = walkingToNearestStop(stops, visitor);
  const pickup = walkingBoarding(planner.product?.mode, boarding, stops, visitor);
  const locationTarget = nearest?.coordinate ?? pickup?.coordinate;
  const showFixedPickup = nearest && planner.product?.mode === 'selected_departure' && boarding &&
    nearest.stop.id !== boarding.stopId;
  const selectedPhoto = selected?.place?.image ?? selected?.design?.photoUrl;
  const canTrack = routes.length > 0 && live.mapVersion !== null;
  const vehicle = canTrack ? live.position : null;
  const lastKnownVehicle = canTrack && !vehicle ? live.lastKnown : null;
  const lastKnownTime = observedAt ? new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tirane',
  }).format(new Date(observedAt)) : null;


  useEffect(() => {
    if (preview) return;
    let version = initialStatus.mapVersion;
    const controller = new AbortController();
    let busy = false;
    async function refresh() {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const reply = await fetch('/api/public/route-tracking?geometry=' + encodeURIComponent(String(version ?? '')), {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]), cache: 'no-store',
        });
        if (!reply.ok) throw Error('Tracking unavailable');
        const { map: nextMap, ...status }: RouteStatus & { map?: PublishedMap } = await reply.json();
        if (controller.signal.aborted) return;
        if (status.mapVersion == null) throw Error('Tracking unavailable');
        if (version != null && Number(status.mapVersion) < Number(version)) return;
        const changed = String(status.mapVersion) !== String(version);
        if (changed && !nextMap) throw Error('Map version unavailable');
        version = status.mapVersion;
        setData(current => ({ map: changed ? nextMap : current.map, status: expireRouteStatus(status) }));
        setTrackingError(false);
      } catch {
        if (!controller.signal.aborted) {
          setTrackingError(true);
          setData(current => ({ ...current, status: expireRouteStatus(current.status, Date.now(), true) }));
        }
      } finally { busy = false; }
    }
    refreshTracking.current = refresh;
    void refresh();
    const timer = setInterval(refresh, 10_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);
    return () => {
      refreshTracking.current = null;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', refresh);
    };
  }, [initialStatus.mapVersion, preview]);

  useEffect(() => {
    const deadline = routeStatusDeadline(live);
    if (deadline === null) return;
    const timer = setTimeout(() => setData(current => current.status === live
      ? { ...current, status: expireRouteStatus(live) } : current), Math.max(0, deadline - Date.now()) + 1);
    return () => clearTimeout(timer);
  }, [live]);

  useEffect(() => {
    function syncTimetable() {
      if (window.location.hash === '#journey-departures') setPanel(showDepartures ? 'departures' : 'stops');
    }
    syncTimetable();
    window.addEventListener('hashchange', syncTimetable);
    return () => window.removeEventListener('hashchange', syncTimetable);
  }, [showDepartures]);

  useEffect(() => {
    if (preview || !showDepartures || panel !== 'departures') return;
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
  }, [panel, preview, scheduleProduct, showDepartures]);

  function show(next: Exclude<Panel, null>, id: string | null = null) {
    if (next !== 'location') locationRequest.current += 1;
    const active = document.activeElement;
    if (active instanceof HTMLElement && !active.closest('#route-panel')) previousControl.current = active;
    select(id);
    setPanel(next);
  }
  function choose(id: string) {
    const boardingId = id === 'boarding' || (boarding?.coordinate && id === boarding.stopId);
    setFollowingVan(false);
    show(boardingId ? 'boarding' : 'stop', boardingId ? 'boarding' : id);
  }
  function close(restoreFocus = true) {
    locationRequest.current += 1;
    setPanel(null);
    select(null);
    if (restoreFocus) previousControl.current?.focus({ preventScroll: true });
  }
  function findMe() {
    setFollowingVan(false);
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
      setLocationMessage(accuracy > nearbyBoardingAccuracy
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

  return <main id="main-content" data-route-explorer={preview ? undefined : true} className={preview ? `${styles.page} ${styles.preview}` : styles.page}
    onKeyDown={event => {
    if (event.key === 'Escape' && panel) close();
  }}>
    <h1 className={preview ? undefined : styles.visuallyHidden}>{content['routePage.title'] || map?.routes[0]?.name || 'Tour route'}</h1>
    <div className={styles.workspace}>
      <div className={styles.map}>
        {preview ? <p className={styles.loading}>Map and live tracking are disabled in this saved draft preview.</p> : <MapBoundary><Map routes={routes} stops={stops} pois={pois} boarding={boarding} vehicle={vehicle} lastKnownVehicle={lastKnownVehicle} findVehicle={findVehicle} followingVan={followingVan} onManualView={() => setFollowingVan(false)}
          selected={canvasSelection} visitor={visitor} centerVisitor={panel === 'location'} locationTarget={locationTarget} reset={reset} zoom={zoom} onSelect={choose} /></MapBoundary>}
        {!preview && <div className={styles.mapTools} role="group" aria-label="Map view" data-map-obstacle data-map-tools>
          {trackingError && !preview && <button type="button" onClick={() => refreshTracking.current?.()}>Retry tracking</button>}
          <div className={styles.zoomControls}>
            <button type="button" aria-label="Zoom in" onClick={() => { setFollowingVan(false); setZoom({ delta: 1 }); }}>+</button>
            <button type="button" aria-label="Zoom out" onClick={() => { setFollowingVan(false); setZoom({ delta: -1 }); }}>−</button>
          </div>
        </div>}
      </div>
      {panel && <section className={`${styles.panel} ${panel === 'boarding' || panel === 'location' ? styles.boardingPanel : ''}`} id="route-panel" aria-label={panel === 'stop' ? selected?.name ?? selectedPoi?.name : panel === 'location' ? 'Boarding directions' : panel === 'tracking' ? 'Tracking details' : panel} data-map-obstacle>
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
          {panel === 'stop' && selectedPoi && <><p className={styles.kicker}>Place of interest</p><h2>{selectedPoi.name}</h2>
            {selectedPoi.description && <p>{selectedPoi.description}</p>}</>}
          {panel === 'stops' && <><p className={styles.kicker}>{content['routePage.eyebrow']}</p><h2>{content['routePage.stops'] || 'Stops'}</h2>
            {content['routePage.text'] && <p>{content['routePage.text']}</p>}
            {stops.length ? <ol className={styles.stops}>{stops.map((stop, index) => <li key={stop.id}>
              <button type="button" onClick={() => choose(stop.id)}><b>{index + 1}</b> {boarding?.stopId === stop.id ? 'Start here' : stop.place?.name ?? stop.name}</button>
            </li>)}</ol> : <p>The itinerary is currently unavailable.</p>}
            {boarding && !stops.some(stop => stop.id === boarding.stopId) &&
              <button type="button" onClick={() => choose('boarding')}>Boarding point</button>}
            {pois.length > 0 && <><h3>Places of interest</h3><ul className={styles.stops}>{pois.map(poi => <li key={poi.id}>
              <button type="button" onClick={() => choose(poi.id)}>{poi.name}</button>
            </li>)}</ul></>}
            {showDepartures && <button type="button" onClick={() => show('departures')}>View departures</button>}
          </>}
          {panel === 'location' && <>
            <p className={styles.kicker}>{nearest ? 'Nearest stop' : 'Boarding point'}</p>
            <h2>{nearest?.stop.place?.name ?? nearest?.stop.name ?? pickup?.name ?? 'Boarding details unavailable'}</h2>
            {!nearest && pickup?.directions && <p>{pickup.directions}</p>}
            {(nearest?.url ?? pickup?.url) && <a className={styles.directions} href={nearest?.url ?? pickup?.url} target="_blank" rel="noopener noreferrer">
              {nearest || pickup?.walking ? 'Walking directions in Google Maps' : 'Get directions'}
            </a>}
            {showFixedPickup && <p>For scheduled tours, meet at <a href={boarding.url} target="_blank" rel="noopener noreferrer">{boarding.name}</a>.</p>}
            {locationMessage && <p className={styles.locationStatus} role="status">{locationMessage}</p>}
            {locationMessage && !visitor && locationMessage !== 'Finding your location…' &&
              <button type="button" onClick={findMe}>Try again</button>}
          </>}
          {panel === 'tracking' && <><h2>Tracking details</h2>
            <p role="status">{live.closed ? 'Tracking is outside scheduled operating hours.' : vehicle ? live.movement ?? 'Van location live' : lastKnownVehicle ? 'Showing the last known van position. Live updates are unavailable.' : 'Live location unavailable'}</p>
            {lastKnownTime && <p>Last GPS update at {lastKnownTime}, Shkodra time.</p>}
            {vehicle && live.eta && <p>Next stop in {live.eta}.</p>}
          </>}
          {panel === 'departures' && showDepartures && <><h2 id="journey-departures">{content['routePage.departures'] || 'Departures'}</h2>{planner.product && <p>{planner.title}</p>}<p>Today · Shkodra local time</p>
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
        <button type="button" disabled={preview} aria-expanded={panel === 'location'} aria-controls={panel === 'location' ? 'route-panel' : undefined} onClick={() => panel === 'location' ? close() : findMe()}><RouteControlIcon name="me" />Find me</button>
        <button type="button" disabled={preview} aria-expanded={panel === 'tracking'} aria-controls={panel === 'tracking' ? 'route-panel' : undefined} onClick={() => {
          if (panel === 'tracking' && followingVan) { close(); return; }
          show('tracking');
          setFollowingVan(true);
          setFindVehicle(value => value + 1);
        }}><RouteControlIcon name="van" />Find van</button>
        <button type="button" onClick={() => {
          close(false);
          setVisitor(null);
          setFollowingVan(false);
          setReset(value => value + 1);
        }}><RouteControlIcon name="route" />Route</button>
      </nav>
    </div>
  </main>;
}
