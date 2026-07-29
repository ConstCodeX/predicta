export interface PredictionType {
  id: string;
  label: string;
  descripcion: string;
  familiasEvento: string[];
  umbrales: { medio: number; alto: number };
  icono: string;
}

// Familias tal como aparecen en la base de datos INDECI (mayúsculas, sin tilde)
export const PREDICTION_TYPES: Record<string, PredictionType> = {
  HIDRO_GEOLOGICO: {
    id: 'HIDRO_GEOLOGICO',
    label: 'Hidrogeológico',
    descripcion: 'Inundaciones, huaicos y deslizamientos por lluvias extremas',
    familiasEvento: ['HIDROMETEOROLOGICO', 'MOVIMIENTO DE MASA'],
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
  INCENDIO: {
    id: 'INCENDIO',
    label: 'Incendio',
    descripcion: 'Incendios forestales, urbanos e industriales',
    familiasEvento: ['INCENDIO'],
    umbrales: { medio: 20, alto: 50 },
    icono: '🔥',
  },
  GEOFISICO: {
    id: 'GEOFISICO',
    label: 'Geofísico',
    descripcion: 'Sismos, actividad volcánica y tsunamis',
    familiasEvento: ['GEOFISICO'],
    umbrales: { medio: 15, alto: 40 },
    icono: '🌍',
  },
  BIOLOGICO: {
    id: 'BIOLOGICO',
    label: 'Biológico',
    descripcion: 'Epidemias, plagas y eventos biológicos',
    familiasEvento: ['BIOLOGICO'],
    umbrales: { medio: 20, alto: 45 },
    icono: '🦠',
  },
  ANTROPICO: {
    id: 'ANTROPICO',
    label: 'Antrópico / Tecnológico',
    descripcion: 'Accidentes, derrames, conflictos y riesgos tecnológicos',
    familiasEvento: ['ANTROPICO', 'TECNOLOGICO'],
    umbrales: { medio: 20, alto: 45 },
    icono: '⚙️',
  },
};
