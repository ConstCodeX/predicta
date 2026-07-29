import { create } from 'zustand';
import type { AlertaMapa, ForecastQuery, ForecastResponse, NivelRiesgoGlobal } from '../types';

// ── Datos de demostración para ver el mapa funcionando sin backend ────────────

const DEMO_ALERTS: AlertaMapa[] = [
  {
    departamento: 'PIURA',
    tipo_alerta: 'INUNDACION',
    severidad: 5,
    probabilidad_porcentaje: 92,
    descripcion:
      'Alto riesgo de desborde del río Piura. Zonas bajas de Castilla y el casco urbano de Piura en alerta máxima por saturación de suelos.',
    acciones_sugeridas: [
      'Evacuar zonas ribereñas de inmediato',
      'Activar albergues municipales',
      'Restringir circulación en vías costeras',
    ],
  },
  {
    departamento: 'TUMBES',
    tipo_alerta: 'LLUVIAS_EXTREMAS',
    severidad: 4,
    probabilidad_porcentaje: 78,
    descripcion:
      'Precipitaciones extremas proyectadas para los próximos 10 días. Primer departamento históricamente afectado por el Niño Costero.',
    acciones_sugeridas: [
      'Reforzar sistemas de drenaje urbano',
      'Alertar a comunidades en cuencas del Tumbes',
    ],
  },
  {
    departamento: 'LA LIBERTAD',
    tipo_alerta: 'MOVIMIENTO_MASA',
    severidad: 3,
    probabilidad_porcentaje: 61,
    descripcion:
      'Riesgo de huaicos en zona altoandina. Provincias de Pataz y Gran Chimú registran suelos saturados.',
    acciones_sugeridas: [
      'Monitorear quebradas activas',
      'Activar alertas tempranas en zonas rurales',
    ],
  },
  {
    departamento: 'LORETO',
    tipo_alerta: 'DESABASTECIMIENTO',
    severidad: 3,
    probabilidad_porcentaje: 55,
    descripcion:
      'Crecida del Amazonas y afluentes puede interrumpir cadenas logísticas. Riesgo para medicamentos e insumos médicos en distritos remotos.',
    acciones_sugeridas: [
      'Incrementar stock en centros de salud',
      'Activar rutas aéreas de contingencia',
    ],
  },
  {
    departamento: 'ANCASH',
    tipo_alerta: 'LLUVIAS_EXTREMAS',
    severidad: 2,
    probabilidad_porcentaje: 43,
    descripcion:
      'Precipitaciones sobre la media histórica en la sierra ancashina. Riesgo moderado-bajo con potencial de escalada.',
    acciones_sugeridas: ['Limpiar canales de riego', 'Revisar estado de puentes rurales'],
  },
];

// ── Tipos del store ───────────────────────────────────────────────────────────

interface MapState {
  alerts: AlertaMapa[];
  selectedAlert: AlertaMapa | null;
  selectedCoords: [number, number] | null;
  isLoading: boolean;
  error: string | null;
  riskLevel: NivelRiesgoGlobal | null;
  analysisText: string | null;
}

interface MapActions {
  selectAlert: (alert: AlertaMapa, coords: [number, number]) => void;
  clearSelection: () => void;
  setForecast: (data: ForecastResponse) => void;
  fetchForecast: (query: ForecastQuery) => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useMapStore = create<MapState & MapActions>((set) => ({
  // Estado inicial con datos de demo para vista inmediata
  alerts: DEMO_ALERTS,
  selectedAlert: null,
  selectedCoords: null,
  isLoading: false,
  error: null,
  riskLevel: 'ALTO',
  analysisText:
    'Vista de demostración con alertas de ejemplo. Usa el panel "Generar pronóstico" para consultar datos reales del INDECI vía IA.',

  selectAlert: (alert, coords) =>
    set({ selectedAlert: alert, selectedCoords: coords }),

  clearSelection: () =>
    set({ selectedAlert: null, selectedCoords: null }),

  setForecast: (data: ForecastResponse) =>
    set({
      alerts: data.alertas_mapa,
      riskLevel: data.nivel_riesgo_global,
      analysisText: data.analisis_general,
      selectedAlert: null,
      selectedCoords: null,
    }),

  fetchForecast: async (query: ForecastQuery) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/v1/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? `Error del servidor (${res.status})`);
      }

      const data = (await res.json()) as ForecastResponse;
      set({
        alerts: data.alertas_mapa,
        riskLevel: data.nivel_riesgo_global,
        analysisText: data.analisis_general,
        selectedAlert: null,
        selectedCoords: null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
