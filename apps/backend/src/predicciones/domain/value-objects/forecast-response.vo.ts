import { InvalidForecastResponseException } from '../exceptions/prediccion.exceptions';

// ─── Enums compartidos con frontend ──────────────────────────────────────────

export type NivelRiesgoGlobal = 'ALTO' | 'MEDIO' | 'BAJO';

export type TipoAlerta =
  // Tipos de pronóstico IA
  | 'DESABASTECIMIENTO'
  | 'LLUVIAS_EXTREMAS'
  | 'INUNDACION'
  | 'MOVIMIENTO_MASA'
  | 'SALUD_PUBLICA'
  | 'AGUA_SANEAMIENTO'
  // Familias reales INDECI
  | 'HIDROMETEOROLOGICO'
  | 'MOVIMIENTO_DE_MASA'
  | 'BAJAS_TEMPERATURAS'
  | 'INCENDIO'
  | 'GEOFISICO'
  | 'BIOLOGICO'
  | 'ANTROPICO'
  | 'TECNOLOGICO';

export type ChartTipo = 'BAR' | 'LINE' | 'PIE';

export type Tendencia = 'UP' | 'DOWN' | 'STABLE';

// ─── Interfaces de charts ─────────────────────────────────────────────────────

export interface ChartDato {
  label: string;
  valor: number;
}

export interface ChartData {
  tipo: ChartTipo;
  titulo: string;
  unidad?: string;
  datos: ChartDato[];
}

export interface MetricaClave {
  label: string;
  valor: string;
  tendencia?: Tendencia;
}

// ─── Respuesta principal ──────────────────────────────────────────────────────

export interface AlertaMapa {
  departamento: string;
  distrito?: string | null;
  tipo_alerta: TipoAlerta;
  severidad: number;               // 1–5
  probabilidad_porcentaje: number; // 0–100
  descripcion: string;
  acciones_sugeridas: string[];
}

export interface ForecastResponse {
  analisis_general: string;
  nivel_riesgo_global: NivelRiesgoGlobal;
  alertas_mapa: AlertaMapa[];
  charts: ChartData[];
  metricas_clave: MetricaClave[];
}

// ─── Constantes de validación ─────────────────────────────────────────────────

const NIVELES_RIESGO: NivelRiesgoGlobal[] = ['ALTO', 'MEDIO', 'BAJO'];

const TIPOS_ALERTA: TipoAlerta[] = [
  'DESABASTECIMIENTO', 'LLUVIAS_EXTREMAS', 'INUNDACION', 'MOVIMIENTO_MASA',
  'SALUD_PUBLICA', 'AGUA_SANEAMIENTO',
  'HIDROMETEOROLOGICO', 'MOVIMIENTO_DE_MASA', 'BAJAS_TEMPERATURAS',
  'INCENDIO', 'GEOFISICO', 'BIOLOGICO', 'ANTROPICO', 'TECNOLOGICO',
];

const CHART_TIPOS: ChartTipo[] = ['BAR', 'LINE', 'PIE'];
const TENDENCIAS: Tendencia[] = ['UP', 'DOWN', 'STABLE'];

// ─── Parser principal ─────────────────────────────────────────────────────────

export function parseForecastResponse(raw: string): ForecastResponse {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new InvalidForecastResponseException(
      `No es JSON válido. Inicio: "${raw.slice(0, 120)}"`,
    );
  }

  return validateForecastResponse(parsed);
}

