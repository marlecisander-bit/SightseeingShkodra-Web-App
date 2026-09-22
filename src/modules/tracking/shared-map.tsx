"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { positionStatus, type Snapshot } from "./positions";
import styles from "./shared-map.module.css";
import type { PublishedMap } from "./published-map";
import { stoppedAt } from "./tracking-state";

const MapCanvas = dynamic(() => import("./map-canvas"), {
  ssr: false, loading: () => <p role="status">Loading map...</p>,
});
export type MapProps = { snapshot: Snapshot; publishedMap?: PublishedMap } & (
  { mode: "view" } |
  { mode: "manage"; onVehicleSelect: (vehicleId: string) => void }
);
/** Manage is a selection interface, never an authorization or database-write boundary. */
export function SharedMap(props: MapProps) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 15_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  return <section className={styles.shell} aria-label="Vehicle map">
    <MapCanvas {...props} now={now} />
    <div className={styles.details}>
      <p role="status">{props.snapshot.state === "unavailable" ? "Vehicle positions are temporarily unavailable." :
        props.snapshot.state === "empty" ? "No vehicle positions are available yet." : "Reported vehicle positions. Arrival times are not available."}</p>
      <ul>{props.snapshot.positions.map((position, index) => <li key={position.vehicleId}>
        <strong>Vehicle {index + 1}</strong>{" — "}{now === null ? "Checking update time..." : positionStatus(position, now)}
        {position.tracking && now !== null && (() => { const stop = stoppedAt(position.tracking, now); return stop ? <p>{stop.label} {stop.number}{stop.name ? `: ${stop.name}` : ""}</p> : null; })()}
        <br /><span>{position.lat.toFixed(5)}, {position.lng.toFixed(5)} · Updated <time dateTime={position.updatedAt}>{position.updatedAt}</time></span>
        {props.mode === "manage" && <button type="button" onClick={() => props.onVehicleSelect(position.vehicleId)}>Select vehicle {index + 1}</button>}
      </li>)}</ul>
      {props.publishedMap && <>
        <h2>Route and stops</h2>
        {props.publishedMap.state === "unavailable" ? <p>Published map is temporarily unavailable.</p> : props.publishedMap.state === "empty" ? <p>No published route yet.</p> : <>
          <ul>{props.publishedMap.routes.map(route => <li key={route.id}>{route.name}</li>)}</ul>
          <ul>{props.publishedMap.points.filter(point => point.kind === "stop").map(point => <li key={point.id}>{point.number ? `${point.number}. ` : ""}{point.name}</li>)}</ul>
          <ul>{props.publishedMap.points.filter(point => point.kind === "poi").map(point => <li key={point.id}>{point.name} (place of interest)</li>)}</ul>
        </>}
      </>}
    </div>
  </section>;
}
