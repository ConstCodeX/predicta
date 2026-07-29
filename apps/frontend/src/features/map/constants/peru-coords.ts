/** [lng, lat] centroide geográfico de cada departamento */
export const DEPT_COORDS: Record<string, [number, number]> = {
  AMAZONAS:       [-78.05,  -5.50],
  ANCASH:         [-77.50,  -9.30],
  APURIMAC:       [-73.10, -14.05],
  AREQUIPA:       [-72.30, -16.40],
  AYACUCHO:       [-74.20, -13.20],
  CAJAMARCA:      [-78.50,  -7.20],
  CALLAO:         [-77.13, -12.06],
  CUSCO:          [-72.00, -13.50],
  HUANCAVELICA:   [-75.00, -12.80],
  HUANUCO:        [-76.20,  -9.90],
  ICA:            [-75.70, -14.10],
  JUNIN:          [-75.20, -11.20],
  'LA LIBERTAD':  [-78.00,  -8.10],
  LAMBAYEQUE:     [-79.90,  -6.70],
  LIMA:           [-76.50, -11.50],
  LORETO:         [-75.00,  -4.00],
  'MADRE DE DIOS':[-70.50, -12.00],
  MOQUEGUA:       [-70.90, -16.90],
  PASCO:          [-76.20, -10.80],
  PIURA:          [-80.60,  -5.20],
  PUNO:           [-70.20, -15.00],
  'SAN MARTIN':   [-76.40,  -6.50],
  TACNA:          [-70.30, -18.00],
  TUMBES:         [-80.40,  -3.60],
  UCAYALI:        [-74.00,  -8.40],
};

/**
 * [lng, lat] de capitals y distritos frecuentes en datos INDECI.
 * Clave: nombre en MAYÚSCULAS sin acentos.
 */
