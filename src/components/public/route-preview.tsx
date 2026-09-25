"use client";
import { useState } from "react";
import { Media } from "./ui";

export function RoutePreview({ places, showNote = true }: { showNote?: boolean; places: readonly { id: string; name: string; tag: string; image: string; alt: string; detail: string; link: string }[] }) {
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected,Math.max(0,places.length-1));
  const place = places[active];
  if(!place)return <p>No destinations are published yet.</p>;
  return (
    <div className="p-route-layout">
      <div className="p-route-list">
        <p className="p-preview">
          Places to discover · Illustrative route, not a published timetable.
        </p>
        {places.map((destination, i) => (
          <button
            key={destination.id}
            data-destination={destination.id}
            aria-pressed={active === i}
            onClick={() => setSelected(i)}
          >
            <span className="p-stop-number">0{i + 1}</span>
            <span>
              {destination.name}
              <small>{destination.tag}</small>
            </span>
            
          </button>
        ))}
      </div>
      <div className="p-stop-preview" data-destination={place.id} aria-live="polite">
        <Media src={place.image} alt={place.alt} />
        <div>
          <p className="p-eyebrow">Selected destination · 0{active + 1}</p>
          <h3>{place.name}</h3>
          <p>{place.detail}</p>
          <a className="p-text-link" href={place.link}>Explore destination</a>
        </div>
      </div>
      {showNote && <div className="p-route-note">
        <span aria-hidden="true">◎</span>
        <p>
          <a href="/live">Open the connected live map</a> for the published route,
          stops and van location. Select a destination above to explore these
          illustrative visitor guides.
        </p>
      </div>}
    </div>
  );
}
