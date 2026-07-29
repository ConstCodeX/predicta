import { Activity, ArrowDown, ArrowUp, CheckCircle2, CloudRain, Cpu, Droplets, Flame, Heart, Leaf, Minus, Mountain, Package, Snowflake, Users } from 'lucide-react';
import type { AlertaMapa, ChartData, ForecastResponse, MetricaClave, NivelRiesgoGlobal, TipoAlerta } from '../../map/types';

// ─── Config de nivel de riesgo ────────────────────────────────────────────────

const RISK_CONFIG: Record<NivelRiesgoGlobal, { label: string; color: string; bg: string }> = {
  ALTO:  { label: 'RIESGO ALTO',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  MEDIO: { label: 'RIESGO MEDIO', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  BAJO:  { label: 'RIESGO BAJO',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

// ─── Config de tipos de alerta ────────────────────────────────────────────────

const TIPO_CONFIG: Partial<Record<TipoAlerta, { label: string; color: string; Icon: React.FC<{ size: number }> }>> = {
  INUNDACION:           { label: 'Inundación',         color: '#3b82f6', Icon: ({ size }) => <Droplets size={size} /> },
  LLUVIAS_EXTREMAS:     { label: 'Lluvias extremas',   color: '#06b6d4', Icon: ({ size }) => <CloudRain size={size} /> },
  MOVIMIENTO_MASA:      { label: 'Movimiento de masa', color: '#f97316', Icon: ({ size }) => <Mountain size={size} /> },
  DESABASTECIMIENTO:    { label: 'Desabastecimiento',  color: '#a78bfa', Icon: ({ size }) => <Package size={size} /> },
  SALUD_PUBLICA:        { label: 'Salud pública',      color: '#f472b6', Icon: ({ size }) => <Heart size={size} /> },
  AGUA_SANEAMIENTO:     { label: 'Agua / Saneamiento', color: '#22d3ee', Icon: ({ size }) => <Droplets size={size} /> },
  HIDROMETEOROLOGICO:   { label: 'Hidrometeorológico', color: '#38bdf8', Icon: ({ size }) => <CloudRain size={size} /> },
  MOVIMIENTO_DE_MASA:   { label: 'Movimiento de masa', color: '#fb923c', Icon: ({ size }) => <Mountain size={size} /> },
  BAJAS_TEMPERATURAS:   { label: 'Bajas temperaturas', color: '#67e8f9', Icon: ({ size }) => <Snowflake size={size} /> },
  INCENDIO:             { label: 'Incendio',           color: '#f87171', Icon: ({ size }) => <Flame size={size} /> },
  GEOFISICO:            { label: 'Geofísico',          color: '#fbbf24', Icon: ({ size }) => <Activity size={size} /> },
  BIOLOGICO:            { label: 'Biológico',          color: '#86efac', Icon: ({ size }) => <Leaf size={size} /> },
  ANTROPICO:            { label: 'Antrópico',          color: '#c084fc', Icon: ({ size }) => <Users size={size} /> },
  TECNOLOGICO:          { label: 'Tecnológico',        color: '#94a3b8', Icon: ({ size }) => <Cpu size={size} /> },
};

const TIPO_DEFAULT = { label: 'Alerta', color: '#94a3b8', Icon: ({ size }: { size: number }) => <Activity size={size} /> };
const SEV_COLOR = ['', '#22c55e', '#84cc16', '#f97316', '#ef4444', '#dc2626'];

// ─── Alert card ───────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: AlertaMapa }) {
  const sev = Math.min(5, Math.max(1, alert.severidad));
  const tipo = TIPO_CONFIG[alert.tipo_alerta] ?? TIPO_DEFAULT;
  return (
    <div className="flex flex-col gap-2 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ color: tipo.color }}><tipo.Icon size={12} /></span>
          <span className="text-[11px] font-semibold" style={{ color: tipo.color }}>{tipo.label}</span>
        </div>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: SEV_COLOR[sev] }}>SEV {sev}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">
          {alert.departamento}{alert.distrito ? ` · ${alert.distrito}` : ''}
        </span>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'oklch(0.68 0 0)' }}>
          {alert.probabilidad_porcentaje}%
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${alert.probabilidad_porcentaje}%`, background: tipo.color }} />
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: 'oklch(0.62 0 0)' }}>{alert.descripcion}</p>
    </div>
  );
}

// ─── Métricas clave ───────────────────────────────────────────────────────────

function MetricaCard({ m }: { m: MetricaClave }) {
  const TrendIcon =
    m.tendencia === 'UP' ? ArrowUp :
    m.tendencia === 'DOWN' ? ArrowDown :
    m.tendencia === 'STABLE' ? Minus : null;

  const trendColor =
    m.tendencia === 'UP' ? '#f97316' :
    m.tendencia === 'DOWN' ? '#22c55e' :
    '#94a3b8';

  return (
    <div className="flex flex-col gap-0.5 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[10px]" style={{ color: 'oklch(0.50 0 0)' }}>{m.label}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white leading-tight">{m.valor}</p>
        {TrendIcon && (
          <TrendIcon size={13} style={{ color: trendColor }} />
        )}
      </div>
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

// Palette for charts (cycles if > 10 items)
const CHART_PALETTE = [
  '#60a5fa', '#f97316', '#a78bfa', '#22d3ee', '#f472b6',
  '#86efac', '#fbbf24', '#67e8f9', '#fb923c', '#c084fc',
];

function BarChartViz({ chart }: { chart: ChartData }) {
  const max = Math.max(...chart.datos.map((d) => d.valor), 1);
  return (
    <div className="flex flex-col gap-1.5">
      {chart.datos.map((d, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="truncate max-w-[140px]" style={{ color: 'oklch(0.70 0 0)' }}>{d.label}</span>
            <span className="tabular-nums" style={{ color: 'oklch(0.58 0 0)' }}>
              {d.valor.toLocaleString()}{chart.unidad ? ` ${chart.unidad}` : ''}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(d.valor / max) * 100}%`,
                background: CHART_PALETTE[i % CHART_PALETTE.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LineChartViz({ chart }: { chart: ChartData }) {
  const datos = chart.datos;
  if (datos.length < 2) return <BarChartViz chart={chart} />;

  const W = 320;
  const H = 70;
  const PAD = { left: 28, right: 8, top: 8, bottom: 20 };
  const maxVal = Math.max(...datos.map((d) => d.valor), 1);
  const minVal = Math.min(...datos.map((d) => d.valor), 0);
  const range = maxVal - minVal || 1;

  const toX = (i: number) =>
    PAD.left + (i / (datos.length - 1)) * (W - PAD.left - PAD.right);
  const toY = (v: number) =>
    PAD.top + (1 - (v - minVal) / range) * (H - PAD.top - PAD.bottom);

  const points = datos.map((d, i) => `${toX(i)},${toY(d.valor)}`).join(' ');
  const areaPoints = [
    `${toX(0)},${H - PAD.bottom}`,
    ...datos.map((d, i) => `${toX(i)},${toY(d.valor)}`),
    `${toX(datos.length - 1)},${H - PAD.bottom}`,
  ].join(' ');

  // Show every Nth label to avoid overlap
  const step = Math.ceil(datos.length / 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Area fill */}
      <polygon points={areaPoints} fill="rgba(96,165,250,0.12)" />
      {/* Line */}
      <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {datos.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.valor)} r={2.5} fill="#60a5fa" />
      ))}
      {/* X labels */}
      {datos.map((d, i) =>
        i % step === 0 || i === datos.length - 1 ? (
          <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.35)">
            {d.label}
          </text>
        ) : null
      )}
      {/* Y axis min/max */}
      <text x={PAD.left - 3} y={PAD.top + 4} textAnchor="end" fontSize={7} fill="rgba(255,255,255,0.3)">
        {maxVal.toLocaleString()}
      </text>
      <text x={PAD.left - 3} y={H - PAD.bottom} textAnchor="end" fontSize={7} fill="rgba(255,255,255,0.3)">
        {minVal.toLocaleString()}
      </text>
    </svg>
  );
}

