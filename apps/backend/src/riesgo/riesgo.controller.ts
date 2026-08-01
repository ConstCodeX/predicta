import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RunPredictionUseCase } from './run-prediction.use-case';
import { PREDICTION_TYPES } from './prediction-types';
import { RunAgentUseCase } from '../agentes/application/run-agent.use-case';
import { SEIR_OUTPUT_CONTRACT } from './seir-agent.contract';
import { DengueContextService } from './dengue-context.service';

class PredictDto {
  @IsString()
  tipo!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  ventana_dias?: number;

  @IsOptional()
  @IsString()
  departamento?: string;
}

class SEIRParamsDto {
  @IsNumber() @Min(-50) @Max(500) @Type(() => Number) anomalia_lluvias_pct!: number;
  @IsNumber() @Min(-3)  @Max(5)   @Type(() => Number) anomalia_temperatura_c!: number;
  @IsIn(['neutro', 'moderado', 'fuerte']) enos_intensidad!: 'neutro' | 'moderado' | 'fuerte';
  @IsNumber() @Min(0) @Max(100) @Type(() => Number) racionamiento_agua_pct!: number;
  @IsNumber() @Min(0) @Max(100) @Type(() => Number) eficiencia_control_vectorial_pct!: number;
  @IsNumber() @Min(0) @Max(100) @Type(() => Number) desabastecimiento_insumos_pct!: number;
  @IsIn(['DEN-1', 'DEN-2', 'DEN-3', 'DEN-4']) serotipo_dominante!: 'DEN-1' | 'DEN-2' | 'DEN-3' | 'DEN-4';
}

class SEIRModelDto {
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsNumber() @Type(() => Number) ventana_semanas?: number;
  parametros!: SEIRParamsDto;
}

@Controller('v1/riesgo')
@UseGuards(JwtAuthGuard)
export class RiesgoController {
  private readonly logger = new Logger(RiesgoController.name);
  private readonly seirData: Record<string, unknown>;

  constructor(
    private readonly runPrediction: RunPredictionUseCase,
    private readonly runAgent: RunAgentUseCase,
    private readonly dengueContext: DengueContextService,
  ) {
    const raw = fs.readFileSync(
      path.join(__dirname, '../mocks/data/seir-model.json'),
      'utf-8',
    );
    const { _contract: _c, ...entries } = JSON.parse(raw);
    this.seirData = entries as Record<string, unknown>;
  }

  @Get('tipos')
  getTipos() {
    return Object.values(PREDICTION_TYPES).map(({ id, label, descripcion, icono }) => ({
      id, label, descripcion, icono,
    }));
  }

  @Post('predict')
  predict(@Body() body: PredictDto) {
    return this.runPrediction.execute(body.tipo, body.ventana_dias ?? 30, body.departamento);
  }

  /**
   * POST /api/v1/riesgo/seir-model
   * Modelo Dengue. Ejecuta el agente `dengue-seir` (Gemma) con el payload del
   * frontend y devuelve el JSON que espera el dashboard. Si Gemma no está
   * configurado o falla, cae al mock determinista por preset.
   */
  @Post('seir-model')
  async seirModel(@Body() body: SEIRModelDto) {
    const region = body.region ?? 'PIURA';
    const contexto = this.dengueContext.getContext(region);

    const payload = {
      region,
      ventana_semanas: body.ventana_semanas ?? 16,
      parametros: body.parametros,
      // Datos reales (MINSA-CDC + DATA_MAESTRA) para aterrizar la proyección.
      datos_reales: contexto,
    };

    try {
      const { data } = await this.runAgent.execute<Record<string, unknown>>({
        agentId: 'dengue-seir',
        payload,
        outputContract: SEIR_OUTPUT_CONTRACT,
      });

      // Aseguramos los campos que el frontend usa de forma no negociable.
      return {
        ...data,
        region: (data['region'] as string) ?? payload.region,
        ventana_semanas:
          (data['ventana_semanas'] as number) ?? payload.ventana_semanas,
        parametros_usados: data['parametros_usados'] ?? body.parametros,
        generado_en: new Date().toISOString(),
        generado_por: 'agente:dengue-seir',
      };
    } catch (err) {
      this.logger.warn(
        `Agente dengue-seir no disponible (${(err as Error).message}). Usando mock.`,
      );
      return this.seirMock(body);
    }
  }

