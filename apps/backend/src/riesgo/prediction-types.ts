export interface PredictionType {
  id: string;
  label: string;
  descripcion: string;
  familiasEvento: string[];
  umbrales: { medio: number; alto: number };
  icono: string;
}

export const PREDICTION_TYPES: Record<string, PredictionType> = {
  HIDRO_GEOLOGICO: {
    id: 'HIDRO_GEOLOGICO',
    label: 'Hidrogeológico',
    descripcion: 'Inundaciones, huaicos y derrumbes por lluvias extremas',
    familiasEvento: ['HIDROMETEOROLÓGICO', 'MOVIMIENTO EN MASA', 'INUNDACIÓN'],
    umbrales: { medio: 30, alto: 60 },
    icono: '💧',
  },
  FRIAJE_HELADA: {
    id: 'FRIAJE_HELADA',
    label: 'Friaje y Heladas',
    descripcion: 'Temperaturas extremas bajas en sierra y selva alta',
    familiasEvento: ['BAJAS TEMPERATURAS'],
    umbrales: { medio: 25, alto: 55 },
    icono: '❄️',
  },
  INCENDIO_FORESTAL: {
    id: 'INCENDIO_FORESTAL',
    label: 'Incendio Forestal',
    descripcion: 'Incendios de vegetación en periodos de sequía prolongada',
    familiasEvento: ['INCENDIO'],
    umbrales: { medio: 20, alto: 50 },
    icono: '🔥',
  },
  SISMO: {
    id: 'SISMO',
    label: 'Sismo',
    descripcion: 'Actividad sísmica y riesgo estructural',
    familiasEvento: ['SISMO'],
    umbrales: { medio: 15, alto: 40 },
    icono: '🌍',
  },
  VIENTOS: {
    id: 'VIENTOS',
    label: 'Vientos Fuertes',
    descripcion: 'Ráfagas extremas y tornados locales',
    familiasEvento: ['VIENTO'],
    umbrales: { medio: 25, alto: 55 },
    icono: '💨',
  },
  CONTAMINACION: {
    id: 'CONTAMINACION',
    label: 'Contaminación',
    descripcion: 'Contaminación ambiental e intoxicaciones',
    familiasEvento: ['CONTAMINACIÓN'],
    umbrales: { medio: 20, alto: 45 },
    icono: '⚗️',
  },
};
