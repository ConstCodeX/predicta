import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, BotOff,
  Loader2, Maximize2, Settings2, X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bar, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ChartModal } from '../seir-model/ChartModal';
import {
  PRESETS, REGIONES,
  type ENOSIntensidad, type SEIRModelResponse, type SEIRParametros,
} from '../seir-model/seir-types';
import { useMapStore } from '../map/store/useMapStore';

const RIESGO_SEIR: Record<string, { color: string; label: string }> = {
  bajo:     { color: '#22c55e', label: 'BAJO' },
  moderado: { color: '#f97316', label: 'MODERADO' },
  critico:  { color: '#ef4444', label: 'CRÍTICO' },
};

const AÑO_OPTIONS = [2025, 2026, 2027, 2028];

const fmtNum   = (n: number) => n.toLocaleString('es-PE');
const fmtSoles = (n: number) =>
  n >= 1_000_000 ? `S/ ${(n / 1_000_000).toFixed(1)}M` : `S/ ${n.toLocaleString()}`;

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

// ─── SEIR Params Modal — solo región, fenómeno, año, lluvias ─
function ParamsModal({ params, region, año, loading, onParamsChange, onRegionChange, onAñoChange, onApply, onClose }: {
  params: SEIRParametros; region: string; año: number; loading: boolean;
  onParamsChange: (p: SEIRParametros) => void;
  onRegionChange: (r: string) => void;
  onAñoChange: (a: number) => void;
  onApply: (p: SEIRParametros, r: string, a: number) => void;
  onClose: () => void;
}) {
  const tieneElNino = params.enos_intensidad !== 'neutro';

  const toggleElNino = (valor: boolean) => {
    const preset = valor ? PRESETS.fuerte : PRESETS.neutro;
    onParamsChange({ ...preset, anomalia_lluvias_pct: params.anomalia_lluvias_pct });
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="relative flex flex-col overflow-hidden"
        style={{ width: 420, maxHeight: '80vh', background: 'rgba(10,10,12,0.98)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20 }}
        initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 6 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-sm font-semibold text-white">Parámetros del modelo</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.42 0 0)' }}>Condiciones de entrada — Dengue SEIR</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ color: 'oklch(0.46 0 0)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
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

          {/* Fenómeno El Niño — sí / no */}
          <div>
            <Label>¿Fenómeno El Niño?</Label>
            <div className="flex gap-2 mt-2">
              {[
                { valor: false, label: 'Sin El Niño', sub: 'Condiciones normales', color: '#22c55e' },
                { valor: true,  label: 'Con El Niño', sub: 'Anomalía climática activa', color: '#ef4444' },
              ].map((o) => {
                const on = tieneElNino === o.valor;
                return (
                  <button key={String(o.valor)} onClick={() => toggleElNino(o.valor)}
                    className="flex-1 rounded-xl px-3 py-3 text-left transition-all"
                    style={{ background: on ? `${o.color}14` : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? `${o.color}50` : 'rgba(255,255,255,0.07)'}` }}>
                    <p className="text-[11px] font-semibold" style={{ color: on ? o.color : 'white' }}>{o.label}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: 'oklch(0.42 0 0)' }}>{o.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Año */}
          <div>
            <Label>Año de proyección</Label>
            <div className="flex gap-2 mt-2">
              {AÑO_OPTIONS.map((a) => {
                const on = año === a;
                return (
                  <button key={a} onClick={() => onAñoChange(a)}
                    className="flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all"
                    style={{ background: on ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? 'rgba(20,184,166,0.40)' : 'rgba(255,255,255,0.07)'}`, color: on ? '#14b8a6' : 'oklch(0.50 0 0)' }}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anomalía de lluvias */}
          <div>
            <Label>Anomalía de lluvias</Label>
            <div className="mt-3">
              <Slider
                label="Desviación respecto al promedio histórico"
                value={params.anomalia_lluvias_pct}
                min={-50} max={300} step={5} unit="%"
                onChange={(v) => onParamsChange({ ...params, anomalia_lluvias_pct: v })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'oklch(0.50 0 0)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Cancelar
          </button>
          <button onClick={() => { onApply(params, region, año); onClose(); }} disabled={loading}
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
  const rtMax  = data.kpis.rt_maximo;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Pico semana',  value: `Sem. ${data.kpis.pico_semana}` },
          { label: 'Máx. semanal', value: fmtNum(data.kpis.maximo_semanal_casos), sub: 'casos' },
          { label: 'Rt máximo',    value: rtMax.toFixed(2), color: rtMax > 4 ? '#ef4444' : rtMax > 2 ? '#f97316' : '#22c55e' },
          { label: 'Camas disp.',  value: fmtNum(camas), color: '#ef4444', sub: `${data.kpis.saturacion_hospitalaria_pct}% sat.` },
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
                  if (n === 'rt')   return [`${val.toFixed(2)}`, 'Rt'];
                  if (n === 'hosp') return [fmtNum(val), 'Hospitalizados'];
                  return [fmtNum(val), 'Casos'];
                }}
                labelFormatter={(l) => { const r = chartData.find((d) => d.name === String(l)); return `${l}${r?.historico ? ' ← histórico' : ' ← proyección'}`; }}
              />
              <ReferenceLine yAxisId="l" x="S4" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 2" />
              <ReferenceLine yAxisId="l" y={camas} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1}
                label={{ value: `Camas: ${camas}`, position: 'right', fill: '#ef4444', fontSize: 9 }} />
              <Bar  yAxisId="l" dataKey="casos" fill="rgba(59,130,246,0.42)" radius={[2, 2, 0, 0]} maxBarSize={22} />
              <Line yAxisId="l" dataKey="hosp" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 2 }} activeDot={{ r: 5 }} />
              <Line yAxisId="r" dataKey="rt"   stroke="#475569" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
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
  const aguaColor  = h.acceso_agua_potable_pct < 50 ? '#ef4444' : h.acceso_agua_potable_pct < 75 ? '#f97316' : '#22c55e';
  const saludPct   = Math.round(Math.min(h.personal_salud_por_1000hab / 2 * 100, 100));
  const saludColor = h.personal_salud_por_1000hab < 0.5 ? '#ef4444' : h.personal_salud_por_1000hab < 1.0 ? '#f97316' : '#22c55e';
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-1">
        {[
          { l: 'Fallecidos estimados', v: h.fallecidos_estimados,    c: '#ef4444',              bg: 'rgba(239,68,68,0.07)',   b: 'rgba(239,68,68,0.14)' },
          { l: 'Heridos graves',       v: h.heridos_graves,          c: '#f97316',              bg: 'rgba(249,115,22,0.07)',  b: 'rgba(249,115,22,0.14)' },
          { l: 'Desplazados',          v: h.personas_desplazadas,    c: 'rgba(255,255,255,0.88)', bg: 'rgba(255,255,255,0.04)', b: 'rgba(255,255,255,0.07)' },
          { l: 'Albergues req.',       v: h.albergues_requeridos,    c: 'rgba(255,255,255,0.88)', bg: 'rgba(255,255,255,0.04)', b: 'rgba(255,255,255,0.07)' },
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
        <ProgBar label="Acceso a agua potable"     value={h.acceso_agua_potable_pct} color={aguaColor} />
        <ProgBar label="Cobertura sistema de salud" value={saludPct}                 color={saludColor} />
      </div>
      <div className="mt-1">
        <Row label="Personal salud / 1,000 hab." value={h.personal_salud_por_1000hab.toFixed(1)} />
        <Row label="Personas en riesgo"           value={fmtNum(h.personas_en_riesgo)} accent="rgba(255,255,255,0.65)" />
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
      <Row label="Arroz"   value={`${fmtNum(e.cultivos.arroz_has)} ha`} />
      <Row label="Mango"   value={`${fmtNum(e.cultivos.mango_has)} ha`} />
      <Row label="Plátano" value={`${fmtNum(e.cultivos.platano_has)} ha`} />
      <Row label="Pérdidas" value={fmtSoles(e.cultivos.total_valor_soles)} accent="#f97316" />
      <SectionLabel>Infraestructura</SectionLabel>
      <Row label="Carreteras" value={`${e.infraestructura.carreteras_afectadas_km} km`} />
      <Row label="Puentes"    value={String(e.infraestructura.puentes_danados)} />
      <Row label="Viviendas"  value={fmtNum(e.infraestructura.viviendas_afectadas)} />
    </div>
  );
}

// ─── SEIR content ─────────────────────────────────────────────
const SEIR_SCENARIOS: { key: Exclude<ENOSIntensidad, 'fuerte'>; label: string }[] = [
  { key: 'neutro',   label: 'Optimista' },
  { key: 'moderado', label: 'Moderado' },
];
const SEIR_SUBTABS: { id: SEIRSubTab; label: string }[] = [
  { id: 'epidemico',   label: 'Epidémico' },
  { id: 'humanitario', label: 'Humanitario' },
  { id: 'economico',   label: 'Económico' },
];

function SEIRContent({ token, onResult, onSubTabChange, externalDepartamento }: {
  token: string;
  onResult?: (r: SEIRModelResponse) => void;
  onSubTabChange?: (tab: SEIRSubTab) => void;
  externalDepartamento?: string | null;
}) {
  const [activePreset, setActivePreset] = useState<Exclude<ENOSIntensidad, 'fuerte'>>('neutro');
  const [params, setParams]             = useState<SEIRParametros>({ ...PRESETS.neutro });
  const [region, setRegion]             = useState(REGIONES[0]);
  const [año, setAño]                   = useState(2027);
  const [result, setResult]             = useState<SEIRModelResponse | null>(null);
  const [loading, setLoading]           = useState(false);
  const [subTab, setSubTab]             = useState<SEIRSubTab>('epidemico');
  const [showParams, setShowParams]     = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);
  const hasAutoRun = useRef(false);

  const runWith = useCallback(async (p: SEIRParametros, overrideRegion?: string, overrideAño?: number) => {
    setLoading(true);
    setResult(null);
    onResult?.(null as unknown as SEIRModelResponse);
    try {
      const res = await fetch('/api/v1/riesgo/seir-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          region: overrideRegion ?? region,
          año: overrideAño ?? año,
          ventana_semanas: 16,
          parametros: p,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as SEIRModelResponse;
        setResult(data);
        if ((data as unknown as Record<string, unknown>)['generado_por'] !== 'mock') {
          onResult?.(data);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [token, region, año, onResult]);

  const selectPreset = (preset: Exclude<ENOSIntensidad, 'fuerte'>) => {
    const p = { ...PRESETS[preset] };
    setActivePreset(preset);
    setParams(p);
    void runWith(p);
  };

  // Sync region when user clicks a departamento on the map
  useEffect(() => {
    if (!externalDepartamento) return;
    const matched = REGIONES.find((r) =>
      r.toUpperCase().startsWith(externalDepartamento.toUpperCase()),
    );
    if (matched) {
      setRegion(matched);
      void runWith(params, matched);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalDepartamento]);

  if (!hasAutoRun.current) {
    hasAutoRun.current = true;
    void runWith(params);
  }

  const kpis   = result?.kpis;
  const nivel  = kpis ? RIESGO_SEIR[kpis.nivel_riesgo] : null;
  const esMock = result && (result as unknown as Record<string, unknown>)['generado_por'] === 'mock';

  return (
    <div className="space-y-5">
      {/* Mock warning */}
      {esMock && (
        <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
          style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.20)' }}>
          <BotOff size={12} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
          <p className="text-[11px] leading-relaxed" style={{ color: '#fde68a' }}>
            Gemma no disponible — datos de referencia estáticos. Configura <strong>GEMINI_API_KEY</strong> para activar el modelo.
          </p>
        </div>
      )}

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
                  El Niño: {params.enos_intensidad === 'neutro' ? 'Sin' : 'Con'}
                </span>
              </button>
            );
          })()}
        </div>
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
            highlight: kpis ? kpis.saturacion_hospitalaria_pct > 100 : false,
          },
          { label: 'Riesgo',   value: nivel?.label ?? '—', color: nivel?.color, highlight: nivel?.label === 'CRÍTICO' },
          {
            label: 'Impacto', value: kpis ? fmtSoles(kpis.impacto_economico_soles) : '—',
            sub: kpis ? `Ahorro: ${fmtSoles(kpis.ahorro_preventivo_soles)}` : '', color: '#22c55e',
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
          {subTab === 'epidemico'   && <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><SEIREpidemicTab data={result} onExpand={() => setChartExpanded(true)} /></motion.div>}
          {subTab === 'humanitario' && <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><SEIRHumanitarianTab data={result} /></motion.div>}
          {subTab === 'economico'   && <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><SEIREconomicTab data={result} /></motion.div>}
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
          <ParamsModal
            params={params} region={region} año={año} loading={loading}
            onParamsChange={setParams}
            onRegionChange={setRegion}
            onAñoChange={setAño}
            onApply={(p, r, a) => { setParams(p); setRegion(r); setAño(a); void runWith(p, r, a); }}
            onClose={() => setShowParams(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {chartExpanded && result && <ChartModal data={result} onClose={() => setChartExpanded(false)} />}
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
  const { selectedDepartamento, setSelectedDepartamento } = useMapStore();

  return (
    <div className="h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-white tracking-tight">Predicciones · Dengue</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.40 0 0)' }}>
            Modelo epidémico SEIR · Generado por Gemma via AI Studio
          </p>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5" style={{ color: 'oklch(0.46 0 0)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          <X size={14} />
        </button>
      </div>

      {/* Region chip */}
      {selectedDepartamento && (
        <div className="flex flex-shrink-0 items-center gap-2 px-5 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20,184,166,0.06)' }}>
          <span className="text-[10px]" style={{ color: 'oklch(0.46 0 0)' }}>Región activa:</span>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: 'rgba(20,184,166,0.15)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.25)' }}>
            {selectedDepartamento}
          </span>
          <button onClick={() => setSelectedDepartamento(null)}
            className="ml-auto text-[10px] rounded px-2 py-0.5 transition-colors"
            style={{ color: 'oklch(0.40 0 0)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'oklch(0.40 0 0)')}>
            Limpiar
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
        <SEIRContent
          token={token}
          onResult={onResult}
          onSubTabChange={onSubTabChange}
          externalDepartamento={selectedDepartamento}
        />
      </div>
    </div>
  );
}
