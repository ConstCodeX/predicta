export interface ReporteEmergenciaProps {
  id?: string;
  fecha?: Date;
  hora?: string;
  anio: number;
  mes?: number;
  semanaEpi?: number;
  tipoReporte?: string;
  numReporte?: string;
  secuencia?: number;
  esUltimoReporte: boolean;
  evento: string;
  familiaEvento?: string;
  departamento: string;
  distrito?: string;
  titulo?: string;
  idEvento?: string;
  urlDetalle?: string;
  urlPdf?: string;
  tienePdf: boolean;
  urlIcono?: string;
  colorFondo?: string;
  pagina?: number;
  duplicado: boolean;
  parseOk: boolean;
  notas?: string;
  createdAt?: Date;
}

export class ReporteEmergencia {
  readonly id: string | undefined;
  readonly fecha?: Date;
  readonly hora?: string;
  readonly anio: number;
  readonly mes?: number;
  readonly semanaEpi?: number;
  readonly tipoReporte?: string;
  readonly numReporte?: string;
  readonly secuencia?: number;
  readonly esUltimoReporte: boolean;
  readonly evento: string;
  readonly familiaEvento?: string;
  readonly departamento: string;
  readonly distrito?: string;
  readonly titulo?: string;
  readonly idEvento?: string;
  readonly urlDetalle?: string;
  readonly urlPdf?: string;
  readonly tienePdf: boolean;
  readonly urlIcono?: string;
  readonly colorFondo?: string;
  readonly pagina?: number;
  readonly duplicado: boolean;
  readonly parseOk: boolean;
  readonly notas?: string;
  readonly createdAt?: Date;

  private constructor(props: ReporteEmergenciaProps) {
    Object.assign(this, props);
  }

  static create(props: ReporteEmergenciaProps): ReporteEmergencia {
    if (!props.evento?.trim()) throw new Error('evento es requerido');
    if (!props.departamento?.trim()) throw new Error('departamento es requerido');
    if (isNaN(props.anio) || props.anio < 1900 || props.anio > new Date().getFullYear() + 1) {
      throw new Error(`anio inválido: ${props.anio}`);
    }
    return new ReporteEmergencia(props);
  }

  static reconstitute(props: ReporteEmergenciaProps & { id: string }): ReporteEmergencia {
    return new ReporteEmergencia(props);
  }
}
