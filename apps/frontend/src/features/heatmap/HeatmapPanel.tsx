import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bot, Flame, Loader2, MapPin, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { SelectField } from '../../components/SelectField';
import { getCoords } from '../map/constants/peru-coords';
import { useMapStore } from '../map/store/useMapStore';

const FAMILIA_OPTIONS = [
  { value: '', label: 'Todas las familias' },
  { value: 'HIDROMETEOROLOGICO', label: 'Hidrometeorólogico' },
  { value: 'MOVIMIENTO DE MASA', label: 'Movimiento de masa' },
  { value: 'BAJAS TEMPERATURAS', label: 'Bajas temperaturas' },
  { value: 'INCENDIO', label: 'Incendio' },
  { value: 'GEOFISICO', label: 'Geofísico' },
  { value: 'BIOLOGICO', label: 'Biológico' },
  { value: 'ANTROPICO', label: 'Antrópico' },
  { value: 'TECNOLOGICO', label: 'Tecnológico' },
];

const CUR_YEAR = new Date().getFullYear();

interface HeatmapResult {
  points: { departamento: string; distrito: string; count: number }[];
  total: number;
  max: number;
  commentary: string | null;
  ai_disponible: boolean;
}

interface Props {
  token: string;
  onClose: () => void;
}

export function HeatmapPanel({ token, onClose }: Props) {
  const { setHeatmap, clearHeatmap, heatmapLoading, setHeatmapLoading, setFlyTarget } = useMapStore();

  const [familia, setFamilia] = useState('');
  const [evento, setEvento] = useState('');
  const [anioDesde, setAnioDesde] = useState('2019');
  const [anioHasta, setAnioHasta] = useState(String(CUR_YEAR));
  const [result, setResult] = useState<HeatmapResult | null>(null);
  const [error, setError] = useState('');

  const generate = useCallback(async () => {
    setHeatmapLoading(true);
    setError('');
    clearHeatmap();
    try {
      const params = new URLSearchParams();
      if (familia) params.set('familiaEvento', familia);
      if (evento) params.set('evento', evento);
      if (anioDesde) params.set('anioDesde', anioDesde);
      if (anioHasta) params.set('anioHasta', anioHasta);

      const res = await fetch(`/api/v1/emergencias/heatmap?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as HeatmapResult;
      setResult(data);
      setHeatmap(data.points, data.max);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setHeatmapLoading(false);
    }
  }, [token, familia, evento, anioDesde, anioHasta, setHeatmap, clearHeatmap, setHeatmapLoading]);

  const handleClose = () => {
    clearHeatmap();
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '0.5rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.6875rem',
    color: 'white',
    outline: 'none',
    width: 64,
    appearance: 'none',
  };

  const top10 = result ? [...result.points].slice(0, 10) : [];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="fixed top-11 right-0 z-30 flex flex-col shadow-2xl"
      style={{
        width: 420,
        height: 'calc(100vh - 2.75rem)',
        background: 'rgba(9,9,11,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Flame size={15} style={{ color: '#f97316' }} />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-bold text-white leading-none">Mapa de Calor</span>
          <span className="text-[10px] mt-0.5" style={{ color: 'oklch(0.46 0 0)' }}>
            Densidad de ocurrencias históricas por zona
          </span>
        </div>
        <button
          onClick={handleClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
          style={{ color: 'oklch(0.46 0 0)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex flex-shrink-0 flex-col gap-2.5 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Familia</span>
            <SelectField
              value={familia}
              onChange={setFamilia}
              options={FAMILIA_OPTIONS}
              placeholder="Todas"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Evento específico</span>
            <input
              type="text"
              value={evento}
              onChange={(e) => setEvento(e.target.value.toUpperCase())}
              placeholder="Ej: HUAICO"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '0.5rem',
                padding: '0.3rem 0.5rem',
                fontSize: '0.6875rem',
                color: 'white',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Año</span>
            <input
              type="number" min={2015} max={CUR_YEAR}
              value={anioDesde}
              onChange={(e) => setAnioDesde(e.target.value)}
              style={inputStyle}
            />
            <span className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>—</span>
            <input
              type="number" min={2015} max={CUR_YEAR}
              value={anioHasta}
              onChange={(e) => setAnioHasta(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            onClick={generate}
            disabled={heatmapLoading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 ml-auto flex-shrink-0"
            style={{ background: '#f97316' }}
          >
            {heatmapLoading ? <Loader2 size={12} className="animate-spin" /> : <Flame size={12} />}
            Generar
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-shrink-0 items-center gap-2 px-4 py-2.5 text-xs"
            style={{ background: 'rgba(239,68,68,0.07)', color: '#f87171' }}
          >
            <AlertCircle size={12} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {heatmapLoading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <Loader2 size={20} className="animate-spin" style={{ color: '#f97316' }} />
          <p className="text-xs" style={{ color: 'oklch(0.44 0 0)' }}>Calculando densidad…</p>
        </div>
      )}

      {/* Results */}
      {!heatmapLoading && result && (
        <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="rounded-xl p-3" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#f97316' }}>Total eventos</p>
              <p className="text-xl font-bold text-white tabular-nums mt-1">{result.total.toLocaleString('es-PE')}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.46 0 0)' }}>Máx. en 1 zona</p>
              <p className="text-xl font-bold text-white tabular-nums mt-1">{result.max.toLocaleString('es-PE')}</p>
            </div>
          </div>

          {/* AI commentary */}
          {result.commentary && (
            <div
              className="flex items-start gap-2.5 px-4 py-3 mx-4 mt-3 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}
            >
              <Bot size={13} style={{ color: '#818cf8', marginTop: 1, flexShrink: 0 }} />
              <p className="text-[11px] leading-relaxed" style={{ color: 'oklch(0.68 0 0)' }}>
                {result.commentary}
              </p>
            </div>
          )}

          {/* Top 10 districts */}
          {top10.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'oklch(0.44 0 0)' }}>
                Zonas más afectadas
              </p>
              <div className="flex flex-col gap-1.5">
                {top10.map((p, i) => {
                  const ratio = result.max > 0 ? p.count / result.max : 0;
                  const barColor = ratio > 0.7 ? '#ef4444' : ratio > 0.4 ? '#f97316' : ratio > 0.2 ? '#fbbf24' : '#60a5fa';
                  const coords = getCoords(p.departamento, p.distrito);
                  return (
                    <button
                      key={i}
                      onClick={() => coords && setFlyTarget(coords)}
                      className="flex flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                      title={coords ? `Ir a ${p.distrito}` : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={10} style={{ color: barColor, flexShrink: 0 }} />
                          <span className="text-[11px] font-medium text-white">{p.distrito}</span>
                          <span className="text-[10px]" style={{ color: 'oklch(0.50 0 0)' }}>{p.departamento}</span>
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: barColor }}>
                          {p.count.toLocaleString('es-PE')}
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${ratio * 100}%`, background: barColor }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!heatmapLoading && !result && !error && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-8 text-center">
          <Flame size={28} style={{ color: 'oklch(0.32 0 0)' }} />
          <p className="text-xs" style={{ color: 'oklch(0.44 0 0)' }}>
            Configura los filtros y pulsa <strong style={{ color: 'oklch(0.60 0 0)' }}>Generar</strong> para visualizar la densidad de eventos en el mapa.
          </p>
        </div>
      )}
    </motion.div>
  );
}
