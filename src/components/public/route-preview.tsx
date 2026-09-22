"use client";
import { useState } from "react";
import {
  destinations,
  previewTracking,
  type TrackingView,
} from "@/modules/public-preview/contracts";
import { Media } from "./ui";

/** Shared map boundary for Phase 6. No map SDK, route geometry or GPS simulation. */
export function TrackingShell({
  state = previewTracking,
}: {
  state?: TrackingView;
}) {
  return (
    <div className="p-tracking-shell">
      <span className="p-map-label">SHKODRA · LIVE MAP</span>
      <div className="p-map-cross" aria-hidden="true">
        ◎
      </div>
      <h3>
        {state.state === "unavailable"
          ? "A little more exploring. A little less waiting."
          : "Vehicle location available"}
      </h3>
      <p>
        {state.state === "unavailable"
          ? state.message
          : "The live map connection will display the latest verified position here."}
      </p>
      <span className="p-status-dot">
        {state.state === "unavailable"
          ? "No live signal · No ETA shown"
          : "Map view not connected"}
      </span>
    </div>
  );
}
export function RoutePreview() {
  const [selected, setSelected] = useState(0);
  const place = destinations[selected];
  return (
    <div className="p-route-layout">
      <div className="p-route-list">
        <p className="p-preview">
          Places to discover · Illustrative route, not a published timetable.
        </p>
        {destinations.map((stop, i) => (
          <button
            key={stop.id}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <span className="p-stop-number">0{i + 1}</span>
            <span>
              {stop.name}
              <small>{stop.tag}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div className="p-stop-preview" aria-live="polite">
        <Media src={place.image} alt={place.alt} />
        <div>
          <p className="p-eyebrow">Selected destination · 0{selected + 1}</p>
          <h3>{place.name}</h3>
          <p>{place.detail}</p>
        </div>
      </div>
      <div className="p-route-note">
        <span aria-hidden="true">◎</span>
        <p>
          The interactive route map will appear here when the route is
          published. Select a destination to take a closer look.
        </p>
      </div>
    </div>
  );
}
