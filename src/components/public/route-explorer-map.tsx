'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Position } from '@/modules/tracking/positions';
import type { Coordinate } from '@/modules/tracking/published-map';
import type { RouteBoarding, RouteStop } from '@/modules/tracking/route-itinerary';
import styles from './route-explorer.module.css';

type Props = {
  lines: Coordinate[][]; stops: RouteStop[]; boarding: RouteBoarding | null;
  vehicle: Position | null; vehicleHistorical: boolean; findVehicle: number; selected: string | null; reset: number;
  onSelect: (id: string) => void;
};

type LabelBox = { left: number; top: number; right: number; bottom: number };

function overlaps(a: LabelBox, b: LabelBox) {
  const gap = 3;
  return a.left < b.right + gap && a.right > b.left - gap &&
    a.top < b.bottom + gap && a.bottom > b.top - gap;
}

function arrangeStopCaptions(canvas: HTMLElement, markers: Map<string, L.Marker>, selected: string | null) {
  const viewport = canvas.getBoundingClientRect();
  const entries = [...markers].flatMap(([id, marker]) => {
    const element = marker.getElement();
    const content = element?.querySelector<HTMLElement>(`.${styles.pinContent}`);
    const photo = element?.querySelector<HTMLElement>(`.${styles.pin}`);
    if (!element || !content || !photo) return [];
    const caption = element.querySelector<HTMLElement>(`.${styles.pinCaption}`);
    content.style.transform = '';
    content.style.setProperty('--caption-leader', '0px');
    if (caption) { caption.style.transform = ''; caption.style.visibility = ''; }
    return [{ id, element, content, photo: photo.getBoundingClientRect() as LabelBox, caption }];
  }).sort((a, b) => Number(b.id === selected) - Number(a.id === selected));

  const vehicle = canvas.querySelector('.leaflet-tourVehicle-pane img')?.getBoundingClientRect();
  const tooltip = canvas.querySelector('.leaflet-tooltip-pane .leaflet-tooltip')?.getBoundingClientRect();
  const occupied: LabelBox[] = entries.filter(entry => !entry.caption).map(entry => entry.photo);
  if (vehicle) occupied.push(vehicle);
  if (tooltip) occupied.push(tooltip);
  // Keep dense symbols tappable. The short leader keeps the shifted card tied to its exact stop.
  for (const entry of entries) {
    if (!entry.caption) continue;
    const original = entry.photo;
    const candidates = [[0, 0], [-28, 0], [28, 0], [-46, 0], [46, 0],
      [-25, 25], [25, 25], [-25, -25], [25, -25], [0, 46], [-48, 30], [48, 30]];
    const offset = candidates.find(([x, y]) => {
      const box = { left: original.left + x, top: original.top + y, right: original.right + x, bottom: original.bottom + y };
      return box.left >= viewport.left + 4 && box.right <= viewport.right - 4 &&
        box.top >= viewport.top + 6 && box.bottom <= viewport.bottom - 18 &&
        !occupied.some(other => overlaps(box, other));
    }) ?? [0, 0];
    const [x, y] = offset;
    entry.photo = { left: original.left + x, top: original.top + y, right: original.right + x, bottom: original.bottom + y };
    occupied.push(entry.photo);
    entry.content.style.transform = x || y ? `translate(${x}px, ${y}px)` : '';
    entry.element.style.setProperty('--pin-leader', `${Math.hypot(x, y)}px`);
    entry.element.style.setProperty('--pin-angle', `${Math.atan2(y, x)}rad`);
  }

  const placed: LabelBox[] = [];
  const offsets = [0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120].flatMap(y =>
      [0, -20, 20, -40, 40, -60, 60, -80, 80].map(x => ({ x, y })))
      .sort((a, b) => Math.abs(a.x) * 1.3 + a.y - Math.abs(b.x) * 1.3 - b.y);
  for (const { id, caption, content } of entries) {
    if (!caption) continue;
    const box = caption.getBoundingClientRect();
    const obstructions = entries.filter(entry => entry.id !== id).map(entry => entry.photo);
    if (vehicle) obstructions.push(vehicle);
    if (tooltip) obstructions.push(tooltip);
    let offset: [number, number] | undefined;
    for (const { x: shift, y } of offsets) {
      const x = Math.min(viewport.right - 6 - box.right, Math.max(viewport.left + 6 - box.left, shift));
      const candidate = { left: box.left + x, right: box.right + x, top: box.top + y, bottom: box.bottom + y };
      if (Math.abs(x) > 84 || candidate.top < viewport.top + 8 || candidate.bottom > viewport.bottom - 18 ||
          [...obstructions, ...placed].some(other => overlaps(candidate, other))) continue;
      offset = [x, y];
      placed.push(candidate);
      break;
    }
    if (!offset) {
      caption.style.visibility = 'hidden';
      continue;
    }
    const [x, y] = offset;
    caption.style.transform = `translate(${x}px, ${y}px)`;
    if (x || y) {
      content.style.setProperty('--caption-leader', `${Math.hypot(x, y + 3)}px`);
      content.style.setProperty('--caption-angle', `${Math.atan2(y + 3, x)}rad`);
    }
  }
}

