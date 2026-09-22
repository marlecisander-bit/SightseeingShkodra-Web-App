"use client";
import { useState } from "react";
import { SharedMap } from "@/modules/tracking/shared-map";
import type { Snapshot } from "@/modules/tracking/positions";
const sample: Snapshot = { state: "ready", positions: [{ vehicleId: "10000000-0000-4000-8000-000000000030", lat: 42.068, lng: 19.512, updatedAt: "2020-01-01T10:00:00Z" }] };
export default function Preview() {
  const [state, setState] = useState<"sample" | "empty" | "unavailable">("sample");
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState("");
  const snapshot: Snapshot = state === "sample" ? sample : { state, positions: [] };
  return <>
    <p><label>Scenario <select value={state} onChange={e => setState(e.target.value as typeof state)}>
      <option value="sample">Stale sample position</option><option value="empty">No positions</option><option value="unavailable">Unavailable</option>
    </select></label>{" "}<label><input type="checkbox" checked={manage} onChange={e => setManage(e.target.checked)} /> Manage interface</label></p>
    {manage ? <SharedMap mode="manage" snapshot={snapshot} onVehicleSelect={setSelected} /> : <SharedMap mode="view" snapshot={snapshot} />}
    {manage && selected && <p role="status">Selected sample vehicle: {selected}. No changes saved.</p>}
  </>;
}
