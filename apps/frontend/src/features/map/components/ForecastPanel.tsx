import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, Loader2, Radio } from 'lucide-react';
import { useState } from 'react';
import type { ForecastQuery, NivelRiesgoGlobal } from '../types';
import { useMapStore } from '../store/useMapStore';

const RISK_BADGE: Record<NivelRiesgoGlobal, { label: string; color: string; bg: string }> = {
  ALTO:  { label: 'ALTO',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  MEDIO: { label: 'MEDIO', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  BAJO:  { label: 'BAJO',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

export function ForecastPanel() {
  const { riskLevel, analysisText, isLoading, error, fetchForecast } = useMapStore();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [departamento, setDepartamento] = useState('');

  const badge = riskLevel ? RISK_BADGE[riskLevel] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const payload: ForecastQuery = { query: query.trim() };
    if (departamento.trim()) payload.departamento = departamento.trim().toUpperCase();
    await fetchForecast(payload);
    setExpanded(false);
  };

  return (
    <div
      className="absolute top-4 left-4 z-10 flex flex-col gap-0 overflow-hidden rounded-xl shadow-2xl"
      style={{
        width: 288,
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Radio size={14} style={{ color: 'oklch(0.60 0.18 240)' }} className="flex-shrink-0" />
        <span className="text-sm font-bold text-white tracking-tight">Predicta AI</span>
        {badge && (
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider"
            style={{ color: badge.color, background: badge.bg }}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Analysis text */}
      {analysisText && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.68 0 0)' }}>
            {analysisText}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-2"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(239,68,68,0.08)' }}>
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
          <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between px-4 py-2.5 text-left transition-colors"
        style={{ color: 'oklch(0.65 0.18 240)' }}
      >
        <span className="text-xs font-semibold">Generar pronóstico</span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Form */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider"
                       style={{ color: 'oklch(0.5 0 0)' }}>
                  Consulta
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej: Pronóstico Niño Costero en Piura"
                  rows={3}
                  required
                  className="resize-none rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(96,165,250,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider"
                       style={{ color: 'oklch(0.5 0 0)' }}>
                  Departamento (opcional)
                </label>
                <input
                  type="text"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  placeholder="Ej: PIURA"
                  className="rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(96,165,250,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'oklch(0.60 0.18 240)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Analizando…
                  </>
                ) : (
                  'Generar pronóstico'
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
