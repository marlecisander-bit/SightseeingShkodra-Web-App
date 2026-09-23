"use client";
import { useState } from "react";
import { destinations } from "@/modules/public-preview/contracts";
import { Media } from "./ui";

export function RoutePreview({ places = destinations }: { places?: readonly { id: string; name: string; tag: string; image: string; alt: string; detail: string }[] }) {
  const [selected, setSelected] = useState(0);
  const place = places[selected];
  return (
    <div className="p-route-layout">
      <div className="p-route-list">
        <p className="p-preview">
          Places to discover · Illustrative route, not a published timetable.
        </p>
        {places.map((stop, i) => (
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
          <a href="/live">Open the connected live map</a> for the published route,
          stops and van location. Select a destination above to explore these
          illustrative visitor guides.
        </p>
      </div>
    </div>
  );
}
