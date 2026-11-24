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
  vehicle: Position | null; findVehicle: number; selected: string | null; reset: number;
  zoom: { delta: number; request: number };
  onSelect: (id: string) => void;
};

const initialCenter: Coordinate = [42.069, 19.512];
const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function RouteExplorerMap({ lines, stops, boarding, vehicle, findVehicle, selected, reset, zoom, onSelect }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pins = useRef(new Map<string, L.Marker>());
  const van = useRef<L.Marker | null>(null);
  const lastFind = useRef(0);
  const choose = useEffectEvent((id: string) => onSelect(id));

  const placeLabels = useEffectEvent(() => {
    const canvas = surface.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const markers = [...pins.current].sort(([a], [b]) => Number(b === selected) - Number(a === selected));
    const symbols = markers.flatMap(([, marker]) => marker.getElement()?.getBoundingClientRect() ?? []);
    const obstacles = [
      ...symbols,
      ...[...canvas.parentElement!.querySelectorAll('[data-map-obstacle]')].map(element => element.getBoundingClientRect()),
    ];
    for (const [, marker] of markers) {
      const caption = marker.getElement()?.querySelector<HTMLElement>(`.${styles.pinCaption}`);
      if (!caption) continue;
      caption.style.visibility = 'hidden';
      for (const placement of ['right', 'left', 'below']) {
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
    instance.createPane('tourVehicle').style.zIndex = '625';
    // Overview tiles use one lower source zoom, which has fewer street labels.
    const overview = L.tileLayer(tileUrl, { tileSize: 512, zoomOffset: -1, maxZoom: 19, attribution, className: styles.overviewTiles });
    const detail = L.tileLayer(tileUrl, { maxZoom: 19, attribution });
    let active: L.TileLayer | undefined;
    function updateTiles() {
      const next = instance.getZoom() >= 14 ? detail : overview;
      if (active === next) return;
      active?.remove();
      active = next.addTo(instance);
    }
    for (const layer of [overview, detail]) {
      layer.on('tileerror', () => surface.current?.setAttribute('data-tiles', 'unavailable'));
      layer.on('tileload', () => surface.current?.removeAttribute('data-tiles'));
    }
    updateTiles();
    instance.on('zoomend', updateTiles);
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
    for (const line of lines) L.polyline(line, { color: '#8d1d40', weight: 5, interactive: false }).addTo(group);

    function addPin(id: string, location: Coordinate, number: string, name: string) {
      const start = id === 'boarding';
      const body = document.createElement('span');
      body.className = styles.pinNumber;
      body.textContent = number;
      const label = document.createElement('span');
      label.className = styles.pinCaption;
      label.textContent = start ? 'Start here' : name;
      const content = document.createElement('span');
      content.append(body, label);

      const title = start ? `Start here: ${name}` : `Stop ${number}: ${name}`;
      const marker = L.marker(location, {
        icon: L.divIcon({ className: start ? styles.startMarker : styles.marker,
          html: content, iconSize: [34, 34], iconAnchor: [17, start ? 30 : 17] }),
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
      const sourceName = stop.place?.name || stop.name;
      const name = sourceName.replace(/^Stop\s+\d+\s*[-–—:]\s*/i, '').trim() || sourceName;
      addPin(stop.id, stop.coordinate, String(index + 1), name);
    });
    if (boarding?.coordinate) addPin('boarding', boarding.coordinate, '●', boarding.name);
    placeLabels();
    return () => { group.remove(); markers.clear(); };
  }, [boarding, lines, stops]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const frame = requestAnimationFrame(() => {
      instance.invalidateSize({ animate: false });
      const bounds = L.latLngBounds([...lines.flat(), ...stops.flatMap(stop => stop.coordinate ? [stop.coordinate] : []),
        ...(boarding?.coordinate ? [boarding.coordinate] : [])]);
      const size = instance.getSize();
      const top = Math.min(72, size.y * .18);
      const bottom = Math.min(114, size.y * .25);
      if (bounds.isValid()) instance.fitBounds(bounds, {
        paddingTopLeft: [28, top], paddingBottomRight: [28, bottom], maxZoom: 15, animate: false,
      });
      else instance.setView(initialCenter, 13, { animate: false });
      placeLabels();
    });
    return () => cancelAnimationFrame(frame);
  }, [boarding, lines, reset, stops]);

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
        let y = Math.max(62, Math.min(size.y - 60, target.y));
        const canvas = surface.current?.getBoundingClientRect();
        const controls = surface.current?.parentElement?.querySelector('[aria-label="Map controls"]')?.getBoundingClientRect();
        if (canvas && controls && canvas.left + x + 20 > controls.left &&
            canvas.left + x - 20 < controls.right && canvas.top + y + 20 > controls.top) {
          y = Math.max(62, controls.top - canvas.top - 23);
        }
        if (x !== target.x || y !== target.y) instance.panBy([target.x - x, target.y - y], { animate: false });
      }
      placeLabels();
    });
    return () => cancelAnimationFrame(frame);
  }, [boarding, lines, selected, stops]);

  useEffect(() => {
    if (!vehicle) { van.current?.remove(); van.current = null; return; }
    if (!map.current) return;
    const point: Coordinate = [vehicle.lat, vehicle.lng];
    if (van.current) { van.current.setLatLng(point); return; }
    van.current = L.marker(point, {
      icon: L.icon({ iconUrl: '/brand/map-bus-front.svg', className: styles.vanMarker,
        iconSize: [34, 34], iconAnchor: [17, 17] }),
      pane: 'tourVehicle', title: 'Live sightseeing van', alt: 'Live sightseeing van',
      keyboard: false, interactive: false,
    }).addTo(map.current);
  }, [vehicle]);

  useEffect(() => {
    if (!vehicle || !map.current || lastFind.current === findVehicle) return;
    lastFind.current = findVehicle;
    map.current.setView([vehicle.lat, vehicle.lng], Math.max(15, map.current.getZoom()), { animate: false });
  }, [findVehicle, vehicle]);

  useEffect(() => {
    if (zoom.request && map.current) map.current.setZoom(map.current.getZoom() + zoom.delta, { animate: false });
  }, [zoom]);

  return <div ref={surface} className={styles.canvas} role="region" aria-label="Interactive tour map" />;
}
