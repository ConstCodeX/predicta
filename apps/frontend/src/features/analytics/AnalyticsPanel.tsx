import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Summary {
  kpis: {
    totalReportes: number;
    conFechaExacta: number;
    pctConFecha: number;
    distritos: number;
    departamentos: number;
    duplicados: number;
    pctDuplicados: number;
    reportesSeguimiento: number;
    primerosReportes: number;
    pctSeguimiento: number;
  };
  porFamiliaEvento: { familia: string; count: number }[];
  porAnio: { anio: number; count: number }[];
  porDepartamento: { departamento: string; count: number }[];
  porMes: { mes: number; count: number }[];
}

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

function BarChart({ data, maxValue, color = 'oklch(0.60 0.18 240)' }: {
  data: { label: string; value: number }[];
  maxValue: number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {data.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-32 text-right text-[11px] truncate flex-shrink-0" style={{ color: 'oklch(0.56 0 0)' }} title={label}>
            {label}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div
              className="h-5 rounded-sm transition-all"
              style={{
                width: `${Math.round((value / maxValue) * 100)}%`,
                background: color,
                minWidth: 4,
              }}
            />
            <span className="text-[11px] tabular-nums flex-shrink-0" style={{ color: 'oklch(0.60 0 0)' }}>
              {value.toLocaleString('es-PE')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span className="text-2xl font-bold tabular-nums" style={{ color: color === 'text-white' ? 'white' : color }}>{value}</span>
      <span className="text-[11px] font-medium" style={{ color: 'oklch(0.52 0 0)' }}>{label}</span>
      {sub && <span className="text-[10px]" style={{ color: 'oklch(0.40 0 0)' }}>{sub}</span>}
    </div>
  );
}

function FindingCard({ type, title, children }: { type: 'warning' | 'info' | 'ok'; title: string; children: React.ReactNode }) {
  const styles = {
    warning: { bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)', icon: <AlertTriangle size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />, title: '#fbbf24' },
    info:    { bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.2)', icon: <Info size={13} style={{ color: 'oklch(0.60 0.18 240)', flexShrink: 0 }} />, title: 'oklch(0.60 0.18 240)' },
    ok:      { bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.2)', icon: <CheckCircle2 size={13} style={{ color: '#34d399', flexShrink: 0 }} />, title: '#34d399' },
  }[type];

  return (
    <div className="rounded-xl p-4" style={{ background: styles.bg, border: `1px solid ${styles.border}` }}>
      <div className="flex items-start gap-2 mb-2">
        {styles.icon}
        <span className="text-xs font-semibold" style={{ color: styles.title }}>{title}</span>
      </div>
      <div className="text-xs leading-relaxed ml-5" style={{ color: 'oklch(0.58 0 0)' }}>{children}</div>
    </div>
  );
}

export function AnalyticsPanel({ token }: { token: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/analytics/summary', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSummary(d as Summary))
      .catch(() => setError('No se pudieron cargar las estadísticas'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ background: 'rgba(9,9,11,0.98)' }}>
      <Loader2 size={20} className="animate-spin" style={{ color: 'oklch(0.50 0 0)' }} />
    </div>
  );

  if (error || !summary) return (
    <div className="flex h-full items-center justify-center" style={{ background: 'rgba(9,9,11,0.98)' }}>
      <p className="text-sm" style={{ color: '#f87171' }}>{error || 'Sin datos'}</p>
    </div>
  );

  const { kpis } = summary;
  const maxFamilia = Math.max(...summary.porFamiliaEvento.map((d) => d.count), 1);
  const maxAnio    = Math.max(...summary.porAnio.map((d) => d.count), 1);
  const maxDept    = Math.max(...summary.porDepartamento.slice(0, 10).map((d) => d.count), 1);
  const maxMes     = Math.max(...summary.porMes.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
      style={{ background: 'rgba(9,9,11,0.98)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
    >
      <div className="mx-auto max-w-5xl px-6 py-6 flex flex-col gap-8">

        {/* Header */}
        <div>
          <h2 className="text-base font-bold text-white">Análisis Exploratorio · Datos INDECI/COEN</h2>
          <p className="mt-1 text-xs" style={{ color: 'oklch(0.46 0 0)' }}>
            {kpis.totalReportes.toLocaleString('es-PE')} reportes scrapeados · {kpis.pctConFecha}% con fecha exacta · generado al vuelo desde la BD
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="reportes totales" value={kpis.totalReportes.toLocaleString('es-PE')} />
          <KpiCard label="con fecha exacta" value={`${kpis.pctConFecha}%`} sub={`${kpis.conFechaExacta.toLocaleString('es-PE')} filas`} color="oklch(0.65 0.17 145)" />
          <KpiCard label="distritos con reportes" value={kpis.distritos.toLocaleString('es-PE')} />
          <KpiCard label="departamentos" value={String(kpis.departamentos)} />
        </div>

        {/* Findings */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.40 0 0)' }}>Hallazgos clave</h3>

          {kpis.totalReportes > 0 && (
            <FindingCard type="warning" title="Una fila no es una emergencia">
              El {kpis.pctSeguimiento}% de las filas ({kpis.reportesSeguimiento.toLocaleString('es-PE')}) son reportes de seguimiento
              (Reporte N.° 2, N.° 3…). Contar filas equivale a contar documentos publicados, no desastres.
              Solo hay ~{kpis.primerosReportes.toLocaleString('es-PE')} primeros reportes (secuencia = 1)
              como proxy de emergencias únicas.
            </FindingCard>
          )}

          <FindingCard type="warning" title='"Bajas temperaturas" mezcla dos estaciones opuestas'>
            La familia BAJAS TEMPERATURAS incluye GRANIZADA (fenómeno convectivo de temporada de lluvias,
            pica dic-mar) junto a HELADA y FRIAJE (pico jun-ago). Usarlas juntas distorsiona cualquier
            análisis estacional. Filtra por evento: HELADA, FRIAJE, DESCENSO DE TEMPERATURA para el frío andino.
          </FindingCard>

          <FindingCard type="info" title="Coocurrencia lluvia-huaico, pero sin rezago temporal">
            Los datos muestran asociación lluvia-huaico (8.88× el nivel basal el mismo día), pero la distribución
            es simétrica (lluvia antes ≈ lluvia después). Esto indica agrupamiento estacional, no un encadenamiento
            con retardo. Para predicción real hace falta precipitación continua de Open-Meteo, no los avisos de INDECI.
          </FindingCard>

          <FindingCard type="ok" title="Estacionalidad muy marcada — base sólida para predicción">
            Movimiento de masa: pico en marzo (9.4× vs agosto). Incendio: pico en septiembre (6.4× vs marzo).
            Hidrometeorólogico: pico en marzo (3.8× vs agosto). Esta estacionalidad es la base del modelo predictivo.
          </FindingCard>

          <FindingCard type="ok" title="Concentración geográfica accionable">
            El 50% de todos los reportes cae en solo el ~14% de los distritos. Un sistema de alerta no necesita
            cubrir el país entero para ser útil — Predicta puede priorizar los {Math.round(kpis.distritos * 0.14)} distritos
            de mayor historial.
          </FindingCard>
        </div>

        {/* Charts row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.40 0 0)' }}>Reportes por año</h3>
            <BarChart
              data={summary.porAnio.map((d) => ({ label: String(d.anio), value: d.count }))}
              maxValue={maxAnio}
              color="oklch(0.60 0.18 240)"
            />
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.40 0 0)' }}>Distribución mensual (estacionalidad)</h3>
            <BarChart
              data={summary.porMes.map((d) => ({ label: MESES[d.mes] ?? String(d.mes), value: d.count }))}
              maxValue={maxMes}
              color="oklch(0.65 0.17 145)"
            />
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.40 0 0)' }}>Por familia de evento</h3>
            <BarChart
              data={summary.porFamiliaEvento.map((d) => ({ label: d.familia, value: d.count }))}
              maxValue={maxFamilia}
              color="oklch(0.72 0.18 70)"
            />
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.40 0 0)' }}>Top 10 departamentos</h3>
            <BarChart
              data={summary.porDepartamento.slice(0, 10).map((d) => ({ label: d.departamento, value: d.count }))}
              maxValue={maxDept}
              color="oklch(0.62 0.16 310)"
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
}
