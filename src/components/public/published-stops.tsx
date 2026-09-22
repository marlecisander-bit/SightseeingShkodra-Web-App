"use client";
import { useState } from "react";
import type { PublicStop } from "@/modules/content/homepage";

export function PublishedStops({ stops }: { stops: PublicStop[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const stop = stops.find((item) => item.id === selected) ?? stops[0];
  if (!stop)
    return (
      <div className="p-empty">
        <p>Boarding stops will be published here.</p>
      </div>
    );
  return (
    <div className="p-route-layout">
      <div className="p-route-list">
        <p className="p-preview">Published route stops, in journey order.</p>
        {stops.map((item, index) => (
          <button
            key={item.id}
            aria-pressed={item.id === stop.id}
            onClick={() => setSelected(item.id)}
          >
            <span className="p-stop-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              {item.name}
              <small>View boarding location</small>
            </span>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div className="p-stop-preview p-published-stop" aria-live="polite">
        <div>
          <p className="p-eyebrow">Boarding location</p>
          <h3>{stop.name}</h3>
          <p>
            Coordinates: {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
          </p>
          <a
            className="p-text-link"
            href={`https://www.openstreetmap.org/?mlat=${stop.lat}&mlon=${stop.lng}#map=17/${stop.lat}/${stop.lng}`}
          >
            View location on OpenStreetMap ↗
          </a>
          <p className="p-preview">
            The shared interactive route map is coming soon. This is a stop
            location, not a live vehicle position.
          </p>
        </div>
      </div>
    </div>
  );
}
