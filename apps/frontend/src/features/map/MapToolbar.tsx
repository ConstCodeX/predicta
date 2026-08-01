import { motion } from 'framer-motion';
import { BarChart2, Crosshair, Flame, MessageSquare, History } from 'lucide-react';

export type MapTool = 'predictions' | 'heatmap' | 'timeline' | 'chat' | 'scenarios';

interface Props {
  activeTool: MapTool | null;
  onToggle: (tool: MapTool) => void;
}

const ACTIVE_TOOLS: { id: MapTool; icon: React.ReactNode; label: string; color: string }[] = [
  { id: 'predictions', icon: <BarChart2 size={15} />, label: 'Predicciones Dengue', color: '#14b8a6' },
  { id: 'heatmap',     icon: <Flame size={15} />,     label: 'Mapa de calor',       color: '#f97316' },
  { id: 'timeline',    icon: <History size={15} />,   label: 'Línea de tiempo',     color: '#a78bfa' },
];

const SOON_TOOLS: { id: MapTool; icon: React.ReactNode; label: string }[] = [
  { id: 'scenarios', icon: <Crosshair size={15} />,     label: 'Escenarios' },
  { id: 'chat',      icon: <MessageSquare size={15} />, label: 'Asistente IA' },
];

export function MapToolbar({ activeTool, onToggle }: Props) {
  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
      {/* Herramientas activas */}
      {ACTIVE_TOOLS.map((tool) => {
        const active = activeTool === tool.id;
        return (
          <motion.button
            key={tool.id}
            onClick={() => onToggle(tool.id)}
            whileTap={{ scale: 0.93 }}
            title={tool.label}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all"
            style={{
              background:           active ? tool.color : 'var(--c-surface)',
              backdropFilter:       'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border:               `1px solid ${active ? 'transparent' : 'var(--c-border)'}`,
              color:                active ? 'white' : 'oklch(0.54 0 0)',
              boxShadow:            active ? `0 0 16px ${tool.color}55` : '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            {tool.icon}
            <span
              className="pointer-events-none absolute left-12 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background:     'var(--c-tooltip)',
                border:         '1px solid var(--c-border)',
                color:          'var(--c-text)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {tool.label}
            </span>
          </motion.button>
        );
      })}

      {/* Separador */}
      <div style={{ height: 1, background: 'var(--c-divider)', margin: '2px 4px' }} />

      {/* Próximamente */}
      {SOON_TOOLS.map((tool) => (
        <div
          key={tool.id}
          title={`${tool.label} — Próximamente`}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl cursor-not-allowed"
          style={{
            background:           'var(--c-dim)',
            backdropFilter:       'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border:               '1px solid var(--c-border3)',
            color:                'oklch(0.36 0 0)',
          }}
        >
          {tool.icon}
          <span
            className="pointer-events-none absolute left-12 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background:     'var(--c-tooltip)',
              border:         '1px solid var(--c-border)',
              color:          'oklch(0.46 0 0)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {tool.label}
            <span
              className="ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              style={{ background: 'var(--c-card-hi)', color: 'oklch(0.44 0 0)' }}
            >
              SOON
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
