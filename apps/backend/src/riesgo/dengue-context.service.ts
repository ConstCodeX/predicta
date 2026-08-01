import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Carga el contexto de dengue pre-agregado por departamento
 * (data/datasets/dengue_context.json, generado por scripts/build_dengue_context.py)
 * y lo entrega para inyectarlo al agente de IA.
 *
 * Regla (AGENTE_CONSULTAS.md): son datos reales de MINSA-CDC + DATA_MAESTRA.
 * Si el departamento no está, se devuelve encontrado=false y el agente debe
 * marcar los campos como sin_dato, nunca inventar.
 */
@Injectable()
export class DengueContextService {
  private readonly logger = new Logger(DengueContextService.name);
  private readonly data: Record<string, unknown> = {};

  constructor(private readonly config: ConfigService) {
    const dataDir =
      this.config.get<string>('DATA_DIR') ?? path.resolve(process.cwd(), 'data');
    const file = path.join(dataDir, 'datasets', 'dengue_context.json');

    try {
      if (fs.existsSync(file)) {
        this.data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        this.logger.log(
          `Contexto dengue cargado: ${Object.keys(this.data).length} departamentos (${file})`,
        );
      } else {
        this.logger.warn(
          `No existe ${file}. Corre: python scripts/build_dengue_context.py`,
        );
      }
    } catch (err) {
      this.logger.error(`Error leyendo dengue_context.json: ${(err as Error).message}`);
    }
  }

  /** MAYUSCULAS sin acentos. */
  private norm(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /** Extrae el departamento de una región tipo "PIURA — Piura / Sullana". */
  private departamentoDe(region: string): string {
    const head = region.split(/[—\-/]/)[0] ?? region;
    return this.norm(head);
  }

  /**
   * Devuelve el contexto de datos reales del departamento de la región.
   * Siempre incluye `encontrado` para que el agente sepa si puede confiar.
   */
  getContext(region: string): {
    departamento: string;
    encontrado: boolean;
    datos: unknown;
  } {
    const dep = this.departamentoDe(region);
    const datos = this.data[dep] ?? null;
    return { departamento: dep, encontrado: datos != null, datos };
  }
}