function validateForecastResponse(data: unknown): ForecastResponse {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new InvalidForecastResponseException('La raíz no es un objeto JSON');
  }

  const d = data as Record<string, unknown>;

  if (typeof d['analisis_general'] !== 'string' || !d['analisis_general'].trim()) {
    throw new InvalidForecastResponseException('Campo analisis_general requerido (string)');
  }

  if (!NIVELES_RIESGO.includes(d['nivel_riesgo_global'] as NivelRiesgoGlobal)) {
    throw new InvalidForecastResponseException(
      `nivel_riesgo_global debe ser ALTO, MEDIO o BAJO. Recibido: "${d['nivel_riesgo_global']}"`,
    );
  }

  if (!Array.isArray(d['alertas_mapa'])) {
    throw new InvalidForecastResponseException('alertas_mapa debe ser un array');
  }

  const alertas = (d['alertas_mapa'] as unknown[]).map((a, i) => validateAlerta(a, i));

  // charts y metricas_clave son opcionales pero se normaliza a array vacío
  const charts = Array.isArray(d['charts']) ? parseCharts(d['charts'] as unknown[]) : [];
  const metricas_clave = Array.isArray(d['metricas_clave'])
    ? parseMetricas(d['metricas_clave'] as unknown[])
    : [];

  return {
    analisis_general: d['analisis_general'] as string,
    nivel_riesgo_global: d['nivel_riesgo_global'] as NivelRiesgoGlobal,
    alertas_mapa: alertas,
    charts,
    metricas_clave,
  };
}

function validateAlerta(a: unknown, index: number): AlertaMapa {
  const ctx = `alertas_mapa[${index}]`;

  if (!a || typeof a !== 'object' || Array.isArray(a)) {
    throw new InvalidForecastResponseException(`${ctx} no es un objeto`);
  }

  const al = a as Record<string, unknown>;

  if (typeof al['departamento'] !== 'string' || !al['departamento'].trim()) {
    throw new InvalidForecastResponseException(`${ctx}.departamento requerido`);
  }

  // Si el tipo no es válido, degradar a HIDROMETEOROLOGICO en lugar de lanzar
  const tipo = TIPOS_ALERTA.includes(al['tipo_alerta'] as TipoAlerta)
    ? (al['tipo_alerta'] as TipoAlerta)
    : 'HIDROMETEOROLOGICO';

  const sev = Number(al['severidad']);
  const severidad = Number.isInteger(sev) && sev >= 1 && sev <= 5 ? sev : 3;

  const prob = Number(al['probabilidad_porcentaje']);
  const probabilidad_porcentaje = Number.isInteger(prob) && prob >= 0 && prob <= 100 ? prob : 50;

  const acciones = Array.isArray(al['acciones_sugeridas'])
    ? (al['acciones_sugeridas'] as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];

  return {
    departamento: (al['departamento'] as string).toUpperCase(),
    distrito: typeof al['distrito'] === 'string' ? al['distrito'].toUpperCase() : null,
    tipo_alerta: tipo,
    severidad,
    probabilidad_porcentaje,
    descripcion: typeof al['descripcion'] === 'string' ? al['descripcion'] : '',
    acciones_sugeridas: acciones.length > 0 ? acciones : ['Monitorear la situación'],
  };
}

// Lenient parsers — descartan entradas inválidas en lugar de lanzar
function parseCharts(raw: unknown[]): ChartData[] {
  const result: ChartData[] = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) continue;
    const chart = c as Record<string, unknown>;
    if (!CHART_TIPOS.includes(chart['tipo'] as ChartTipo)) continue;
    if (typeof chart['titulo'] !== 'string' || !chart['titulo'].trim()) continue;
    if (!Array.isArray(chart['datos'])) continue;

    const datos: ChartDato[] = (chart['datos'] as unknown[])
      .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object' && !Array.isArray(d))
      .map((d) => ({
        label: String(d['label'] ?? ''),
        valor: Number(d['valor'] ?? 0),
      }))
      .filter((d) => d.label && !isNaN(d.valor));

    if (datos.length === 0) continue;

    result.push({
      tipo: chart['tipo'] as ChartTipo,
      titulo: chart['titulo'] as string,
      unidad: typeof chart['unidad'] === 'string' ? chart['unidad'] : undefined,
      datos,
    });
  }
  return result;
}

function parseMetricas(raw: unknown[]): MetricaClave[] {
  return raw
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object' && !Array.isArray(m))
    .map((m) => ({
      label: String(m['label'] ?? ''),
      valor: String(m['valor'] ?? ''),
      tendencia: TENDENCIAS.includes(m['tendencia'] as Tendencia)
        ? (m['tendencia'] as Tendencia)
        : undefined,
    }))
    .filter((m) => m.label && m.valor);
}
