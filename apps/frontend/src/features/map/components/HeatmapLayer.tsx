import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { getCoords } from '../constants/peru-coords';
import { useMapStore } from '../store/useMapStore';

export function HeatmapLayer() {
  const { heatmapPoints, heatmapMax } = useMapStore();

  const geojson = useMemo(() => {
    const features: {
      type: 'Feature';
      geometry: { type: 'Point'; coordinates: [number, number] };
      properties: Record<string, unknown>;
    }[] = [];
    for (const p of heatmapPoints) {
      const coords = getCoords(p.departamento, p.distrito);
      if (!coords) continue;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          weight: heatmapMax > 0 ? p.count / heatmapMax : 0,
          count: p.count,
          departamento: p.departamento,
          distrito: p.distrito,
        },
      });
    }
    return { type: 'FeatureCollection' as const, features };
  }, [heatmapPoints, heatmapMax]);

  if (heatmapPoints.length === 0) return null;

  return (
    <Source id="heatmap-src" type="geojson" data={geojson}>
      {/* Heatmap layer for overview at lower zoom */}
      <Layer
        id="heatmap-density"
        type="heatmap"
        maxzoom={14}
        paint={{
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1.5, 9, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(33,102,172,0)',
            0.2, 'rgba(103,169,207,0.8)',
            0.4, 'rgba(209,229,240,0.9)',
            0.6, 'rgba(253,219,199,0.9)',
            0.8, 'rgba(239,138,98,0.95)',
            1,   'rgba(178,24,43,1)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 9, 50],
          'heatmap-opacity': 0.82,
        }}
      />
      {/* Circle layer visible at high zoom */}
      <Layer
        id="heatmap-circles"
        type="circle"
        minzoom={7}
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 6, 14, 18],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'weight'],
            0,   '#2c7fb8',
            0.4, '#fec44f',
            0.8, '#f03b20',
            1,   '#bd0026',
          ],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.8],
          'circle-stroke-color': 'rgba(0,0,0,0.3)',
          'circle-stroke-width': 1,
        }}
      />
    </Source>
  );
}
