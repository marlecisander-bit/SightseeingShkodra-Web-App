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
  vehicle: Position | null; selected: string | null; reset: number;
  onSelect: (id: string) => void;
};

export default function RouteExplorerMap({ lines, stops, boarding, vehicle, selected, reset, onSelect }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pins = useRef(new Map<string, L.Marker>());
  const van = useRef<L.Marker | null>(null);
  const choose = useEffectEvent((id: string) => onSelect(id));

  useEffect(() => {
    if (!surface.current) return;
    const instance = L.map(surface.current, { scrollWheelZoom: false, zoomControl: false, zoomAnimation: false }).setView([42.069, 19.512], 13);
    map.current = instance;
    L.control.zoom({ position: 'topright' }).addTo(instance);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    const tileFailure = () => surface.current?.setAttribute('data-tiles', 'unavailable');
    const tileReady = () => surface.current?.removeAttribute('data-tiles');
    tiles.on('tileerror', tileFailure).on('tileload', tileReady);
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
    const pin = (id: string, name: string, coordinate: Coordinate, label: string, image?: string) => {
      const badge = document.createElement('span');
      badge.className = styles.pin;
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
      const start = id === 'boarding';
      const marker = L.marker(coordinate, {
        icon: L.divIcon({ className: start ? styles.startMarker : styles.marker, html: badge,
          iconSize: start ? [90, 32] : [42, 42], iconAnchor: start ? [12, 16] : [21, 21] }),
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
      if (stop.coordinate) pin(stop.id, `Stop ${index + 1}: ${stop.name}`, stop.coordinate, String(index + 1), stop.place?.image);
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
    if (bounds.isValid()) instance.fitBounds(bounds, { paddingTopLeft: [32, 118], paddingBottomRight: [36, 40], maxZoom: 15, animate: false });
  }, [boarding, lines, reset, stops]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    for (const [id, marker] of pins.current) {
      marker.getElement()?.setAttribute('data-selected', String(id === selected));
      marker.setZIndexOffset(id === selected ? 500 : id === 'boarding' ? 250 : 0);
    }
    const marker = selected ? pins.current.get(selected) : undefined;
    if (!marker) return;
    const frame = requestAnimationFrame(() => {
      instance.invalidateSize({ pan: false });
      const target = instance.latLngToContainerPoint(marker.getLatLng());
      const size = instance.getSize();
      const x = Math.max(48, Math.min(size.x - 48, target.x));
      const y = Math.max(112, Math.min(size.y - 40, target.y));
      if (x !== target.x || y !== target.y) instance.panBy([target.x - x, target.y - y], { animate: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [boarding, lines, selected, stops]);

  useEffect(() => {
    if (!vehicle) { van.current?.remove(); van.current = null; return; }
    if (!map.current) return;
    const point: Coordinate = [vehicle.lat, vehicle.lng];
    if (van.current) van.current.setLatLng(point);
    else van.current = L.marker(point, {
      icon: L.icon({ iconUrl: '/brand/map-bus-front.svg', className: styles.vanMarker,
        iconSize: [36, 36], iconAnchor: [18, 18] }),
      title: 'Live sightseeing van', alt: 'Live sightseeing van', keyboard: false,
      interactive: false, zIndexOffset: 350,
    }).addTo(map.current);
  }, [vehicle]);

  return <div ref={surface} className={styles.canvas} role="region" aria-label="Interactive tour map" />;
}
