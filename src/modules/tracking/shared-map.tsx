"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { positionStatus, type Snapshot } from "./positions";
import styles from "./shared-map.module.css";

const MapCanvas = dynamic(() => import("./map-canvas"), {
  ssr: false, loading: () => <p role="status">Loading map...</p>,
});
export type MapProps = { snapshot: Snapshot } & (
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
        <br /><span>{position.lat.toFixed(5)}, {position.lng.toFixed(5)} · Updated <time dateTime={position.updatedAt}>{position.updatedAt}</time></span>
        {props.mode === "manage" && <button type="button" onClick={() => props.onVehicleSelect(position.vehicleId)}>Select vehicle {index + 1}</button>}
      </li>)}</ul>
    </div>
  </section>;
}
