import { motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import type { AlertaMapa } from '../types';

const TIPO_LABEL: Record<string, string> = {
  INUNDACION:           'Inundación',
  LLUVIAS_EXTREMAS:     'Lluvias extremas',
  MOVIMIENTO_MASA:      'Movimiento de masa',
  DESABASTECIMIENTO:    'Desabastecimiento',
  HIDROMETEOROLOGICO:   'Hidrometeorólogico',
  MOVIMIENTO_DE_MASA:   'Movimiento de masa',
  BAJAS_TEMPERATURAS:   'Bajas temperaturas',
  INCENDIO:             'Incendio',
  GEOFISICO:            'Geofísico',
  BIOLOGICO:            'Biológico',
  ANTROPICO:            'Antrópico',
  TECNOLOGICO:          'Tecnológico',
};

const SEV_COLOR = ['', '#22c55e', '#84cc16', '#f97316', '#ef4444', '#dc2626'];
const SEV_LABEL = ['', 'Leve', 'Moderado', 'Grave', 'Muy grave', 'Crítico'];

interface Props {
  alert: AlertaMapa;
  onClose: () => void;
}

export function AlertPopup({ alert, onClose }: Props) {
  const sev = Math.min(5, Math.max(1, alert.severidad));
  const isTimeline = alert.acciones_sugeridas.length === 0 && alert.probabilidad_porcentaje === 50;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      style={{
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.75rem',
        width: 280,
      }}
      className="overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-2 px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.6 0 0)' }}>
            {TIPO_LABEL[alert.tipo_alerta] ?? alert.tipo_alerta}
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-white leading-tight">
            {alert.departamento}
            {alert.distrito ? ` · ${alert.distrito}` : ''}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 flex-shrink-0 rounded-md p-1 transition-colors hover:bg-white/5"
          style={{ color: 'oklch(0.5 0 0)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Metrics */}
      {!isTimeline && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white leading-none">
              {alert.probabilidad_porcentaje}
              <span className="text-sm font-normal" style={{ color: 'oklch(0.55 0 0)' }}>%</span>
            </span>
            <span className="mt-0.5 text-[10px]" style={{ color: 'oklch(0.5 0 0)' }}>probabilidad</span>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-4 rounded-full"
                  style={{ background: i < sev ? SEV_COLOR[sev] : 'rgba(255,255,255,0.12)' }}
                />
              ))}
            </div>
            <span className="text-[10px] font-medium" style={{ color: SEV_COLOR[sev] }}>
              Severidad {sev} — {SEV_LABEL[sev]}
            </span>
          </div>
        </div>
      )}

      {/* Descripción */}
      <div className="px-4 py-3" style={{ borderBottom: alert.acciones_sugeridas.length > 0 ? '1px solid rgba(255,255,255,0.07)' : undefined }}>
        <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.72 0 0)' }}>
          {alert.descripcion}
        </p>
      </div>

      {/* Acciones */}
      {alert.acciones_sugeridas.length > 0 && (
        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.5 0 0)' }}>
            Acciones sugeridas
          </p>
          <ul className="flex flex-col gap-1.5">
            {alert.acciones_sugeridas.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'oklch(0.65 0.17 145)' }} />
                <span className="text-xs" style={{ color: 'oklch(0.72 0 0)' }}>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
