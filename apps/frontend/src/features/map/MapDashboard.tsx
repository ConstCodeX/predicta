import 'maplibre-gl/dist/maplibre-gl.css';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Map, Marker, Popup } from 'react-map-gl/maplibre';
import { AlertMarkerIcon } from './components/AlertMarkerIcon';
import { AlertPopup } from './components/AlertPopup';
import { HeatmapLayer } from './components/HeatmapLayer';
import { MapLegend } from './components/MapLegend';
import { MapStatusBar } from './MapStatusBar';
import { getCoords } from './constants/peru-coords';
import { useMapStore } from './store/useMapStore';
import type { AlertaMapa } from './types';

const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface HeatmapClickInfo {
  lng: number;
  lat: number;
  departamento: string;
  distrito: string;
  count: number;
}

export function MapDashboard() {
  const {
    alerts, selectedAlert, selectedCoords,
    selectAlert, clearSelection,
    heatmapPoints, timelineMode,
    setHoveredAlert,
  } = useMapStore();

  const [heatmapClick, setHeatmapClick] = useState<HeatmapClickInfo | null>(null);

  const handleMarkerClick = (alert: AlertaMapa) => {
    const coords = getCoords(alert.departamento, alert.distrito);
    if (!coords) return;
    selectAlert(alert, coords);
  };

  const handleMapClick = (e: { lngLat: { lng: number; lat: number }; features?: Array<{ properties: Record<string, unknown> }> }) => {
    const feat = e.features?.[0];
    if (!feat || heatmapPoints.length === 0) {
      setHeatmapClick(null);
      return;
    }
    const p = feat.properties as { departamento?: string; distrito?: string; count?: number };
    if (!p.departamento) return;
    setHeatmapClick({
      lng: e.lngLat.lng,
      lat: e.lngLat.lat,
      departamento: p.departamento,
      distrito: p.distrito ?? '',
      count: p.count ?? 0,
    });
  };

  const heatmapActive = heatmapPoints.length > 0;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Map
        initialViewState={{ longitude: -75.0, latitude: -9.1, zoom: 5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={CARTO_DARK}
        interactiveLayerIds={heatmapActive ? ['heatmap-circles'] : []}
        cursor={heatmapActive ? 'pointer' : 'grab'}
        onClick={handleMapClick as never}
      >
        {/* Heatmap overlay */}
        <HeatmapLayer />

        {/* Alert markers — hidden when heatmap is active */}
        {heatmapPoints.length === 0 ? alerts.map((alert, i) => {
          const coords = getCoords(alert.departamento, alert.distrito);
          if (!coords) return null;
          return (
            <Marker key={i} longitude={coords[0]} latitude={coords[1]} anchor="center">
              <AlertMarkerIcon
                tipo_alerta={alert.tipo_alerta}
                severidad={alert.severidad}
                onClick={() => handleMarkerClick(alert)}
                onHover={() => setHoveredAlert(alert)}
                onLeave={() => setHoveredAlert(null)}
              />
            </Marker>
          );
        }) : null}

        {/* Alert marker popup */}
        <AnimatePresence>
          {selectedAlert && selectedCoords && (
            <Popup
              longitude={selectedCoords[0]}
              latitude={selectedCoords[1]}
              anchor="bottom"
              offset={[0, -8] as [number, number]}
              onClose={clearSelection}
              closeButton={false}
              closeOnClick={false}
            >
              <AlertPopup alert={selectedAlert} onClose={clearSelection} />
            </Popup>
          )}
        </AnimatePresence>

        {/* Heatmap circle click popup */}
        {heatmapClick && (
          <Popup
            longitude={heatmapClick.lng}
            latitude={heatmapClick.lat}
            anchor="bottom"
            offset={[0, -6] as [number, number]}
            onClose={() => setHeatmapClick(null)}
            closeButton={false}
            closeOnClick
          >
            <div
              className="flex flex-col gap-1 rounded-xl px-3 py-2.5"
              style={{
                background: 'rgba(9,9,11,0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                minWidth: 140,
              }}
            >
              <p className="text-xs font-bold text-white leading-tight">
                {heatmapClick.distrito || heatmapClick.departamento}
              </p>
              {heatmapClick.distrito && (
                <p className="text-[10px]" style={{ color: 'oklch(0.52 0 0)' }}>
                  {heatmapClick.departamento}
                </p>
              )}
              <div
                className="mt-0.5 rounded-lg px-2 py-1 text-center text-[11px] font-semibold"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
              >
                {heatmapClick.count.toLocaleString()} eventos
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map overlays */}
      <MapLegend />

      {/* Bottom status bar — hidden when timeline active */}
      {!timelineMode && <MapStatusBar />}

      {/* Empty state hint */}
      {alerts.length === 0 && heatmapPoints.length === 0 && !timelineMode && (
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full px-4 py-2 pointer-events-none"
          style={{
            background: 'rgba(9,9,11,0.70)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <span className="text-[11px]" style={{ color: 'oklch(0.50 0 0)' }}>
            Selecciona una herramienta en el panel lateral para activar datos en el mapa
          </span>
        </div>
      )}
    </div>
  );
}
