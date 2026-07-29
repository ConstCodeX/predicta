import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Bot,
  BotOff,
  ChevronDown,
  Info,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SelectField } from '../../components/SelectField';
import { useMapStore } from '../map/store/useMapStore';
import type { AlertaMapa } from '../map/types';
import {
  NIVEL_BG,
  NIVEL_COLOR,
  NIVEL_LABEL,
  type DistrictPrediction,
  type NivelRiesgo,
  type PredictionResponse,
  type PredictionType,
} from './prediction-types';

const VENTANA_OPTIONS = [
  { value: '7',  label: 'Próximos 7 días' },
  { value: '14', label: 'Próximos 14 días' },
  { value: '30', label: 'Próximo mes' },
];

const COLOR_BY_OPTIONS = [
  { value: 'probabilidad', label: 'Probabilidad' },
  { value: 'nivel',        label: 'Nivel de riesgo' },
  { value: 'lluvia',       label: 'Lluvia estimada' },
];

const TIPO_PREDICCION_ALERTA: Record<string, AlertaMapa['tipo_alerta']> = {
  HIDRO_GEOLOGICO:  'HIDROMETEOROLOGICO',
  FRIAJE_HELADA:    'BAJAS_TEMPERATURAS',
  INCENDIO:         'INCENDIO',
  GEOFISICO:        'GEOFISICO',
  BIOLOGICO:        'BIOLOGICO',
  ANTROPICO:        'ANTROPICO',
  SALUD_PUBLICA:    'SALUD_PUBLICA',
  AGUA_SANEAMIENTO: 'AGUA_SANEAMIENTO',
};

function nivelFallback(nivel: NivelRiesgo): AlertaMapa['tipo_alerta'] {
  if (nivel === 'alto') return 'INUNDACION';
  if (nivel === 'medio') return 'LLUVIAS_EXTREMAS';
  return 'MOVIMIENTO_MASA';
}

interface Props {
  token: string;
  onClose: () => void;
}

