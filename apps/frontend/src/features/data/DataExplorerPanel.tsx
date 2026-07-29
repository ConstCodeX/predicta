import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { SelectField } from '../../components/SelectField';

interface Reporte {
  id: string;
  fecha: string | null;
  anio: number;
  mes: number | null;
  evento: string;
  familiaEvento: string | null;
  departamento: string;
  distrito: string | null;
  tipoReporte: string | null;
  secuencia: number | null;
  duplicado: boolean;
  parseOk: boolean;
}

interface PageResult {
  data: Reporte[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Props {
  token: string;
}

const FAMILIA_OPTIONS = [
  { value: 'BAJAS TEMPERATURAS', label: 'Bajas temperaturas' },
  { value: 'HIDROMETEOROLÓGICO', label: 'Hidrometeorólogico' },
  { value: 'INCENDIO', label: 'Incendio' },
  { value: 'MOVIMIENTO EN MASA', label: 'Movimiento en masa' },
  { value: 'INUNDACIÓN', label: 'Inundación' },
  { value: 'SISMO', label: 'Sismo' },
  { value: 'VIENTO', label: 'Viento' },
  { value: 'CONTAMINACIÓN', label: 'Contaminación' },
];

export function DataExplorerPanel({ token }: Props) {
  const [result, setResult] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    departamento: '',
    familiaEvento: '',
    anioDesde: '',
    anioHasta: '',
  });
  const [applied, setApplied] = useState(filters);

  const fetchData = useCallback(async (f: typeof filters, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '25' });
      if (f.departamento) params.set('departamento', f.departamento);
      if (f.familiaEvento) params.set('familiaEvento', f.familiaEvento);
      if (f.anioDesde) params.set('anioDesde', f.anioDesde);
      if (f.anioHasta) params.set('anioHasta', f.anioHasta);

      const res = await fetch(`/api/v1/emergencias?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as PageResult;
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(applied, page); }, [fetchData, applied, page]);

  const applyFilters = () => { setPage(1); setApplied({ ...filters }); };
  const clearFilters = () => { const e = { departamento: '', familiaEvento: '', anioDesde: '', anioHasta: '' }; setFilters(e); setPage(1); setApplied(e); };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    color: 'white',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.98)' }}
    >
      {/* Filter bar */}
      <div
        className="flex flex-shrink-0 items-end gap-3 flex-wrap px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-1.5 mr-1">
          <Filter size={13} style={{ color: 'oklch(0.50 0 0)' }} />
          <span className="text-xs font-semibold" style={{ color: 'oklch(0.50 0 0)' }}>Filtros</span>
        </div>

        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Departamento</label>
          <input
            value={filters.departamento}
            onChange={(e) => setFilters((f) => ({ ...f, departamento: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Ej: PIURA"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Familia de evento</label>
          <SelectField
            value={filters.familiaEvento}
            onChange={(v) => setFilters((f) => ({ ...f, familiaEvento: v }))}
            options={FAMILIA_OPTIONS}
            placeholder="Todas"
          />
        </div>

        <div className="flex flex-col gap-1 w-[90px]">
          <label className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Año desde</label>
          <input
            type="number" min="2010" max="2026"
            value={filters.anioDesde}
            onChange={(e) => setFilters((f) => ({ ...f, anioDesde: e.target.value }))}
            placeholder="2019"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1 w-[90px]">
          <label className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Año hasta</label>
          <input
            type="number" min="2010" max="2026"
            value={filters.anioHasta}
            onChange={(e) => setFilters((f) => ({ ...f, anioHasta: e.target.value }))}
            placeholder="2026"
            style={inputStyle}
          />
        </div>

        <div className="flex gap-2 pb-0.5">
          <button
            onClick={applyFilters}
            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-all"
            style={{ background: 'oklch(0.60 0.18 240)' }}
          >
            Buscar
          </button>
          <button
            onClick={clearFilters}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/5"
            style={{ color: 'oklch(0.50 0 0)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Limpiar
          </button>
        </div>

        {result && (
          <span className="ml-auto text-xs" style={{ color: 'oklch(0.44 0 0)' }}>
            {result.total.toLocaleString('es-PE')} reportes
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={18} className="animate-spin" style={{ color: 'oklch(0.50 0 0)' }} />
          </div>
        )}
        {!loading && result && (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                {['Fecha', 'Año', 'Evento', 'Familia', 'Departamento', 'Distrito', 'Tipo', 'Seq', 'Dup'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'oklch(0.46 0 0)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.map((r, i) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-2" style={{ color: 'oklch(0.62 0 0)', whiteSpace: 'nowrap' }}>
                    {r.fecha ? new Date(r.fecha).toLocaleDateString('es-PE') : '—'}
                  </td>
                  <td className="px-4 py-2 tabular-nums" style={{ color: 'oklch(0.55 0 0)' }}>{r.anio}</td>
                  <td className="px-4 py-2 max-w-[200px] truncate text-white" title={r.evento}>{r.evento}</td>
                  <td className="px-4 py-2 max-w-[160px] truncate" style={{ color: 'oklch(0.58 0 0)' }} title={r.familiaEvento ?? ''}>
                    {r.familiaEvento ?? <span style={{ color: 'oklch(0.36 0 0)' }}>—</span>}
                  </td>
                  <td className="px-4 py-2 font-medium" style={{ color: 'oklch(0.70 0 0)' }}>{r.departamento}</td>
                  <td className="px-4 py-2" style={{ color: 'oklch(0.52 0 0)' }}>{r.distrito ?? '—'}</td>
                  <td className="px-4 py-2" style={{ color: 'oklch(0.44 0 0)', whiteSpace: 'nowrap' }}>{r.tipoReporte ?? '—'}</td>
                  <td className="px-4 py-2 tabular-nums text-center" style={{ color: 'oklch(0.44 0 0)' }}>{r.secuencia ?? '—'}</td>
                  <td className="px-4 py-2 text-center">
                    {r.duplicado
                      ? <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>dup</span>
                      : <span style={{ color: 'oklch(0.36 0 0)' }}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && result?.data.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs" style={{ color: 'oklch(0.44 0 0)' }}>Sin resultados para los filtros seleccionados.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div
          className="flex flex-shrink-0 items-center justify-between px-6 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-[11px]" style={{ color: 'oklch(0.44 0 0)' }}>
            Página {result.page} de {result.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={result.page === 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-30 hover:bg-white/5"
              style={{ color: 'oklch(0.52 0 0)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <ChevronLeft size={12} /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
              disabled={result.page === result.totalPages}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-30 hover:bg-white/5"
              style={{ color: 'oklch(0.52 0 0)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              Siguiente <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
