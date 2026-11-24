'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Position } from 'geojson';
import styles from '@/modules/tracking/shared-map.module.css';

type CanvasProps = {
  routes: Position[][];
  points: { coordinates: Position; selected: boolean }[];
  drawing: Position[] | null;
  onPoint: (position: Position) => void;
};

const latLng = ([longitude, latitude]: Position): L.LatLngTuple => [latitude, longitude];

export default function TrackingEditorCanvas({ routes, points, drawing, onPoint }: CanvasProps) {
  const element = useRef<HTMLDivElement>(null);
  const canvas = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const handleClick = useEffectEvent(({ latlng }: L.LeafletMouseEvent) => onPoint([latlng.lng, latlng.lat]));
  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, { zoomAnimation: false, scrollWheelZoom: false }).setView([42.0683, 19.5126], 13);
    canvas.current = map;
    layers.current = L.layerGroup().addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.on('click', handleClick);
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(element.current);
    return () => { observer.disconnect(); map.remove(); canvas.current = null; layers.current = null; fitted.current = false; };
  }, []);
  useEffect(() => {
    const map = canvas.current;
    const group = layers.current;
    if (!map || !group) return;
    group.clearLayers();
    for (const line of routes) L.polyline(line.map(latLng), { color: '#146576', interactive: false }).addTo(group);
    for (const point of points) L.circleMarker(latLng(point.coordinates), {
      radius: point.selected ? 9 : 5, color: point.selected ? '#a43524' : '#146576', fillOpacity: 1, interactive: false,
    }).addTo(group);
    if (drawing?.length) L.polyline(drawing.map(latLng), { color: '#a43524', dashArray: '6 4', interactive: false }).addTo(group);
    if (!fitted.current && (routes.length || points.length)) {
      const bounds = L.latLngBounds([...routes.flat(), ...points.map(point => point.coordinates)].map(latLng));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15, animate: false });
      fitted.current = true;
    }
  }, [routes, points, drawing]);
  return <div className={styles.canvas} ref={element} role="region" aria-label="Draft route and stop editor map" />;
}
