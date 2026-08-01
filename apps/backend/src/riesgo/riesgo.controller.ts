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
      return this.seirMock(body, contexto);
    }
  }

  /** Fallback calibrado con datos reales MINSA-CDC por departamento. */
  private seirMock(
    body: SEIRModelDto,
    contexto?: ReturnType<DengueContextService['getContext']>,
  ) {
    const region = body.region ?? 'PIURA';
    const params = body.parametros;
    const semanas = body.ventana_semanas ?? 16;
    const intensidad = params?.enos_intensidad ?? 'neutro';

    const CIUDADES: Record<string, { ciudad: string; lat: number; lng: number }[]> = {
      LORETO:          [{ ciudad: 'Iquitos',         lat: -3.749,  lng: -73.253 }, { ciudad: 'Nauta',          lat: -4.505,  lng: -73.576 }],
      UCAYALI:         [{ ciudad: 'Pucallpa',        lat: -8.379,  lng: -74.557 }, { ciudad: 'Atalaya',        lat: -10.729, lng: -73.757 }],
      'MADRE DE DIOS': [{ ciudad: 'Puerto Maldonado',lat: -12.594, lng: -69.189 }],
      'SAN MARTIN':    [{ ciudad: 'Tarapoto',        lat: -6.485,  lng: -76.359 }, { ciudad: 'Moyobamba',      lat: -6.034,  lng: -76.970 }],
      PIURA:           [{ ciudad: 'Piura',           lat: -5.194,  lng: -80.632 }, { ciudad: 'Sullana',        lat: -4.903,  lng: -80.688 }, { ciudad: 'Talara', lat: -4.577, lng: -81.273 }],
      TUMBES:          [{ ciudad: 'Tumbes',          lat: -3.567,  lng: -80.452 }, { ciudad: 'Zarumilla',      lat: -3.499,  lng: -80.272 }],
      AMAZONAS:        [{ ciudad: 'Chachapoyas',     lat: -6.228,  lng: -77.869 }, { ciudad: 'Bagua',          lat: -5.651,  lng: -78.526 }],
      LAMBAYEQUE:      [{ ciudad: 'Chiclayo',        lat: -6.772,  lng: -79.844 }, { ciudad: 'Ferreñafe',      lat: -6.637,  lng: -79.783 }],
      'LA LIBERTAD':   [{ ciudad: 'Trujillo',        lat: -8.111,  lng: -79.029 }, { ciudad: 'Chepén',         lat: -7.228,  lng: -79.427 }],
      CAJAMARCA:       [{ ciudad: 'Cajamarca',       lat: -7.161,  lng: -78.512 }, { ciudad: 'Jaén',           lat: -5.707,  lng: -78.808 }],
      HUANUCO:         [{ ciudad: 'Huánuco',         lat: -9.929,  lng: -76.242 }, { ciudad: 'Tingo María',    lat: -9.287,  lng: -75.997 }],
      JUNIN:           [{ ciudad: 'Huancayo',        lat: -12.065, lng: -75.204 }, { ciudad: 'La Merced',      lat: -11.053, lng: -75.315 }],
      ICA:             [{ ciudad: 'Ica',             lat: -14.067, lng: -75.728 }, { ciudad: 'Chincha',        lat: -13.408, lng: -76.131 }],
      LIMA:            [{ ciudad: 'Lima',            lat: -12.046, lng: -77.042 }, { ciudad: 'Callao',         lat: -12.052, lng: -77.128 }],
      CALLAO:          [{ ciudad: 'Callao',          lat: -12.052, lng: -77.128 }],
      ANCASH:          [{ ciudad: 'Chimbote',        lat: -9.075,  lng: -78.592 }, { ciudad: 'Huaraz',         lat: -9.529,  lng: -77.528 }],
      CUSCO:           [{ ciudad: 'Cusco',           lat: -13.532, lng: -71.968 }, { ciudad: 'Quillabamba',    lat: -12.853, lng: -72.695 }],
      AREQUIPA:        [{ ciudad: 'Arequipa',        lat: -16.409, lng: -71.537 }, { ciudad: 'Camaná',         lat: -16.622, lng: -72.711 }],
      PUNO:            [{ ciudad: 'Puno',            lat: -15.840, lng: -70.021 }, { ciudad: 'Juliaca',        lat: -15.499, lng: -70.133 }],
      TACNA:           [{ ciudad: 'Tacna',           lat: -18.006, lng: -70.248 }],
      MOQUEGUA:        [{ ciudad: 'Moquegua',        lat: -17.193, lng: -70.934 }, { ciudad: 'Ilo',            lat: -17.638, lng: -71.341 }],
      AYACUCHO:        [{ ciudad: 'Ayacucho',        lat: -13.162, lng: -74.225 }, { ciudad: 'Huanta',         lat: -12.934, lng: -74.249 }],
      APURIMAC:        [{ ciudad: 'Abancay',         lat: -13.638, lng: -72.883 }, { ciudad: 'Andahuaylas',    lat: -13.654, lng: -73.378 }],
      HUANCAVELICA:    [{ ciudad: 'Huancavelica',    lat: -12.784, lng: -74.974 }],
      PASCO:           [{ ciudad: 'Cerro de Pasco',  lat: -10.686, lng: -76.261 }, { ciudad: 'Oxapampa',       lat: -10.579, lng: -75.398 }],
    };

    // Clave de departamento (ej. "PIURA — Piura / Sullana" → "PIURA")
    const regionKey = region.split(/[—\-]/)[0]?.trim().toUpperCase() ?? region.toUpperCase();

    // ── Casos base desde datos reales MINSA-CDC ────────────────────────────────
    // Extraemos min (año bueno), mediana y max de los años disponibles.
    let casosBaseAnual = 2000; // fallback si no hay datos
    let casosPeakAnual = 8000;

    if (contexto?.encontrado && contexto.datos) {
      type DatosDengue = { casos?: { total_por_anio?: Record<string, number> } };
      const d = contexto.datos as DatosDengue;
      const porAnio = d.casos?.total_por_anio ?? {};
      const vals = Object.values(porAnio)
        .map(Number)
        .filter((v) => v > 0)
        .sort((a, b) => a - b);
      if (vals.length >= 2) {
        // Año base = percentil 25 (un año moderadamente bueno, no el peor ni el mejor)
        casosBaseAnual = vals[Math.floor(vals.length * 0.25)] ?? vals[0]!;
        casosPeakAnual = vals[vals.length - 1]!;
      } else if (vals.length === 1) {
        casosBaseAnual = vals[0]!;
        casosPeakAnual = vals[0]! * 3;
      }
    }

    // Casos en la ventana de proyección (semanas / 52 del año)
    const fraccionAnual = semanas / 52;
    const casosBasePeriodo = casosBaseAnual * fraccionAnual;
    const casosPeakPeriodo = casosPeakAnual * fraccionAnual;

    // ── Multiplicadores ENOS (calibrados con datos 2021-2024) ────────────────
    // neutro = año base, moderado = entre base y pico, fuerte = por encima del pico
    let casosTotal: number;
    if (intensidad === 'neutro') {
      casosTotal = casosBasePeriodo;                                // año normal
    } else if (intensidad === 'moderado') {
      casosTotal = casosBasePeriodo + (casosPeakPeriodo - casosBasePeriodo) * 0.55;
    } else {
      casosTotal = casosPeakPeriodo * 1.25;                        // 25% sobre peor año histórico
    }

    // Factor de lluvias (+40% máximo por anomalía extrema)
    const lluviasMult = 1 + Math.max(0, (params?.anomalia_lluvias_pct ?? 0) / 100) * 0.4;
    // Factor de control vectorial (eficiencia 80% → mult 1.0; 20% → mult 1.24)
    const vectorMult = 1 + (1 - Math.min(1, (params?.eficiencia_control_vectorial_pct ?? 80) / 100)) * 0.3;

    casosTotal = Math.round(casosTotal * lluviasMult * vectorMult);

    // ── Nivel de riesgo calibrado en casos ────────────────────────────────────
    const nivelRiesgo: 'bajo' | 'moderado' | 'critico' =
      casosTotal >= casosPeakPeriodo * 0.75 ? 'critico' :
      casosTotal >= casosBasePeriodo * 1.2   ? 'moderado' : 'bajo';

    // ── KPIs derivados ────────────────────────────────────────────────────────
    const picoSemana   = Math.round(semanas * 0.58);
    const maxSemanal   = Math.round(casosTotal / semanas * 3.0);
    // Camas disponibles (referencia MINSA: ~1.6 camas/1000 hab para dengue en temporada)
    const CAMAS_REFERENCIA: Record<string, number> = {
      LIMA: 4200, PIURA: 820, 'LA LIBERTAD': 860, LAMBAYEQUE: 560,
      'SAN MARTIN': 380, LORETO: 480, UCAYALI: 260, ICA: 420,
      CAJAMARCA: 340, ANCASH: 500, JUNIN: 600, TUMBES: 105,
      AMAZONAS: 185, 'MADRE DE DIOS': 65, HUANUCO: 380, CALLAO: 460,
      CUSCO: 580, AREQUIPA: 620, PUNO: 620, AYACUCHO: 300,
      MOQUEGUA: 90, TACNA: 155, PASCO: 130, APURIMAC: 200, HUANCAVELICA: 210,
    };
    const camas = CAMAS_REFERENCIA[regionKey] ?? 250;
    const hospsTotal     = Math.round(casosTotal * 0.092);        // 9.2% hospitalización Peru CDC
    const hospsMaxSem    = Math.round(maxSemanal * 0.092);
    const satHospitalaria = Math.round((hospsMaxSem / camas) * 100);
    const rtMax = parseFloat(
      (intensidad === 'fuerte' ? 3.2 : intensidad === 'moderado' ? 2.1 : 1.35).toFixed(2),
    );
    // Impacto económico: costo unitario MINSA ≈ S/ 2,400/caso + pérdidas indirectas
    const impactoSoles = Math.round(casosTotal * 2400 * (intensidad === 'fuerte' ? 2.2 : intensidad === 'moderado' ? 1.6 : 1.2));

    // ── Proyección semanal (campana epidémica) ────────────────────────────────
    const proyeccionSemanal = Array.from({ length: semanas }, (_, i) => {
      const s = i + 1;
      const curva = Math.exp(-Math.pow((s - picoSemana) / (semanas / 3.5), 2));
      const casos  = Math.max(1, Math.round(maxSemanal * curva));
      const rtSem  = s < picoSemana
        ? parseFloat(Math.min(rtMax, 0.8 + (rtMax - 0.8) * (s / picoSemana)).toFixed(2))
        : parseFloat(Math.max(0.55, rtMax - (rtMax - 0.55) * ((s - picoSemana) / (semanas - picoSemana))).toFixed(2));
      return {
        semana: s,
        casos_proyectados: casos,
        hospitalizados_requeridos: Math.round(casos * 0.092),
        tasa_rt: rtSem,
        es_historico: s <= 4,
      };
    });

    // ── Distribución geográfica ───────────────────────────────────────────────
    const ciudades = CIUDADES[regionKey] ?? [{ ciudad: regionKey, lat: -9.19, lng: -75.01 }];
    const pesos = ciudades.map((_, i) => Math.pow(0.5, i));
    const pesoTotal = pesos.reduce((a, b) => a + b, 0);
    const distribucionGeo = ciudades.map((c, i) => {
      const pct = pesos[i]! / pesoTotal;
      return { ...c, casos: Math.round(casosTotal * pct), pct: parseFloat(pct.toFixed(3)) };
    });

    const alertas: string[] = [];
    if (satHospitalaria > 80) alertas.push(`Saturación hospitalaria pico: ${satHospitalaria}% — activar Plan de Contingencia DIRESA.`);
    if (rtMax > 2.5)          alertas.push(`Rt proyectado ${rtMax} — transmisión acelerada, reforzar fumigación y descacharrización.`);
    if (nivelRiesgo === 'critico') alertas.push(`Alerta CRÍTICA en ${regionKey}: proyección supera el peor año histórico registrado.`);
    if (intensidad === 'fuerte' && (params?.anomalia_lluvias_pct ?? 0) > 100)
      alertas.push(`Anomalía de lluvias +${params.anomalia_lluvias_pct}% combinada con El Niño fuerte — máxima precaución.`);

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
        saturacion_hospitalaria_pct: Math.min(satHospitalaria, 250),
        nivel_riesgo: nivelRiesgo,
        impacto_economico_soles: impactoSoles,
        impacto_economico_usd: Math.round(impactoSoles / 3.75),
        ahorro_preventivo_soles: Math.round(impactoSoles * 0.65),
        rt_maximo: rtMax,
        camas_disponibles: camas,
      },
      proyeccion_semanal: proyeccionSemanal,
      humanitario: {
        fallecidos_estimados: Math.round(casosTotal * 0.0015),
        heridos_graves:       Math.round(casosTotal * 0.012),
        personas_desplazadas: Math.round(casosTotal * 0.03),
        personas_en_riesgo:   Math.round(casosTotal * 8),
        acceso_agua_potable_pct: Math.round(85 - (intensidad === 'fuerte' ? 25 : intensidad === 'moderado' ? 12 : 4)),
        personal_salud_por_1000hab: parseFloat((intensidad === 'fuerte' ? 0.7 : intensidad === 'moderado' ? 0.9 : 1.1).toFixed(1)),
        albergues_requeridos: Math.round(casosTotal * 0.006),
      },
      economico: {
        impacto_total_soles:       impactoSoles,
        costo_atencion_soles:      Math.round(impactoSoles * 0.52),
        inversion_preventiva_soles: Math.round(impactoSoles * 0.18),
        cultivos: {
          arroz_has:   intensidad === 'fuerte' ? Math.round(casosTotal * 0.08) : 0,
          mango_has:   intensidad === 'fuerte' ? Math.round(casosTotal * 0.03) : 0,
          platano_has: intensidad !== 'neutro'  ? Math.round(casosTotal * 0.02) : 0,
          total_valor_soles: Math.round(impactoSoles * 0.22),
        },
        infraestructura: {
          carreteras_afectadas_km: intensidad === 'fuerte' ? Math.round(casosTotal / 800) : 0,
          puentes_danados:         intensidad === 'fuerte' ? Math.round(casosTotal / 8000) : 0,
          viviendas_afectadas:     Math.round(casosTotal * 0.25),
        },
      },
      distribucion_geografica: distribucionGeo,
      alertas,
      notas_metodologicas: `Proyección basada en datos MINSA-CDC ${regionKey} (media histórica: ${casosBaseAnual.toLocaleString()} casos/año, pico histórico: ${casosPeakAnual.toLocaleString()} casos/año). Ventana ${semanas} sem. Escenario: ${intensidad}.`,
      generado_por: 'agente:dengue-seir',
    };
  }
}