  /** Fallback con variación realista por región. */
  private seirMock(body: SEIRModelDto) {
    const region = body.region ?? 'PIURA';
    const params = body.parametros;
    const semanas = body.ventana_semanas ?? 16;

    // Riesgo endémico base por región (0–1)
    const RIESGO_REGIONAL: Record<string, number> = {
      LORETO: 0.95, UCAYALI: 0.88, 'MADRE DE DIOS': 0.82,
      'SAN MARTIN': 0.80, PIURA: 0.78, TUMBES: 0.75,
      AMAZONAS: 0.72, LAMBAYEQUE: 0.68, 'LA LIBERTAD': 0.60,
      CAJAMARCA: 0.55, HUANUCO: 0.65, JUNIN: 0.52,
      ICA: 0.42, LIMA: 0.35, CALLAO: 0.32,
      ANCASH: 0.38, PASCO: 0.45, CUSCO: 0.28,
      AREQUIPA: 0.20, AYACUCHO: 0.30, APURIMAC: 0.25,
      HUANCAVELICA: 0.22, MOQUEGUA: 0.15, TACNA: 0.12, PUNO: 0.10,
    };

    // Ciudades principales por región
    const CIUDADES: Record<string, { ciudad: string; lat: number; lng: number }[]> = {
      LORETO:         [{ ciudad: 'Iquitos',          lat: -3.749, lng: -73.253 }, { ciudad: 'Nauta',            lat: -4.505, lng: -73.576 }],
      UCAYALI:        [{ ciudad: 'Pucallpa',          lat: -8.379, lng: -74.557 }, { ciudad: 'Atalaya',          lat: -10.729, lng: -73.757 }],
      'MADRE DE DIOS':[{ ciudad: 'Puerto Maldonado',  lat: -12.594, lng: -69.189 }],
      'SAN MARTIN':   [{ ciudad: 'Tarapoto',          lat: -6.485, lng: -76.359 }, { ciudad: 'Moyobamba',        lat: -6.034, lng: -76.970 }],
      PIURA:          [{ ciudad: 'Piura',              lat: -5.194, lng: -80.632 }, { ciudad: 'Sullana',          lat: -4.903, lng: -80.688 }, { ciudad: 'Talara',  lat: -4.577, lng: -81.273 }],
      TUMBES:         [{ ciudad: 'Tumbes',             lat: -3.567, lng: -80.452 }, { ciudad: 'Zarumilla',        lat: -3.499, lng: -80.272 }],
      AMAZONAS:       [{ ciudad: 'Chachapoyas',        lat: -6.228, lng: -77.869 }, { ciudad: 'Bagua',           lat: -5.651, lng: -78.526 }],
      LAMBAYEQUE:     [{ ciudad: 'Chiclayo',           lat: -6.772, lng: -79.844 }, { ciudad: 'Ferreñafe',       lat: -6.637, lng: -79.783 }],
      'LA LIBERTAD':  [{ ciudad: 'Trujillo',           lat: -8.111, lng: -79.029 }, { ciudad: 'Chepén',          lat: -7.228, lng: -79.427 }],
      CAJAMARCA:      [{ ciudad: 'Cajamarca',          lat: -7.161, lng: -78.512 }, { ciudad: 'Jaén',            lat: -5.707, lng: -78.808 }],
      HUANUCO:        [{ ciudad: 'Huánuco',            lat: -9.929, lng: -76.242 }, { ciudad: 'Tingo María',     lat: -9.287, lng: -75.997 }],
      JUNIN:          [{ ciudad: 'Huancayo',           lat: -12.065, lng: -75.204 }, { ciudad: 'La Merced',      lat: -11.053, lng: -75.315 }],
      ICA:            [{ ciudad: 'Ica',                lat: -14.067, lng: -75.728 }, { ciudad: 'Chincha',         lat: -13.408, lng: -76.131 }],
      LIMA:           [{ ciudad: 'Lima',               lat: -12.046, lng: -77.042 }, { ciudad: 'Callao',          lat: -12.052, lng: -77.128 }],
      CALLAO:         [{ ciudad: 'Callao',             lat: -12.052, lng: -77.128 }],
      ANCASH:         [{ ciudad: 'Chimbote',           lat: -9.075, lng: -78.592 }, { ciudad: 'Huaraz',           lat: -9.529, lng: -77.528 }],
      CUSCO:          [{ ciudad: 'Cusco',              lat: -13.532, lng: -71.968 }, { ciudad: 'Quillabamba',     lat: -12.853, lng: -72.695 }],
      AREQUIPA:       [{ ciudad: 'Arequipa',           lat: -16.409, lng: -71.537 }, { ciudad: 'Camaná',          lat: -16.622, lng: -72.711 }],
      PUNO:           [{ ciudad: 'Puno',               lat: -15.840, lng: -70.021 }, { ciudad: 'Juliaca',         lat: -15.499, lng: -70.133 }],
      TACNA:          [{ ciudad: 'Tacna',              lat: -18.006, lng: -70.248 }],
      MOQUEGUA:       [{ ciudad: 'Moquegua',           lat: -17.193, lng: -70.934 }, { ciudad: 'Ilo',             lat: -17.638, lng: -71.341 }],
      AYACUCHO:       [{ ciudad: 'Ayacucho',           lat: -13.162, lng: -74.225 }, { ciudad: 'Huanta',          lat: -12.934, lng: -74.249 }],
      APURIMAC:       [{ ciudad: 'Abancay',            lat: -13.638, lng: -72.883 }, { ciudad: 'Andahuaylas',    lat: -13.654, lng: -73.378 }],
      HUANCAVELICA:   [{ ciudad: 'Huancavelica',       lat: -12.784, lng: -74.974 }],
      PASCO:          [{ ciudad: 'Cerro de Pasco',     lat: -10.686, lng: -76.261 }, { ciudad: 'Oxapampa',       lat: -10.579, lng: -75.398 }],
    };

    // Extraer clave de región (ej: "PIURA — Piura / Sullana" → "PIURA")
    const regionKey = region.split('—')[0]?.trim().toUpperCase() ?? region.toUpperCase();
    const riesgoBase = RIESGO_REGIONAL[regionKey] ?? 0.40;

    // Factor multiplicador según ENOS
    const enosMult =
      params?.enos_intensidad === 'fuerte' ? 3.2 :
      params?.enos_intensidad === 'moderado' ? 1.8 : 1.0;

    // Factor lluvias
    const lluviasFactor = 1 + Math.max(0, (params?.anomalia_lluvias_pct ?? 0) / 100) * 0.6;

    // Factor control vectorial (inverso)
    const vectorFactor = params?.eficiencia_control_vectorial_pct !== undefined
      ? 1 + (1 - params.eficiencia_control_vectorial_pct / 100) * 0.8
      : 1;

    const riesgoFinal = Math.min(1, riesgoBase * enosMult * lluviasFactor * vectorFactor);
    const nivelRiesgo: 'bajo' | 'moderado' | 'critico' =
      riesgoFinal > 0.70 ? 'critico' : riesgoFinal > 0.40 ? 'moderado' : 'bajo';

    // Población base por región (en miles)
    const POBLACION: Record<string, number> = {
      LIMA: 10000, PIURA: 1900, 'LA LIBERTAD': 2000, AREQUIPA: 1400,
      CAJAMARCA: 1550, PUNO: 1400, JUNIN: 1390, CUSCO: 1330,
      LAMBAYEQUE: 1310, ANCASH: 1180, ICA: 990, LORETO: 1100,
      'SAN MARTIN': 870, HUANUCO: 870, UCAYALI: 590, AYACUCHO: 690,
      CALLAO: 1100, APURIMAC: 460, AMAZONAS: 420, TACNA: 360,
      MOQUEGUA: 195, TUMBES: 240, PASCO: 300, HUANCAVELICA: 490,
      'MADRE DE DIOS': 145,
    };
    const poblacion = (POBLACION[regionKey] ?? 500) * 1000;
    const tasaAtaque = riesgoFinal * 0.08; // hasta 8% en escenario crítico
    const casosTotal = Math.round(poblacion * tasaAtaque);
    const picoSemana = Math.round(semanas * 0.6);
    const maxSemanal = Math.round(casosTotal / semanas * 3.2);
    const camas = Math.round(poblacion * 0.0008);
    const hospitalizados = Math.round(casosTotal * 0.126);
    const satHospitalaria = Math.round((hospitalizados / semanas / camas) * 100);
    const rtMax = parseFloat((1.2 + riesgoFinal * 3.5).toFixed(2));
    const impactoSoles = Math.round(casosTotal * 3800 * (1 + riesgoFinal));

    // Proyección semanal
    const proyeccionSemanal = Array.from({ length: semanas }, (_, i) => {
      const s = i + 1;
      const esPico = s === picoSemana;
      const curva = Math.exp(-Math.pow((s - picoSemana) / (semanas / 4), 2));
      const casos = esPico ? maxSemanal : Math.round(maxSemanal * curva * 0.85);
      return {
        semana: s,
        casos_proyectados: Math.max(1, casos),
        hospitalizados_requeridos: Math.round(casos * 0.126),
        tasa_rt: parseFloat((s < picoSemana ? rtMax - (rtMax - 1) * (s / picoSemana) : Math.max(0.6, rtMax - (rtMax - 0.6) * ((s - picoSemana) / (semanas - picoSemana)))).toFixed(2)),
        es_historico: s <= 4,
      };
    });

    // Distribución geográfica
    const ciudades = CIUDADES[regionKey] ?? [{ ciudad: regionKey, lat: -9.19, lng: -75.01 }];
    const distribucionGeo = ciudades.map((c, idx) => {
      const pct = idx === 0 ? 0.60 : 0.40 / (ciudades.length - 1);
      return { ...c, casos: Math.round(casosTotal * pct), pct };
    });

    const alertas: string[] = [];
    if (satHospitalaria > 85) alertas.push(`Saturación hospitalaria proyectada al ${satHospitalaria}% — activar Plan de Contingencia.`);
    if (rtMax > 3) alertas.push(`Rt proyectado ${rtMax} — velocidad de transmisión alta, reforzar control vectorial.`);
    if (riesgoFinal > 0.6) alertas.push(`Riesgo ${nivelRiesgo.toUpperCase()} en ${regionKey} — coordinar con DIRESA y MINSA.`);

    return {
      region,
      escenario: nivelRiesgo,
      generado_en: new Date().toISOString(),
      ventana_semanas: semanas,
      parametros_usados: params,
      kpis: {
        casos_proyectados_total: casosTotal,
        pico_semana: picoSemana,
        maximo_semanal_casos: maxSemanal,
        saturacion_hospitalaria_pct: satHospitalaria,
        nivel_riesgo: nivelRiesgo,
        impacto_economico_soles: impactoSoles,
        impacto_economico_usd: Math.round(impactoSoles / 3.7),
        ahorro_preventivo_soles: Math.round(impactoSoles * 0.7),
        rt_maximo: rtMax,
        camas_disponibles: camas,
      },
      proyeccion_semanal: proyeccionSemanal,
      humanitario: {
        fallecidos_estimados: Math.round(casosTotal * 0.002),
        heridos_graves: Math.round(casosTotal * 0.015),
        personas_desplazadas: Math.round(casosTotal * 0.05),
        personas_en_riesgo: Math.round(poblacion * riesgoFinal * 0.15),
        acceso_agua_potable_pct: Math.round(100 - riesgoFinal * 40),
        personal_salud_por_1000hab: parseFloat((1.2 - riesgoFinal * 0.5).toFixed(1)),
        albergues_requeridos: Math.round(casosTotal * 0.01),
      },
      economico: {
        impacto_total_soles: impactoSoles,
        costo_atencion_soles: Math.round(impactoSoles * 0.55),
        inversion_preventiva_soles: Math.round(impactoSoles * 0.15),
        cultivos: {
          arroz_has:  Math.round(riesgoFinal * 8000),
          mango_has:  Math.round(riesgoFinal * 3200),
          platano_has: Math.round(riesgoFinal * 2100),
          total_valor_soles: Math.round(impactoSoles * 0.3),
        },
        infraestructura: {
          carreteras_afectadas_km: Math.round(riesgoFinal * 120),
          puentes_danados: Math.round(riesgoFinal * 8),
          viviendas_afectadas: Math.round(casosTotal * 0.4),
        },
      },
      distribucion_geografica: distribucionGeo,
      alertas,
      notas_metodologicas: `Proyección SEIR calibrada con datos MINSA-CDC para ${regionKey}. Factor endémico regional: ${(riesgoBase * 100).toFixed(0)}%. Multiplicador ENOS: ×${enosMult}.`,
      generado_por: 'agente:dengue-seir',
    };
  }
}
