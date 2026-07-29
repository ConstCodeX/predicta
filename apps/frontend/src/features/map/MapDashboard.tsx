import 'maplibre-gl/dist/maplibre-gl.css';
import { AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import { Map, Marker, Popup } from 'react-map-gl/maplibre';
import { AlertMarkerIcon } from './components/AlertMarkerIcon';
import { AlertPopup } from './components/AlertPopup';
import { ForecastPanel } from './components/ForecastPanel';
import { MapLegend } from './components/MapLegend';
import { getCoords } from './constants/peru-coords';
import { useMapStore } from './store/useMapStore';
import type { AlertaMapa } from './types';

const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function MapDashboard() {
  const { alerts, selectedAlert, selectedCoords, selectAlert, clearSelection, timelineMode } = useMapStore();

  const handleMarkerClick = (alert: AlertaMapa) => {
    const coords = getCoords(alert.departamento, alert.distrito);
    if (!coords) return;
    selectAlert(alert, coords);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Map
        initialViewState={{ longitude: -75.0, latitude: -9.1, zoom: 5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={CARTO_DARK}
      >
        {/* Markers */}
        {alerts.map((alert, i) => {
          const coords = getCoords(alert.departamento, alert.distrito);
          if (!coords) return null;
          return (
            <Marker key={i} longitude={coords[0]} latitude={coords[1]} anchor="center">
              <AlertMarkerIcon
                tipo_alerta={alert.tipo_alerta}
                severidad={alert.severidad}
                onClick={() => handleMarkerClick(alert)}
              />
            </Marker>
          );
        })}

        {/* Popup */}
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
      </Map>

      {/* Overlays */}
      <ForecastPanel />
      {alerts.length > 0 && <MapLegend />}

      {/* Empty state hint */}
      {alerts.length === 0 && !timelineMode && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: 'rgba(9,9,11,0.70)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.09)',
            pointerEvents: 'none',
          }}
        >
          <Layers size={12} style={{ color: 'oklch(0.46 0 0)' }} />
          <span className="text-[11px]" style={{ color: 'oklch(0.50 0 0)' }}>
            Usa <strong style={{ color: 'oklch(0.65 0 0)' }}>Predicciones</strong> o <strong style={{ color: 'oklch(0.65 0 0)' }}>Análisis Predictivo</strong> para ver datos en el mapa
          </span>
        </div>
      )}
    </div>
  );
}
