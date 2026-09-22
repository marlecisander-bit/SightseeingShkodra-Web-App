"use client";
import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapProps } from "./shared-map";
import { positionStatus } from "./positions";
import styles from "./shared-map.module.css";

export default function MapCanvas(props: MapProps & { now: number | null }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([42.068, 19.512], 13);
    map.current = instance;
    markers.current = L.layerGroup().addTo(instance);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, referrerPolicy: "strict-origin-when-cross-origin",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    tiles.on("tileerror", () => setTileError(true));
    const observer = new ResizeObserver(() => instance.invalidateSize({ animate: false }));
    observer.observe(element.current);
    return () => { observer.disconnect(); tiles.off(); instance.remove(); map.current = null; markers.current = null; fitted.current = false; };
  }, []);
  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();
    const positions = props.snapshot.positions;
    positions.forEach((position, index) => {
      const status = props.now === null ? "Checking update time" : positionStatus(position, props.now);
      const label = document.createElement("span");
      label.textContent = `Vehicle ${index + 1}: ${status}`;
      const marker = L.circleMarker([position.lat, position.lng], {
        radius: 10, color: status === "Recent position" ? "#792335" : "#665f58", fillOpacity: 0.8,
      }).bindTooltip(label).addTo(markers.current!);
      if (props.mode === "manage") marker.on("click", () => props.onVehicleSelect(position.vehicleId));
    });
    if (positions.length && !fitted.current) {
      map.current.fitBounds(L.latLngBounds(positions.map(p => [p.lat, p.lng])), { maxZoom: 15, padding: [30, 30], animate: false });
      fitted.current = true;
    }
  }, [props]);
  return <>
    <div ref={element} className={styles.canvas} role="region" aria-label="Interactive vehicle map. Positions are also listed below." />
    {tileError && <p role="status">Map background could not fully load. Vehicle coordinates remain listed below.</p>}
  </>;
}
