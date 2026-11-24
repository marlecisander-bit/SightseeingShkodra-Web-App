/** Presentation projection of the supplied app's map_versions.map_data GeoJSON.
 * Copy only validated presentation fields and coordinates from GeoJSON.
 */
import stopDesignDefaults from './stop-design-defaults.json';

export type StopDesign = { number: string; color: string; photoUrl?: string };
export type Coordinate = [number, number]; // Leaflet latitude, longitude
export type PublishedMap = {
  state: "ready" | "empty" | "unavailable";
  routes: { id: string; name: string; color: string; lines: Coordinate[][]; weight?: number; lineStyle?: 'dashed' | 'dotted'; stopSequence?: string[] }[];
  points: { id: string; name: string; number: string; kind: "stop" | "poi"; coordinate: Coordinate; description?: string; design?: StopDesign }[];
};
const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const label = (value: unknown, fallback: string) => typeof value === "string" ? value.slice(0, 160) : fallback;
function photoUrl(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch { /* Missing or invalid published artwork. */ }
}
function stopDesign(id: string, number: string, properties: Record<string, unknown>): StopDesign {
  const defaults = (stopDesignDefaults as Record<string, { color: string; photoUrl?: string }>)[id];
  const candidate = properties.color || defaults?.color;
  const color = typeof candidate === 'string' && /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : '#F20544';
  return { number: number || 'S', color, photoUrl: photoUrl(Object.hasOwn(properties, 'photoUrl') ? properties.photoUrl : defaults?.photoUrl) };
}
function coordinate(value: unknown): Coordinate {
  if (!Array.isArray(value) || value.length < 2 || typeof value[0] !== "number" || typeof value[1] !== "number" || !Number.isFinite(value[0]) || !Number.isFinite(value[1]) || Math.abs(value[0]) > 180 || Math.abs(value[1]) > 90) throw Error("Invalid coordinate");
  return [value[1], value[0]];
}
export function projectPublishedMap(value: unknown): PublishedMap {
  const result: PublishedMap = { state: "empty", routes: [], points: [] };
  try {
    const data = record(value);
    if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features) || data.features.length > 1000) throw Error("Invalid map");
    let coordinateCount = 0;
    for (const [index, item] of data.features.entries()) {
      const feature = record(item), geometry = record(feature?.geometry), p = record(feature?.properties) ?? {};
      if (!feature || feature.type !== "Feature" || !geometry) throw Error("Invalid feature");
      if (p.active === false) continue;
      const id = String(index); // Stable within this published snapshot; not a database identity.
      if (geometry.type === "Point") {
        const kind = p.pointType === "poi" ? "poi" : "stop";
        const pointId = label(p.objectId, id);
        const number = typeof p.stopNumber === 'number' || typeof p.stopNumber === 'string' ? String(p.stopNumber).slice(0, 30) : '';
        result.points.push({
          id: pointId, kind, name: label(p.name, kind === 'poi' ? 'Place of interest' : 'Stop'), number,
          coordinate: coordinate(geometry.coordinates),
          ...(typeof p.description === 'string' && p.description.trim() ? { description: p.description.trim().slice(0, 800) } : {}),
          ...(kind === 'stop' ? { design: stopDesign(pointId, number, p) } : {}),
        });
        coordinateCount++;
      } else if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
        const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
        if (!Array.isArray(lines) || !lines.length) throw Error("Invalid route");
        const projected = lines.map(line => {
          if (!Array.isArray(line) || line.length < 2 || line.length > 20000) throw Error("Invalid route");
          coordinateCount += line.length;
          if (coordinateCount > 20000) throw Error("Map too large");
          return line.map(coordinate);
        });
        const stopSequence = Array.isArray(p.stopSequence) && p.stopSequence.length <= 101 &&
          p.stopSequence.every(id => typeof id === 'string' && id.length <= 150) ? p.stopSequence as string[] : undefined;
        const weight = Number(p.weight);
        const lineStyle = p.lineStyle === 'dashed' || p.lineStyle === 'dotted' ? p.lineStyle : undefined;
        result.routes.push({ weight: weight >= 1 && weight <= 24 ? weight : 6, lineStyle, ...(stopSequence ? { stopSequence } : {}), id, name: label(p.name, "Tour route"), color: typeof p.color === "string" && /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "var(--ss-route)", lines: projected });
      }
      if (coordinateCount > 20000) throw Error("Map too large");
    }
    result.state = result.routes.length || result.points.length ? "ready" : "empty";
    return result;
  } catch { return { state: "unavailable", routes: [], points: [] }; }
}
