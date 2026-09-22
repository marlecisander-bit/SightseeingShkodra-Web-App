/** Port of the supplied app's js/shared/tracking-state.js. Baseline retained in docs/source/tracking. */
export type TrackingState = {
  source_recorded_at: string;
  movement_state?: string;
  offline_seconds?: number;
  delayed_seconds?: number;
  current_stop_number?: string | number | null;
  current_stop_name?: string;
  reported_stopped?: boolean;
  reported_stop_number?: string | number | null;
  reported_stop_name?: string;
};
export function classify(position: TrackingState | null, now = Date.now()) {
  if (!position) return "GPS_OFFLINE";
  const time = Date.parse(position.source_recorded_at), age = now - time;
  if (!Number.isFinite(time) || !Number.isFinite(now) || age < -60000 || age > Number(position.offline_seconds || 120) * 1000) return "GPS_OFFLINE";
  if (age > Number(position.delayed_seconds || 20) * 1000) return "GPS_DELAYED";
  return ["MOVING", "PARKED_AT_STOP", "STATIONARY"].includes(position.movement_state ?? "") ? position.movement_state! : "UNKNOWN";
}
export function stoppedAt(position: TrackingState | null, now = Date.now()) {
  if (!position) return null;
  const confirmed = position.movement_state === "PARKED_AT_STOP";
  if (!confirmed && position.reported_stopped !== true) return null;
  const number = confirmed ? position.current_stop_number : position.reported_stop_number;
  if (number === null || number === undefined) return null;
  const health = classify(position, now);
  return { number: String(number), name: confirmed ? position.current_stop_name : position.reported_stop_name,
    label: !confirmed ? "Last reported stopped at" : health === "GPS_DELAYED" || health === "GPS_OFFLINE" ? "Last seen parked at" : "Van parked at" };
}
