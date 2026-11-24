'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { FeatureCollection, Geometry, Position } from 'geojson';

const TrackingEditorCanvas = dynamic(() => import('./tracking-editor-canvas'), {
  ssr: false, loading: () => <p role="status">Loading map editor…</p>,
});

const nameOf = (feature: FeatureCollection['features'][number], index: number) =>
  typeof feature.properties?.name === 'string' && feature.properties.name
    ? feature.properties.name : `${feature.geometry?.type ?? 'Feature'} ${index + 1}`;

export function TrackingMapEditor({ initial }: { initial: FeatureCollection }) {
  const [map, setMap] = useState(initial);
  const [selected, setSelected] = useState(0);
  const [drawing, setDrawing] = useState<Position[] | null>(null);
  const feature = map.features[selected];
  const geometry = feature?.geometry;
  const properties = feature?.properties;
  const stops = map.features.filter(({ geometry, properties }) =>
    geometry?.type === 'Point' && properties?.pointType === 'stop' && properties.active !== false);
  const stopSequence = [1, 2, 3, 4, 5].map(number =>
    stops.find(stop => Number(stop.properties?.stopNumber) === number)?.properties?.objectId);
  const ordered = stops.length === 5 && stopSequence.every(id => typeof id === 'string');
  const draft = ordered ? { ...map, features: map.features.map(item =>
    item.geometry?.type === 'LineString' && item.properties?.active !== false
      ? { ...item, properties: { ...item.properties, objectType: 'route',
        stopSequence: [...stopSequence, stopSequence[0]] } } : item) } : map;
  const routes = map.features.flatMap(({ geometry }) => {
    if (geometry?.type === 'LineString') return [geometry.coordinates];
    if (geometry?.type === 'MultiLineString') return geometry.coordinates;
    return [];
  });

  function update(updateFeature: (item: FeatureCollection['features'][number]) => FeatureCollection['features'][number]) {
    setMap(current => ({
      ...current,
      features: current.features.map((item, index) => index === selected ? updateFeature(item) : item),
    }));
  }

  function select(index: number) {
    setSelected(index);
    setDrawing(null);
  }

  function addPoint(kind: 'stop' | 'poi') {
    const stopNumber = [1, 2, 3, 4, 5].find(number =>
      !stops.some(stop => Number(stop.properties?.stopNumber) === number));
    setMap(current => ({ ...current, features: [...current.features, {
      type: 'Feature', geometry: { type: 'Point', coordinates: [19.5126, 42.0683] },
      properties: { objectId: crypto.randomUUID(), pointType: kind, active: kind === 'poi' || stopNumber !== undefined,
        name: kind === 'stop' ? (stopNumber ? `Stop ${stopNumber}` : 'New stop') : 'New point of interest',
        ...(kind === 'stop' ? { stopNumber: stopNumber ?? 1 } : {}) },
    }] }));
    select(map.features.length);
  }

  function updateProperties(changes: Record<string, unknown>) {
    update(item => ({ ...item, properties: { ...item.properties, ...changes } }));
  }

  function handleMapPoint(coordinates: Position) {
    if (drawing) {
      setDrawing([...drawing, coordinates]);
    } else if (geometry?.type === 'Point') {
      update(item => ({ ...item, geometry: { ...geometry, coordinates: [...coordinates, ...geometry.coordinates.slice(2)] } }));
    }
  }

  function applyLine() {
    if (!drawing || drawing.length < 2) return;
    const line: Geometry = { type: 'LineString', coordinates: drawing };
    if (geometry?.type === 'LineString') {
      update(item => ({ ...item, geometry: { ...geometry, coordinates: drawing } }));
    } else {
      setMap(current => ({ ...current, features: [...current.features, {
        type: 'Feature', geometry: line, properties: { objectId: crypto.randomUUID(), name: 'Tour route', objectType: 'route', active: !map.features.some(item => item.geometry?.type === 'LineString' && item.properties?.active !== false) },
      }] }));
      setSelected(map.features.length);
    }
    setDrawing(null);
  }

  return <div>
    <input type="hidden" name="geojson" value={JSON.stringify(draft)} />
    <label>Map feature <select value={feature ? selected : ''} onChange={event => select(Number(event.target.value))}>
      {!feature && <option value="">No map features</option>}
      {map.features.map((item, index) => <option key={index} value={index}>{nameOf(item, index)}</option>)}
    </select></label>
    <div>
      <button type="button" onClick={() => addPoint('stop')}>Add stop</button>{' '}
      <button type="button" onClick={() => addPoint('poi')}>Add point of interest</button>{' '}
      <button type="button" onClick={() => { setSelected(-1); setDrawing([]); }}>Draw new route</button>
    </div>
    {feature && <fieldset>
      <legend>{nameOf(feature, selected)}</legend>
      <label>Name <input value={String(properties?.name ?? '')} maxLength={100}
        onChange={event => updateProperties({ name: event.target.value })} /></label>
      {geometry?.type === 'Point' && <>
        {properties?.pointType !== 'poi' && <label> Stop number <input type="number" min={1} max={5}
          value={String(properties?.stopNumber ?? '')}
          onChange={event => updateProperties({ stopNumber: event.target.value === '' ? '' : Number(event.target.value) })} /></label>}
        <label> Description <textarea value={String(properties?.description ?? '')} maxLength={1000}
          onChange={event => updateProperties({ description: event.target.value })} /></label>
        <p>Click the map to move this point.</p>
      </>}
      <label> <input type="checkbox" checked={properties?.active !== false}
        onChange={event => updateProperties({ active: event.target.checked })} /> Active</label>
      {geometry?.type === 'LineString' && !drawing && <button type="button" onClick={() => setDrawing([])}>Redraw selected route</button>}
      <button type="button" onClick={() => {
        if (!window.confirm(`Remove ${nameOf(feature, selected)} from this draft?`)) return;
        setMap(current => ({ ...current, features: current.features.filter((_, index) => index !== selected) }));
        select(0);
      }}>Remove feature</button>
    </fieldset>}
    {drawing && <p>
      Click the map to draw the route. {drawing.length} points.{' '}
      <button type="button" disabled={!drawing.length} onClick={() => setDrawing(drawing.slice(0, -1))}>Undo point</button>{' '}
      <button type="button" disabled={drawing.length < 2} onClick={applyLine}>Use drawn route</button>{' '}
      <button type="button" onClick={() => { if (!feature) setSelected(0); setDrawing(null); }}>Cancel drawing</button>
    </p>}
    <TrackingEditorCanvas routes={routes} points={map.features.flatMap((item, index) => item.geometry?.type === 'Point'
      ? [{ coordinates: item.geometry.coordinates, selected: index === selected }] : [])}
      drawing={drawing} onPoint={handleMapPoint} />
    <p>The published loop requires one active route and five active stops numbered 1–5.</p>
    <button name="status" value="draft" type="submit" disabled={drawing !== null}>Save draft</button>
  </div>;
}
