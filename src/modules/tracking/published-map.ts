/** Presentation projection of the supplied app's map_versions.map_data GeoJSON.
 * No HTML, executable styling, remote icons or database fields cross this boundary.
 */
export type Coordinate = [number, number]; // Leaflet latitude, longitude
export type PublishedMap = {
  state: "ready" | "empty" | "unavailable";
  routes: { id: string; name: string; color: string; lines: Coordinate[][] }[];
  points: { id: string; name: string; number: string; kind: "stop" | "poi"; coordinate: Coordinate }[];
};
const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const label = (value: unknown, fallback: string) => typeof value === "string" ? value.slice(0, 160) : fallback;
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
        result.points.push({ id, kind, name: label(p.name, kind === "poi" ? "Place of interest" : "Stop"), number: typeof p.stopNumber === "number" || typeof p.stopNumber === "string" ? String(p.stopNumber).slice(0, 30) : "", coordinate: coordinate(geometry.coordinates) });
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
        result.routes.push({ id, name: label(p.name, "Tour route"), color: typeof p.color === "string" && /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#792335", lines: projected });
      }
      if (coordinateCount > 20000) throw Error("Map too large");
    }
    result.state = result.routes.length || result.points.length ? "ready" : "empty";
    return result;
  } catch { return { state: "unavailable", routes: [], points: [] }; }
}