const DISTRICT_COORDS: Record<string, [number, number]> = {
  // ── PIURA ──────────────────────────────────────────────────────────────────
  PIURA:           [-80.629,  -5.195],
  SULLANA:         [-80.685,  -4.903],
  TALARA:          [-81.272,  -4.577],
  PAITA:           [-81.114,  -5.089],
  CHULUCANAS:      [-80.165,  -5.097],
  MORROPON:        [-79.967,  -5.178],
  HUANCABAMBA:     [-79.451,  -5.237],
  AYABACA:         [-79.716,  -4.636],
  SECHURA:         [-80.820,  -5.557],
  CATACAOS:        [-80.676,  -5.265],
  // ── TUMBES ─────────────────────────────────────────────────────────────────
  TUMBES:          [-80.451,  -3.567],
  ZARUMILLA:       [-80.274,  -3.502],
  ZORRITOS:        [-80.673,  -3.686],
  CORRALES:        [-80.464,  -3.573],
  // ── LA LIBERTAD ────────────────────────────────────────────────────────────
  TRUJILLO:        [-79.022,  -8.109],
  CHEPEN:          [-79.432,  -7.226],
  PACASMAYO:       [-79.569,  -7.401],
  VIRU:            [-78.759,  -8.410],
  OTUZCO:          [-78.569,  -7.901],
  PATAZ:           [-77.629,  -7.742],
  'SANTIAGO DE CHUCO': [-78.168, -8.141],
  HUAMACHUCO:      [-78.051,  -7.811],
  CASCAS:          [-78.765,  -7.561],
  ASCOPE:          [-79.127,  -7.716],
  CHOCOPE:         [-79.220,  -7.774],
  // ── ANCASH ─────────────────────────────────────────────────────────────────
  HUARAZ:          [-77.530,  -9.527],
  CHIMBOTE:        [-78.591,  -9.074],
  CARAZ:           [-77.819,  -9.046],
  CASMA:           [-78.310,  -9.472],
  RECUAY:          [-77.451,  -9.722],
  CARHUAZ:         [-77.647,  -9.278],
  YUNGAY:          [-77.748,  -9.139],
  HUARI:           [-77.176,  -9.434],
  POMABAMBA:       [-77.098,  -8.834],
  AIJA:            [-77.632, -10.025],
  BOLOGNESI:       [-77.307, -10.023],
  SIHUAS:          [-77.660,  -8.574],
  CORONGO:         [-77.897,  -8.690],
  OCROS:           [-77.387, -10.370],
  // ── CAJAMARCA ──────────────────────────────────────────────────────────────
  CAJAMARCA:       [-78.513,  -7.163],
  JAEN:            [-78.805,  -5.707],
  CHOTA:           [-78.647,  -6.555],
  CUTERVO:         [-78.813,  -6.376],
  SANTA_CRUZ:      [-79.033,  -6.641],
  CONTUMAZA:       [-78.912,  -7.380],
  CELENDIN:        [-78.143,  -6.868],
  'SAN MARCOS':    [-78.168,  -7.330],
  'SAN PABLO':     [-79.025,  -7.118],
  BAMBAMARCA:      [-78.519,  -6.683],
  HUALGAYOC:       [-78.627,  -6.749],
  // ── PUNO ───────────────────────────────────────────────────────────────────
  PUNO:            [-70.034, -15.846],
  JULIACA:         [-70.133, -15.489],
  AZANGARO:        [-70.197, -14.909],
  LAMPA:           [-70.369, -15.359],
  ILAVE:           [-69.636, -16.083],
  YUNGUYO:         [-69.098, -16.237],
  DESAGUADERO:     [-69.043, -16.567],
  MACUSANI:        [-70.430, -14.074],
  MELGAR:          [-70.920, -14.530],
  AYAVIRI:         [-70.588, -14.876],
  HUANCANE:        [-69.759, -15.205],
  CARABAYA:        [-70.430, -14.074],
  SANDIA:          [-69.439, -14.185],
  // ── CUSCO ──────────────────────────────────────────────────────────────────
  CUSCO:           [-71.978, -13.517],
  SICUANI:         [-71.238, -14.254],
  QUILLABAMBA:     [-72.692, -12.854],
  ESPINAR:         [-71.406, -14.793],
  CALCA:           [-71.964, -13.332],
  URUBAMBA:        [-72.123, -13.303],
  PISAC:           [-71.847, -13.415],
  ANTA:            [-72.203, -13.476],
  PARURO:          [-71.840, -13.769],
  ACOMAYO:         [-71.684, -13.922],
  CHUMBIVILCAS:    [-71.988, -14.421],
  CANCHIS:         [-71.238, -14.254],
  // ── HUANCAVELICA ──────────────────────────────────────────────────────────
  HUANCAVELICA:    [-74.973, -12.786],
  LIRCAY:          [-74.721, -13.135],
  ACOBAMBA:        [-74.569, -12.841],
  CHURCAMPA:       [-74.396, -12.631],
  TAYACAJA:        [-74.802, -12.408],
  ANGARAES:        [-74.721, -13.135],
  CASTROVIRREYNA:  [-75.286, -13.476],
  HUAYTARA:        [-75.359, -13.595],
  // ── HUANUCO ────────────────────────────────────────────────────────────────
  HUANUCO:         [-76.242,  -9.930],
  'TINGO MARIA':   [-75.999,  -9.291],
  AMBO:            [-76.205, -10.115],
  LEONCIO_PRADO:   [-75.999,  -9.291],
  PACHITEA:        [-76.027, -10.083],
  HUAMALIES:       [-76.978,  -9.641],
  DOS_DE_MAYO:     [-76.681,  -9.839],
  MARANON:         [-76.347,  -9.253],
  PUERTO_INCA:     [-75.160,  -9.385],
  // ── PASCO ──────────────────────────────────────────────────────────────────
  'CERRO DE PASCO': [-76.263, -10.686],
  OXAPAMPA:        [-75.397, -10.584],
  PASCO:           [-76.263, -10.686],
  YANAHUANCA:      [-76.508, -10.493],
  VILLA_RICA:      [-75.241, -10.719],
  // ── JUNIN ──────────────────────────────────────────────────────────────────
  HUANCAYO:        [-75.209, -12.065],
  'LA OROYA':      [-75.904, -11.531],
  SATIPO:          [-74.638, -11.254],
  TARMA:           [-75.693, -11.417],
  JUNIN:           [-76.004, -11.162],
  CONCEPCION:      [-75.315, -11.914],
  JAUJA:           [-75.505, -11.781],
  CHUPACA:         [-75.287, -12.063],
  YAULI:           [-76.010, -11.656],
  CHANCHAMAYO:     [-75.329, -11.139],
  // ── AYACUCHO ──────────────────────────────────────────────────────────────
  AYACUCHO:        [-74.222, -13.159],
  HUANTA:          [-74.245, -12.934],
  'LA MAR':        [-73.964, -13.013],
  CANGALLO:        [-74.025, -13.600],
  HUAMANGA:        [-74.222, -13.159],
  'VICTOR FAJARDO':[-74.183, -13.940],
  // ── APURIMAC ──────────────────────────────────────────────────────────────
  ABANCAY:         [-72.881, -13.634],
  ANDAHUAYLAS:     [-73.388, -13.656],
  AYMARAES:        [-73.165, -14.346],
  COTABAMBAS:      [-72.335, -13.749],
  CHINCHEROS:      [-73.654, -13.651],
  GRAU:            [-72.565, -14.206],
  // ── ICA ───────────────────────────────────────────────────────────────────
  ICA:             [-75.736, -14.067],
  PISCO:           [-76.209, -13.714],
  CHINCHA:         [-76.127, -13.411],
  NAZCA:           [-74.942, -14.831],
  PALPA:           [-75.183, -14.547],
  // ── AREQUIPA ──────────────────────────────────────────────────────────────
  AREQUIPA:        [-71.537, -16.409],
  CAYLLOMA:        [-71.788, -15.181],
  ISLAY:           [-72.083, -17.060],
  CAMANA:          [-72.714, -16.621],
  CASTILLA:        [-72.003, -15.999],
  CONDESUYOS:      [-72.716, -15.570],
  'LA UNION':      [-73.074, -15.386],
  // ── LORETO ────────────────────────────────────────────────────────────────
  IQUITOS:         [-73.249,  -3.749],
  YURIMAGUAS:      [-76.119,  -5.893],
  REQUENA:         [-73.855,  -5.057],
  NAUTA:           [-73.574,  -4.503],
  CONTAMANA:       [-74.914,  -7.347],
  // ── SAN MARTIN ────────────────────────────────────────────────────────────
  TARAPOTO:        [-76.373,  -6.485],
  MOYOBAMBA:       [-76.974,  -6.035],
  JUANJUI:         [-76.727,  -7.176],
  TOCACHE:         [-76.513,  -8.185],
  RIOJA:           [-77.124,  -6.063],
  LAMAS:           [-76.524,  -6.426],
  // ── AMAZONAS ──────────────────────────────────────────────────────────────
  CHACHAPOYAS:     [-77.869,  -6.232],
  BAGUA:           [-78.528,  -5.649],
  'BAGUA GRANDE':  [-78.450,  -5.744],
  RODRIGUEZ_DE_MENDOZA: [-77.499, -6.387],
  UTCUBAMBA:       [-78.528,  -5.649],
  // ── LAMBAYEQUE ────────────────────────────────────────────────────────────
  CHICLAYO:        [-79.837,  -6.771],
  FERRENAFE:       [-79.786,  -6.638],
  LAMBAYEQUE:      [-79.905,  -6.706],
  // ── LIMA ──────────────────────────────────────────────────────────────────
  LIMA:            [-77.028, -12.046],
  CANETE:          [-76.392, -13.076],
  HUACHO:          [-77.607, -11.106],
  BARRANCA:        [-77.760, -10.754],
  HUARAL:          [-77.212, -11.497],
  YAUYOS:          [-75.912, -12.491],
  HUAROCHIRI:      [-76.217, -11.993],
  OYON:            [-76.773, -10.676],
  MATUCANA:        [-76.400, -11.843],
  // ── TACNA ─────────────────────────────────────────────────────────────────
  TACNA:           [-70.238, -18.013],
  TARATA:          [-70.039, -17.475],
  CANDARAVE:       [-70.265, -17.268],
  'JORGE BASADRE': [-70.372, -17.739],
  // ── MOQUEGUA ──────────────────────────────────────────────────────────────
  MOQUEGUA:        [-70.932, -17.193],
  ILO:             [-71.343, -17.644],
  GENERAL_SANCHEZ_CERRO: [-70.652, -16.434],
  // ── MADRE DE DIOS ─────────────────────────────────────────────────────────
  'PUERTO MALDONADO': [-69.189, -12.593],
  TAMBOPATA:       [-69.189, -12.593],
  MANU:            [-71.365, -12.249],
  // ── UCAYALI ───────────────────────────────────────────────────────────────
  PUCALLPA:        [-74.552,  -8.379],
  CORONEL_PORTILLO:[-74.552,  -8.379],
  ATALAYA:         [-73.768,  -9.999],
  PADRE_ABAD:      [-75.548,  -8.931],
};

