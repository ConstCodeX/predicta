import 'maplibre-gl/dist/maplibre-gl.css';
import { AnimatePresence } from 'framer-motion';
import { Map, Marker, Popup } from 'react-map-gl/maplibre';
import { AlertMarkerIcon } from './components/AlertMarkerIcon';
import { AlertPopup } from './components/AlertPopup';
import { ForecastPanel } from './components/ForecastPanel';
import { MapLegend } from './components/MapLegend';
import { getDeptCoords } from './constants/peru-coords';
import { useMapStore } from './store/useMapStore';
import type { AlertaMapa } from './types';

const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function MapDashboard() {
  const { alerts, selectedAlert, selectedCoords, selectAlert, clearSelection } = useMapStore();

  const handleMarkerClick = (alert: AlertaMapa) => {
    const coords = getDeptCoords(alert.departamento);
    if (!coords) return;
    selectAlert(alert, coords);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Map
        initialViewState={{ longitude: -75.0, latitude: -9.1, zoom: 5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={CARTO_DARK}
      >
        {/* Markers */}
        {alerts.map((alert, i) => {
          const coords = getDeptCoords(alert.departamento);
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
      <MapLegend />
    </div>
  );
}
