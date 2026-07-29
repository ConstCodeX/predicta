import { Activity, CloudRain, Cpu, Droplets, Flame, Heart, Leaf, Mountain, Package, Snowflake, Users } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import type { TipoAlerta } from '../types';

const ALL_TYPES: { tipo: TipoAlerta; label: string; color: string; icon: React.ReactNode }[] = [
  { tipo: 'INUNDACION',         label: 'Inundación',          color: '#3b82f6', icon: <Droplets size={12} /> },
  { tipo: 'LLUVIAS_EXTREMAS',   label: 'Lluvias extremas',    color: '#06b6d4', icon: <CloudRain size={12} /> },
  { tipo: 'MOVIMIENTO_MASA',    label: 'Movimiento de masa',  color: '#f97316', icon: <Mountain size={12} /> },
  { tipo: 'DESABASTECIMIENTO',  label: 'Desabastecimiento',   color: '#a78bfa', icon: <Package size={12} /> },
  { tipo: 'HIDROMETEOROLOGICO', label: 'Hidrometeorólogico',  color: '#38bdf8', icon: <CloudRain size={12} /> },
  { tipo: 'MOVIMIENTO_DE_MASA', label: 'Mov. de masa',        color: '#fb923c', icon: <Mountain size={12} /> },
  { tipo: 'BAJAS_TEMPERATURAS', label: 'Bajas temperaturas',  color: '#67e8f9', icon: <Snowflake size={12} /> },
  { tipo: 'INCENDIO',           label: 'Incendio',            color: '#f87171', icon: <Flame size={12} /> },
  { tipo: 'GEOFISICO',          label: 'Geofísico',           color: '#fbbf24', icon: <Activity size={12} /> },
  { tipo: 'BIOLOGICO',          label: 'Biológico',           color: '#86efac', icon: <Leaf size={12} /> },
  { tipo: 'ANTROPICO',          label: 'Antrópico',           color: '#c084fc', icon: <Users size={12} /> },
  { tipo: 'TECNOLOGICO',        label: 'Tecnológico',         color: '#94a3b8', icon: <Cpu size={12} /> },
  { tipo: 'SALUD_PUBLICA',      label: 'Salud pública',       color: '#f472b6', icon: <Heart size={12} /> },
  { tipo: 'AGUA_SANEAMIENTO',   label: 'Agua / Saneamiento',  color: '#22d3ee', icon: <Droplets size={12} /> },
];

export function MapLegend() {
  const alerts = useMapStore((s) => s.alerts);

  // Only show types that are actually present on the map
  const presentTypes = new Set(alerts.map((a) => a.tipo_alerta));
  const visible = ALL_TYPES.filter((t) => presentTypes.has(t.tipo));

  if (visible.length === 0) return null;

  return (
    <div
      className="absolute bottom-6 right-4 z-10 flex flex-col gap-2.5 rounded-xl p-3 shadow-2xl"
      style={{
        background: 'rgba(9,9,11,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 178,
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.48 0 0)' }}>
        Tipo de alerta
      </p>
      <ul className="flex flex-col gap-1.5">
        {visible.map(({ tipo, label, color, icon }) => (
          <li key={tipo} className="flex items-center gap-2">
            <span style={{ color }}>{icon}</span>
            <span className="text-[11px]" style={{ color: 'oklch(0.72 0 0)' }}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
