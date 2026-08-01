export type ENOSIntensidad = 'neutro' | 'moderado' | 'fuerte';
export type Serotipo = 'DEN-1' | 'DEN-2' | 'DEN-3' | 'DEN-4';
export type NivelRiesgoSEIR = 'bajo' | 'moderado' | 'critico';

export interface SEIRParametros {
  anomalia_lluvias_pct: number;
  anomalia_temperatura_c: number;
  enos_intensidad: ENOSIntensidad;
  racionamiento_agua_pct: number;
  eficiencia_control_vectorial_pct: number;
  desabastecimiento_insumos_pct: number;
  serotipo_dominante: Serotipo;
}

export interface SEIRSemana {
  semana: number;
  casos_proyectados: number;
  hospitalizados_requeridos: number;
  tasa_rt: number;
  es_historico: boolean;
}

export interface SEIRHumanitario {
  fallecidos_estimados: number;
  heridos_graves: number;
  personas_desplazadas: number;
  personas_en_riesgo: number;
  acceso_agua_potable_pct: number;
  personal_salud_por_1000hab: number;
  albergues_requeridos: number;
}

export interface SEIREconomico {
  impacto_total_soles: number;
  costo_atencion_soles: number;
  inversion_preventiva_soles: number;
  cultivos: {
    arroz_has: number;
    mango_has: number;
    platano_has: number;
    total_valor_soles: number;
  };
  infraestructura: {
    carreteras_afectadas_km: number;
    puentes_danados: number;
    viviendas_afectadas: number;
  };
}

export interface SEIRCiudad {
  ciudad: string;
  lat: number;
  lng: number;
  casos: number;
  pct: number;
}

export interface SEIRModelResponse {
  region: string;
  escenario: string;
  generado_en: string;
  ventana_semanas: number;
  parametros_usados: SEIRParametros;
  kpis: {
    casos_proyectados_total: number;
    pico_semana: number;
    maximo_semanal_casos: number;
    saturacion_hospitalaria_pct: number;
    nivel_riesgo: NivelRiesgoSEIR;
    impacto_economico_soles: number;
    impacto_economico_usd: number;
    ahorro_preventivo_soles: number;
    rt_maximo: number;
    camas_disponibles: number;
  };
  proyeccion_semanal: SEIRSemana[];
  humanitario?: SEIRHumanitario;
  economico?: SEIREconomico;
  distribucion_geografica?: SEIRCiudad[];
  alertas: string[];
  notas_metodologicas: string;
  explicacion_pronostico?: string;
}

export const PRESETS: Record<ENOSIntensidad, SEIRParametros> = {
  neutro: {
    anomalia_lluvias_pct: 0,
    anomalia_temperatura_c: 0.5,
    enos_intensidad: 'neutro',
    racionamiento_agua_pct: 15,
    eficiencia_control_vectorial_pct: 80,
    desabastecimiento_insumos_pct: 5,
    serotipo_dominante: 'DEN-1',
  },
  moderado: {
    anomalia_lluvias_pct: 60,
    anomalia_temperatura_c: 1.5,
    enos_intensidad: 'moderado',
    racionamiento_agua_pct: 35,
    eficiencia_control_vectorial_pct: 40,
    desabastecimiento_insumos_pct: 20,
    serotipo_dominante: 'DEN-2',
  },
  fuerte: {
    anomalia_lluvias_pct: 180,
    anomalia_temperatura_c: 2.8,
    enos_intensidad: 'fuerte',
    racionamiento_agua_pct: 55,
    eficiencia_control_vectorial_pct: 20,
    desabastecimiento_insumos_pct: 45,
    serotipo_dominante: 'DEN-2',
  },
};

export const REGIONES = [
  'AMAZONAS — Chachapoyas / Bagua',
  'ANCASH — Huaraz / Chimbote',
  'APURIMAC — Abancay / Andahuaylas',
  'AREQUIPA — Arequipa / Camana',
  'AYACUCHO — Ayacucho / Huanta',
  'CAJAMARCA — Cajamarca / Jaen',
  'CALLAO — Callao',
  'CUSCO — Cusco / Quillabamba',
  'HUANCAVELICA — Huancavelica',
  'HUANUCO — Huánuco / Tingo María',
  'ICA — Ica / Chincha',
  'JUNIN — Huancayo / La Merced',
  'LA LIBERTAD — Trujillo / Chepén',
  'LAMBAYEQUE — Chiclayo / Ferreñafe',
  'LIMA — Lima Metropolitana',
  'LORETO — Iquitos / Nauta',
  'MADRE DE DIOS — Puerto Maldonado',
  'MOQUEGUA — Moquegua / Ilo',
  'PASCO — Cerro de Pasco / Oxapampa',
  'PIURA — Piura / Sullana',
  'PUNO — Puno / Juliaca',
  'SAN MARTIN — Tarapoto / Moyobamba',
  'TACNA — Tacna',
  'TUMBES — Tumbes / Zarumilla',
  'UCAYALI — Pucallpa / Atalaya',
];
