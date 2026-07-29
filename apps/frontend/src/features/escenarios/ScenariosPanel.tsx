import { motion } from 'framer-motion';
import { Bot, BotOff, Crosshair, Loader2, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { getCoords } from '../map/constants/peru-coords';
import { useMapStore } from '../map/store/useMapStore';

interface EscenarioTipo {
  id: string;
  label: string;
  descripcion: string;
  icono: string;
}

interface ZonaEscenario {
  departamento: string;
  distrito: string;
  promedio_anual: number;
  maximo_anual: number;
  anios_con_eventos: number;
  nivel: 'normal' | 'moderado' | 'extremo';
  count: number;
}

interface ScenarioResult {
  escenario: EscenarioTipo;
  intensidad: string;
  zonas_afectadas: ZonaEscenario[];
  total_zonas: number;
  resumen_estadistico: { total_historico: number; departamentos_afectados: number };
  commentary: string | null;
  ai_disponible: boolean;
}

const INTENSIDADES = [
  { id: 'normal',   label: 'Normal',   color: '#22d3ee' },
  { id: 'moderado', label: 'Moderado', color: '#f97316' },
  { id: 'extremo',  label: 'Extremo',  color: '#ef4444' },
] as const;

const NIVEL_COLOR: Record<ZonaEscenario['nivel'], string> = {
  normal:   '#22d3ee',
  moderado: '#f97316',
  extremo:  '#ef4444',
};

interface Props {
  token: string;
  onClose: () => void;
}

export function ScenariosPanel({ token, onClose }: Props) {
  const { setHeatmap, clearHeatmap, setHeatmapLoading, setFlyTarget } = useMapStore();

  const [tipos, setTipos] = useState<EscenarioTipo[]>([]);
  const [tiposLoaded, setTiposLoaded] = useState(false);
  const [selectedEscenario, setSelectedEscenario] = useState<string>('');
  const [intensidad, setIntensidad] = useState<'normal' | 'moderado' | 'extremo'>('normal');
  const [departamento, setDepartamento] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lazy-load scenario types when panel mounts
  const loadTipos = async () => {
    if (tiposLoaded) return;
    try {
      const r = await fetch('/api/v1/escenarios/tipos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await r.json()) as EscenarioTipo[];
      setTipos(data);
      setTiposLoaded(true);
    } catch {
      setTipos([]);
    }
  };

  // Load on first render
  if (!tiposLoaded) loadTipos();

  const analyze = async () => {
    if (!selectedEscenario) return;
    setLoading(true);
    setHeatmapLoading(true);
    setError(null);
    setResult(null);
    clearHeatmap();

    try {
      const res = await fetch('/api/v1/escenarios/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          escenarioId: selectedEscenario,
          intensidad,
          ...(departamento.trim() ? { departamento: departamento.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }

      const data = (await res.json()) as ScenarioResult;
      setResult(data);

      if (data.zonas_afectadas.length > 0) {
        const max = Math.max(...data.zonas_afectadas.map((z) => z.count));
        setHeatmap(
          data.zonas_afectadas.map((z) => ({
            departamento: z.departamento,
            distrito: z.distrito,
            count: z.count,
          })),
          max,
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHeatmapLoading(false);
    }
  };

  const handleClose = () => {
    clearHeatmap();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="absolute right-4 top-16 bottom-10 z-20 w-80 overflow-y-auto rounded-2xl flex flex-col gap-3 p-4"
      style={{
        background: 'rgba(9,9,11,0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Crosshair size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-white">Escenarios de Riesgo</span>
        </div>
        <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Scenario cards */}
      <div className="shrink-0">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Tipo de evento</p>
        <div className="grid grid-cols-3 gap-1.5">
          {tipos.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedEscenario(t.id)}
              title={t.descripcion}
              className="flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-all"
              style={{
                background: selectedEscenario === t.id
                  ? 'rgba(139,92,246,0.25)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedEscenario === t.id ? '#8b5cf6' : 'rgba(255,255,255,0.06)'}`,
                color: selectedEscenario === t.id ? 'white' : 'oklch(0.55 0 0)',
              }}
            >
              <span className="text-lg leading-none">{t.icono}</span>
              <span className="text-[9px] font-medium leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div className="shrink-0">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Intensidad</p>
        <div className="flex gap-1.5">
          {INTENSIDADES.map((i) => (
            <button
              key={i.id}
              onClick={() => setIntensidad(i.id)}
              className="flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all"
              style={{
                background: intensidad === i.id ? i.color + '33' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${intensidad === i.id ? i.color : 'rgba(255,255,255,0.06)'}`,
                color: intensidad === i.id ? i.color : 'oklch(0.55 0 0)',
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {/* Departamento filter */}
      <div className="shrink-0">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Departamento (opcional)</p>
        <input
          value={departamento}
          onChange={(e) => setDepartamento(e.target.value.toUpperCase())}
          placeholder="Ej. CUSCO"
          className="w-full rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none transition-colors"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>

      {/* Analyze button */}
      <button
        onClick={analyze}
        disabled={loading || !selectedEscenario}
        className="shrink-0 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-40"
        style={{
          background: selectedEscenario ? '#8b5cf6' : 'rgba(139,92,246,0.3)',
          color: 'white',
        }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
        Analizar escenario
      </button>

      {error && (
        <p className="shrink-0 rounded-lg px-3 py-2 text-xs text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-zinc-500">Eventos históricos</p>
              <p className="text-lg font-bold text-white">{result.resumen_estadistico.total_historico.toLocaleString()}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-zinc-500">Zonas en riesgo</p>
              <p className="text-lg font-bold text-white">{result.total_zonas}</p>
            </div>
          </div>

          {/* AI commentary */}
          {result.commentary ? (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex items-center gap-1.5">
                <Bot size={12} className="text-violet-400" />
                <span className="text-[10px] font-medium text-violet-400">Análisis IA</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">{result.commentary}</p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <BotOff size={11} className="text-zinc-600" />
              <span className="text-[10px] text-zinc-600">Fallback estadístico (IA no disponible)</span>
            </div>
          )}

          {/* Top zones */}
          {result.zonas_afectadas.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                Top zonas afectadas ({result.zonas_afectadas.length})
              </p>
              <div className="flex flex-col gap-1">
                {result.zonas_afectadas.slice(0, 12).map((z, i) => {
                  const max = result.zonas_afectadas[0].promedio_anual || 1;
                  const pct = Math.round((z.promedio_anual / max) * 100);
                  const coords = getCoords(z.departamento, z.distrito);
                  return (
                    <button
                      key={i}
                      onClick={() => coords && setFlyTarget(coords)}
                      className="flex flex-col gap-0.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                      title={coords ? `Ir a ${z.distrito}` : undefined}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <MapPin size={9} style={{ color: NIVEL_COLOR[z.nivel], flexShrink: 0 }} />
                          <span className="text-[10px] text-zinc-300 truncate max-w-[130px]">
                            {z.distrito}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              background: NIVEL_COLOR[z.nivel] + '22',
                              color: NIVEL_COLOR[z.nivel],
                            }}
                          >
                            {z.nivel}
                          </span>
                          <span className="text-[10px] text-zinc-400 tabular-nums">{z.promedio_anual}/año</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: NIVEL_COLOR[z.nivel] }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
