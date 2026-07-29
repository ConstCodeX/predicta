import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IReporteRepository,
  REPORTE_REPOSITORY_PORT,
} from '../../../domain/ports/reporte.repository.port';
import { ICSVParser, CSV_PARSER_PORT, RawReporteRow } from '../../../domain/ports/csv-parser.port';
import { ReporteEmergencia } from '../../../domain/entities/reporte.entity';
import {
  UploadINDECIHistoricalDataCommand,
  UploadResult,
} from './upload-indeci-historical-data.dto';

const BATCH_SIZE = 500;

@Injectable()
export class UploadINDECIHistoricalDataUseCase {
  private readonly logger = new Logger(UploadINDECIHistoricalDataUseCase.name);

  constructor(
    @Inject(REPORTE_REPOSITORY_PORT)
    private readonly repo: IReporteRepository,
    @Inject(CSV_PARSER_PORT)
    private readonly csvParser: ICSVParser,
  ) {}

  async execute(command: UploadINDECIHistoricalDataCommand): Promise<UploadResult> {
    const rows = await this.csvParser.parse(command.fileBuffer);
    const result: UploadResult = { total: rows.length, imported: 0, discarded: 0, errors: [] };

    // ── Regla 1: descartar filas con duplicado = True
    // ── Regla 2: descartar filas con parse_ok = False
    const cleanRows = rows.filter((row) => {
      if (this.isTruthy(row.duplicado)) {
        result.discarded++;
        return false;
      }
      if (this.isFalsy(row.parse_ok)) {
        result.discarded++;
        return false;
      }
      return true;
    });

    this.logger.log(
      `CSV procesado: ${result.total} filas totales, ${result.discarded} descartadas, ${cleanRows.length} a insertar`,
    );

    const batches = this.chunk(cleanRows, BATCH_SIZE);
    let rowIndex = 0;

    for (const batch of batches) {
      const entities: ReporteEmergencia[] = [];

      for (const raw of batch) {
        rowIndex++;
        try {
          entities.push(
            ReporteEmergencia.create({
              fecha: this.parseDate(raw.fecha),
              hora: raw.hora || undefined,
              anio: parseInt(raw.anio, 10),
              mes: this.parseIntOpt(raw.mes),
              semanaEpi: this.parseIntOpt(raw.semana_epi),
              tipoReporte: raw.tipo_reporte || undefined,
              numReporte: raw.num_reporte || undefined,
              secuencia: this.parseIntOpt(raw.secuencia),
              esUltimoReporte: this.isTruthy(raw.es_ultimo_reporte),
              evento: raw.evento,
              familiaEvento: raw.familia_evento || undefined,
              departamento: raw.departamento,
              distrito: raw.distrito || undefined,
              titulo: raw.titulo || undefined,
              idEvento: raw.id_evento || undefined,
              urlDetalle: raw.url_detalle || undefined,
              urlPdf: raw.url_pdf || undefined,
              tienePdf: this.isTruthy(raw.tiene_pdf),
              urlIcono: raw.url_icono || undefined,
              colorFondo: raw.color_fondo || undefined,
              pagina: this.parseIntOpt(raw.pagina),
              // Se persisten para auditoría, aunque las filas inválidas ya fueron descartadas arriba
              duplicado: this.isTruthy(raw.duplicado),
              parseOk: !this.isFalsy(raw.parse_ok),
              notas: raw.notas || undefined,
            }),
          );
        } catch (err) {
          result.errors.push({ row: rowIndex, message: (err as Error).message });
        }
      }

      if (entities.length > 0) {
        const saved = await this.repo.saveBatch(entities);
        result.imported += saved;
        this.logger.log(`Batch guardado: ${saved} registros (fila ~${rowIndex})`);
      }
    }

    return result;
  }

  /**
   * Evalúa "True", "true", "1", "yes", "si", "s" como verdadero.
   */
  private isTruthy(value?: string): boolean {
    const v = value?.trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'si' || v === 's';
  }

  /**
   * Evalúa "False", "false", "0", "no", "n" como falso explícito.
   * Vacío/undefined se trata como "no definido" (no falso).
   */
  private isFalsy(value?: string): boolean {
    if (!value?.trim()) return false;
    const v = value.trim().toLowerCase();
    return v === 'false' || v === '0' || v === 'no' || v === 'n';
  }

  private parseDate(value?: string): Date | undefined {
    if (!value?.trim()) return undefined;
    const v = value.trim();
    // ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? undefined : d;
    }
    // Formato peruano: DD/MM/YYYY
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      const d = new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  }

  private parseIntOpt(value?: string): number | undefined {
    if (!value?.trim()) return undefined;
    const n = parseInt(value, 10);
    return isNaN(n) ? undefined : n;
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }
}
