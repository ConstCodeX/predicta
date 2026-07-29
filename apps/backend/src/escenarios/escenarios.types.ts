export interface EscenarioType {
  id: string;
  label: string;
  descripcion: string;
  icono: string;
  familias: string[];
  eventos: string[];
  umbrales: {
    normal: number;   // avg events/year for a "risk zone" to appear
    moderado: number; // avg events/year for moderate risk
    extremo: number;  // avg events/year OR max single year for extreme risk
  };
}

export type Intensidad = 'normal' | 'moderado' | 'extremo';

export const ESCENARIOS: Record<string, EscenarioType> = {
  HELADAS: {
    id: 'HELADAS',
    label: 'Heladas',
    descripcion: 'Temperaturas extremas bajas, frost y congelamiento en sierra y altiplano',
    icono: '❄️',
    familias: ['BAJAS TEMPERATURAS'],
    eventos: ['HELADA', 'FRIAJE'],
    umbrales: { normal: 1, moderado: 4, extremo: 10 },
  },
  LLUVIAS_INTENSAS: {
    id: 'LLUVIAS_INTENSAS',
    label: 'Lluvias Intensas',
    descripcion: 'Precipitaciones extremas, inundaciones y desbordes de ríos',
    icono: '🌧️',
    familias: ['HIDROMETEOROLOGICO'],
    eventos: ['LLUVIAS INTENSAS', 'INUNDACION', 'DESBORDE'],
    umbrales: { normal: 2, moderado: 6, extremo: 18 },
  },
  HUAICOS: {
    id: 'HUAICOS',
    label: 'Huaicos y Deslizamientos',
    descripcion: 'Flujos de lodo, deslizamientos y movimientos de masa por lluvias',
    icono: '⛰️',
    familias: ['MOVIMIENTO DE MASA'],
    eventos: ['HUAICO', 'DESLIZAMIENTO', 'DERRUMBE'],
    umbrales: { normal: 1, moderado: 3, extremo: 8 },
  },
  GRANIZADAS: {
    id: 'GRANIZADAS',
    label: 'Granizadas',
    descripcion: 'Precipitación de granizo con daños en cultivos y viviendas',
    icono: '🌨️',
    familias: ['HIDROMETEOROLOGICO', 'BAJAS TEMPERATURAS'],
    eventos: ['GRANIZADA', 'GRANIZO'],
    umbrales: { normal: 1, moderado: 2, extremo: 6 },
  },
  SISMO: {
    id: 'SISMO',
    label: 'Sismo / Terremoto',
    descripcion: 'Actividad sísmica, terremotos y tsunamis',
    icono: '🌍',
    familias: ['GEOFISICO'],
    eventos: ['SISMO', 'TERREMOTO', 'TSUNAMI'],
    umbrales: { normal: 1, moderado: 2, extremo: 5 },
  },
  INCENDIO_FORESTAL: {
    id: 'INCENDIO_FORESTAL',
    label: 'Incendio Forestal',
    descripcion: 'Incendios forestales y quemas no controladas',
    icono: '🔥',
    familias: ['INCENDIO'],
    eventos: ['INCENDIO FORESTAL', 'INCENDIO FORESTAL URBANO'],
    umbrales: { normal: 1, moderado: 4, extremo: 10 },
  },
  SEQUIA: {
    id: 'SEQUIA',
    label: 'Sequía / Déficit Hídrico',
    descripcion: 'Períodos secos prolongados, escasez de agua y déficit hídrico',
    icono: '🌵',
    familias: ['HIDROMETEOROLOGICO'],
    eventos: ['SEQUIA', 'DEFICIT HIDRICO'],
    umbrales: { normal: 1, moderado: 2, extremo: 5 },
  },
  EPIDEMIA: {
    id: 'EPIDEMIA',
    label: 'Epidemia / Dengue',
    descripcion: 'Brotes epidémicos, dengue, malaria y enfermedades de transmisión vectorial',
    icono: '🦟',
    familias: ['BIOLOGICO'],
    eventos: ['EPIDEMIA', 'DENGUE', 'MALARIA', 'BROTE EPIDEMICO'],
    umbrales: { normal: 1, moderado: 3, extremo: 8 },
  },
  OLA_CALOR: {
    id: 'OLA_CALOR',
    label: 'Ola de Calor',
    descripcion: 'Temperaturas extremas altas, golpe de calor y estrés térmico',
    icono: '🌡️',
    familias: ['HIDROMETEOROLOGICO'],
    eventos: ['OLA DE CALOR', 'TEMPERATURA MAXIMA'],
    umbrales: { normal: 1, moderado: 2, extremo: 5 },
  },
};
