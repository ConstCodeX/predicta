import { Activity, CheckCircle2, CloudRain, Cpu, Droplets, Flame, Leaf, Mountain, Package, Snowflake, Users } from 'lucide-react';
import type { AlertaMapa, ForecastResponse, NivelRiesgoGlobal, TipoAlerta } from '../../map/types';

const RISK_CONFIG: Record<NivelRiesgoGlobal, { label: string; color: string; bg: string }> = {
  ALTO:  { label: 'RIESGO ALTO',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  MEDIO: { label: 'RIESGO MEDIO', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  BAJO:  { label: 'RIESGO BAJO',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

const TIPO_CONFIG: Partial<Record<TipoAlerta, { label: string; color: string; Icon: React.FC<{ size: number }> }>> = {
  INUNDACION:           { label: 'Inundación',          color: '#3b82f6', Icon: ({ size }) => <Droplets size={size} /> },
  LLUVIAS_EXTREMAS:     { label: 'Lluvias extremas',    color: '#06b6d4', Icon: ({ size }) => <CloudRain size={size} /> },
  MOVIMIENTO_MASA:      { label: 'Movimiento de masa',  color: '#f97316', Icon: ({ size }) => <Mountain size={size} /> },
  DESABASTECIMIENTO:    { label: 'Desabastecimiento',   color: '#a78bfa', Icon: ({ size }) => <Package size={size} /> },
  HIDROMETEOROLOGICO:   { label: 'Hidrometeorólogico',  color: '#38bdf8', Icon: ({ size }) => <CloudRain size={size} /> },
  MOVIMIENTO_DE_MASA:   { label: 'Movimiento de masa',  color: '#fb923c', Icon: ({ size }) => <Mountain size={size} /> },
  BAJAS_TEMPERATURAS:   { label: 'Bajas temperaturas',  color: '#67e8f9', Icon: ({ size }) => <Snowflake size={size} /> },
  INCENDIO:             { label: 'Incendio',            color: '#f87171', Icon: ({ size }) => <Flame size={size} /> },
  GEOFISICO:            { label: 'Geofísico',           color: '#fbbf24', Icon: ({ size }) => <Activity size={size} /> },
  BIOLOGICO:            { label: 'Biológico',           color: '#86efac', Icon: ({ size }) => <Leaf size={size} /> },
  ANTROPICO:            { label: 'Antrópico',           color: '#c084fc', Icon: ({ size }) => <Users size={size} /> },
  TECNOLOGICO:          { label: 'Tecnológico',         color: '#94a3b8', Icon: ({ size }) => <Cpu size={size} /> },
};

const TIPO_DEFAULT = { label: 'Alerta', color: '#94a3b8', Icon: ({ size }: { size: number }) => <Activity size={size} /> };

const SEV_COLOR = ['', '#22c55e', '#84cc16', '#f97316', '#ef4444', '#dc2626'];

function AlertCard({ alert }: { alert: AlertaMapa }) {
  const sev = Math.min(5, Math.max(1, alert.severidad));
  const tipo = TIPO_CONFIG[alert.tipo_alerta] ?? TIPO_DEFAULT;

  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Tipo + severidad */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ color: tipo.color }}>
            <tipo.Icon size={12} />
          </span>
          <span className="text-[11px] font-semibold" style={{ color: tipo.color }}>
            {tipo.label}
          </span>
        </div>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: SEV_COLOR[sev] }}>
          SEV {sev}
        </span>
      </div>

      {/* Departamento + probabilidad */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">
          {alert.departamento}
          {alert.distrito ? ` · ${alert.distrito}` : ''}
        </span>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'oklch(0.68 0 0)' }}>
          {alert.probabilidad_porcentaje}%
        </span>
      </div>

      {/* Probability bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${alert.probabilidad_porcentaje}%`, background: tipo.color }}
        />
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: 'oklch(0.62 0 0)' }}>
        {alert.descripcion}
      </p>
    </div>
  );
}

function collectUniqueActions(alerts: AlertaMapa[]): string[] {
  const seen = new Set<string>();
  const actions: string[] = [];
  for (const alert of alerts) {
    for (const action of alert.acciones_sugeridas) {
      if (!seen.has(action)) {
        seen.add(action);
        actions.push(action);
      }
    }
  }
  return actions.slice(0, 6);
}

interface Props {
  data: ForecastResponse;
}

export function ForecastResponseCard({ data }: Props) {
  const risk = RISK_CONFIG[data.nivel_riesgo_global];
  const allActions = collectUniqueActions(data.alertas_mapa);

  return (
    <div className="flex flex-col gap-3">
      {/* Risk header */}
      <div
        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
        style={{ background: risk.bg, border: `1px solid ${risk.color}30` }}
      >
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider flex-shrink-0"
          style={{ color: risk.color, background: `${risk.color}20` }}
        >
          {risk.label}
        </span>
        <span className="text-[11px]" style={{ color: 'oklch(0.72 0 0)' }}>
          {data.alertas_mapa.length} zona{data.alertas_mapa.length !== 1 ? 's' : ''} en alerta — mapa actualizado
        </span>
      </div>

      {/* Analysis */}
      <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.7 0 0)' }}>
        {data.analisis_general}
      </p>

      {/* Alert cards */}
      {data.alertas_mapa.length > 0 && (
        <div className="flex flex-col gap-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'oklch(0.44 0 0)' }}
          >
            Alertas detectadas
          </p>
          {data.alertas_mapa.map((alert, i) => (
            <AlertCard key={i} alert={alert} />
          ))}
        </div>
      )}

      {/* Quick action buttons */}
      {allActions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'oklch(0.44 0 0)' }}
          >
            Acciones sugeridas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allActions.map((action, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'oklch(0.70 0 0)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
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
