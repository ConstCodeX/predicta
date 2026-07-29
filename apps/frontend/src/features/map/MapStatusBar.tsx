import { useMapStore } from './store/useMapStore';

const TIPO_LABEL: Record<string, string> = {
  INUNDACION:         'Inundación',
  LLUVIAS_EXTREMAS:   'Lluvias extremas',
  MOVIMIENTO_MASA:    'Movimiento de masa',
  DESABASTECIMIENTO:  'Desabastecimiento',
  SALUD_PUBLICA:      'Salud pública',
  AGUA_SANEAMIENTO:   'Agua / Saneamiento',
  HIDROMETEOROLOGICO: 'Hidrometeorólogico',
  MOVIMIENTO_DE_MASA: 'Movimiento de masa',
  BAJAS_TEMPERATURAS: 'Bajas temperaturas',
  INCENDIO:           'Incendio',
  GEOFISICO:          'Geofísico',
  BIOLOGICO:          'Biológico',
  ANTROPICO:          'Antrópico',
  TECNOLOGICO:        'Tecnológico',
};


export function MapStatusBar() {
  const { hoveredAlert, alerts } = useMapStore();

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-4 px-4"
      style={{
        height: 26,
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.6875rem',
        color: 'oklch(0.44 0 0)',
      }}
    >
      {hoveredAlert ? (
        <>
          <span style={{ color: 'oklch(0.65 0 0)', fontWeight: 600 }}>
            {hoveredAlert.distrito ? `${hoveredAlert.distrito} · ` : ''}{hoveredAlert.departamento}
          </span>
          <span style={{ color: TIPO_LABEL[hoveredAlert.tipo_alerta] ? 'oklch(0.54 0 0)' : 'oklch(0.44 0 0)' }}>
            {TIPO_LABEL[hoveredAlert.tipo_alerta] ?? hoveredAlert.tipo_alerta}
          </span>
          <span style={{ color: 'oklch(0.52 0 0)', fontWeight: 500, tabularNums: 'normal' } as React.CSSProperties}>
            Prob. {hoveredAlert.probabilidad_porcentaje}%
          </span>
          {hoveredAlert.descripcion && (
            <span className="hidden sm:inline truncate" style={{ color: 'oklch(0.40 0 0)', maxWidth: 360 }}>
              {hoveredAlert.descripcion}
            </span>
          )}
        </>
      ) : (
        <>
          <span>Predicta · Perú</span>
          {alerts.length > 0 && (
            <span>{alerts.length} alerta{alerts.length !== 1 ? 's' : ''} activa{alerts.length !== 1 ? 's' : ''}</span>
          )}
          <span className="ml-auto">Pasa el cursor sobre un marcador para ver detalles</span>
        </>
      )}
    </div>
  );
}
