"use client";
import { useState } from "react";
import { SharedMap } from "@/modules/tracking/shared-map";
import type { Snapshot } from "@/modules/tracking/positions";
import { projectPublishedMap } from "@/modules/tracking/published-map";
const publishedMap = projectPublishedMap({type: "FeatureCollection", features: [
  {type: "Feature", properties: {name: "Fictional preview route", color: "#792335"}, geometry: {type: "LineString", coordinates: [[19.508,42.066],[19.512,42.068],[19.516,42.07]]}},
  {type: "Feature", properties: {name: "Sample meeting point", pointType: "stop", stopNumber: 1}, geometry: {type: "Point", coordinates: [19.508,42.066]}},
  {type: "Feature", properties: {name: "Sample stop", pointType: "stop", stopNumber: 2}, geometry: {type: "Point", coordinates: [19.516,42.07]}},
  {type: "Feature", properties: {name: "Sample attraction", pointType: "poi"}, geometry: {type: "Point", coordinates: [19.513,42.067]}},
]});
const sample: Snapshot = { state: "ready", positions: [{ vehicleId: "10000000-0000-4000-8000-000000000030", lat: 42.068, lng: 19.512, updatedAt: "2020-01-01T10:00:00Z", tracking: {source_recorded_at: "2020-01-01T10:00:00Z", movement_state: "PARKED_AT_STOP", current_stop_number: 1, current_stop_name: "Sample meeting point"} }] };
export default function Preview() {
  const [state, setState] = useState<"sample" | "empty" | "unavailable">("sample");
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState("");
  const snapshot: Snapshot = state === "sample" ? sample : { state, positions: [] };
  return <>
    <p><label>Scenario <select value={state} onChange={e => setState(e.target.value as typeof state)}>
      <option value="sample">Stale sample position</option><option value="empty">No positions</option><option value="unavailable">Unavailable</option>
    </select></label>{" "}<label><input type="checkbox" checked={manage} onChange={e => setManage(e.target.checked)} /> Manage interface</label></p>
    {manage ? <SharedMap mode="manage" snapshot={snapshot} publishedMap={publishedMap} onVehicleSelect={setSelected} /> : <SharedMap mode="view" snapshot={snapshot} publishedMap={publishedMap} />}
    {manage && selected && <p role="status">Selected sample vehicle: {selected}. No changes saved.</p>}
  </>;
}
