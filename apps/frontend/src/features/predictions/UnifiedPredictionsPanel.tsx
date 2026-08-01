import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, AlertCircle, AlertTriangle, Bot, BotOff,
  ChevronDown, Info, Loader2, Maximize2, RefreshCw, Settings2, X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bar, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { SelectField } from '../../components/SelectField';
import { ChartModal } from '../seir-model/ChartModal';
import {
  PRESETS, REGIONES,
  type ENOSIntensidad, type SEIRModelResponse, type SEIRParametros,
} from '../seir-model/seir-types';
import { getCoords } from '../map/constants/peru-coords';
import { useMapStore } from '../map/store/useMapStore';
import type { AlertaMapa } from '../map/types';
import {
  NIVEL_BG, NIVEL_COLOR, NIVEL_LABEL,
  type DistrictPrediction, type NivelRiesgo,
  type PredictionResponse, type PredictionType,
} from './prediction-types';

// ─── Constants ────────────────────────────────────────────────
const SEIR_TAB_ID = '__seir__';

const VENTANA_OPTIONS = [
  { value: '7', label: 'Próximos 7 días' },
  { value: '14', label: 'Próximos 14 días' },
  { value: '30', label: 'Próximo mes' },
];

const COLOR_BY_OPTIONS = [
  { value: 'probabilidad', label: 'Probabilidad' },
  { value: 'nivel', label: 'Nivel de riesgo' },
  { value: 'lluvia', label: 'Lluvia estimada' },
];

const TIPO_PREDICCION_ALERTA: Record<string, AlertaMapa['tipo_alerta']> = {
  HIDRO_GEOLOGICO: 'HIDROMETEOROLOGICO',
  FRIAJE_HELADA: 'BAJAS_TEMPERATURAS',
  INCENDIO: 'INCENDIO',
  GEOFISICO: 'GEOFISICO',
  BIOLOGICO: 'BIOLOGICO',
  ANTROPICO: 'ANTROPICO',
  SALUD_PUBLICA: 'SALUD_PUBLICA',
  AGUA_SANEAMIENTO: 'AGUA_SANEAMIENTO',
};

const RIESGO_SEIR: Record<string, { color: string; label: string }> = {
  bajo: { color: '#22c55e', label: 'BAJO' },
  moderado: { color: '#f97316', label: 'MODERADO' },
  critico: { color: '#ef4444', label: 'CRÍTICO' },
};

const fmtNum = (n: number) => n.toLocaleString('es-PE');
const fmtSoles = (n: number) => n >= 1_000_000
  ? `S/ ${(n / 1_000_000).toFixed(1)}M`
  : `S/ ${n.toLocaleString()}`;

// ─── Small shared components ──────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-widest" style={{ color: 'oklch(0.34 0 0)' }}>
      {children}
    </p>
  );
}

function Slider({ label, value, min, max, step = 1, unit = '', accent, onChange }: {
  label: string; value: number; min: number; max: number;
  step?: number; unit?: string; accent?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: 'oklch(0.50 0 0)' }}>{label}</span>
        <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {value > 0 && !unit.startsWith('°') ? '+' : ''}
          {Number.isInteger(value) ? value : value.toFixed(1)}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-[3px] rounded-full appearance-none cursor-pointer"
        style={{ accentColor: accent ?? 'oklch(0.60 0.18 240)' }} />
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[11px]" style={{ color: 'oklch(0.48 0 0)' }}>{label}</span>
      <span className="text-xs font-medium tabular-nums" style={{ color: accent ?? 'rgba(255,255,255,0.88)' }}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-widest mt-5 mb-2" style={{ color: 'oklch(0.32 0 0)' }}>
      {children}
    </p>
  );
}

function ProgBar({ label, value, color = '#22c55e' }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: 'oklch(0.50 0 0)' }}>{label}</span>
        <span className="text-[11px] font-medium tabular-nums" style={{ color }}>{value}%</span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.65, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

