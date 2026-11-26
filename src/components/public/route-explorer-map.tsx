'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../../public/live-map-workspace/css/stop-design.css';
import type { Position } from '@/modules/tracking/positions';
import type { Coordinate, PublishedMap, StopDesign } from '@/modules/tracking/published-map';
import type { RouteBoarding, RouteStop } from '@/modules/tracking/route-itinerary';
import styles from './route-explorer.module.css';

type Props = {
  routes: PublishedMap['routes']; stops: RouteStop[]; boarding: RouteBoarding | null;
  vehicle: Position | null; lastKnownVehicle: Position | null; findVehicle: number; followingVan: boolean; onManualView: () => void; selected: string | null; reset: number;
  zoom: { delta: number } | null;
  visitor: { coordinate: Coordinate; accuracy: number } | null; centerVisitor: boolean; locationTarget?: Coordinate;
  onSelect: (id: string) => void;
};

function mapObstacles(canvas: HTMLElement) {
  const workspace = canvas.closest('[data-route-explorer]');
  return [...workspace?.querySelectorAll('[data-map-obstacle]') ?? []].map(node => node.getBoundingClientRect());
}

function keepVisible(instance: L.Map, coordinate: L.LatLngExpression, padding: number) {
  const canvas = instance.getContainer();
  const rect = canvas.getBoundingClientRect();
  const size = instance.getSize();
  const original = instance.latLngToContainerPoint(coordinate);
  const clamp = (x: number, y: number) => L.point(
    Math.max(padding, Math.min(size.x - padding, x)),
    Math.max(padding, Math.min(size.y - padding - 16, y)),
  );
  const obstacles = mapObstacles(canvas).filter(box =>
    box.left < rect.right && box.right > rect.left && box.top < rect.bottom && box.bottom > rect.top,
  );
  const xs = [original.x, ...obstacles.flatMap(box => [
    box.left - rect.left - padding - 2, box.right - rect.left + padding + 2,
  ])];
  const ys = [original.y, ...obstacles.flatMap(box => [
    box.top - rect.top - padding - 2, box.bottom - rect.top + padding + 2,
  ])];
  const candidates = xs.flatMap(x => ys.map(y => clamp(x, y)));
  const best = candidates.filter(point => !obstacles.some(box =>
    rect.left + point.x + padding > box.left && rect.left + point.x - padding < box.right &&
    rect.top + point.y + padding > box.top && rect.top + point.y - padding < box.bottom,
  )).sort((a, b) => a.distanceTo(original) - b.distanceTo(original))[0] ?? candidates[0];
  if (!best.equals(original)) instance.panBy(original.subtract(best), { animate: false });
}

