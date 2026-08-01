import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SEIRModelResponse } from './seir-types';

interface Props {
  data: SEIRModelResponse;
  onClose: () => void;
}

const RIESGO_COLOR: Record<string, string> = {
  bajo: '#22c55e', moderado: '#f97316', critico: '#ef4444',
};

export function ChartModal({ data, onClose }: Props) {
  const chartData = data.proyeccion_semanal.map((s) => ({
    name:      `Sem. ${s.semana}`,
    casos:     s.casos_proyectados,
    hosp:      s.hospitalizados_requeridos,
    rt:        s.tasa_rt,
    historico: s.es_historico,
  }));

  const camas  = data.kpis.camas_disponibles;
  const rtMax  = data.kpis.rt_maximo;
  const nivel  = data.kpis.nivel_riesgo;
  const color  = RIESGO_COLOR[nivel] ?? '#6b7280';
  const pico   = chartData.find((d) => d.casos === data.kpis.maximo_semanal_casos);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '92vw',
          maxWidth: 1280,
          height: '82vh',
          background: 'rgba(10,10,12,0.98)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20,
        }}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Proyección Epidémica Semanal
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.44 0 0)' }}>
              {data.region} · {data.escenario} · 16 semanas · Modelo Dengue
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Summary pills */}
            <div className="flex gap-2">
              {[
                { label: 'Total casos', value: data.kpis.casos_proyectados_total.toLocaleString() },
                { label: 'Pico', value: `Sem. ${data.kpis.pico_semana}` },
                { label: 'Rt máx.', value: rtMax.toFixed(2), color },
                { label: 'Camas disp.', value: camas.toLocaleString(), color: '#ef4444' },
              ].map((p) => (
                <div key={p.label} className="rounded-xl px-3 py-1.5 text-center"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-0.5"
                    style={{ color: 'oklch(0.38 0 0)' }}>{p.label}</p>
                  <p className="text-sm font-semibold tabular-nums"
                    style={{ color: p.color ?? 'white' }}>{p.value}</p>
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="rounded-full p-2 transition-colors"
              style={{ color: 'oklch(0.46 0 0)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 px-8 py-6 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 60, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#555', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              />
              <YAxis
                yAxisId="l"
                tick={{ fill: '#555', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <YAxis
                yAxisId="r"
                orientation="right"
                domain={[0, Math.ceil(rtMax) + 2]}
                tick={{ fill: '#555', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `Rt ${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,10,12,0.98)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 12, fontSize: 12, color: 'white',
                }}
                formatter={(v, n) => {
                  const val = v as number;
                  if (n === 'rt')   return [`${val.toFixed(2)}`, 'Tasa Rt'];
                  if (n === 'hosp') return [val.toLocaleString('es-PE'), 'Hospitalizados req.'];
                  return [val.toLocaleString('es-PE'), 'Casos proyectados'];
                }}
                labelFormatter={(l) => {
                  const row = chartData.find((d) => d.name === String(l));
                  return `${l}${row?.historico ? '  (histórico MINSA)' : '  (proyección Dengue)'}`;
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: 'oklch(0.48 0 0)', paddingTop: 12 }}
                formatter={(v: string) => ({
                  casos: 'Casos proyectados',
                  hosp:  'Hospitalizados requeridos',
                  rt:    'Tasa de reproducción Rt',
                }[v] ?? v)}
              />

              {/* Historical divider */}
              <ReferenceLine yAxisId="l" x="Sem. 4"
                stroke="rgba(255,255,255,0.12)" strokeDasharray="4 2"
                label={{ value: '◀ Histórico · Proyección ▶', position: 'top',
                  fill: 'oklch(0.44 0 0)', fontSize: 10 }} />

              {/* Hospital capacity */}
              <ReferenceLine yAxisId="l" y={camas}
                stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1.5}
                label={{ value: `Camas disponibles (${camas})`, position: 'right',
                  fill: '#ef4444', fontSize: 10 }} />

              {/* Peak marker */}
              {pico && (
                <ReferenceLine yAxisId="l" x={pico.name}
                  stroke={color} strokeDasharray="3 2" strokeWidth={1}
                  label={{ value: `Pico: ${pico.casos.toLocaleString()}`, position: 'top',
                    fill: color, fontSize: 10 }} />
              )}

              <Bar yAxisId="l" dataKey="casos" fill="rgba(59,130,246,0.45)"
                radius={[3, 3, 0, 0]} />
              <Line yAxisId="l" dataKey="hosp" stroke="#f97316" strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 6 }} />
              <Line yAxisId="r" dataKey="rt" stroke="#64748b" strokeWidth={1.5}
                strokeDasharray="5 3" dot={false} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Footer note */}
        <div className="px-8 pb-5 flex-shrink-0">
          <p className="text-[10px] leading-relaxed" style={{ color: 'oklch(0.34 0 0)' }}>
            {data.notas_metodologicas}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