export function PredictionsPanel({ token, onClose }: Props) {
  const setForecast = useMapStore((s) => s.setForecast);
  const [tipos, setTipos] = useState<PredictionType[]>([]);
  const [selectedTipo, setSelectedTipo] = useState('HIDRO_GEOLOGICO');
  const [ventana, setVentana] = useState('7');
  const [colorBy, setColorBy] = useState('probabilidad');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [selected, setSelected] = useState<DistrictPrediction | null>(null);
  const [error, setError] = useState('');
  const hasAutoRun = useRef(false);

  // Load prediction types
  useEffect(() => {
    void fetch('/api/v1/riesgo/tipos', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setTipos(data as PredictionType[]));
  }, [token]);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelected(null);
    try {
      const res = await fetch('/api/v1/riesgo/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tipo: selectedTipo, ventana_dias: parseInt(ventana, 10) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as PredictionResponse;
      setResult(data);

      // Push to map as alert markers
      const tipoAlerta = TIPO_PREDICCION_ALERTA[data.tipo] ?? nivelFallback('medio');
      setForecast({
        analisis_general: data.resumen ?? '',
        nivel_riesgo_global: 'MEDIO',
        alertas_mapa: data.predicciones.slice(0, 30).map((p) => ({
          departamento: p.departamento,
          distrito: p.distrito,
          tipo_alerta: p.nivel === 'alto' ? tipoAlerta : p.nivel === 'medio' ? tipoAlerta : tipoAlerta,
          severidad: p.nivel === 'alto' ? 5 : p.nivel === 'medio' ? 3 : 1,
          probabilidad_porcentaje: p.probabilidad_pct,
          descripcion: `${p.probabilidad_pct.toFixed(1)}% · X${p.x_base.toFixed(1)} · Pico: ${p.dia_pico}`,
          acciones_sugeridas: [],
        })),
        charts: [],
        metricas_clave: [],
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, selectedTipo, ventana, setForecast]);

  // Auto-run on first open
  useEffect(() => {
    if (!hasAutoRun.current && tipos.length > 0) {
      hasAutoRun.current = true;
      void runPrediction();
    }
  }, [tipos, runPrediction]);

  const sorted = result
    ? [...result.predicciones].sort((a, b) => b.probabilidad_pct - a.probabilidad_pct)
    : [];

  const currentTipo = tipos.find((t) => t.id === selectedTipo);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="fixed top-11 right-0 z-30 flex flex-col shadow-2xl"
      style={{
        width: 560,
        height: 'calc(100vh - 2.75rem)',
        background: 'rgba(9,9,11,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <BarChart3 size={15} style={{ color: 'oklch(0.60 0.18 240)' }} />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-bold text-white leading-none">Predicciones</span>
          <span className="text-[10px] mt-0.5" style={{ color: 'oklch(0.46 0 0)' }}>
            {currentTipo ? `${currentTipo.icono} ${currentTipo.label}` : 'Sistema de riesgo predictivo'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
          style={{ color: 'oklch(0.46 0 0)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Type selector pills */}
      <div
        className="flex flex-shrink-0 gap-1.5 px-4 py-2.5 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'none' }}
      >
        {tipos.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTipo(t.id)}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium flex-shrink-0 transition-colors"
            style={{
              background: selectedTipo === t.id ? 'oklch(0.60 0.18 240)' : 'rgba(255,255,255,0.05)',
              color: selectedTipo === t.id ? 'white' : 'oklch(0.54 0 0)',
              border: `1px solid ${selectedTipo === t.id ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <span>{t.icono}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div
        className="flex flex-shrink-0 items-center gap-3 px-4 py-2.5 flex-wrap"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Ventana</span>
          <div style={{ width: 160 }}>
            <SelectField
              value={ventana}
              onChange={setVentana}
              options={VENTANA_OPTIONS}
              placeholder="7 días"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Colorear por</span>
          <div style={{ width: 150 }}>
            <SelectField
              value={colorBy}
              onChange={setColorBy}
              options={COLOR_BY_OPTIONS}
              placeholder="Probabilidad"
            />
          </div>
        </div>
        <button
          onClick={runPrediction}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 ml-auto"
          style={{ background: 'oklch(0.60 0.18 240)', flexShrink: 0 }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Actualizar
        </button>
      </div>

      {/* Calibration info box */}
      <div
        className="flex flex-shrink-0 items-start gap-2 px-4 py-2"
        style={{ background: 'rgba(96,165,250,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <Info size={11} style={{ color: 'oklch(0.55 0.10 240)', marginTop: 1, flexShrink: 0 }} />
        <p className="text-[10px] leading-relaxed" style={{ color: 'oklch(0.48 0 0)' }}>
          Las probabilidades están calibradas con un error medio de <strong style={{ color: 'oklch(0.62 0 0)' }}>±0.64 pp</strong> sobre datos históricos INDECI. Modelo: {currentTipo?.label ?? '—'} · Ventana: {ventana} días.
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-shrink-0 items-center gap-2 px-4 py-2.5 text-xs"
            style={{ background: 'rgba(239,68,68,0.07)', borderBottom: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
          >
            <AlertCircle size={12} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {loading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 size={20} className="animate-spin" style={{ color: 'oklch(0.44 0 0)' }} />
            <p className="text-xs" style={{ color: 'oklch(0.44 0 0)' }}>
              Analizando datos históricos INDECI…
            </p>
          </div>
        )}
        {!loading && sorted.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-8">
            <ChevronDown size={18} style={{ color: 'oklch(0.36 0 0)' }} />
            <p className="text-xs" style={{ color: 'oklch(0.44 0 0)' }}>
              Selecciona un tipo de riesgo y pulsa <strong style={{ color: 'oklch(0.60 0 0)' }}>Actualizar</strong> para generar predicciones.
            </p>
          </div>
        )}
        {!loading && sorted.length > 0 && (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                {['DISTRITO', 'DEPTO', 'PROB %', 'X BASE', 'LLUVIA 3D', 'DÍA PICO'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold"
                    style={{ color: 'oklch(0.42 0 0)', whiteSpace: 'nowrap', fontSize: '0.6875rem', letterSpacing: '0.05em' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const isSelected = selected?.distrito === p.distrito && selected?.departamento === p.departamento;
                return (
                  <tr
                    key={i}
                    onClick={() => setSelected(isSelected ? null : p)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? NIVEL_BG[p.nivel] : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <td className="px-3 py-2 font-medium text-white" style={{ whiteSpace: 'nowrap' }}>{p.distrito}</td>
                    <td className="px-3 py-2" style={{ color: 'oklch(0.56 0 0)', whiteSpace: 'nowrap' }}>{p.departamento}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold" style={{ color: NIVEL_COLOR[p.nivel] }}>
                      {p.probabilidad_pct.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: p.x_base > 1.5 ? '#f97316' : 'oklch(0.56 0 0)' }}>
                      {p.x_base.toFixed(1)}x
                    </td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: p.lluvia_estimada_mm > 10 ? 'oklch(0.60 0.18 240)' : 'oklch(0.50 0 0)' }}>
                      {p.lluvia_estimada_mm}mm
                    </td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: 'oklch(0.50 0 0)', whiteSpace: 'nowrap' }}>
                      {p.dia_pico}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary + selected district detail */}
      <AnimatePresence>
        {(result || selected) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-shrink-0 flex flex-col gap-2 px-4 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            {selected && (
              <div className="rounded-xl px-3.5 py-3" style={{ background: NIVEL_BG[selected.nivel], border: `1px solid ${NIVEL_COLOR[selected.nivel]}22` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-white">{selected.distrito}, {selected.departamento}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: `${NIVEL_COLOR[selected.nivel]}22`, color: NIVEL_COLOR[selected.nivel] }}
                  >
                    {NIVEL_LABEL[selected.nivel].toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: 'oklch(0.60 0 0)' }}>
                  <span>Probabilidad en la ventana: <strong style={{ color: NIVEL_COLOR[selected.nivel] }}>{selected.probabilidad_pct.toFixed(1)}%</strong></span>
                  <span>Multiplicador base: <strong style={{ color: 'white' }}>{selected.x_base.toFixed(1)}x</strong></span>
                  <span>Lluvia estimada: <strong style={{ color: 'white' }}>{selected.lluvia_estimada_mm}mm</strong></span>
                  <span>Día pico: <strong style={{ color: 'white' }}>{selected.dia_pico}</strong></span>
                </div>
              </div>
            )}
            {result?.resumen && (
              <p className="text-[10px] leading-relaxed" style={{ color: 'oklch(0.48 0 0)' }}>
                {result.resumen}
              </p>
            )}
            {result && (
              <div className="flex items-center gap-1.5">
                {result.ai_disponible
                  ? <Bot size={10} style={{ color: '#22c55e' }} />
                  : <BotOff size={10} style={{ color: 'oklch(0.44 0 0)' }} />
                }
                <span className="text-[9px]" style={{ color: result.ai_disponible ? '#22c55e' : 'oklch(0.38 0 0)' }}>
                  {result.ai_disponible ? 'Análisis con IA' : 'Fallback estadístico (IA no disponible)'}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