export default function RouteExplorerMap({ lines, stops, boarding, vehicle, vehicleHistorical, findVehicle, selected, reset, onSelect }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pins = useRef(new Map<string, L.Marker>());
  const van = useRef<L.Marker | null>(null);
  const lastFind = useRef(0);
  const choose = useEffectEvent((id: string) => onSelect(id));
  const arrange = useEffectEvent(() => {
    if (surface.current) arrangeStopCaptions(surface.current, pins.current, selected);
  });

  useEffect(() => {
    if (!surface.current) return;
    const instance = L.map(surface.current, { scrollWheelZoom: true, zoomControl: false, zoomAnimation: false, zoomSnap: 0.25 }).setView([42.069, 19.512], 13);
    map.current = instance;
    // Leaflet's stop markers share a pane and can overlap the parked van.
    instance.createPane('tourVehicle').style.zIndex = '625';
    L.control.zoom({ position: 'topright' }).addTo(instance);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    const tileFailure = () => surface.current?.setAttribute('data-tiles', 'unavailable');
    const tileReady = () => surface.current?.removeAttribute('data-tiles');
    tiles.on('tileerror', tileFailure).on('tileload', tileReady);
    instance.on('moveend zoomend resize', arrange);
    const observer = new ResizeObserver(() => instance.invalidateSize({ animate: false }));
    observer.observe(surface.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; van.current = null; };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const group = L.layerGroup().addTo(instance);
    const markers = pins.current;
    for (const line of lines) {
      L.polyline(line, { color: '#fff', weight: 9, interactive: false }).addTo(group);
      L.polyline(line, { color: '#a93229', weight: 5, interactive: false }).addTo(group);
    }
    const pin = (id: string, name: string, coordinate: Coordinate, label: string, image?: string, stopName?: string) => {
      const content = document.createElement('span');
      content.className = styles.pinContent;
      const badge = document.createElement('span');
      badge.className = styles.pin;
      content.append(badge);
      const start = id === 'boarding';
      if (image) {
        const thumbnail = document.createElement('img');
        thumbnail.src = image;
        thumbnail.alt = '';
        thumbnail.addEventListener('error', () => thumbnail.remove(), { once: true });
        badge.append(thumbnail);
      }
      const number = document.createElement('b');
      number.textContent = label;
      badge.append(number);
      if (stopName) {
        const caption = document.createElement('span');
        caption.className = styles.pinCaption;
        caption.textContent = stopName;
        content.append(caption);
      }
      const marker = L.marker(coordinate, {
        icon: L.divIcon({ className: start ? styles.startMarker : styles.marker, html: content,
          iconSize: start ? [90, 32] : [104, 80], iconAnchor: start ? [12, 16] : [52, 31] }),
        keyboard: true, title: name, zIndexOffset: start ? 250 : 0,
      }).addTo(group);
      const button = marker.getElement();
      button?.setAttribute('aria-label', name);
      button?.addEventListener('keydown', event => {
        if (event.key === ' ') { event.preventDefault(); choose(id); }
      });
      marker.on('click', () => choose(id));
      markers.set(id, marker);
    };
    stops.forEach((stop, index) => {
      const sourceName = stop.place?.name || stop.name;
      const name = sourceName.replace(/^Stop\s+\d+\s*[-–—:]\s*/i, '').trim() || sourceName;
      if (stop.coordinate) pin(stop.id, `Stop ${index + 1}: ${name}`, stop.coordinate, String(index + 1), stop.place?.image, name);
    });
    if (boarding?.coordinate) pin('boarding', `Start here: ${boarding.name}`, boarding.coordinate, 'Start here');
    return () => { group.remove(); markers.clear(); };
  }, [boarding, lines, stops]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    instance.invalidateSize({ pan: false });
    const bounds = L.latLngBounds([...lines.flat(), ...stops.flatMap(stop => stop.coordinate ? [stop.coordinate] : []),
      ...(boarding?.coordinate ? [boarding.coordinate] : [])]);
    if (bounds.isValid()) instance.fitBounds(bounds, { paddingTopLeft: [52, 118], paddingBottomRight: [52, 60], maxZoom: 15, animate: false });
  }, [boarding, lines, reset, stops]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    for (const [id, marker] of pins.current) {
      marker.getElement()?.setAttribute('data-selected', String(id === selected));
      marker.setZIndexOffset(id === selected ? 500 : id === 'boarding' ? 250 : 0);
    }
    const marker = selected ? pins.current.get(selected) : undefined;
    arrange();
    if (!marker) return;
    const frame = requestAnimationFrame(() => {
      instance.invalidateSize({ pan: false });
      const target = instance.latLngToContainerPoint(marker.getLatLng());
      const size = instance.getSize();
      const x = Math.max(56, Math.min(size.x - 56, target.x));
      const y = Math.max(120, Math.min(size.y - 58, target.y));
      if (x !== target.x || y !== target.y) instance.panBy([target.x - x, target.y - y], { animate: false });
      arrange();
    });
    return () => cancelAnimationFrame(frame);
  }, [boarding, lines, selected, stops]);

  useEffect(() => {
    if (!vehicle) { van.current?.remove(); van.current = null; arrange(); return; }
    if (!map.current) return;
    const point: Coordinate = [vehicle.lat, vehicle.lng];
    const label = vehicleHistorical ? 'Last known van location' : 'Live sightseeing van';
    const tooltip = vehicleHistorical ? `Last known van location · ${new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tirane',
    }).format(new Date(vehicle.updatedAt))} Shkodra time` : null;
    if (van.current?.options.alt === label) {
      van.current.setLatLng(point);
      if (tooltip) van.current.setTooltipContent(tooltip);
      arrange();
      return;
    }
    van.current?.remove();
    van.current = L.marker(point, {
      icon: L.icon({ iconUrl: '/brand/map-bus-front.svg',
        className: vehicleHistorical ? `${styles.vanMarker} ${styles.historicalVan}` : styles.vanMarker,
        iconSize: [36, 36], iconAnchor: [18, 18] }),
      pane: 'tourVehicle', title: label, alt: label, keyboard: vehicleHistorical, interactive: vehicleHistorical,
    }).addTo(map.current);
    if (tooltip) van.current.bindTooltip(tooltip, { direction: 'top', offset: [0, -18] });
    arrange();
  }, [vehicle, vehicleHistorical]);

  useEffect(() => {
    if (!vehicle || !map.current || lastFind.current === findVehicle) return;
    lastFind.current = findVehicle;
    map.current.setView([vehicle.lat, vehicle.lng], Math.max(15, map.current.getZoom()), { animate: false });
  }, [findVehicle, vehicle]);

  return <div ref={surface} className={styles.canvas} role="region" aria-label="Interactive tour map" />;
}
