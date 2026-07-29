/**
 * Fila cruda del CSV INDECI — todos los valores son strings tal como
 * salen del parser; la conversión de tipos ocurre en el use case.
 */
export interface RawReporteRow {
  fecha?: string;
  hora?: string;
  anio: string;
  mes?: string;
  semana_epi?: string;
  tipo_reporte?: string;
  num_reporte?: string;
  secuencia?: string;
  es_ultimo_reporte?: string;
  evento: string;
  familia_evento?: string;
  departamento: string;
  distrito?: string;
  titulo?: string;
  id_evento?: string;
  url_detalle?: string;
  url_pdf?: string;
  tiene_pdf?: string;
  url_icono?: string;
  color_fondo?: string;
  pagina?: string;
  duplicado?: string;
  parse_ok?: string;
  notas?: string;
}

export interface ICSVParser {
  parse(buffer: Buffer): Promise<RawReporteRow[]>;
}

export const CSV_PARSER_PORT = Symbol('ICSVParser');
