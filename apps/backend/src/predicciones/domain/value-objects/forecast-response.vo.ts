import { InvalidForecastResponseException } from '../exceptions/prediccion.exceptions';

// ─── Tipos públicos (frontend los consume tal cual) ──────────────────────────

export type NivelRiesgoGlobal = 'ALTO' | 'MEDIO' | 'BAJO';

export type TipoAlerta =
  | 'DESABASTECIMIENTO'
  | 'LLUVIAS_EXTREMAS'
  | 'INUNDACION'
  | 'MOVIMIENTO_MASA';

export interface AlertaMapa {
  departamento: string;
  distrito?: string | null;
  tipo_alerta: TipoAlerta;
  severidad: number;              // 1–5
  probabilidad_porcentaje: number; // 0–100
  descripcion: string;
  acciones_sugeridas: string[];
}

export interface ForecastResponse {
  analisis_general: string;
  nivel_riesgo_global: NivelRiesgoGlobal;
  alertas_mapa: AlertaMapa[];
}

// ─── Constantes de validación ─────────────────────────────────────────────────

const NIVELES_RIESGO: NivelRiesgoGlobal[] = ['ALTO', 'MEDIO', 'BAJO'];

const TIPOS_ALERTA: TipoAlerta[] = [
  'DESABASTECIMIENTO',
  'LLUVIAS_EXTREMAS',
  'INUNDACION',
  'MOVIMIENTO_MASA',
];

// ─── Parser + validador ───────────────────────────────────────────────────────

/**
 * Parsea la cadena devuelta por el LLM y la valida contra la interfaz
 * ForecastResponse. Lanza InvalidForecastResponseException si no cumple.
 *
 * Tolera bloques Markdown ```json ... ``` que algunos modelos insertan
 * aunque el prompt lo prohíba explícitamente.
 */
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
      `No es JSON válido. Inicio de respuesta: "${raw.slice(0, 120)}"`,
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

  return {
    analisis_general: d['analisis_general'] as string,
    nivel_riesgo_global: d['nivel_riesgo_global'] as NivelRiesgoGlobal,
    alertas_mapa: alertas,
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

  if (!TIPOS_ALERTA.includes(al['tipo_alerta'] as TipoAlerta)) {
    throw new InvalidForecastResponseException(
      `${ctx}.tipo_alerta inválido: "${al['tipo_alerta']}". Valores: ${TIPOS_ALERTA.join(', ')}`,
    );
  }

  const sev = Number(al['severidad']);
  if (!Number.isInteger(sev) || sev < 1 || sev > 5) {
    throw new InvalidForecastResponseException(`${ctx}.severidad debe ser entero 1–5`);
  }

  const prob = Number(al['probabilidad_porcentaje']);
  if (!Number.isInteger(prob) || prob < 0 || prob > 100) {
    throw new InvalidForecastResponseException(
      `${ctx}.probabilidad_porcentaje debe ser entero 0–100`,
    );
  }

  if (!Array.isArray(al['acciones_sugeridas']) || al['acciones_sugeridas'].length === 0) {
    throw new InvalidForecastResponseException(
      `${ctx}.acciones_sugeridas debe ser un array no vacío`,
    );
  }

  return {
    departamento: al['departamento'] as string,
    distrito: typeof al['distrito'] === 'string' ? al['distrito'] : null,
    tipo_alerta: al['tipo_alerta'] as TipoAlerta,
    severidad: sev,
    probabilidad_porcentaje: prob,
    descripcion: typeof al['descripcion'] === 'string' ? al['descripcion'] : '',
    acciones_sugeridas: (al['acciones_sugeridas'] as unknown[]).filter(
      (s): s is string => typeof s === 'string',
    ),
  };
}
