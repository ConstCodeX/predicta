import { motion } from 'framer-motion';
import { useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import type { SEIRCiudad, SEIRModelResponse } from './seir-types';

type ActiveTab = 'epidemico' | 'humanitario' | 'economico';

const RIESGO_COLOR: Record<string, string> = {
  bajo:     '#22c55e',
  moderado: '#f97316',
  critico:  '#ef4444',
};

const TAB_COLOR: Record<ActiveTab, string> = {
  epidemico:   '', // uses RIESGO_COLOR
  humanitario: '#ef4444',
  economico:   '#f97316',
};

const TAB_ICON: Record<ActiveTab, string> = {
  epidemico:   '🦟',
  humanitario: '🚨',
  economico:   '🌾',
};

// ─── Generic city marker ──────────────────────────────────────
function CityMarker({
  city, color, ratio, icon, onClick,
}: {
  city: SEIRCiudad; color: string; ratio: number; icon: string; onClick: () => void;
}) {
  const outer    = Math.round(18 + ratio * 54);
  const core     = Math.round(6 + ratio * 14);
  const duration = `${1.2 + (1 - ratio) * 0.8}s`;

  return (
    <Marker longitude={city.lng} latitude={city.lat} anchor="center">
      <div
        className="relative flex items-center justify-center cursor-pointer"
        style={{ width: outer + 16, height: outer + 16 }}
        onClick={onClick}
      >
        <div className="absolute animate-ping rounded-full"
          style={{ width: outer, height: outer, background: `${color}35`, animationDuration: duration }} />
        <div className="absolute rounded-full"
          style={{ width: Math.round(outer * 0.65), height: Math.round(outer * 0.65), background: `${color}20`, border: `1.5px solid ${color}70` }} />
        {/* Icon badge */}
        <div className="rounded-full relative z-10 flex items-center justify-center"
          style={{ width: core + 6, height: core + 6, background: color, boxShadow: `0 0 ${core * 2}px ${color}80`, fontSize: core > 14 ? 12 : 9 }}>
          {icon}
        </div>
        <div className="absolute whitespace-nowrap pointer-events-none"
          style={{ bottom: -(outer / 2) + 2 }}>
          <p className="text-[10px] font-semibold text-white text-center"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
            {city.ciudad}
          </p>
        </div>
      </div>
    </Marker>
  );
}

// ─── Popup content per tab ────────────────────────────────────
function CityPopup({ city, data, activeTab, onClose }: {
  city: SEIRCiudad; data: SEIRModelResponse; activeTab: ActiveTab; onClose: () => void;
}) {
  const color      = activeTab === 'epidemico' ? (RIESGO_COLOR[data.kpis.nivel_riesgo] ?? '#6b7280') : TAB_COLOR[activeTab];
  const totalCasos = data.kpis.casos_proyectados_total;
  const h          = data.humanitario;
  const e          = data.economico;

  const fmtSoles = (n: number) => n >= 1_000_000 ? `S/ ${(n / 1_000_000).toFixed(1)}M` : `S/ ${n.toLocaleString()}`;

  return (
    <Popup longitude={city.lng} latitude={city.lat}
      anchor="bottom" offset={[0, -14] as [number, number]}
      onClose={onClose} closeButton={false} closeOnClick>
      <div className="flex flex-col gap-2 rounded-xl px-4 py-3"
        style={{ background: 'rgba(9,9,11,0.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', minWidth: 180 }}>
        <div>
          <p className="text-xs font-semibold text-white leading-tight">{city.ciudad}</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'oklch(0.44 0 0)' }}>
            {data.region.split(' — ')[0]} · {data.escenario}
          </p>
        </div>

        {activeTab === 'epidemico' && (
          <div className="space-y-1.5">
            <Row label="Casos proy." value={city.casos.toLocaleString()} color={color} />
            <Row label="% del total" value={`${(city.pct * 100).toFixed(0)}%`} />
            <Row label="Hosp. req." value={Math.round(city.casos * 0.126).toLocaleString()} color="#f97316" />
            <div className="h-[3px] rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${(city.casos / totalCasos) * 100}%`, background: color }} />
            </div>
          </div>
        )}

        {activeTab === 'humanitario' && h && (
          <div className="space-y-1.5">
            <Row label="Fallecidos est." value={Math.round(h.fallecidos_estimados * city.pct).toLocaleString()} color="#ef4444" />
            <Row label="Heridos graves"  value={Math.round(h.heridos_graves * city.pct).toLocaleString()} color="#f97316" />
            <Row label="Desplazados"     value={Math.round(h.personas_desplazadas * city.pct).toLocaleString()} />
            <Row label="Albergues req."  value={Math.round(h.albergues_requeridos * city.pct).toLocaleString()} />
          </div>
        )}

        {activeTab === 'economico' && e && (
          <div className="space-y-1.5">
            <Row label="Impacto local" value={fmtSoles(e.impacto_total_soles * city.pct)} color="#f97316" />
            <Row label="Pérd. agrícola" value={fmtSoles(e.cultivos.total_valor_soles * city.pct)} color="#fbbf24" />
            <Row label="Viviendas afect." value={Math.round(e.infraestructura.viviendas_afectadas * city.pct).toLocaleString()} />
          </div>
        )}
      </div>
    </Popup>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px]" style={{ color: 'oklch(0.50 0 0)' }}>{label}</span>
      <span className="text-xs font-semibold tabular-nums" style={{ color: color ?? 'rgba(255,255,255,0.85)' }}>{value}</span>
    </div>
  );
}

