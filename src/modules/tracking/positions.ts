export type Position = {
  vehicleId: string;
  lat: number;
  lng: number;
  updatedAt: string;
};
export type Snapshot = {
  state: "ready" | "empty" | "unavailable";
  positions: Position[];
};
export const staleAfterMs = 120_000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const validOperator = (value: string) => uuid.test(value);
export function positionStatus(position: Position, now: number) {
  const age = now - Date.parse(position.updatedAt);
  return Number.isFinite(age) && age >= -30_000 && age <= staleAfterMs
    ? "Recent position"
    : "Last known position - updates unavailable";
}
/** Reject a malformed or mixed-tenant snapshot rather than showing misleading locations. */
export function normalizePositions(operatorId: string, rows: unknown): Snapshot {
  const unavailable: Snapshot = { state: "unavailable", positions: [] };
  if (!validOperator(operatorId) || !Array.isArray(rows) || rows.length > 500) return unavailable;
  const seen = new Set<string>();
  const positions: Position[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || row.operator_id !== operatorId ||
      typeof row.vehicle_id !== "string" || !uuid.test(row.vehicle_id) || seen.has(row.vehicle_id) ||
      typeof row.lat !== "number" || !Number.isFinite(row.lat) || Math.abs(row.lat) > 90 ||
      typeof row.lng !== "number" || !Number.isFinite(row.lng) || Math.abs(row.lng) > 180 ||
      typeof row.updated_at !== "string" || !Number.isFinite(Date.parse(row.updated_at))) return unavailable;
    seen.add(row.vehicle_id);
    positions.push({ vehicleId: row.vehicle_id, lat: row.lat, lng: row.lng, updatedAt: row.updated_at });
  }
  return { state: positions.length ? "ready" : "empty", positions };
}
