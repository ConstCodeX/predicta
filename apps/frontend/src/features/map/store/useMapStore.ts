import { create } from 'zustand';
import type { AlertaMapa, ForecastQuery, ForecastResponse, NivelRiesgoGlobal } from '../types';

export interface TimelineEvent {
  departamento: string;
  distrito: string;
  familiaEvento: string;
  count: number;
}

export interface TimelineFrame {
  anio: number;
  mes: number;
  events: TimelineEvent[];
}

const FAMILIA_TIPO: Record<string, AlertaMapa['tipo_alerta']> = {
  'HIDROMETEOROLÓGICO': 'LLUVIAS_EXTREMAS',
  'INUNDACIÓN': 'INUNDACION',
  'MOVIMIENTO EN MASA': 'MOVIMIENTO_MASA',
  'BAJAS TEMPERATURAS': 'INUNDACION',
  'INCENDIO': 'MOVIMIENTO_MASA',
  'SISMO': 'MOVIMIENTO_MASA',
  'VIENTO': 'LLUVIAS_EXTREMAS',
  'CONTAMINACIÓN': 'DESABASTECIMIENTO',
};

function timelineToAlerta(e: TimelineEvent): AlertaMapa {
  return {
    departamento: e.departamento,
    distrito: e.distrito,
    tipo_alerta: FAMILIA_TIPO[e.familiaEvento] ?? 'MOVIMIENTO_MASA',
    severidad: Math.min(5, Math.max(1, e.count)),
    probabilidad_porcentaje: 50,
    descripcion: `${e.count} evento(s) histórico(s) · ${e.familiaEvento}`,
    acciones_sugeridas: [],
  };
}

interface MapState {
  alerts: AlertaMapa[];
  selectedAlert: AlertaMapa | null;
  selectedCoords: [number, number] | null;
  isLoading: boolean;
  error: string | null;
  riskLevel: NivelRiesgoGlobal | null;
  analysisText: string | null;
  timelineMode: boolean;
  timelineFrames: TimelineFrame[];
  timelineIndex: number;
}

interface MapActions {
  selectAlert: (alert: AlertaMapa, coords: [number, number]) => void;
  clearSelection: () => void;
  setForecast: (data: ForecastResponse) => void;
  fetchForecast: (query: ForecastQuery, token: string) => Promise<void>;
  setTimelineFrame: (index: number) => void;
  setTimelineFrames: (frames: TimelineFrame[]) => void;
  activateTimeline: () => void;
  deactivateTimeline: () => void;
}

export const useMapStore = create<MapState & MapActions>((set, get) => ({
  alerts: [],
  selectedAlert: null,
  selectedCoords: null,
  isLoading: false,
  error: null,
  riskLevel: null,
  analysisText: null,
  timelineMode: false,
  timelineFrames: [],
  timelineIndex: 0,

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
      timelineMode: false,
    }),

  fetchForecast: async (query: ForecastQuery, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/v1/ai/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(query),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
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
        timelineMode: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  setTimelineFrames: (frames: TimelineFrame[]) =>
    set({ timelineFrames: frames, timelineIndex: 0 }),

  setTimelineFrame: (index: number) => {
    const { timelineFrames } = get();
    const frame = timelineFrames[index];
    if (!frame) return;
    const alerts = frame.events.map(timelineToAlerta);
    set({ timelineIndex: index, alerts, selectedAlert: null, selectedCoords: null });
  },

  activateTimeline: () =>
    set({ timelineMode: true, alerts: [], selectedAlert: null }),

  deactivateTimeline: () =>
    set({ timelineMode: false, timelineFrames: [], timelineIndex: 0, alerts: [] }),
}));