// ─── Timeline bar ─────────────────────────────────────────────
export function SEIRTimelineBar({ data }: { data: SEIRModelResponse }) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  const weeks    = data.proyeccion_semanal;
  const peak     = data.kpis.pico_semana;
  const color    = RIESGO_COLOR[data.kpis.nivel_riesgo] ?? '#6b7280';
  const maxCasos = Math.max(...weeks.map((w) => w.casos_proyectados), 1);
  const hovered  = weeks.find((w) => w.semana === hoveredWeek) ?? null;

  return (
    <motion.div
      className="absolute bottom-9 left-14 z-10"
      style={{ width: 'calc(100% - 80px)', maxWidth: 560 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="rounded-2xl px-4 py-3"
        style={{ background: 'rgba(9,9,11,0.90)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-white">{data.escenario}</span>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
              {{ bajo: 'BAJO', moderado: 'MODERADO', critico: 'CRÍTICO' }[data.kpis.nivel_riesgo]}
            </span>
          </div>
          <span className="text-[9px]" style={{ color: 'oklch(0.42 0 0)' }}>
            {data.region.split(' — ')[0]} · 16 sem. Dengue
          </span>
        </div>

        <div className="relative" style={{ height: 40 }}>
          {hovered && (
            <div className="absolute bottom-full mb-2 left-0 z-20 flex items-center gap-3 rounded-lg px-3 py-2 pointer-events-none whitespace-nowrap"
              style={{ background: 'rgba(9,9,11,0.97)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
              <span className="text-[10px] font-medium text-white">
                Sem. {hovered.semana}
                <span className="ml-1 text-[9px]" style={{ color: 'oklch(0.42 0 0)' }}>
                  {hovered.es_historico ? '(histórico)' : '(proyección)'}
                </span>
              </span>
              <span className="text-[10px] tabular-nums font-semibold" style={{ color }}>
                {hovered.casos_proyectados.toLocaleString()} casos
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: '#f97316' }}>
                {hovered.hospitalizados_requeridos.toLocaleString()} hosp.
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: '#64748b' }}>
                Rt {hovered.tasa_rt.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex gap-[2px] items-end h-full">
            {weeks.map((w) => {
              const barH     = Math.max((w.casos_proyectados / maxCasos) * 100, 4);
              const isPeak   = w.semana === peak;
              const isHov    = w.semana === hoveredWeek;
              const barColor = w.es_historico ? 'rgba(255,255,255,0.22)' : color;
              return (
                <div key={w.semana} className="flex-1 flex flex-col justify-end relative" style={{ height: '100%' }}
                  onMouseEnter={() => setHoveredWeek(w.semana)}
                  onMouseLeave={() => setHoveredWeek(null)}>
                  {isPeak && !isHov && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] font-bold"
                      style={{ color, lineHeight: 1 }}>▲</div>
                  )}
                  <div className="rounded-sm transition-opacity"
                    style={{ height: `${barH}%`, background: isHov ? 'white' : barColor,
                      opacity: isHov ? 1 : isPeak ? 1 : 0.72,
                      boxShadow: isPeak ? `0 0 6px ${color}` : undefined }} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-[2px] mt-1">
          {weeks.map((w) => (
            <div key={w.semana} className="flex-1 text-center text-[7px]"
              style={{ color: w.semana === hoveredWeek ? 'rgba(255,255,255,0.7)' : 'oklch(0.36 0 0)' }}>
              {w.semana % 4 === 0 || w.semana === 1 ? `S${w.semana}` : ''}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── City overlay (inside Map) ────────────────────────────────
interface OverlayProps {
  data:      SEIRModelResponse;
  activeTab?: ActiveTab;
}

export function SEIRMapOverlay({ data, activeTab = 'epidemico' }: OverlayProps) {
  const [hovered, setHovered] = useState<SEIRCiudad | null>(null);

  const cities   = data.distribucion_geografica ?? [];
  const riesgoColor = RIESGO_COLOR[data.kpis.nivel_riesgo] ?? '#6b7280';
  const color    = activeTab === 'epidemico' ? riesgoColor : TAB_COLOR[activeTab];
  const icon     = TAB_ICON[activeTab];
  const maxCasos = Math.max(...cities.map((c) => c.casos), 1);

  // Compute per-city ratio based on tab
  const getRatio = (city: SEIRCiudad): number => {
    if (activeTab === 'epidemico')   return maxCasos > 0 ? city.casos / maxCasos : 0;
    // For other tabs, just use the pct (city's share of total)
    return Math.min(city.pct * 2.5, 1); // amplify slightly so markers are visible
  };

  return (
    <>
      {cities.map((city) => (
        <CityMarker
          key={`${city.ciudad}-${activeTab}`}
          city={city}
          color={color}
          ratio={getRatio(city)}
          icon={icon}
          onClick={() => setHovered((h) => h?.ciudad === city.ciudad ? null : city)}
        />
      ))}

      {hovered && (
        <CityPopup
          city={hovered}
          data={data}
          activeTab={activeTab}
          onClose={() => setHovered(null)}
        />
      )}
    </>
  );
}
