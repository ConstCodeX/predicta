import { CloudRain, Droplets, Mountain, Package } from 'lucide-react';

const ALERT_ITEMS = [
  { icon: <Droplets size={13} />,  label: 'Inundación',         color: '#3b82f6' },
  { icon: <CloudRain size={13} />, label: 'Lluvias extremas',   color: '#06b6d4' },
  { icon: <Mountain size={13} />,  label: 'Movimiento de masa', color: '#f97316' },
  { icon: <Package size={13} />,   label: 'Desabastecimiento',  color: '#a78bfa' },
];

const SEV_SIZES = [8, 10, 13, 17, 22];
const SEV_LABELS = ['1', '2', '3', '4', '5'];

export function MapLegend() {
  return (
    <div
      className="absolute bottom-6 right-4 z-10 flex flex-col gap-3 rounded-xl p-3 shadow-2xl"
      style={{
        background: 'rgba(9,9,11,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 178,
      }}
    >
      {/* Tipo de alerta */}
      <div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest"
           style={{ color: 'oklch(0.48 0 0)' }}>
          Tipo de alerta
        </p>
        <ul className="flex flex-col gap-1.5">
          {ALERT_ITEMS.map(({ icon, label, color }) => (
            <li key={label} className="flex items-center gap-2">
              <span style={{ color }}>{icon}</span>
              <span className="text-[11px]" style={{ color: 'oklch(0.72 0 0)' }}>{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* Severidad */}
      <div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest"
           style={{ color: 'oklch(0.48 0 0)' }}>
          Severidad
        </p>
        <div className="flex items-end gap-2">
          {SEV_SIZES.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className="rounded-full"
                style={{ width: s, height: s, background: 'rgba(255,255,255,0.25)' }}
              />
              <span className="text-[9px]" style={{ color: 'oklch(0.5 0 0)' }}>{SEV_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
