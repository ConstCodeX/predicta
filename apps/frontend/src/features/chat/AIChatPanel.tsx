import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '../map/store/useMapStore';
import type { ForecastQuery, ForecastResponse } from '../map/types';
import { ForecastResponseCard } from './components/ForecastResponseCard';

type Message =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; data: ForecastResponse }
  | { id: string; role: 'error'; text: string };

const SUGGESTIONS = [
  '¿Qué zonas de Piura son más vulnerables en El Niño 2025?',
  'Riesgo de huaicos en Ancash y La Libertad',
  'Predicción de inundaciones en el norte del Perú',
  'Desabastecimiento de medicamentos en Loreto',
];

interface Props {
  token: string;
  onClose: () => void;
}

export function AIChatPanel({ token, onClose }: Props) {
  const setForecast = useMapStore((s) => s.setForecast);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
      setInput('');
      setIsLoading(true);

      try {
        const payload: ForecastQuery = { query: trimmed };
        const res = await fetch('/api/v1/ai/forecast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? `Error del servidor (${res.status})`);
        }

        const data = (await res.json()) as ForecastResponse;

        // Actualizar marcadores del mapa en tiempo real
        setForecast(data);

        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', data }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'error', text: (err as Error).message },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, setForecast, token],
  );

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="fixed top-0 right-0 z-30 flex h-full flex-col shadow-2xl"
      style={{
        width: 400,
        background: 'rgba(9,9,11,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex flex-shrink-0 items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.18)',
          }}
        >
          <BarChart3 size={15} style={{ color: 'oklch(0.60 0.18 240)' }} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white leading-none">Análisis Predictivo</span>
          <span className="mt-0.5 text-[10px]" style={{ color: 'oklch(0.46 0 0)' }}>
            Datos INDECI + IA · Fenómeno del Niño Perú
          </span>
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded-lg p-1.5 transition-colors hover:bg-white/5"
          style={{ color: 'oklch(0.46 0 0)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col gap-5 mt-2">
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Sparkles size={22} style={{ color: 'oklch(0.48 0 0)' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.48 0 0)' }}>
                Consulta el comportamiento histórico de El Niño por región.<br />
                La IA cruza datos INDECI y genera un pronóstico predictivo.<br />
                Los marcadores del mapa se actualizan en tiempo real.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.36 0 0)' }}>
                Consultas frecuentes
              </p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl px-3.5 py-2.5 text-left text-xs transition-all hover:bg-white/5"
                  style={{
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'oklch(0.62 0 0)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div
                    className="max-w-[82%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs text-white"
                    style={{ background: 'oklch(0.60 0.18 240)' }}
                  >
                    {msg.text}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={11} style={{ color: 'oklch(0.50 0 0)' }} />
                    <span className="text-[10px]" style={{ color: 'oklch(0.46 0 0)' }}>
                      Predicta · análisis generado
                    </span>
                  </div>
                  <ForecastResponseCard data={msg.data} />
                </div>
              )}

              {msg.role === 'error' && (
                <div
                  className="rounded-xl px-3.5 py-3 text-xs leading-relaxed"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171',
                  }}
                >
                  {msg.text}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-1"
            >
              <Loader2 size={12} className="animate-spin" style={{ color: 'oklch(0.50 0 0)' }} />
              <span className="text-xs" style={{ color: 'oklch(0.46 0 0)' }}>
                Analizando datos históricos INDECI…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ej: ¿Qué pasará en Piura con El Niño 2025?"
            rows={2}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-xs text-white placeholder-zinc-600 outline-none"
            style={{ minHeight: 36, maxHeight: 120 }}
          />
          <button
            onClick={() => send(input)}
            disabled={isLoading || !input.trim()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-40"
            style={{ background: 'oklch(0.60 0.18 240)' }}
          >
            {isLoading
              ? <Loader2 size={13} className="animate-spin text-white" />
              : <Send size={13} className="text-white" />
            }
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px]" style={{ color: 'oklch(0.36 0 0)' }}>
          Enter para enviar · Shift+Enter nueva línea
        </p>
      </div>
    </motion.div>
  );
}
