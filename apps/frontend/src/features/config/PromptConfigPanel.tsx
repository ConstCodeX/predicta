import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bot, Check, Loader2, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const DEFAULT_PREDICT_SYSTEM = `Eres un sistema experto en análisis de riesgo de desastres en Perú.
Usas datos históricos del INDECI para generar predicciones de probabilidad por distrito.
Responde SIEMPRE con JSON válido y sin ningún texto adicional fuera del JSON.`;

const DEFAULT_HEATMAP_COMMENTARY = `Eres un analista de riesgos en Perú. Responde en español, máximo 2 oraciones, sin formato markdown.`;

const KNOWN_PROMPTS: { key: string; label: string; description: string; defaultValue: string }[] = [
  {
    key: 'prompt.predict.system',
    label: 'Sistema — Predicciones de riesgo',
    description: 'System prompt del análisis predictivo por IA. Define el rol y formato de respuesta.',
    defaultValue: DEFAULT_PREDICT_SYSTEM,
  },
  {
    key: 'prompt.heatmap.commentary',
    label: 'Sistema — Comentario de mapa de calor',
    description: 'System prompt para el análisis breve del mapa de calor histórico.',
    defaultValue: DEFAULT_HEATMAP_COMMENTARY,
  },
];

interface ConfigEntry {
  key: string;
  value: string;
  description: string | null;
}

interface Props {
  token: string;
  onClose: () => void;
}

export function PromptConfigPanel({ token, onClose }: Props) {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as ConfigEntry[];
      const map: Record<string, string> = {};
      for (const e of data) map[e.key] = e.value;
      setConfigs(map);
      setEdits(map);
    } catch {
      setLoadError('No se pudieron cargar las configuraciones.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadConfigs(); }, [loadConfigs]);

  const getDisplayValue = (key: string) => {
    if (edits[key] !== undefined) return edits[key];
    const known = KNOWN_PROMPTS.find((p) => p.key === key);
    return known?.defaultValue ?? '';
  };

  const isDirty = (key: string) => {
    const current = configs[key];
    const edit = edits[key];
    if (edit === undefined) return false;
    return edit !== (current ?? KNOWN_PROMPTS.find((p) => p.key === key)?.defaultValue ?? '');
  };

  const save = async (key: string) => {
    const value = getDisplayValue(key);
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await fetch(`/api/v1/config/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value }),
      });
      setConfigs((c) => ({ ...c, [key]: value }));
      setSaved((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000);
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const reset = async (key: string) => {
    const known = KNOWN_PROMPTS.find((p) => p.key === key);
    if (!known) return;
    // Remove from DB (revert to code default)
    await fetch(`/api/v1/config/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setConfigs((c) => { const n = { ...c }; delete n[key]; return n; });
    setEdits((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ background: 'rgba(9,9,11,0.98)' }}>
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Bot size={16} style={{ color: 'oklch(0.60 0.18 240)' }} />
        <div className="flex flex-col flex-1">
          <span className="text-sm font-bold text-white">Configuración de IA</span>
          <span className="text-[10px]" style={{ color: 'oklch(0.46 0 0)' }}>
            Edita los prompts del sistema — si la IA no está disponible, el servidor no falla
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
          style={{ color: 'oklch(0.46 0 0)' }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {loading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin" style={{ color: 'oklch(0.44 0 0)' }} />
          </div>
        )}

        <AnimatePresence>
          {loadError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs mb-4"
              style={{ background: 'rgba(239,68,68,0.07)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <AlertCircle size={12} />
              {loadError}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && (
          <div className="flex flex-col gap-6 max-w-2xl">
            {KNOWN_PROMPTS.map((prompt) => {
              const isCustomized = configs[prompt.key] !== undefined;
              const currentValue = getDisplayValue(prompt.key);
              const dirty = isDirty(prompt.key);

              return (
                <div key={prompt.key} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{prompt.label}</span>
                        {isCustomized && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                            style={{ background: 'rgba(96,165,250,0.12)', color: 'oklch(0.60 0.18 240)', border: '1px solid rgba(96,165,250,0.2)' }}
                          >
                            PERSONALIZADO
                          </span>
                        )}
                      </div>
                      <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>{prompt.description}</span>
                      <code className="text-[9px] font-mono" style={{ color: 'oklch(0.38 0 0)' }}>{prompt.key}</code>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isCustomized && (
                        <button
                          onClick={() => void reset(prompt.key)}
                          title="Restaurar valor por defecto"
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] transition-colors hover:bg-white/5"
                          style={{ color: 'oklch(0.46 0 0)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <RotateCcw size={10} />
                          Resetear
                        </button>
                      )}
                      <button
                        onClick={() => void save(prompt.key)}
                        disabled={!dirty || saving[prompt.key]}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold text-white transition-all disabled:opacity-40"
                        style={{ background: saved[prompt.key] ? '#22c55e' : 'oklch(0.60 0.18 240)' }}
                      >
                        {saving[prompt.key]
                          ? <Loader2 size={10} className="animate-spin" />
                          : saved[prompt.key]
                          ? <Check size={10} />
                          : null
                        }
                        {saved[prompt.key] ? 'Guardado' : 'Guardar'}
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={currentValue}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [prompt.key]: e.target.value }))}
                    rows={6}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${dirty ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      fontSize: '0.6875rem',
                      fontFamily: 'ui-monospace, monospace',
                      color: 'oklch(0.75 0 0)',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.6,
                    }}
                  />

                  {!isCustomized && (
                    <p className="text-[10px]" style={{ color: 'oklch(0.38 0 0)' }}>
                      Usando valor por defecto del código. Guarda para personalizar.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
