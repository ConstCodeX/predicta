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


export interface HeatmapPoint {
  departamento: string;
  distrito: string;
  count: number;
}

interface MapState {
  alerts: AlertaMapa[];
  selectedAlert: AlertaMapa | null;
  selectedCoords: [number, number] | null;
  hoveredAlert: AlertaMapa | null;
  isLoading: boolean;
  error: string | null;
  riskLevel: NivelRiesgoGlobal | null;
  analysisText: string | null;
  timelineMode: boolean;
  timelineFrames: TimelineFrame[];
  timelineIndex: number;
  timelineGlobalMax: number;
  heatmapPoints: HeatmapPoint[];
  heatmapMax: number;
  heatmapLoading: boolean;
}

interface MapActions {
  selectAlert: (alert: AlertaMapa, coords: [number, number]) => void;
  clearSelection: () => void;
  setHoveredAlert: (alert: AlertaMapa | null) => void;
  setForecast: (data: ForecastResponse) => void;
  fetchForecast: (query: ForecastQuery, token: string) => Promise<void>;
  setTimelineFrame: (index: number) => void;
  setTimelineFrames: (frames: TimelineFrame[]) => void;
  activateTimeline: () => void;
  deactivateTimeline: () => void;
  setHeatmap: (points: HeatmapPoint[], max: number) => void;
  clearHeatmap: () => void;
  setHeatmapLoading: (v: boolean) => void;
}

export const useMapStore = create<MapState & MapActions>((set, get) => ({
  alerts: [],
  selectedAlert: null,
  selectedCoords: null,
  hoveredAlert: null,
  isLoading: false,
  error: null,
  riskLevel: null,
  analysisText: null,
  timelineMode: false,
  timelineFrames: [],
  timelineIndex: 0,
  timelineGlobalMax: 0,
  heatmapPoints: [],
  heatmapMax: 0,
  heatmapLoading: false,

  selectAlert: (alert, coords) =>
    set({ selectedAlert: alert, selectedCoords: coords }),

  clearSelection: () =>
    set({ selectedAlert: null, selectedCoords: null }),

  setHoveredAlert: (alert) => set({ hoveredAlert: alert }),

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

  setTimelineFrames: (frames: TimelineFrame[]) => {
    // Compute global max across all frames for consistent color scale
    let globalMax = 0;
    for (const f of frames) {
      for (const e of f.events) {
        if (e.count > globalMax) globalMax = e.count;
      }
    }
    set({ timelineFrames: frames, timelineIndex: 0, timelineGlobalMax: globalMax });
  },

  setTimelineFrame: (index: number) => {
    const { timelineFrames, timelineGlobalMax } = get();
    const frame = timelineFrames[index];
    if (!frame) return;
    // Timeline now drives the heatmap layer for richer visualization
    const heatmapPoints = frame.events.map((e) => ({
      departamento: e.departamento,
      distrito: e.distrito,
      count: e.count,
    }));
    set({
      timelineIndex: index,
      heatmapPoints,
      heatmapMax: timelineGlobalMax,
      alerts: [],
      selectedAlert: null,
      selectedCoords: null,
    });
  },

  activateTimeline: () =>
    set({ timelineMode: true, alerts: [], heatmapPoints: [], selectedAlert: null }),

  deactivateTimeline: () =>
    set({ timelineMode: false, timelineFrames: [], timelineIndex: 0, alerts: [], heatmapPoints: [], heatmapMax: 0 }),

  setHeatmap: (points, max) => set({ heatmapPoints: points, heatmapMax: max }),
  clearHeatmap: () => set({ heatmapPoints: [], heatmapMax: 0 }),
  setHeatmapLoading: (v) => set({ heatmapLoading: v }),
}));
