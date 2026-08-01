import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, Maximize2, Settings2, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import {
  Bar, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  PRESETS, REGIONES,
  type ENOSIntensidad, type SEIRModelResponse, type SEIRParametros, type Serotipo,
} from './seir-types';
import { ChartModal } from './ChartModal';

// ─── Constants ────────────────────────────────────────────────
type TabId = 'epidemico' | 'humanitario' | 'economico';

const SCENARIOS: { key: Exclude<ENOSIntensidad, 'fuerte'>; label: string }[] = [
  { key: 'neutro',   label: 'Optimista' },
  { key: 'moderado', label: 'Moderado'  },
];

const TABS: { id: TabId; label: string }[] = [
  { id: 'epidemico',   label: 'Epidémico'   },
  { id: 'humanitario', label: 'Humanitario' },
  { id: 'economico',   label: 'Económico'   },
];

const RIESGO: Record<string, { color: string; label: string }> = {
  bajo:     { color: '#22c55e', label: 'BAJO'     },
  moderado: { color: '#f97316', label: 'MODERADO' },
  critico:  { color: '#ef4444', label: 'CRÍTICO'  },
};

const fmtNum   = (n: number) => n.toLocaleString('es-PE');
const fmtSoles = (n: number) => n >= 1_000_000
  ? `S/ ${(n / 1_000_000).toFixed(1)}M`
  : `S/ ${n.toLocaleString()}`;

