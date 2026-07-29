import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { ICSVParser, RawReporteRow } from '../../domain/ports/csv-parser.port';
import { CSVParseException } from '../../domain/exceptions/reporte.exceptions';

/**
 * Normaliza una cabecera de columna: minúsculas, sin acentos, espacios → _.
 * Permite que el CSV venga con "Año", "AÑO", "año", "anio", etc.
 */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}

/** Columnas conocidas con sus alias normalizados para mayor tolerancia. */
const ALIASES: Record<keyof RawReporteRow, string[]> = {
  fecha: ['fecha'],
  hora: ['hora'],
  anio: ['anio', 'ano', 'year'],
  mes: ['mes', 'month'],
  semana_epi: ['semana_epi', 'semana_epidemiologica', 'semana'],
  tipo_reporte: ['tipo_reporte', 'tiporeporte', 'tipo'],
  num_reporte: ['num_reporte', 'numero_reporte', 'numreporte', 'nro_reporte'],
  secuencia: ['secuencia'],
  es_ultimo_reporte: ['es_ultimo_reporte', 'esultimoreporte', 'ultimo_reporte'],
  evento: ['evento'],
  familia_evento: ['familia_evento', 'familiaevento', 'familia'],
  departamento: ['departamento', 'region', 'dpto', 'dep'],
  distrito: ['distrito', 'dist'],
  titulo: ['titulo', 'title'],
  id_evento: ['id_evento', 'idevento', 'id'],
  url_detalle: ['url_detalle', 'urldetalle', 'url'],
  url_pdf: ['url_pdf', 'urlpdf'],
  tiene_pdf: ['tiene_pdf', 'tienepdf'],
  url_icono: ['url_icono', 'urlicono', 'icono'],
  color_fondo: ['color_fondo', 'colorfondo', 'color'],
  pagina: ['pagina', 'page'],
  duplicado: ['duplicado'],
  parse_ok: ['parse_ok', 'parseok'],
  notas: ['notas', 'notes', 'observaciones'],
};

@Injectable()
export class IndecCSVParserAdapter implements ICSVParser {
  async parse(buffer: Buffer): Promise<RawReporteRow[]> {
    let records: Record<string, string>[];

    try {
      const delimiter = this.detectDelimiter(buffer);
      records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
        delimiter,
      }) as Record<string, string>[];
    } catch (err) {
      throw new CSVParseException((err as Error).message);
    }

    if (records.length === 0) return [];

    // Construir mapa { campo_dominio → columna_real_del_csv }
    const rawHeaders = Object.keys(records[0]);
    const headerMap = this.buildHeaderMap(rawHeaders);

    return records.map((row) => this.mapRow(row, headerMap));
  }

  private detectDelimiter(buffer: Buffer): string {
    const sample = buffer.toString('utf8', 0, 1024).split('\n')[0] ?? '';
    const commas = (sample.match(/,/g) ?? []).length;
    const semicolons = (sample.match(/;/g) ?? []).length;
    return semicolons > commas ? ';' : ',';
  }

  private buildHeaderMap(rawHeaders: string[]): Map<keyof RawReporteRow, string> {
    const normalized = rawHeaders.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
    const map = new Map<keyof RawReporteRow, string>();

    for (const [field, aliases] of Object.entries(ALIASES) as [keyof RawReporteRow, string[]][]) {
      const match = normalized.find(({ norm }) => aliases.includes(norm));
      if (match) map.set(field, match.raw);
    }

    return map;
  }

  private mapRow(
    row: Record<string, string>,
    headerMap: Map<keyof RawReporteRow, string>,
  ): RawReporteRow {
    const get = (field: keyof RawReporteRow): string | undefined => {
      const col = headerMap.get(field);
      return col !== undefined ? (row[col] || undefined) : undefined;
    };

    return {
      fecha: get('fecha'),
      hora: get('hora'),
      anio: get('anio') ?? '',
      mes: get('mes'),
      semana_epi: get('semana_epi'),
      tipo_reporte: get('tipo_reporte'),
      num_reporte: get('num_reporte'),
      secuencia: get('secuencia'),
      es_ultimo_reporte: get('es_ultimo_reporte'),
      evento: get('evento') ?? '',
      familia_evento: get('familia_evento'),
      departamento: get('departamento') ?? '',
      distrito: get('distrito'),
      titulo: get('titulo'),
      id_evento: get('id_evento'),
      url_detalle: get('url_detalle'),
      url_pdf: get('url_pdf'),
      tiene_pdf: get('tiene_pdf'),
      url_icono: get('url_icono'),
      color_fondo: get('color_fondo'),
      pagina: get('pagina'),
      duplicado: get('duplicado'),
      parse_ok: get('parse_ok'),
      notas: get('notas'),
    };
  }
}
