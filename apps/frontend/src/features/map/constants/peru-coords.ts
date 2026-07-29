/** [lng, lat] del centroide de cada departamento peruano */
export const PERU_DEPT_COORDS: Record<string, [number, number]> = {
  AMAZONAS: [-78.05, -5.5],
  ANCASH: [-77.5, -9.3],
  APURIMAC: [-73.1, -14.05],
  AREQUIPA: [-72.3, -16.4],
  AYACUCHO: [-74.2, -13.2],
  CAJAMARCA: [-78.5, -7.2],
  CALLAO: [-77.13, -12.06],
  CUSCO: [-72.0, -13.5],
  HUANCAVELICA: [-75.0, -12.8],
  HUANUCO: [-76.2, -9.9],
  ICA: [-75.7, -14.1],
  JUNIN: [-75.2, -11.2],
  'LA LIBERTAD': [-78.0, -8.1],
  LAMBAYEQUE: [-79.9, -6.7],
  LIMA: [-76.5, -11.5],
  LORETO: [-75.0, -4.0],
  'MADRE DE DIOS': [-70.5, -12.0],
  MOQUEGUA: [-70.9, -16.9],
  PASCO: [-76.2, -10.8],
  PIURA: [-80.6, -5.2],
  PUNO: [-70.2, -15.0],
  'SAN MARTIN': [-76.4, -6.5],
  TACNA: [-70.3, -18.0],
  TUMBES: [-80.4, -3.6],
  UCAYALI: [-74.0, -8.4],
};

function stripAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Retorna [lng, lat] para un nombre de departamento (tolerante a acentos,
 * mayúsculas/minúsculas y variantes). Retorna null si no hay coincidencia.
 */
export function getDeptCoords(departamento: string): [number, number] | null {
  const key = stripAccents(departamento.toUpperCase());

  if (PERU_DEPT_COORDS[key]) return PERU_DEPT_COORDS[key];

  // Búsqueda parcial (tolerancia a prefijos como "REGIÓN PIURA")
  const match = Object.entries(PERU_DEPT_COORDS).find(([k]) =>
    key.includes(stripAccents(k)) || stripAccents(k).includes(key),
  );
  return match ? match[1] : null;
}
