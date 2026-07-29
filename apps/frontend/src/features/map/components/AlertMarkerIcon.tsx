import { motion } from 'framer-motion';
import {
  Activity,
  CloudRain,
  Cpu,
  Droplets,
  Flame,
  Leaf,
  Mountain,
  Package,
  Snowflake,
  Users,
} from 'lucide-react';
import type { TipoAlerta } from '../types';

const SIZE: Record<number, number> = { 1: 22, 2: 26, 3: 30, 4: 36, 5: 44 };

type AlertConfig = { color: string; ring: string; Icon: React.FC<{ size: number }> };

const ALERT_CONFIG: Record<TipoAlerta, AlertConfig> = {
  // ── Forecast / IA ─────────────────────────────────────────────────────
  INUNDACION: {
    color: '#3b82f6',
    ring: 'rgba(59,130,246,0.35)',
    Icon: ({ size }) => <Droplets size={size} />,
  },
  LLUVIAS_EXTREMAS: {
    color: '#06b6d4',
    ring: 'rgba(6,182,212,0.35)',
    Icon: ({ size }) => <CloudRain size={size} />,
  },
  MOVIMIENTO_MASA: {
    color: '#f97316',
    ring: 'rgba(249,115,22,0.35)',
    Icon: ({ size }) => <Mountain size={size} />,
  },
  DESABASTECIMIENTO: {
    color: '#a78bfa',
    ring: 'rgba(167,139,250,0.35)',
    Icon: ({ size }) => <Package size={size} />,
  },
  // ── Familias INDECI reales ────────────────────────────────────────────
  HIDROMETEOROLOGICO: {
    color: '#38bdf8',
    ring: 'rgba(56,189,248,0.35)',
    Icon: ({ size }) => <CloudRain size={size} />,
  },
  MOVIMIENTO_DE_MASA: {
    color: '#fb923c',
    ring: 'rgba(251,146,60,0.35)',
    Icon: ({ size }) => <Mountain size={size} />,
  },
  BAJAS_TEMPERATURAS: {
    color: '#67e8f9',
    ring: 'rgba(103,232,249,0.35)',
    Icon: ({ size }) => <Snowflake size={size} />,
  },
  INCENDIO: {
    color: '#f87171',
    ring: 'rgba(248,113,113,0.35)',
    Icon: ({ size }) => <Flame size={size} />,
  },
  GEOFISICO: {
    color: '#fbbf24',
    ring: 'rgba(251,191,36,0.35)',
    Icon: ({ size }) => <Activity size={size} />,
  },
  BIOLOGICO: {
    color: '#86efac',
    ring: 'rgba(134,239,172,0.35)',
    Icon: ({ size }) => <Leaf size={size} />,
  },
  ANTROPICO: {
    color: '#c084fc',
    ring: 'rgba(192,132,252,0.35)',
    Icon: ({ size }) => <Users size={size} />,
  },
  TECNOLOGICO: {
    color: '#94a3b8',
    ring: 'rgba(148,163,184,0.35)',
    Icon: ({ size }) => <Cpu size={size} />,
  },
};

const FALLBACK_CONFIG: AlertConfig = {
  color: '#94a3b8',
  ring: 'rgba(148,163,184,0.35)',
  Icon: ({ size }) => <Activity size={size} />,
};

interface Props {
  tipo_alerta: TipoAlerta;
  severidad: number;
  onClick: () => void;
}

export function AlertMarkerIcon({ tipo_alerta, severidad, onClick }: Props) {
  const sev = Math.min(5, Math.max(1, severidad));
  const size = SIZE[sev];
  const { color, ring, Icon } = ALERT_CONFIG[tipo_alerta] ?? FALLBACK_CONFIG;
  const iconSize = Math.round(size * 0.46);
  const pulsing = sev >= 4;

  return (
    <button
      onClick={onClick}
      style={{ width: size, height: size, cursor: 'pointer' }}
      className="relative flex items-center justify-center border-0 bg-transparent p-0"
    >
      {pulsing && (
        <motion.span
          className="absolute rounded-full"
          style={{ backgroundColor: ring, inset: -6 }}
          animate={{ scale: [1, 1.55, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
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
      <span style={{ color, zIndex: 1 }}>
        <Icon size={iconSize} />
      </span>
    </button>
  );
}
