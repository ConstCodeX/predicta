import { motion } from 'framer-motion';
import { MessageSquare, Upload } from 'lucide-react';

interface Props {
  csvOpen: boolean;
  chatOpen: boolean;
  onToggleCsv: () => void;
  onToggleChat: () => void;
}

export function AppToolbar({ csvOpen, chatOpen, onToggleCsv, onToggleChat }: Props) {
  return (
    <div
      className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl p-1 shadow-2xl"
      style={{
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}
    >
      <ToolButton icon={<Upload size={14} />} label="Subir CSV" active={csvOpen} onClick={onToggleCsv} />
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
      <ToolButton icon={<MessageSquare size={14} />} label="Análisis Predictivo" active={chatOpen} onClick={onToggleChat} />
    </div>
  );
}

function ToolButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-colors"
      style={{ color: active ? 'white' : 'oklch(0.60 0 0)', background: active ? 'oklch(0.60 0.18 240)' : 'transparent' }}
    >
      {icon}
      {label}
    </motion.button>
  );
}
