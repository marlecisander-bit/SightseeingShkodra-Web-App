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
  vehicle: Position | null; findVehicle: number; allowArrivalFocus: boolean; selected: string | null; reset: number;
  zoom: { delta: number; request: number };
  visitor: { coordinate: Coordinate; accuracy: number } | null; centerVisitor: boolean;
  onSelect: (id: string) => void;
};

const initialCenter: Coordinate = [42.069, 19.512];
const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function RouteExplorerMap({ routes, stops, boarding, vehicle, findVehicle, allowArrivalFocus, selected, reset, zoom, visitor, centerVisitor, onSelect }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pins = useRef(new Map<string, L.Marker>());
  const van = useRef<L.Marker | null>(null);
  const lastFind = useRef(0);
  const arrivalDeadline = useRef(0);
  const arrivalFocused = useRef(false);
  const choose = useEffectEvent((id: string) => onSelect(id));

  const placeLabels = useEffectEvent(() => {
    const canvas = surface.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const markers = [...pins.current].sort(([a], [b]) => Number(b === selected) - Number(a === selected));
    const symbols = markers.flatMap(([, marker]) => {
      const element = marker.getElement();
      return (element?.querySelector('.stop-portrait') ?? element)?.getBoundingClientRect() ?? [];
    });
    const obstacles = [
      ...symbols,
      ...[...canvas.parentElement!.querySelectorAll('[data-map-obstacle]')].map(element => element.getBoundingClientRect()),
    ];
    for (const [, marker] of markers) {
      const caption = marker.getElement()?.querySelector<HTMLElement>('[data-map-caption]');
      if (!caption) continue;
      caption.style.visibility = 'hidden';
      for (const placement of ['below', 'right', 'left']) {
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
    arrivalDeadline.current = Date.now() + 15_000;
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
        icon: L.divIcon({ className: design ? `stop-photo-marker ${styles.photoMarker}` : start ? styles.startMarker : styles.marker,
          html: content, iconSize: design ? [44, 44] : [34, 34], iconAnchor: design ? [22, 22] : [17, start ? 30 : 17] }),
        keyboard: true, autoPanOnFocus: false, title, zIndexOffset: start ? 250 : 0,
      }).addTo(group);
      const button = marker.getElement();
      button?.setAttribute('aria-label', title);
      button?.addEventListener('keydown', event => {
        if (event.key === ' ') { event.preventDefault(); choose(id); }
      });
      marker.on('click', () => choose(id));
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
      const top = Math.min(72, size.y * .18);
      const bottom = Math.min(64, size.y * .18);
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
        const target = instance.latLngToContainerPoint(marker.getLatLng());
        const size = instance.getSize();
        const x = Math.max(26, Math.min(size.x - 26, target.x));
        const y = Math.max(62, Math.min(size.y - 48, target.y));
        if (x !== target.x || y !== target.y) instance.panBy([target.x - x, target.y - y], { animate: false });
      }
      placeLabels();
    });
    return () => cancelAnimationFrame(frame);
  }, [boarding, routes, selected, stops]);

  useEffect(() => {
    if (!vehicle) { van.current?.remove(); van.current = null; return; }
    if (!map.current) return;
    const point: Coordinate = [vehicle.lat, vehicle.lng];
    if (van.current) { van.current.setLatLng(point); return; }
    van.current = L.marker(point, {
      icon: L.icon({ iconUrl: '/live-map-workspace/assets/brand/sightseeing-van.svg', className: styles.vanMarker,
        iconSize: [58, 38], iconAnchor: [29, 19] }),
      pane: 'tourVehicle', title: 'Live sightseeing van', alt: 'Live sightseeing van',
      keyboard: false, interactive: false,
    }).addTo(map.current);
  }, [vehicle]);

  useEffect(() => {
    if (!vehicle || !allowArrivalFocus || arrivalFocused.current || Date.now() > arrivalDeadline.current) return;
    const frame = requestAnimationFrame(() => {
      const instance = map.current;
      if (!instance) return;
      arrivalFocused.current = true;
      instance.invalidateSize({ animate: false });
      instance.setView([vehicle.lat, vehicle.lng], 16, { animate: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [allowArrivalFocus, vehicle]);

  useEffect(() => {
    if (!vehicle || !map.current || lastFind.current === findVehicle) return;
    const frame = requestAnimationFrame(() => {
      const instance = map.current;
      if (!instance) return;
      lastFind.current = findVehicle;
      instance.invalidateSize({ animate: false });
      instance.setView([vehicle.lat, vehicle.lng], Math.max(15, instance.getZoom()), { animate: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [findVehicle, vehicle]);

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
      // A coarse location is easier to interpret with its accuracy area in view.
      if (visitor.accuracy >= 120) {
        instance.fitBounds(L.latLng(visitor.coordinate).toBounds(visitor.accuracy * 2), {
          padding: [16, 16], maxZoom: 16, animate: false,
        });
      } else {
        instance.setView(visitor.coordinate, Math.max(16, instance.getZoom()), { animate: false });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [centerVisitor, visitor]);

  useEffect(() => {
    if (zoom.request && map.current) map.current.setZoom(map.current.getZoom() + zoom.delta, { animate: false });
  }, [zoom]);

  return <div ref={surface} className={styles.canvas} role="region" aria-label="Interactive tour map" />;
}
