import { motion } from 'framer-motion';
import { CloudRain, Droplets, Mountain, Package } from 'lucide-react';
import type { TipoAlerta } from '../types';

// Tamaño en px por severidad (índice 0 sin usar)
const SIZE: Record<number, number> = { 1: 22, 2: 26, 3: 30, 4: 36, 5: 44 };

const ALERT_CONFIG: Record<
  TipoAlerta,
  { color: string; ring: string; Icon: React.FC<{ size: number }> }
> = {
  INUNDACION: {
    color: '#3b82f6',   // blue-500
    ring: 'rgba(59,130,246,0.35)',
    Icon: ({ size }) => <Droplets size={size} />,
  },
  LLUVIAS_EXTREMAS: {
    color: '#06b6d4',   // cyan-500
    ring: 'rgba(6,182,212,0.35)',
    Icon: ({ size }) => <CloudRain size={size} />,
  },
  MOVIMIENTO_MASA: {
    color: '#f97316',   // orange-500
    ring: 'rgba(249,115,22,0.35)',
    Icon: ({ size }) => <Mountain size={size} />,
  },
  DESABASTECIMIENTO: {
    color: '#a78bfa',   // violet-400
    ring: 'rgba(167,139,250,0.35)',
    Icon: ({ size }) => <Package size={size} />,
  },
};

interface Props {
  tipo_alerta: TipoAlerta;
  severidad: number;
  onClick: () => void;
}

export function AlertMarkerIcon({ tipo_alerta, severidad, onClick }: Props) {
  const sev = Math.min(5, Math.max(1, severidad));
  const size = SIZE[sev];
  const { color, ring, Icon } = ALERT_CONFIG[tipo_alerta];
  const iconSize = Math.round(size * 0.46);
  const pulsing = sev >= 4;

  return (
    <button
      onClick={onClick}
      style={{ width: size, height: size, cursor: 'pointer' }}
      className="relative flex items-center justify-center border-0 bg-transparent p-0"
    >
      {/* Pulsing ring for high severity */}
      {pulsing && (
        <motion.span
          className="absolute rounded-full"
          style={{ backgroundColor: ring, inset: -6 }}
          animate={{ scale: [1, 1.55, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Main circle */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.15 }}
        whileHover={{ opacity: 0.3 }}
      />
      <motion.span
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* Icon */}
      <span style={{ color, zIndex: 1 }}>
        <Icon size={iconSize} />
      </span>
    </button>
  );
}