// ─── Params Modal ─────────────────────────────────────────────
function ParamsModal({
  params, region,
  onParamsChange, onRegionChange, onApply, onClose, loading,
}: {
  params: SEIRParametros;
  region: string;
  onParamsChange: (p: SEIRParametros) => void;
  onRegionChange: (r: string) => void;
  onApply: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const set = <K extends keyof SEIRParametros>(k: K, v: SEIRParametros[K]) =>
    onParamsChange({ ...params, [k]: v });

  const ENOS_OPTIONS: { key: ENOSIntensidad; label: string; sub: string; color: string }[] = [
    { key: 'neutro',   label: 'Sin El Niño',   sub: 'Condiciones normales',   color: '#22c55e' },
    { key: 'moderado', label: 'El Niño Mod.',   sub: 'Anomalía +40–80%',      color: '#f97316' },
    { key: 'fuerte',   label: 'El Niño Fuerte', sub: 'Anomalía +150%+',       color: '#ef4444' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 480,
          maxHeight: '86vh',
          background: 'rgba(10,10,12,0.98)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20,
        }}
        initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 6 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-sm font-semibold text-white">Parámetros del modelo</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.42 0 0)' }}>
              Ajusta las condiciones de entrada del Dengue
            </p>
          </div>
          <button onClick={onClose}
            className="rounded-full p-1.5"
            style={{ color: 'oklch(0.46 0 0)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
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

          {/* El Niño ENOS */}
          <div>
            <Label>Intensidad El Niño (ENOS)</Label>
            <div className="flex gap-2 mt-2">
              {ENOS_OPTIONS.map((o) => {
                const on = params.enos_intensidad === o.key;
                return (
                  <button key={o.key} onClick={() => set('enos_intensidad', o.key)}
                    className="flex-1 rounded-xl px-2 py-2.5 text-left transition-all"
                    style={{
                      background: on ? `${o.color}14` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${on ? `${o.color}50` : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    <p className="text-[11px] font-semibold" style={{ color: on ? o.color : 'white' }}>
                      {o.label}
                    </p>
                    <p className="text-[9px] mt-0.5" style={{ color: 'oklch(0.42 0 0)' }}>{o.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders — 2 columns */}
          <div>
            <Label>Variables climáticas y operacionales</Label>
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 mt-3">
              <Slider label="Anomalía lluvias" value={params.anomalia_lluvias_pct}
                min={-50} max={300} step={5} unit="%"
                onChange={(v) => set('anomalia_lluvias_pct', v)} />
              <Slider label="Anomalía temperatura" value={params.anomalia_temperatura_c}
                min={-3} max={5} step={0.1} unit="°C"
                onChange={(v) => set('anomalia_temperatura_c', v)} />
              <Slider label="Racionamiento agua" value={params.racionamiento_agua_pct}
                min={0} max={100} unit="%"
                onChange={(v) => set('racionamiento_agua_pct', v)} />
              <Slider label="Control vectorial" value={params.eficiencia_control_vectorial_pct}
                min={0} max={100} unit="%" accent="#22c55e"
                onChange={(v) => set('eficiencia_control_vectorial_pct', v)} />
              <Slider label="Desabastecimiento insumos" value={params.desabastecimiento_insumos_pct}
                min={0} max={100} unit="%"
                onChange={(v) => set('desabastecimiento_insumos_pct', v)} />
            </div>
          </div>

          {/* Serotipo */}
          <div>
            <Label>Serotipo dominante (MINSA-CDC)</Label>
            <div className="flex gap-1.5 mt-2">
              {(['DEN-1', 'DEN-2', 'DEN-3', 'DEN-4'] as Serotipo[]).map((s) => {
                const on = params.serotipo_dominante === s;
                return (
                  <button key={s} onClick={() => set('serotipo_dominante', s)}
                    className="flex-1 rounded-xl py-2 text-[11px] font-semibold transition-all"
                    style={{
                      background: on ? 'oklch(0.60 0.18 240)' : 'rgba(255,255,255,0.05)',
                      border:     `1px solid ${on ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                      color:      on ? 'white' : 'oklch(0.44 0 0)',
                    }}>
                    {s}
                    {s === 'DEN-2' && (
                      <span className="ml-0.5 text-[8px]" style={{ color: on ? '#fde68a' : '#fbbf24' }}>⚠</span>
                    )}
                  </button>
                );
              })}
            </div>
            {params.serotipo_dominante === 'DEN-2' && (
              <p className="text-[10px] mt-1.5" style={{ color: '#fbbf24' }}>
                DEN-2 incrementa mortalidad en adultos sin inmunidad previa.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'oklch(0.50 0 0)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Cancelar
          </button>
          <button onClick={() => { onApply(); onClose(); }} disabled={loading}
            className="flex-1 rounded-xl py-2 text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: 'oklch(0.60 0.18 240)', color: 'white' }}>
            {loading ? 'Ejecutando…' : 'Aplicar y ejecutar modelo'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

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

// ─── Metric card ─────────────────────────────────────────────
function KPI({ label, value, sub, color, highlight }: {
  label: string; value: string; sub?: string; color?: string; highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl px-4 py-3.5 min-w-0"
      style={{
        background: highlight ? `${color}0d` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${highlight ? `${color}28` : 'rgba(255,255,255,0.07)'}`,
      }}>
      <p className="text-[9px] uppercase tracking-widest truncate" style={{ color: 'oklch(0.36 0 0)' }}>
        {label}
      </p>
      <p className="text-xl font-semibold tabular-nums leading-none"
        style={{ color: color ?? 'white', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] truncate"
          style={{ color: highlight ? `${color}bb` : 'oklch(0.44 0 0)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[11px]" style={{ color: 'oklch(0.48 0 0)' }}>{label}</span>
      <span className="text-xs font-medium tabular-nums"
        style={{ color: accent ?? 'rgba(255,255,255,0.88)' }}>
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

function ProgBar({ label, value, color = '#22c55e' }: {
  label: string; value: number; color?: string;
}) {
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

// ─── Tabs ─────────────────────────────────────────────────────
function EpidemicTab({ data, onExpand }: { data: SEIRModelResponse; onExpand: () => void }) {
  const chartData = data.proyeccion_semanal.map((s) => ({
    name: `S${s.semana}`, casos: s.casos_proyectados,
    hosp: s.hospitalizados_requeridos, rt: s.tasa_rt, historico: s.es_historico,
  }));
  const camas = data.kpis.camas_disponibles;
  const rtMax = data.kpis.rt_maximo;

  return (
    <motion.div key="epidemico" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Pico semana',   value: `Sem. ${data.kpis.pico_semana}` },
          { label: 'Máx. semanal',  value: fmtNum(data.kpis.maximo_semanal_casos), sub: 'casos' },
          { label: 'Rt máximo',     value: rtMax.toFixed(2),
            color: rtMax > 4 ? '#ef4444' : rtMax > 2 ? '#f97316' : '#22c55e' },
          { label: 'Camas disp.',   value: fmtNum(camas), color: '#ef4444',
            sub: `${data.kpis.saturacion_hospitalaria_pct}% saturación` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] uppercase tracking-widest mb-1.5"
              style={{ color: 'oklch(0.36 0 0)' }}>{s.label}</p>
            <p className="text-base font-semibold tabular-nums"
              style={{ color: s.color ?? 'white' }}>{s.value}</p>
            {s.sub && <p className="text-[10px] mt-0.5" style={{ color: 'oklch(0.44 0 0)' }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div>
            <p className="text-xs font-medium text-white">Proyección semanal</p>
            <p className="text-[10px]" style={{ color: 'oklch(0.40 0 0)' }}>
              S1–S4 histórico · S5–S16 proyección Dengue
            </p>
          </div>
          <button onClick={onExpand}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] transition-colors"
            style={{ color: 'oklch(0.48 0 0)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'oklch(0.48 0 0)'; }}>
            <Maximize2 size={11} />
            Ampliar
          </button>
        </div>
        <div className="px-3 pb-4">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 42, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#444', fontSize: 9 }} tickLine={false}
                axisLine={false} interval={1} />
              <YAxis yAxisId="l" tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <YAxis yAxisId="r" orientation="right" domain={[0, Math.ceil(rtMax) + 2]}
                tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(10,10,12,0.97)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontSize: 11, color: 'white' }}
                formatter={(v, n) => {
                  const val = v as number;
                  if (n === 'rt')   return [`${val.toFixed(2)}`, 'Rt'];
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
        <p className="text-[10px] leading-relaxed" style={{ color: 'oklch(0.34 0 0)' }}>
          {data.notas_metodologicas}
        </p>
      )}
    </motion.div>
  );
}

function HumanitarianTab({ data }: { data: SEIRModelResponse }) {
  const h = data.humanitario;
  if (!h) return <p className="py-12 text-center text-xs" style={{ color: 'oklch(0.40 0 0)' }}>Sin datos.</p>;
  const aguaColor  = h.acceso_agua_potable_pct < 50 ? '#ef4444' : h.acceso_agua_potable_pct < 75 ? '#f97316' : '#22c55e';
  const saludPct   = Math.round(Math.min(h.personal_salud_por_1000hab / 2 * 100, 100));
  const saludColor = h.personal_salud_por_1000hab < 0.5 ? '#ef4444' : h.personal_salud_por_1000hab < 1.0 ? '#f97316' : '#22c55e';

  return (
    <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <div className="grid grid-cols-2 gap-3 mb-1">
        {[
          { l: 'Fallecidos estimados', v: h.fallecidos_estimados,  c: '#ef4444', bg: 'rgba(239,68,68,0.07)',   b: 'rgba(239,68,68,0.14)' },
          { l: 'Heridos graves',       v: h.heridos_graves,        c: '#f97316', bg: 'rgba(249,115,22,0.07)', b: 'rgba(249,115,22,0.14)' },
          { l: 'Desplazados',          v: h.personas_desplazadas,  c: 'rgba(255,255,255,0.88)', bg: 'rgba(255,255,255,0.04)', b: 'rgba(255,255,255,0.07)' },
          { l: 'Albergues req.',       v: h.albergues_requeridos,  c: 'rgba(255,255,255,0.88)', bg: 'rgba(255,255,255,0.04)', b: 'rgba(255,255,255,0.07)' },
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
    </motion.div>
  );
}

function EconomicTab({ data }: { data: SEIRModelResponse }) {
  const e = data.economico;
  if (!e) return <p className="py-12 text-center text-xs" style={{ color: 'oklch(0.40 0 0)' }}>Sin datos.</p>;
  const ahorro = e.impacto_total_soles - e.inversion_preventiva_soles;

  return (
    <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
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
      <Row label="Arroz"    value={`${fmtNum(e.cultivos.arroz_has)} ha`} />
      <Row label="Mango"    value={`${fmtNum(e.cultivos.mango_has)} ha`} />
      <Row label="Plátano"  value={`${fmtNum(e.cultivos.platano_has)} ha`} />
      <Row label="Pérdidas" value={fmtSoles(e.cultivos.total_valor_soles)} accent="#f97316" />
      <SectionLabel>Infraestructura</SectionLabel>
      <Row label="Carreteras" value={`${e.infraestructura.carreteras_afectadas_km} km`} />
      <Row label="Puentes"    value={String(e.infraestructura.puentes_danados)} />
      <Row label="Viviendas"  value={fmtNum(e.infraestructura.viviendas_afectadas)} />
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
interface Props { token: string; onClose: () => void; onResult?: (r: SEIRModelResponse) => void; }

export function SEIRModelPanel({ token, onClose, onResult }: Props) {
  const [activePreset, setActivePreset] = useState<Exclude<ENOSIntensidad, 'fuerte'>>('neutro');
  const [params, setParams]             = useState<SEIRParametros>({ ...PRESETS.neutro });
  const [region, setRegion]             = useState(REGIONES[0]);
  const [result, setResult]             = useState<SEIRModelResponse | null>(null);
  const [loading, setLoading]           = useState(false);
  const [tab, setTab]                   = useState<TabId>('epidemico');
  const [showParams, setShowParams]     = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);
  const hasAutoRun                      = useRef(false);

  const runWith = useCallback(async (p: SEIRParametros) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/riesgo/seir-model', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ region, ventana_semanas: 16, parametros: p }),
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

  const kpis  = result?.kpis;
  const nivel = kpis ? RIESGO[kpis.nivel_riesgo] : null;

  return (
    <div className="h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>

      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-white tracking-tight">Dashboard Dengue</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.40 0 0)' }}>
            {region.split(' — ')[0]} · {result ? `${result.ventana_semanas} semanas` : '16 semanas'}
          </p>
        </div>
        {loading && <Loader2 size={13} className="animate-spin" style={{ color: 'oklch(0.44 0 0)' }} />}
        <button onClick={() => setShowParams(true)}
          className="rounded-xl p-2 transition-colors"
          title="Configurar parámetros"
          style={{ color: 'oklch(0.50 0 0)', border: '1px solid rgba(255,255,255,0.08)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'oklch(0.50 0 0)'; }}>
          <Settings2 size={14} />
        </button>
        <button onClick={onClose} className="rounded-full p-1.5"
          style={{ color: 'oklch(0.46 0 0)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>

        {/* Scenario selector (2 presets) */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {SCENARIOS.map((s) => {
            const active = activePreset === s.key;
            return (
              <button key={s.key} onClick={() => selectPreset(s.key)}
                className="flex-1 rounded-lg py-2.5 text-xs font-medium transition-all"
                style={{ background: active ? 'rgba(255,255,255,0.11)' : 'transparent', color: active ? 'white' : 'oklch(0.44 0 0)' }}>
                {s.label}
              </button>
            );
          })}
          {/* ENOS indicator */}
          {(() => {
            const enos = RIESGO[params.enos_intensidad === 'fuerte' ? 'critico' : params.enos_intensidad === 'moderado' ? 'moderado' : 'bajo'];
            return (
              <button onClick={() => setShowParams(true)}
                className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs transition-all"
                style={{ background: `${enos.color}15`, border: `1px solid ${enos.color}35`, color: enos.color }}>
                <span className="text-[9px] font-semibold">
                  El Niño: {params.enos_intensidad === 'fuerte' ? 'Fuerte' : params.enos_intensidad === 'moderado' ? 'Mod.' : 'Sin'}
                </span>
              </button>
            );
          })()}
        </div>

        {/* 4 KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <KPI label="Casos proy." value={kpis ? fmtNum(kpis.casos_proyectados_total) : '—'} sub={kpis ? `Pico S${kpis.pico_semana}` : ''} />
          <KPI label="Saturación" value={kpis ? `${kpis.saturacion_hospitalaria_pct}%` : '—'}
            color={kpis && kpis.saturacion_hospitalaria_pct > 100 ? '#ef4444' : '#f97316'}
            sub={kpis && kpis.saturacion_hospitalaria_pct > 100 ? 'Colapso proy.' : 'Sin desborde'}
            highlight={kpis ? kpis.saturacion_hospitalaria_pct > 100 : false} />
          <KPI label="Riesgo" value={nivel?.label ?? '—'} color={nivel?.color} highlight={nivel?.label === 'CRÍTICO'} />
          <KPI label="Impacto" value={kpis ? fmtSoles(kpis.impacto_economico_soles) : '—'}
            sub={kpis ? `Ahorro: ${fmtSoles(kpis.ahorro_preventivo_soles)}` : ''} color="#22c55e" />
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Tabs */}
        <div className="flex">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-2 text-xs font-medium transition-colors"
                style={{ color: active ? 'white' : 'oklch(0.42 0 0)', borderBottom: `1.5px solid ${active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.06)'}` }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {result ? (
          <AnimatePresence mode="wait">
            {tab === 'epidemico'   && <EpidemicTab key="e" data={result} onExpand={() => setChartExpanded(true)} />}
            {tab === 'humanitario' && <HumanitarianTab key="h" data={result} />}
            {tab === 'economico'   && <EconomicTab key="c" data={result} />}
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
      </div>

      {/* Params modal */}
      <AnimatePresence>
        {showParams && (
          <ParamsModal
            params={params}
            region={region}
            loading={loading}
            onParamsChange={setParams}
            onRegionChange={setRegion}
            onApply={() => void runWith(params)}
            onClose={() => setShowParams(false)}
          />
        )}
      </AnimatePresence>

      {/* Chart modal */}
      <AnimatePresence>
        {chartExpanded && result && (
          <ChartModal data={result} onClose={() => setChartExpanded(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