function PieChartViz({ chart }: { chart: ChartData }) {
  const total = chart.datos.reduce((s, d) => s + d.valor, 0) || 1;
  const R = 40;
  const CX = 50;
  const CY = 50;

  let cumAngle = -Math.PI / 2;
  const slices = chart.datos.map((d, i) => {
    const angle = (d.valor / total) * Math.PI * 2;
    const startAngle = cumAngle;
    cumAngle += angle;
    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(cumAngle);
    const y2 = CY + R * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { d: `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z`, color: CHART_PALETTE[i % CHART_PALETTE.length], label: d.label, pct: Math.round((d.valor / total) * 100) };
  });

  return (
    <div className="flex gap-3 items-center">
      <svg viewBox="0 0 100 100" style={{ width: 80, height: 80, flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity={0.9} />
        ))}
        <circle cx={CX} cy={CY} r={18} fill="rgba(9,9,11,0.9)" />
      </svg>
      <div className="flex flex-col gap-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[10px] truncate" style={{ color: 'oklch(0.65 0 0)' }}>{s.label}</span>
            <span className="text-[10px] tabular-nums ml-auto" style={{ color: 'oklch(0.52 0 0)' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ chart }: { chart: ChartData }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-[10px] font-semibold" style={{ color: 'oklch(0.60 0 0)' }}>{chart.titulo}</p>
      {chart.tipo === 'BAR' && <BarChartViz chart={chart} />}
      {chart.tipo === 'LINE' && <LineChartViz chart={chart} />}
      {chart.tipo === 'PIE' && <PieChartViz chart={chart} />}
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

function collectUniqueActions(alerts: AlertaMapa[]): string[] {
  const seen = new Set<string>();
  const actions: string[] = [];
  for (const alert of alerts) {
    for (const action of alert.acciones_sugeridas) {
      if (!seen.has(action)) { seen.add(action); actions.push(action); }
    }
  }
  return actions.slice(0, 5);
}

interface Props {
  data: ForecastResponse;
}

export function ForecastResponseCard({ data }: Props) {
  const risk = RISK_CONFIG[data.nivel_riesgo_global];
  const allActions = collectUniqueActions(data.alertas_mapa);
  const charts = data.charts ?? [];
  const metricas = data.metricas_clave ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Risk header */}
      <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5" style={{ background: risk.bg, border: `1px solid ${risk.color}30` }}>
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider flex-shrink-0" style={{ color: risk.color, background: `${risk.color}20` }}>
          {risk.label}
        </span>
        <span className="text-[11px]" style={{ color: 'oklch(0.72 0 0)' }}>
          {data.alertas_mapa.length} zona{data.alertas_mapa.length !== 1 ? 's' : ''} en alerta · mapa actualizado
        </span>
      </div>

      {/* Analysis */}
      <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.7 0 0)' }}>{data.analisis_general}</p>

      {/* Key metrics */}
      {metricas.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.44 0 0)' }}>Métricas clave</p>
          <div className="grid grid-cols-2 gap-1.5">
            {metricas.map((m, i) => <MetricaCard key={i} m={m} />)}
          </div>
        </div>
      )}

      {/* Charts */}
      {charts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.44 0 0)' }}>Análisis visual</p>
          {charts.map((c, i) => <ChartCard key={i} chart={c} />)}
        </div>
      )}

      {/* Alert cards */}
      {data.alertas_mapa.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.44 0 0)' }}>Alertas detectadas</p>
          {data.alertas_mapa.map((alert, i) => <AlertCard key={i} alert={alert} />)}
        </div>
      )}

      {/* Quick actions */}
      {allActions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.44 0 0)' }}>Acciones sugeridas</p>
          <div className="flex flex-wrap gap-1.5">
            {allActions.map((action, i) => (
              <span key={i} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ border: '1px solid rgba(255,255,255,0.09)', color: 'oklch(0.70 0 0)', background: 'rgba(255,255,255,0.03)' }}>
                <CheckCircle2 size={10} style={{ color: 'oklch(0.65 0.17 145)', flexShrink: 0 }} />
                {action}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