// ─── SEIR Params Modal ────────────────────────────────────────
function ParamsModal({ params, region, loading, onParamsChange, onRegionChange, onApply, onClose }: {
  params: SEIRParametros; region: string; loading: boolean;
  onParamsChange: (p: SEIRParametros) => void; onRegionChange: (r: string) => void;
  onApply: () => void; onClose: () => void;
}) {
  const set = <K extends keyof SEIRParametros>(k: K, v: SEIRParametros[K]) =>
    onParamsChange({ ...params, [k]: v });

  const ENOS: { key: ENOSIntensidad; label: string; sub: string; color: string }[] = [
    { key: 'neutro', label: 'Sin El Niño', sub: 'Condiciones normales', color: '#22c55e' },
    { key: 'moderado', label: 'El Niño Mod.', sub: 'Anomalía +40–80%', color: '#f97316' },
    { key: 'fuerte', label: 'El Niño Fuerte', sub: 'Anomalía +150%+', color: '#ef4444' },
  ];

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="relative flex flex-col overflow-hidden"
        style={{ width: 480, maxHeight: '86vh', background: 'rgba(10,10,12,0.98)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20 }}
        initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 6 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-sm font-semibold text-white">Parámetros del modelo</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.42 0 0)' }}>Ajusta las condiciones de entrada del Dengue</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ color: 'oklch(0.46 0 0)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>
          {/* Región */}
          <div>
            <Label>Región de análisis</Label>
            <select value={region} onChange={(e) => onRegionChange(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-xs outline-none mt-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'white' }}>
              {REGIONES.map((r) => <option key={r} value={r} style={{ background: '#0a0a0b' }}>{r}</option>)}
            </select>
          </div>

          {/* ENOS — most impactful parameter */}
          <div>
            <Label>Fenómeno El Niño (ENOS)</Label>
            <div className="flex gap-2 mt-2">
              {ENOS.map((o) => {
                const on = params.enos_intensidad === o.key;
                return (
                  <button key={o.key} onClick={() => set('enos_intensidad', o.key)}
                    className="flex-1 rounded-xl px-2 py-3 text-left transition-all"
                    style={{ background: on ? `${o.color}14` : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? `${o.color}50` : 'rgba(255,255,255,0.07)'}` }}>
                    <p className="text-[11px] font-semibold" style={{ color: on ? o.color : 'white' }}>{o.label}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: 'oklch(0.42 0 0)' }}>{o.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders — only the two most operationally meaningful */}
          <div className="space-y-5">
            <Label>Parámetros de ajuste</Label>
            <Slider
              label="Anomalía de lluvias"
              value={params.anomalia_lluvias_pct}
              min={-50} max={300} step={5} unit="%"
              onChange={(v) => set('anomalia_lluvias_pct', v)}
            />
            <Slider
              label="Eficiencia control vectorial"
              value={params.eficiencia_control_vectorial_pct}
              min={0} max={100} unit="%" accent="#22c55e"
              onChange={(v) => set('eficiencia_control_vectorial_pct', v)}
            />
          </div>

          <p className="text-[10px] leading-relaxed" style={{ color: 'oklch(0.34 0 0)' }}>
            Los demás parámetros (temperatura, racionamiento hídrico, serotipo) se calibran automáticamente según el escenario ENOS seleccionado.
          </p>
        </div>
        <div className="flex gap-2 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'oklch(0.50 0 0)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Cancelar
          </button>
          <button onClick={() => { onApply(); onClose(); }} disabled={loading}
            className="flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: 'oklch(0.60 0.18 240)', color: 'white' }}>
            {loading ? 'Ejecutando…' : 'Aplicar y ejecutar modelo'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SEIR sub-tabs ────────────────────────────────────────────
type SEIRSubTab = 'epidemico' | 'humanitario' | 'economico';

function SEIREpidemicTab({ data, onExpand }: { data: SEIRModelResponse; onExpand: () => void }) {
  const chartData = data.proyeccion_semanal.map((s) => ({
    name: `S${s.semana}`, casos: s.casos_proyectados,
    hosp: s.hospitalizados_requeridos, rt: s.tasa_rt, historico: s.es_historico,
  }));
  const camas = data.kpis.camas_disponibles;
  const rtMax = data.kpis.rt_maximo;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Pico semana', value: `Sem. ${data.kpis.pico_semana}` },
          { label: 'Máx. semanal', value: fmtNum(data.kpis.maximo_semanal_casos), sub: 'casos' },
          { label: 'Rt máximo', value: rtMax.toFixed(2), color: rtMax > 4 ? '#ef4444' : rtMax > 2 ? '#f97316' : '#22c55e' },
          { label: 'Camas disp.', value: fmtNum(camas), color: '#ef4444', sub: `${data.kpis.saturacion_hospitalaria_pct}% sat.` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'oklch(0.36 0 0)' }}>{s.label}</p>
            <p className="text-base font-semibold tabular-nums" style={{ color: s.color ?? 'white' }}>{s.value}</p>
            {s.sub && <p className="text-[10px] mt-0.5" style={{ color: 'oklch(0.44 0 0)' }}>{s.sub}</p>}
          </div>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div>
            <p className="text-xs font-medium text-white">Proyección semanal</p>
            <p className="text-[10px]" style={{ color: 'oklch(0.40 0 0)' }}>S1–S4 histórico · S5–S16 proyección Dengue</p>
          </div>
          <button onClick={onExpand}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px]"
            style={{ color: 'oklch(0.48 0 0)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'oklch(0.48 0 0)'; }}>
            <Maximize2 size={11} /> Ampliar
          </button>
        </div>
        <div className="px-3 pb-4">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 42, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false} interval={1} />
              <YAxis yAxisId="l" tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <YAxis yAxisId="r" orientation="right" domain={[0, Math.ceil(rtMax) + 2]}
                tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(10,10,12,0.97)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontSize: 11, color: 'white' }}
                formatter={(v, n) => {
                  const val = v as number;
                  if (n === 'rt') return [`${val.toFixed(2)}`, 'Rt'];
                  if (n === 'hosp') return [fmtNum(val), 'Hospitalizados'];
                  return [fmtNum(val), 'Casos'];
                }}
                labelFormatter={(l) => { const r = chartData.find((d) => d.name === String(l)); return `${l}${r?.historico ? ' ← histórico' : ' ← proyección'}`; }}
              />
              <ReferenceLine yAxisId="l" x="S4" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 2" />
              <ReferenceLine yAxisId="l" y={camas} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1}
                label={{ value: `Camas: ${camas}`, position: 'right', fill: '#ef4444', fontSize: 9 }} />
              <Bar yAxisId="l" dataKey="casos" fill="rgba(59,130,246,0.42)" radius={[2, 2, 0, 0]} maxBarSize={22} />
              <Line yAxisId="l" dataKey="hosp" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 2 }} activeDot={{ r: 5 }} />
              <Line yAxisId="r" dataKey="rt" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-1 flex-wrap">
            {[{ color: '#3b82f6', l: 'Casos' }, { color: '#f97316', l: 'Hospitalizados' }, { color: '#ef4444', l: 'Camas' }, { color: '#475569', l: 'Rt' }].map((x) => (
              <span key={x.l} className="flex items-center gap-1.5 text-[9px]" style={{ color: 'oklch(0.42 0 0)' }}>
                <span style={{ width: 10, height: 3, borderRadius: 2, background: x.color, display: 'inline-block' }} />
                {x.l}
              </span>
            ))}
          </div>
        </div>
      </div>
      {data.notas_metodologicas && (
        <p className="text-[10px] leading-relaxed" style={{ color: 'oklch(0.34 0 0)' }}>{data.notas_metodologicas}</p>
      )}

      {/* Geo-distribution table */}
      {(data.distribucion_geografica ?? []).length > 0 && (
        <div>
          <SectionLabel>Distribución por ciudad · proyección pico</SectionLabel>
          <table className="w-full text-xs border-collapse mt-1">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['CIUDAD', 'CASOS PROY.', '% TOTAL', 'HOSP. REQ.'].map((h) => (
                  <th key={h} className="pb-2 text-left font-semibold"
                    style={{ color: 'oklch(0.42 0 0)', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data.distribucion_geografica!]
                .sort((a, b) => b.casos - a.casos)
                .map((c) => {
                  const riesgoColor = RIESGO_SEIR[data.kpis.nivel_riesgo]?.color ?? '#6b7280';
                  const hosp = Math.round(c.casos * 0.126);
                  return (
                    <tr key={c.ciudad} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="py-2 font-medium text-white">{c.ciudad}</td>
                      <td className="py-2 tabular-nums font-semibold" style={{ color: riesgoColor }}>
                        {c.casos.toLocaleString()}
                      </td>
                      <td className="py-2 tabular-nums" style={{ color: 'oklch(0.56 0 0)' }}>
                        {(c.pct * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 tabular-nums" style={{ color: '#f97316' }}>
                        {hosp.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SEIRHumanitarianTab({ data }: { data: SEIRModelResponse }) {
  const h = data.humanitario;
  if (!h) return <p className="py-12 text-center text-xs" style={{ color: 'oklch(0.40 0 0)' }}>Sin datos.</p>;
  const aguaColor = h.acceso_agua_potable_pct < 50 ? '#ef4444' : h.acceso_agua_potable_pct < 75 ? '#f97316' : '#22c55e';
  const saludPct = Math.round(Math.min(h.personal_salud_por_1000hab / 2 * 100, 100));
  const saludColor = h.personal_salud_por_1000hab < 0.5 ? '#ef4444' : h.personal_salud_por_1000hab < 1.0 ? '#f97316' : '#22c55e';
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-1">
        {[
          { l: 'Fallecidos estimados', v: h.fallecidos_estimados, c: '#ef4444', bg: 'rgba(239,68,68,0.07)', b: 'rgba(239,68,68,0.14)' },
          { l: 'Heridos graves', v: h.heridos_graves, c: '#f97316', bg: 'rgba(249,115,22,0.07)', b: 'rgba(249,115,22,0.14)' },
          { l: 'Desplazados', v: h.personas_desplazadas, c: 'rgba(255,255,255,0.88)', bg: 'rgba(255,255,255,0.04)', b: 'rgba(255,255,255,0.07)' },
          { l: 'Albergues req.', v: h.albergues_requeridos, c: 'rgba(255,255,255,0.88)', bg: 'rgba(255,255,255,0.04)', b: 'rgba(255,255,255,0.07)' },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl p-4" style={{ background: x.bg, border: `1px solid ${x.b}` }}>
            <p className="text-[9px] uppercase tracking-widest mb-2"
              style={{ color: x.c === 'rgba(255,255,255,0.88)' ? 'oklch(0.36 0 0)' : `${x.c}99` }}>{x.l}</p>
            <p className="text-2xl font-semibold tabular-nums leading-none"
              style={{ color: x.c, letterSpacing: '-0.02em' }}>{x.v.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <SectionLabel>Servicios básicos</SectionLabel>
      <div className="space-y-4 pt-1">
        <ProgBar label="Acceso a agua potable" value={h.acceso_agua_potable_pct} color={aguaColor} />
        <ProgBar label="Cobertura sistema de salud" value={saludPct} color={saludColor} />
      </div>
      <div className="mt-1">
        <Row label="Personal salud / 1,000 hab." value={h.personal_salud_por_1000hab.toFixed(1)} />
        <Row label="Personas en riesgo" value={fmtNum(h.personas_en_riesgo)} accent="rgba(255,255,255,0.65)" />
      </div>
    </div>
  );
}

function SEIREconomicTab({ data }: { data: SEIRModelResponse }) {
  const e = data.economico;
  if (!e) return <p className="py-12 text-center text-xs" style={{ color: 'oklch(0.40 0 0)' }}>Sin datos.</p>;
  const ahorro = e.impacto_total_soles - e.inversion_preventiva_soles;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'oklch(0.34 0 0)' }}>Impacto total</p>
          <p className="text-2xl font-semibold tabular-nums" style={{ letterSpacing: '-0.02em' }}>{fmtSoles(e.impacto_total_soles)}</p>
          <p className="text-[10px] mt-1" style={{ color: 'oklch(0.44 0 0)' }}>Atención: {fmtSoles(e.costo_atencion_soles)}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(34,197,94,0.65)' }}>Ahorro preventivo</p>
          <p className="text-2xl font-semibold tabular-nums" style={{ color: '#22c55e', letterSpacing: '-0.02em' }}>{fmtSoles(ahorro)}</p>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(34,197,94,0.6)' }}>Inv.: {fmtSoles(e.inversion_preventiva_soles)}</p>
        </div>
      </div>
      <SectionLabel>Agricultura</SectionLabel>
      <Row label="Arroz" value={`${fmtNum(e.cultivos.arroz_has)} ha`} />
      <Row label="Mango" value={`${fmtNum(e.cultivos.mango_has)} ha`} />
      <Row label="Plátano" value={`${fmtNum(e.cultivos.platano_has)} ha`} />
      <Row label="Pérdidas" value={fmtSoles(e.cultivos.total_valor_soles)} accent="#f97316" />
      <SectionLabel>Infraestructura</SectionLabel>
      <Row label="Carreteras" value={`${e.infraestructura.carreteras_afectadas_km} km`} />
      <Row label="Puentes" value={String(e.infraestructura.puentes_danados)} />
      <Row label="Viviendas" value={fmtNum(e.infraestructura.viviendas_afectadas)} />
    </div>
  );
}

// ─── SEIR content ─────────────────────────────────────────────
const SEIR_SCENARIOS: { key: Exclude<ENOSIntensidad, 'fuerte'>; label: string }[] = [
  { key: 'neutro', label: 'Optimista' },
  { key: 'moderado', label: 'Moderado' },
];
const SEIR_SUBTABS: { id: SEIRSubTab; label: string }[] = [
  { id: 'epidemico', label: 'Epidémico' },
  { id: 'humanitario', label: 'Humanitario' },
  { id: 'economico', label: 'Económico' },
];

function SEIRContent({ token, onResult, onSubTabChange }: {
  token: string;
  onResult?: (r: SEIRModelResponse) => void;
  onSubTabChange?: (tab: SEIRSubTab) => void;
}) {
  const [activePreset, setActivePreset] = useState<Exclude<ENOSIntensidad, 'fuerte'>>('neutro');
  const [params, setParams] = useState<SEIRParametros>({ ...PRESETS.neutro });
  const [region, setRegion] = useState(REGIONES[0]);
  const [result, setResult] = useState<SEIRModelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState<SEIRSubTab>('epidemico');
  const [showParams, setShowParams] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);
  const hasAutoRun = useRef(false);

  const runWith = useCallback(async (p: SEIRParametros) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/riesgo/seir-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ region, ventana_semanas: 16, parametros: p }),
      });
      if (res.ok) {
        const data = (await res.json()) as SEIRModelResponse;
        setResult(data);
        onResult?.(data);
      }
    } finally {
      setLoading(false);
    }
  }, [token, region, onResult]);

  const selectPreset = (preset: Exclude<ENOSIntensidad, 'fuerte'>) => {
    const p = { ...PRESETS[preset] };
    setActivePreset(preset);
    setParams(p);
    void runWith(p);
  };

  if (!hasAutoRun.current) {
    hasAutoRun.current = true;
    void runWith(params);
  }

  const kpis = result?.kpis;
  const nivel = kpis ? RIESGO_SEIR[kpis.nivel_riesgo] : null;

  return (
    <div className="space-y-5">
      {/* Presets row + gear */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {SEIR_SCENARIOS.map((s) => {
            const active = activePreset === s.key;
            return (
              <button key={s.key} onClick={() => selectPreset(s.key)}
                className="flex-1 rounded-lg py-2.5 text-xs font-medium transition-all"
                style={{ background: active ? 'rgba(255,255,255,0.11)' : 'transparent', color: active ? 'white' : 'oklch(0.44 0 0)' }}>
                {s.label}
              </button>
            );
          })}
          {/* ENOS badge */}
          {(() => {
            const enos = RIESGO_SEIR[params.enos_intensidad === 'fuerte' ? 'critico' : params.enos_intensidad === 'moderado' ? 'moderado' : 'bajo'];
            return (
              <button onClick={() => setShowParams(true)}
                className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs"
                style={{ background: `${enos.color}15`, border: `1px solid ${enos.color}35`, color: enos.color }}>
                <span className="text-[9px] font-semibold">
                  El Niño: {params.enos_intensidad === 'fuerte' ? 'Fuerte' : params.enos_intensidad === 'moderado' ? 'Mod.' : 'Sin'}
                </span>
              </button>
            );
          })()}
        </div>
        {/* Gear */}
        <button onClick={() => setShowParams(true)} title="Configurar parámetros"
          className="rounded-xl p-2 flex-shrink-0 transition-colors"
          style={{ color: 'oklch(0.50 0 0)', border: '1px solid rgba(255,255,255,0.08)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'oklch(0.50 0 0)'; }}>
          <Settings2 size={14} />
        </button>
        {loading && <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: 'oklch(0.44 0 0)' }} />}
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Casos proy.', value: kpis ? fmtNum(kpis.casos_proyectados_total) : '—', sub: kpis ? `Pico S${kpis.pico_semana}` : '' },
          {
            label: 'Saturación', value: kpis ? `${kpis.saturacion_hospitalaria_pct}%` : '—',
            color: kpis && kpis.saturacion_hospitalaria_pct > 100 ? '#ef4444' : '#f97316',
            sub: kpis && kpis.saturacion_hospitalaria_pct > 100 ? 'Colapso proy.' : 'Sin desborde',
            highlight: kpis ? kpis.saturacion_hospitalaria_pct > 100 : false
          },
          { label: 'Riesgo', value: nivel?.label ?? '—', color: nivel?.color, highlight: nivel?.label === 'CRÍTICO' },
          {
            label: 'Impacto', value: kpis ? fmtSoles(kpis.impacto_economico_soles) : '—',
            sub: kpis ? `Ahorro: ${fmtSoles(kpis.ahorro_preventivo_soles)}` : '', color: '#22c55e'
          },
        ].map((k) => (
          <div key={k.label} className="flex flex-col gap-1 rounded-2xl px-4 py-3.5 min-w-0"
            style={{ background: k.highlight ? `${k.color}0d` : 'rgba(255,255,255,0.04)', border: `1px solid ${k.highlight ? `${k.color}28` : 'rgba(255,255,255,0.07)'}` }}>
            <p className="text-[9px] uppercase tracking-widest truncate" style={{ color: 'oklch(0.36 0 0)' }}>{k.label}</p>
            <p className="text-xl font-semibold tabular-nums leading-none" style={{ color: k.color ?? 'white', letterSpacing: '-0.02em' }}>{k.value}</p>
            {k.sub && <p className="text-[10px] truncate" style={{ color: k.highlight ? `${k.color}bb` : 'oklch(0.44 0 0)' }}>{k.sub}</p>}
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Sub-tabs */}
      <div className="flex">
        {SEIR_SUBTABS.map((t) => {
          const active = subTab === t.id;
          return (
            <button key={t.id} onClick={() => { setSubTab(t.id); onSubTabChange?.(t.id); }}
              className="flex-1 py-2 text-xs font-medium"
              style={{ color: active ? 'white' : 'oklch(0.42 0 0)', borderBottom: `1.5px solid ${active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.06)'}` }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      {result ? (
        <AnimatePresence mode="wait">
          {subTab === 'epidemico' && <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><SEIREpidemicTab data={result} onExpand={() => setChartExpanded(true)} /></motion.div>}
          {subTab === 'humanitario' && <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><SEIRHumanitarianTab data={result} /></motion.div>}
          {subTab === 'economico' && <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><SEIREconomicTab data={result} /></motion.div>}
        </AnimatePresence>
      ) : (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin" style={{ color: 'oklch(0.38 0 0)' }} />
        </div>
      )}

      {/* Alerts */}
      {(result?.alertas ?? []).length > 0 && (
        <div className="space-y-2">
          {result!.alertas.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.14)' }}>
              <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px] leading-relaxed" style={{ color: '#fca5a5' }}>{a}</p>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showParams && (
          <ParamsModal params={params} region={region} loading={loading}
            onParamsChange={setParams} onRegionChange={setRegion}
            onApply={() => void runWith(params)} onClose={() => setShowParams(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {chartExpanded && result && <ChartModal data={result} onClose={() => setChartExpanded(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Climate content ──────────────────────────────────────────
function nivelFallback(nivel: NivelRiesgo): AlertaMapa['tipo_alerta'] {
  if (nivel === 'alto') return 'INUNDACION';
  if (nivel === 'medio') return 'LLUVIAS_EXTREMAS';
  return 'MOVIMIENTO_MASA';
}

function ClimateContent({ token, selectedTipo, tipos }: {
  token: string; selectedTipo: string; tipos: PredictionType[];
}) {
  const setForecast = useMapStore((s) => s.setForecast);
  const setFlyTarget = useMapStore((s) => s.setFlyTarget);
  const [ventana, setVentana] = useState('7');
  const [colorBy, setColorBy] = useState('probabilidad');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [selected, setSelected] = useState<DistrictPrediction | null>(null);
  const [error, setError] = useState('');
  const prevTipo = useRef(selectedTipo);

  const currentTipo = tipos.find((t) => t.id === selectedTipo);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelected(null);
    try {
      const res = await fetch('/api/v1/riesgo/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo: selectedTipo, ventana_dias: parseInt(ventana, 10) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as PredictionResponse;
      setResult(data);

      const tipoAlerta = TIPO_PREDICCION_ALERTA[data.tipo] ?? nivelFallback('medio');
      setForecast({
        analisis_general: data.resumen ?? '',
        nivel_riesgo_global: 'MEDIO',
        alertas_mapa: data.predicciones.slice(0, 30).map((p) => ({
          departamento: p.departamento,
          distrito: p.distrito,
          tipo_alerta: tipoAlerta,
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

  // Run when category changes (or on first render)
  useEffect(() => {
    if (prevTipo.current !== selectedTipo) {
      prevTipo.current = selectedTipo;
      setResult(null);
    }
    void runPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTipo]);

  const sorted = result
    ? [...result.predicciones].sort((a, b) => b.probabilidad_pct - a.probabilidad_pct)
    : [];

  return (
    <div className="flex flex-col gap-0" style={{ minHeight: 400 }}>
      {/* Controls */}
      <div className="flex flex-shrink-0 items-center gap-3 pb-3 flex-wrap"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Ventana</span>
          <div style={{ width: 150 }}>
            <SelectField value={ventana} onChange={setVentana} options={VENTANA_OPTIONS} placeholder="7 días" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Colorear</span>
          <div style={{ width: 130 }}>
            <SelectField value={colorBy} onChange={setColorBy} options={COLOR_BY_OPTIONS} placeholder="Probabilidad" />
          </div>
        </div>
        <button onClick={() => void runPrediction()} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ml-auto flex-shrink-0"
          style={{ background: '#14b8a6' }}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Actualizar
        </button>
      </div>

      {/* Calibration note */}
      <div className="flex flex-shrink-0 items-start gap-2 py-2 mb-1"
        style={{ background: 'rgba(96,165,250,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <Info size={11} style={{ color: 'oklch(0.55 0.10 240)', marginTop: 1, flexShrink: 0 }} />
        <p className="text-[10px] leading-relaxed" style={{ color: 'oklch(0.48 0 0)' }}>
          Calibrado ±<strong style={{ color: 'oklch(0.62 0 0)' }}>0.64 pp</strong> INDECI · {currentTipo?.label ?? '—'} · {ventana} días.
        </p>
      </div>

      {/* KPI summary cards — shown once results arrive */}
      <AnimatePresence>
        {sorted.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-4 gap-2 my-3">
            {(() => {
              const altos  = sorted.filter((p) => p.nivel === 'alto').length;
              const medios = sorted.filter((p) => p.nivel === 'medio').length;
              const avgP   = (sorted.reduce((s, p) => s + p.probabilidad_pct, 0) / sorted.length).toFixed(1);
              const maxL   = Math.max(...sorted.map((p) => p.lluvia_estimada_mm));
              return [
                { label: 'Riesgo alto',  value: String(altos),   sub: 'distritos',   color: '#ef4444', hi: altos > 3 },
                { label: 'Riesgo medio', value: String(medios),  sub: 'distritos',   color: '#f97316', hi: false },
                { label: 'Prob. media',  value: `${avgP}%`,      sub: 'del período', color: 'white',   hi: false },
                { label: 'Lluvia máx.',  value: `${maxL}mm`,     sub: 'estimada',    color: 'oklch(0.60 0.18 240)', hi: false },
              ].map((k) => (
                <div key={k.label} className="flex flex-col gap-1 rounded-2xl px-3 py-3 min-w-0"
                  style={{ background: k.hi ? `${k.color}0d` : 'rgba(255,255,255,0.04)', border: `1px solid ${k.hi ? `${k.color}28` : 'rgba(255,255,255,0.07)'}` }}>
                  <p className="text-[9px] uppercase tracking-widest truncate" style={{ color: 'oklch(0.36 0 0)' }}>{k.label}</p>
                  <p className="text-lg font-semibold tabular-nums leading-none" style={{ color: k.color, letterSpacing: '-0.02em' }}>{k.value}</p>
                  <p className="text-[10px] truncate" style={{ color: 'oklch(0.44 0 0)' }}>{k.sub}</p>
                </div>
              ));
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex shrink-0 items-center gap-2 py-2 text-xs mb-1"
            style={{ background: 'rgba(239,68,68,0.07)', color: '#f87171' }}>
            <AlertCircle size={12} />{error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight: 340, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {loading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 size={20} className="animate-spin" style={{ color: 'oklch(0.44 0 0)' }} />
            <p className="text-xs" style={{ color: 'oklch(0.44 0 0)' }}>Analizando datos históricos INDECI…</p>
          </div>
        )}
        {!loading && sorted.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
            <ChevronDown size={18} style={{ color: 'oklch(0.36 0 0)' }} />
            <p className="text-xs" style={{ color: 'oklch(0.44 0 0)' }}>Pulsa <strong style={{ color: 'oklch(0.60 0 0)' }}>Actualizar</strong> para generar predicciones.</p>
          </div>
        )}
        {!loading && sorted.length > 0 && (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 1 }}>
                {['DISTRITO', 'DEPTO', 'PROB %', 'X BASE', 'LLUVIA 3D', 'DÍA PICO'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold"
                    style={{ color: 'oklch(0.42 0 0)', whiteSpace: 'nowrap', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const isSel = selected?.distrito === p.distrito && selected?.departamento === p.departamento;
                return (
                  <tr key={i} onClick={() => {
                    setSelected(isSel ? null : p);
                    const coords = getCoords(p.departamento, p.distrito);
                    if (coords) setFlyTarget(coords);
                  }}
                    className="cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSel ? NIVEL_BG[p.nivel] : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td className="px-3 py-2 font-medium text-white" style={{ whiteSpace: 'nowrap' }}>{p.distrito}</td>
                    <td className="px-3 py-2" style={{ color: 'oklch(0.56 0 0)', whiteSpace: 'nowrap' }}>{p.departamento}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold" style={{ color: NIVEL_COLOR[p.nivel] }}>{p.probabilidad_pct.toFixed(1)}%</td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: p.x_base > 1.5 ? '#f97316' : 'oklch(0.56 0 0)' }}>{p.x_base.toFixed(1)}x</td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: p.lluvia_estimada_mm > 10 ? 'oklch(0.60 0.18 240)' : 'oklch(0.50 0 0)' }}>{p.lluvia_estimada_mm}mm</td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: 'oklch(0.50 0 0)', whiteSpace: 'nowrap' }}>{p.dia_pico}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <AnimatePresence>
        {(result || selected) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2 pt-3 mt-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {selected && (
              <div className="rounded-xl px-3.5 py-3" style={{ background: NIVEL_BG[selected.nivel], border: `1px solid ${NIVEL_COLOR[selected.nivel]}22` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-white">{selected.distrito}, {selected.departamento}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: `${NIVEL_COLOR[selected.nivel]}22`, color: NIVEL_COLOR[selected.nivel] }}>
                    {NIVEL_LABEL[selected.nivel].toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: 'oklch(0.60 0 0)' }}>
                  <span>Prob.: <strong style={{ color: NIVEL_COLOR[selected.nivel] }}>{selected.probabilidad_pct.toFixed(1)}%</strong></span>
                  <span>Mult.: <strong style={{ color: 'white' }}>{selected.x_base.toFixed(1)}x</strong></span>
                  <span>Lluvia: <strong style={{ color: 'white' }}>{selected.lluvia_estimada_mm}mm</strong></span>
                  <span>Pico: <strong style={{ color: 'white' }}>{selected.dia_pico}</strong></span>
                </div>
              </div>
            )}
            {result?.resumen && (
              <p className="text-[10px] leading-relaxed" style={{ color: 'oklch(0.48 0 0)' }}>{result.resumen}</p>
            )}
            {result && (
              <div className="flex items-center gap-1.5">
                {result.ai_disponible ? <Bot size={10} style={{ color: '#22c55e' }} /> : <BotOff size={10} style={{ color: 'oklch(0.44 0 0)' }} />}
                <span className="text-[9px]" style={{ color: result.ai_disponible ? '#22c55e' : 'oklch(0.38 0 0)' }}>
                  {result.ai_disponible ? 'Análisis con IA' : 'Fallback estadístico (IA no disponible)'}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Unified panel (root export) ─────────────────────────────
interface Props {
  token: string; onClose: () => void;
  onResult?: (r: SEIRModelResponse) => void;
  onSubTabChange?: (tab: SEIRSubTab) => void;
}

export function UnifiedPredictionsPanel({ token, onClose, onResult, onSubTabChange }: Props) {
  const [activeCategory, setActiveCategory] = useState(SEIR_TAB_ID);
  const [tipos, setTipos] = useState<PredictionType[]>([]);
  const isSeir = activeCategory === SEIR_TAB_ID;
  const currentTipo = tipos.find((t) => t.id === activeCategory);

  useEffect(() => {
    void fetch('/api/v1/riesgo/tipos', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setTipos(data as PredictionType[]));
  }, [token]);

  return (
    <div className="h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-white tracking-tight">Predicciones</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.40 0 0)' }}>
            {isSeir
              ? 'Modelo epidémico Dengue · Dengue Perú'
              : currentTipo
                ? `${currentTipo.icono} ${currentTipo.label}`
                : 'Sistema de riesgo predictivo · Perú'}
          </p>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5" style={{ color: 'oklch(0.46 0 0)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          <X size={14} />
        </button>
      </div>

      {/* Category tabs (scrollable pills) */}
      <div className="flex flex-shrink-0 gap-1.5 px-5 py-2.5 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'none' }}>
        {/* SEIR tab — always last */}
        <button onClick={() => setActiveCategory(SEIR_TAB_ID)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium flex-shrink-0 transition-colors"
          style={{ background: isSeir ? '#14b8a6' : 'rgba(255,255,255,0.05)', color: isSeir ? 'white' : 'oklch(0.54 0 0)', border: `1px solid ${isSeir ? 'transparent' : 'rgba(255,255,255,0.08)'}` }}>
          <Activity size={11} />
          <span>Dengue</span>
        </button>
        {tipos.map((t) => {
          const active = activeCategory === t.id;
          return (
            <button key={t.id} onClick={() => setActiveCategory(t.id)}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium flex-shrink-0 transition-colors"
              style={{ background: active ? '#14b8a6' : 'rgba(255,255,255,0.05)', color: active ? 'white' : 'oklch(0.54 0 0)', border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.08)'}` }}>
              <span>{t.icono}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-5 py-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
        <AnimatePresence mode="wait">
          {isSeir ? (
            <motion.div key="seir"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <SEIRContent token={token} onResult={onResult} onSubTabChange={onSubTabChange} />
            </motion.div>
          ) : (
            <motion.div key={activeCategory}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <ClimateContent token={token} selectedTipo={activeCategory} tipos={tipos} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
