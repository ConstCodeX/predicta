import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight,
  Brain, Database, FileText, Map, TrendingUp, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
}

const SLIDES = [
  {
    id: 'intro',
    icon: <Activity size={28} style={{ color: '#14b8a6' }} />,
    tag: 'Predicta AI',
    title: 'Predicción de Dengue con IA',
    subtitle: 'Perú · Todos los distritos',
    body: 'Sistema de pronóstico epidémico que combina datos históricos del INDECI/COEN, capacidad hospitalaria por distrito y el modelo de lenguaje Gemma para anticipar brotes de dengue semanas antes de que ocurran.',
    accent: '#14b8a6',
    stats: [
      { label: 'Distritos cubiertos', value: '1,891' },
      { label: 'Reportes INDECI', value: '36,650' },
      { label: 'Años de histórico', value: '2019–2026' },
    ],
  },
  {
    id: 'data',
    icon: <Database size={28} style={{ color: '#6366f1' }} />,
    tag: 'Datos de entrada',
    title: 'Los CSV alimentan a Gemma',
    subtitle: 'Dos fuentes, un contexto estructurado',
    body: 'Los archivos CSV cargados en el sistema se convierten en el contexto que Gemma recibe en su prompt. No hay búsqueda externa: todo el conocimiento del modelo viene de los datos que tú subes.',
    accent: '#6366f1',
    bullets: [
      { icon: '📊', text: 'DATA_MAESTRA — 1,891 distritos: población, camas hospitalarias, agua potable, anemia, vulnerabilidad' },
      { icon: '🚨', text: 'COEN/INDECI — 36,650 reportes: eventos, familia, fecha, departamento, distrito (2019-2026)' },
      { icon: '🦟', text: 'Casos Dengue por departamento — acumulados por semana epidemiológica, defunciones, letalidad' },
    ],
  },
  {
    id: 'flow',
    icon: <Brain size={28} style={{ color: '#f59e0b' }} />,
    tag: 'Flujo de la IA',
    title: 'De CSV a pronóstico en segundos',
    subtitle: 'Pipeline completo sin caja negra',
    body: 'El agente dengue-seir recibe los datos reales del departamento seleccionado y genera una proyección semanal con Rt, saturación hospitalaria e impacto económico — todo anclado en cifras reales.',
    accent: '#f59e0b',
    flow: [
      { step: '1', label: 'Sube el CSV', desc: 'INDECI · DATA_MAESTRA' },
      { step: '2', label: 'Selecciona región', desc: 'Click en el mapa' },
      { step: '3', label: 'Gemma analiza', desc: 'Prompt con contexto real' },
      { step: '4', label: 'Pronóstico', desc: 'Semanas · KPIs · Alertas' },
    ],
  },
  {
    id: 'map',
    icon: <Map size={28} style={{ color: '#22d3ee' }} />,
    tag: 'Mapa interactivo',
    title: 'Click en el mapa = región activa',
    subtitle: 'La selección se propaga a todo el panel',
    body: 'Al hacer click en cualquier punto del mapa, el departamento queda seleccionado y el modelo se re-ejecuta automáticamente con los datos reales de esa región. Sin necesidad de configurar nada manualmente.',
    accent: '#22d3ee',
    highlights: [
      'Piura — zona de mayor riesgo histórico por El Niño Costero',
      'Loreto — alta incidencia endémica, baja capacidad hospitalaria',
      'San Martín — patrón estacional claro post-2023',
      'Ucayali — mayor % alarma y casos graves históricos',
    ],
  },
  {
    id: 'seir',
    icon: <TrendingUp size={28} style={{ color: '#a78bfa' }} />,
    tag: 'Modelo SEIR',
    title: 'Proyección epidémica semanal',
    subtitle: 'S1–S4 histórico · S5+ proyección',
    body: 'Gemma construye una curva de 16 semanas con casos proyectados, hospitalizados requeridos y número reproductivo Rt. Los primeros 4 puntos son datos reales MINSA; los siguientes son la proyección.',
    accent: '#a78bfa',
    kpis: [
      { label: 'Rt', desc: 'Velocidad de contagio. >1 = brote activo', color: '#f97316' },
      { label: 'Saturación hosp.', desc: 'Camas requeridas vs disponibles', color: '#ef4444' },
      { label: 'Semana pico', desc: 'Semana con máximo de casos proyectados', color: '#a78bfa' },
      { label: 'Impacto S/', desc: 'Costo estimado vs ahorro preventivo', color: '#22c55e' },
    ],
  },
  {
    id: 'alerts',
    icon: <AlertTriangle size={28} style={{ color: '#ef4444' }} />,
    tag: 'Alertas tempranas',
    title: 'Actúa antes del pico epidémico',
    subtitle: 'El sistema avisa cuando el umbral crítico se acerca',
    body: 'Si el modelo detecta que la saturación hospitalaria superará el 100% o que el Rt supera 4.0, genera alertas automáticas con acciones sugeridas para los equipos de salud pública.',
    accent: '#ef4444',
    levels: [
      { label: 'CRÍTICO', desc: 'Saturación ≥ 100%', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
      { label: 'ALTO', desc: 'Saturación 60–99%', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
      { label: 'MODERADO', desc: 'Saturación 30–59%', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
      { label: 'BAJO', desc: 'Saturación < 30%', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    ],
  },
  {
    id: 'cta',
    icon: <FileText size={28} style={{ color: '#14b8a6' }} />,
    tag: 'Empieza ahora',
    title: 'Carga tus datos y lanza el modelo',
    subtitle: 'Admin → Subir CSV → Selecciona región → Predicciones',
    body: 'Ingresa con las credenciales de demo, ve a Administración para cargar los CSV de INDECI y DATA_MAESTRA, luego abre el panel de Predicciones en el mapa y selecciona cualquier departamento del Perú.',
    accent: '#14b8a6',
    steps: [
      { n: '01', text: 'Ingresar con cuenta demo' },
      { n: '02', text: 'Admin → Subir CSV (INDECI / DATA_MAESTRA)' },
      { n: '03', text: 'Panel lateral → Predicciones' },
      { n: '04', text: 'Click en un departamento del mapa' },
      { n: '05', text: 'Ver pronóstico generado por Gemma' },
    ],
  },
] as const;

type SlideId = typeof SLIDES[number]['id'];

function SlideContent({ slide }: { slide: typeof SLIDES[number] }) {
  const s = slide as Record<string, unknown>;
  return (
    <div className="flex flex-col gap-5">
      {/* Tag + icon */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl p-3" style={{ background: `${slide.accent}15`, border: `1px solid ${slide.accent}30` }}>
          {slide.icon}
        </div>
        <span className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide"
          style={{ background: `${slide.accent}15`, color: slide.accent, border: `1px solid ${slide.accent}25` }}>
          {slide.tag}
        </span>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{slide.title}</h2>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.50 0 0)' }}>{slide.subtitle}</p>
      </div>

      {/* Body */}
      <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.60 0 0)' }}>{slide.body}</p>

      {/* Stats */}
      {'stats' in s && Array.isArray(s.stats) && (
        <div className="grid grid-cols-3 gap-3">
          {(s.stats as { label: string; value: string }[]).map((stat) => (
            <div key={stat.label} className="rounded-2xl p-4 text-center"
              style={{ background: `${slide.accent}0d`, border: `1px solid ${slide.accent}20` }}>
              <p className="text-xl font-bold tabular-nums" style={{ color: slide.accent }}>{stat.value}</p>
              <p className="text-[10px] mt-1" style={{ color: 'oklch(0.44 0 0)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bullets */}
      {'bullets' in s && Array.isArray(s.bullets) && (
        <div className="flex flex-col gap-2.5">
          {(s.bullets as { icon: string; text: string }[]).map((b) => (
            <div key={b.text} className="flex items-start gap-3 rounded-xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-lg leading-none mt-0.5">{b.icon}</span>
              <p className="text-[12px] leading-relaxed" style={{ color: 'oklch(0.60 0 0)' }}>{b.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Flow */}
      {'flow' in s && Array.isArray(s.flow) && (
        <div className="flex items-center gap-1">
          {(s.flow as { step: string; label: string; desc: string }[]).map((f, i, arr) => (
            <div key={f.step} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold"
                  style={{ background: `${slide.accent}20`, color: slide.accent, border: `1px solid ${slide.accent}40` }}>
                  {f.step}
                </div>
                <p className="text-[11px] font-semibold text-white text-center">{f.label}</p>
                <p className="text-[10px] text-center" style={{ color: 'oklch(0.44 0 0)' }}>{f.desc}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="w-4 h-px flex-shrink-0 mb-8" style={{ background: `${slide.accent}40` }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Highlights */}
      {'highlights' in s && Array.isArray(s.highlights) && (
        <div className="flex flex-col gap-2">
          {(s.highlights as string[]).map((h) => (
            <div key={h} className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: slide.accent }} />
              <p className="text-[12px]" style={{ color: 'oklch(0.58 0 0)' }}>{h}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      {'kpis' in s && Array.isArray(s.kpis) && (
        <div className="grid grid-cols-2 gap-2.5">
          {(s.kpis as { label: string; desc: string; color: string }[]).map((k) => (
            <div key={k.label} className="rounded-xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[13px] font-semibold" style={{ color: k.color }}>{k.label}</p>
              <p className="text-[10px] mt-1 leading-snug" style={{ color: 'oklch(0.46 0 0)' }}>{k.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alert levels */}
      {'levels' in s && Array.isArray(s.levels) && (
        <div className="flex flex-col gap-2">
          {(s.levels as { label: string; desc: string; color: string; bg: string }[]).map((l) => (
            <div key={l.label} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
              style={{ background: l.bg, border: `1px solid ${l.color}30` }}>
              <span className="text-[11px] font-bold w-20 flex-shrink-0" style={{ color: l.color }}>{l.label}</span>
              <span className="text-[11px]" style={{ color: 'oklch(0.58 0 0)' }}>{l.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      {'steps' in s && Array.isArray(s.steps) && (
        <div className="flex flex-col gap-2">
          {(s.steps as { n: string; text: string }[]).map((step) => (
            <div key={step.n} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] font-mono font-bold w-6 flex-shrink-0" style={{ color: slide.accent }}>{step.n}</span>
              <span className="text-[12px]" style={{ color: 'oklch(0.64 0 0)' }}>{step.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DemoCarousel({ onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const total = SLIDES.length;
  const slide = SLIDES[idx];

  const go = (next: number) => {
    setDir(next > idx ? 1 : -1);
    setIdx(next);
  };
  const prev = () => idx > 0 && go(idx - 1);
  const next = () => idx < total - 1 && go(idx + 1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 560,
          maxHeight: '88vh',
          background: '#0a0a0c',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 24,
        }}
        initial={{ scale: 0.93, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top bar */}
        <motion.div
          className="h-0.5 flex-shrink-0"
          style={{ background: slide.accent }}
          animate={{ background: slide.accent }}
          transition={{ duration: 0.4 }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'oklch(0.36 0 0)' }}>
              Demo
            </span>
            <span className="text-[11px]" style={{ color: 'oklch(0.26 0 0)' }}>·</span>
            <span className="text-[11px]" style={{ color: 'oklch(0.36 0 0)' }}>
              {idx + 1} / {total}
            </span>
          </div>
          <button onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-white/5"
            style={{ color: 'oklch(0.40 0 0)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Slide content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={slide.id as SlideId}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <SlideContent slide={slide} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={prev} disabled={idx === 0}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors disabled:opacity-20"
            style={{ color: 'oklch(0.50 0 0)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) => { if (idx > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <ArrowLeft size={12} /> Anterior
          </button>

          {/* Dots */}
          <div className="flex-1 flex items-center justify-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button key={s.id} onClick={() => go(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  background: i === idx ? slide.accent : 'rgba(255,255,255,0.15)',
                }} />
            ))}
          </div>

          {idx < total - 1 ? (
            <button onClick={next}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all"
              style={{ background: slide.accent }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
              Siguiente <ArrowRight size={12} />
            </button>
          ) : (
            <button onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all"
              style={{ background: slide.accent }}>
              Ingresar →
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
