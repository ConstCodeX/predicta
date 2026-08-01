import 'maplibre-gl/dist/maplibre-gl.css';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Map, Marker, Popup, type MapRef } from 'react-map-gl/maplibre';
import { SEIRMapOverlay, SEIRTimelineBar } from '../seir-model/SEIRMapOverlay';
import type { SEIRModelResponse } from '../seir-model/seir-types';
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

// Pulsing location indicator rendered as a Marker
function PulseMarker({ coords }: { coords: [number, number] }) {
  return (
    <Marker longitude={coords[0]} latitude={coords[1]} anchor="center">
      <div className="relative flex items-center justify-center" style={{ width: 48, height: 48, pointerEvents: 'none' }}>
        <div
          className="absolute animate-ping rounded-full"
          style={{ width: 40, height: 40, background: 'rgba(96,165,250,0.30)', animationDuration: '1.1s' }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: 20, height: 20, background: 'rgba(96,165,250,0.15)', border: '1.5px solid rgba(96,165,250,0.5)' }}
        />
        <div
          className="rounded-full"
          style={{ width: 7, height: 7, background: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }}
        />
      </div>
    </Marker>
  );
}

// Region center coordinates for fly-to
const REGION_CENTERS: Record<string, [number, number]> = {
  PIURA:       [-80.63, -5.19],
  LORETO:      [-73.25, -3.75],
  'SAN MARTIN': [-76.37, -6.49],
  UCAYALI:     [-74.55, -8.39],
  TUMBES:      [-80.45, -3.57],
  'LA LIBERTAD': [-79.00, -8.12],
  LAMBAYEQUE:  [-79.84, -6.70],
  LIMA:        [-77.04, -12.04],
};

interface MapDashboardProps {
  seirData?: SEIRModelResponse | null;
  seirSubTab?: 'epidemico' | 'humanitario' | 'economico';
}

export function MapDashboard({ seirData, seirSubTab = 'epidemico' }: MapDashboardProps = {}) {
  const mapRef = useRef<MapRef>(null);

  const {
    alerts, selectedAlert, selectedCoords,
    selectAlert, clearSelection,
    heatmapPoints, timelineMode,
    setHoveredAlert,
    flyTarget, setFlyTarget,
  } = useMapStore();

  const [heatmapClick, setHeatmapClick] = useState<HeatmapClickInfo | null>(null);

  // Fly to target whenever it changes (seq ensures same-coords re-triggers)
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    mapRef.current.flyTo({
      center: flyTarget.coords,
      zoom: 11,
      duration: 1400,
      essential: true,
    });
  }, [flyTarget?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to the SEIR region when data arrives
  useEffect(() => {
    if (!seirData || !mapRef.current) return;
    const regionKey = seirData.region.split(' — ')[0].toUpperCase();
    const coords = REGION_CENTERS[regionKey];
    if (coords) {
      mapRef.current.flyTo({ center: coords, zoom: 9, duration: 1600, essential: true });
    }
  }, [seirData?.region]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkerClick = (alert: AlertaMapa) => {
    const coords = getCoords(alert.departamento, alert.distrito);
    if (!coords) return;
    selectAlert(alert, coords);
    setFlyTarget(coords);
  };

  const handleMapClick = (e: {
    lngLat: { lng: number; lat: number };
    features?: Array<{ properties: Record<string, unknown> }>;
  }) => {
    const feat = e.features?.[0];
    if (!feat || heatmapPoints.length === 0) {
      setHeatmapClick(null);
      return;
    }
    const p = feat.properties as { departamento?: string; distrito?: string; count?: number };
    if (!p.departamento) return;

    const info: HeatmapClickInfo = {
      lng: e.lngLat.lng,
      lat: e.lngLat.lat,
      departamento: p.departamento,
      distrito: p.distrito ?? '',
      count: p.count ?? 0,
    };
    setHeatmapClick(info);
    setFlyTarget([info.lng, info.lat]);
  };

  const heatmapActive = heatmapPoints.length > 0;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -75.0, latitude: -9.1, zoom: 5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={CARTO_DARK}
        interactiveLayerIds={heatmapActive ? ['heatmap-circles'] : []}
        cursor={heatmapActive ? 'pointer' : 'grab'}
        onClick={handleMapClick as never}
      >
        {/* Heatmap overlay */}
        <HeatmapLayer />

        {/* Alert markers — hidden when heatmap active */}
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

        {/* SEIR epidemic spread overlay */}
        {seirData && <SEIRMapOverlay data={seirData} activeTab={seirSubTab} />}

        {/* Fly target pulse */}
        {flyTarget && <PulseMarker coords={flyTarget.coords} />}

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
                border: '1px solid rgba(255,255,255,0.10)',
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

      {/* SEIR timeline bar — bottom of the map half */}
      <AnimatePresence>
        {seirData && <SEIRTimelineBar data={seirData} />}
      </AnimatePresence>

      {!timelineMode && <MapStatusBar />}

      {alerts.length === 0 && heatmapPoints.length === 0 && !timelineMode && !seirData && (
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