function normalize(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Genera un offset determinista en ±0.38° a partir del nombre del distrito */
function districtHashOffset(distrito: string): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < distrito.length; i++) {
    h ^= distrito.charCodeAt(i);
    h = (Math.imul(h, 16777619)) >>> 0;
  }
  const lng = ((h & 0xffff) / 0xffff - 0.5) * 0.76;
  const lat = (((h >>> 16) & 0xffff) / 0xffff - 0.5) * 0.76;
  return [lng, lat];
}

/**
 * Devuelve [lng, lat] para un punto de Perú.
 * Prioridad:
 *   1. Lookup exacto de distrito
 *   2. Centroide de departamento + offset determinista por distrito
 *   3. Solo centroide de departamento
 */
export function getCoords(
  departamento: string,
  distrito?: string | null,
): [number, number] | null {
  const deptKey = normalize(departamento);

  if (distrito) {
    const distKey = normalize(distrito);

    // Lookup exacto
    if (DISTRICT_COORDS[distKey]) return DISTRICT_COORDS[distKey];

    // Búsqueda parcial (ej. "MORROPÓN" ≈ "MORROPON")
    const partialMatch = Object.entries(DISTRICT_COORDS).find(
      ([k]) => k.includes(distKey) || distKey.includes(k),
    );
    if (partialMatch) return partialMatch[1];

    // Fallback: centroide del dept + offset determinista
    const deptCoords = DEPT_COORDS[deptKey] ?? findDept(deptKey);
    if (deptCoords) {
      const [dLng, dLat] = districtHashOffset(distKey);
      return [deptCoords[0] + dLng, deptCoords[1] + dLat];
    }
  }

  return DEPT_COORDS[deptKey] ?? findDept(deptKey);
}

function findDept(key: string): [number, number] | null {
  const match = Object.entries(DEPT_COORDS).find(
    ([k]) => key.includes(normalize(k)) || normalize(k).includes(key),
  );
  return match ? match[1] : null;
}

/** Compatibilidad: mantiene la firma anterior */
export function getDeptCoords(departamento: string): [number, number] | null {
  return getCoords(departamento);
}