const followZoom = 16;
const initialCenter: Coordinate = [42.069, 19.512];
const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function RouteExplorerMap({ routes, stops, boarding, vehicle, lastKnownVehicle, findVehicle, followingVan, onManualView, selected, reset, zoom, visitor, centerVisitor, locationTarget, onSelect }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pins = useRef(new Map<string, L.Marker>());
  const van = useRef<L.Marker | null>(null);
  const lastFind = useRef(0);
  const vehicleLat = (vehicle ?? lastKnownVehicle)?.lat;
  const vehicleLng = (vehicle ?? lastKnownVehicle)?.lng;
  const targetLat = locationTarget?.[0];
  const targetLng = locationTarget?.[1];
  const manualView = useEffectEvent(() => onManualView());
  const choose = useEffectEvent((id: string) => onSelect(id));

  const placeLabels = useEffectEvent(() => {
    const canvas = surface.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const priority = (id: string) => (id === selected ? 2 : 0) + (id === 'boarding' ? 1 : 0);
    const markers = [...pins.current].sort(([a], [b]) => priority(b) - priority(a));
    const symbols = markers.flatMap(([, marker]) => {
      const element = marker.getElement();
      return (element?.querySelector('.stop-portrait') ?? element)?.getBoundingClientRect() ?? [];
    });
    const obstacles = [
      ...symbols,
      ...mapObstacles(canvas),
    ];
    for (const [id, marker] of markers) {
      const caption = marker.getElement()?.querySelector<HTMLElement>('[data-map-caption]');
      if (!caption) continue;
      caption.style.visibility = 'hidden';
      const placements = id === 'boarding' ? ['above', 'right', 'left', 'below'] : ['below', 'right', 'left'];
      for (const placement of placements) {
        caption.dataset.placement = placement;
        const box = caption.getBoundingClientRect();
        if (box.left < bounds.left + 4 || box.right > bounds.right - 4 ||
            box.top < bounds.top + 4 || box.bottom > bounds.bottom - 18 ||
            obstacles.some(other => box.left < other.right + 2 && box.right > other.left - 2 &&
              box.top < other.bottom + 2 && box.bottom > other.top - 2)) continue;
        caption.style.visibility = 'visible';
        obstacles.push(box);
        break;
      }
    }
  });

  useEffect(() => {
    if (!surface.current) return;
    const instance = L.map(surface.current, {
      scrollWheelZoom: true, zoomControl: false, zoomAnimation: false, zoomSnap: 0.25, minZoom: 3,
    }).setView(initialCenter, 13);
    map.current = instance;
    instance.on('dragstart', manualView);
    instance.createPane('tourVehicle').style.zIndex = '625';
    instance.createPane('tourVisitor').style.zIndex = '624';
    const tiles = L.tileLayer(tileUrl, { maxZoom: 19, attribution, referrerPolicy: 'strict-origin' }).addTo(instance);
    tiles.on('tileerror', () => surface.current?.setAttribute('data-tiles', 'unavailable'));
    tiles.on('tileload', () => surface.current?.removeAttribute('data-tiles'));
    instance.on('moveend resize', placeLabels);
    const observer = new ResizeObserver(() => { instance.invalidateSize({ animate: false }); placeLabels(); });
    observer.observe(surface.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; van.current = null; };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const group = L.layerGroup().addTo(instance);
    const markers = pins.current;
    for (const route of routes) for (const line of route.lines) {
      L.polyline(line, {
        color: route.color === 'var(--ss-route)' ? '#d90000' : route.color,
        weight: route.weight ?? 6, opacity: .92,
        dashArray: route.lineStyle === 'dashed' ? '12 8' : route.lineStyle === 'dotted' ? '2 8' : undefined,
        interactive: false,
      }).addTo(group);
    }

    function addPin(id: string, location: Coordinate, number: string, name: string, design?: StopDesign) {
      const start = id === 'boarding';
      const content = document.createElement('span');
      const label = document.createElement('span');
      label.className = design ? `stop-name-pill ${styles.photoCaption}` : styles.pinCaption;
      label.dataset.mapCaption = '';
      label.textContent = start ? 'Start here' : name;
      if (design) {
        content.className = 'stop-marker-shell';
        const portrait = document.createElement('span');
        portrait.className = 'stop-portrait';
        portrait.style.setProperty('--stop-color', design.color);
        const frame = document.createElement('span');
        frame.className = 'stop-photo-frame';
        const fallback = document.createElement('span');
        fallback.className = 'stop-photo-fallback';
        fallback.textContent = 'Photo unavailable';
        frame.append(fallback);
        if (design.photoUrl) {
          const image = document.createElement('img');
          image.className = 'stop-photo';
          image.alt = '';
          image.decoding = 'async';
          image.referrerPolicy = 'no-referrer';
          image.addEventListener('error', () => { image.hidden = true; portrait.classList.add('is-photo-missing'); });
          image.src = design.photoUrl;
          frame.prepend(image);
        } else portrait.classList.add('is-photo-missing');
        const badge = document.createElement('span');
        badge.className = 'stop-number-badge';
        badge.textContent = design.number;
        portrait.append(frame, badge, label);
        content.append(portrait);
      } else {
        const body = document.createElement('span');
        body.className = styles.pinNumber;
        body.textContent = number;
        content.append(body, label);
      }

      const title = start ? `Start here: ${name}` : `Stop ${number}: ${name}`;
      const marker = L.marker(location, {
        icon: L.divIcon({ className: design ? `stop-photo-marker ${styles.photoMarker} ${start ? styles.boardingPhoto : ''}` : start ? styles.startMarker : styles.marker,
          html: content, iconSize: design ? [44, 44] : [34, 34], iconAnchor: design ? [22, 22] : [17, start ? 30 : 17] }),
        keyboard: true, autoPanOnFocus: false, title, zIndexOffset: start ? 250 : 0,
      }).addTo(group);
      const button = marker.getElement();
      button?.setAttribute('aria-label', title);
      button?.addEventListener('keydown', event => {
        if (event.key === ' ') { event.preventDefault(); choose(id); }
      });
      marker.on('click', () => {
        button?.focus({ preventScroll: true });
        choose(id);
      });
      markers.set(id, marker);
    }
    stops.forEach((stop, index) => {
      if (!stop.coordinate || (boarding?.coordinate && boarding.stopId === stop.id)) return;
      const sourceName = stop.name;
      const name = sourceName.replace(/^Stop\s+\d+\s*[-–—:]\s*/i, '').trim() || sourceName;
      addPin(stop.id, stop.coordinate, stop.design?.number ?? String(index + 1), name, stop.design);
    });
    if (boarding?.coordinate) addPin('boarding', boarding.coordinate, '●', boarding.name, stops.find(stop => stop.id === boarding.stopId)?.design);
    placeLabels();
    return () => { group.remove(); markers.clear(); };
  }, [boarding, routes, stops]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const frame = requestAnimationFrame(() => {
      instance.invalidateSize({ animate: false });
      const bounds = L.latLngBounds([...routes.flatMap(route => route.lines.flat()), ...stops.flatMap(stop => stop.coordinate ? [stop.coordinate] : []),
        ...(boarding?.coordinate ? [boarding.coordinate] : [])]);
      const size = instance.getSize();
      const top = Math.min(66, size.y * .18);
      const bottom = Math.min(size.x > 760 ? 140 : 94, size.y * .26);
      if (bounds.isValid()) instance.fitBounds(bounds, {
        paddingTopLeft: [37, top], paddingBottomRight: [37, bottom], maxZoom: 15, animate: false,
      });
      else instance.setView(initialCenter, 13, { animate: false });
      placeLabels();
    });
    return () => cancelAnimationFrame(frame);
  }, [boarding, routes, reset, stops]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    for (const [id, marker] of pins.current) {
      const element = marker.getElement();
      element?.setAttribute('data-selected', String(id === selected));
      element?.setAttribute('aria-pressed', String(id === selected));
      marker.setZIndexOffset(id === selected ? 500 : id === 'boarding' ? 250 : 0);
    }
    const marker = selected ? pins.current.get(selected) : undefined;
    const frame = requestAnimationFrame(() => {
      if (marker) {
        instance.invalidateSize({ animate: false });
        instance.panTo(marker.getLatLng(), { animate: false });
        keepVisible(instance, marker.getLatLng(), 38);
      }
      placeLabels();
    });
    return () => cancelAnimationFrame(frame);
  }, [boarding, routes, selected, stops]);

  useEffect(() => {
    const displayed = vehicle ?? lastKnownVehicle;
    if (!displayed) { van.current?.remove(); van.current = null; return; }
    if (!map.current) return;
    const point: Coordinate = [displayed.lat, displayed.lng];
    const label = vehicle ? 'Live sightseeing van' : 'Last known sightseeing van position';
    if (!van.current) {
      van.current = L.marker(point, {
        icon: L.icon({ iconUrl: '/live-map-workspace/assets/brand/sightseeing-van.svg', className: styles.vanMarker,
          iconSize: [58, 38], iconAnchor: [29, 19] }),
        pane: 'tourVehicle', keyboard: false, interactive: false,
      }).addTo(map.current);
    } else van.current.setLatLng(point);
    const icon = van.current.getElement();
    icon?.setAttribute('alt', label);
    icon?.setAttribute('title', label);
    if (vehicle) van.current.unbindTooltip();
    else if (!van.current.getTooltip()) van.current.bindTooltip('Last known', {
      permanent: true, direction: 'bottom', offset: [0, 17],
    });
  }, [vehicle, lastKnownVehicle]);

  useEffect(() => {
    if (!followingVan || vehicleLat === undefined || vehicleLng === undefined) return;
    const frame = requestAnimationFrame(() => {
      const instance = map.current;
      if (!instance) return;
      const requested = lastFind.current !== findVehicle;
      lastFind.current = findVehicle;
      instance.invalidateSize({ animate: false });
      instance.setView([vehicleLat, vehicleLng], requested ? Math.max(followZoom, instance.getZoom()) : followZoom, { animate: false });
      keepVisible(instance, [vehicleLat, vehicleLng], 32);
    });
    return () => cancelAnimationFrame(frame);
  }, [findVehicle, followingVan, vehicleLat, vehicleLng]);

  useEffect(() => {
    const instance = map.current;
    if (!visitor || !instance) return;
    const group = L.layerGroup().addTo(instance);
    if (visitor.accuracy > 0) L.circle(visitor.coordinate, {
      radius: visitor.accuracy, color: '#245bc0', weight: 1, opacity: .4,
      fillColor: '#4388f2', fillOpacity: .12, interactive: false,
    }).addTo(group);
    L.circleMarker(visitor.coordinate, {
      pane: 'tourVisitor', radius: 8, color: '#fff', weight: 3, fillColor: '#245bc0', fillOpacity: 1,
    }).bindTooltip('Your location').addTo(group);
    return () => { group.remove(); };
  }, [visitor]);

  useEffect(() => {
    if (!centerVisitor || !visitor || !map.current) return;
    const frame = requestAnimationFrame(() => {
      const instance = map.current;
      if (!instance) return;
      instance.invalidateSize({ animate: false });
      if (targetLat === undefined || targetLng === undefined) {
        instance.setView(visitor.coordinate, followZoom, { animate: false });
        keepVisible(instance, visitor.coordinate, 18);
        return;
      }
      const canvas = instance.getContainer();
      const rect = canvas.getBoundingClientRect();
      const panel = canvas.closest('[data-route-explorer]')?.querySelector('#route-panel')?.getBoundingClientRect();
      const right = panel && panel.top < rect.bottom && panel.left < rect.right ? rect.right - panel.left : 0;
      instance.fitBounds([visitor.coordinate, [targetLat, targetLng]], {
        paddingTopLeft: [42, 32],
        paddingBottomRight: [Math.ceil(right) + 42, Math.min(110, instance.getSize().y * .27)],
        maxZoom: followZoom, animate: false,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [centerVisitor, visitor, targetLat, targetLng]);

  useEffect(() => {
    if (zoom && map.current) map.current.setZoom(map.current.getZoom() + zoom.delta, { animate: false });
  }, [zoom]);

  return <div ref={surface} className={styles.canvas} role="region" aria-label="Interactive tour map"
    onWheelCapture={onManualView} onDoubleClickCapture={onManualView}
    onTouchStartCapture={event => { if (event.touches.length > 1) onManualView(); }}
    onKeyDownCapture={event => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', '='].includes(event.key)) onManualView();
    }} />;
}
