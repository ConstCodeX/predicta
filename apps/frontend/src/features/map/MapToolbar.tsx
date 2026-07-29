import { motion } from 'framer-motion';
import { Flame, MessageSquare, History, Sparkles } from 'lucide-react';

export type MapTool = 'predictions' | 'heatmap' | 'timeline' | 'chat';

interface Props {
  activeTool: MapTool | null;
  onToggle: (tool: MapTool) => void;
}

const TOOLS: { id: MapTool; icon: React.ReactNode; label: string; color: string }[] = [
  { id: 'predictions', icon: <Sparkles size={15} />, label: 'Predicciones', color: 'oklch(0.60 0.18 240)' },
  { id: 'heatmap',     icon: <Flame size={15} />,    label: 'Mapa de calor', color: '#f97316' },
  { id: 'timeline',    icon: <History size={15} />,  label: 'Línea de tiempo', color: '#a78bfa' },
  { id: 'chat',        icon: <MessageSquare size={15} />, label: 'Asistente IA', color: '#22d3ee' },
];

export function MapToolbar({ activeTool, onToggle }: Props) {
  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5"
    >
      {TOOLS.map((tool) => {
        const active = activeTool === tool.id;
        return (
          <motion.button
            key={tool.id}
            onClick={() => onToggle(tool.id)}
            whileTap={{ scale: 0.93 }}
            title={tool.label}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all"
            style={{
              background: active ? tool.color : 'rgba(9,9,11,0.82)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.09)'}`,
              color: active ? 'white' : 'oklch(0.54 0 0)',
              boxShadow: active ? `0 0 16px ${tool.color}55` : '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {tool.icon}
            {/* Tooltip */}
            <span
              className="pointer-events-none absolute left-12 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: 'rgba(9,9,11,0.92)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'white',
                backdropFilter: 'blur(8px)',
              }}
            >
              {tool.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
