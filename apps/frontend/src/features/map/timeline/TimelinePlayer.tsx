import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Pause, Play, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SelectField } from '../../../components/SelectField';
import { useMapStore, type TimelineFrame } from '../store/useMapStore';

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const SPEED_OPTIONS = [
  { value: '1200', label: 'Lento' },
  { value: '700',  label: 'Normal' },
  { value: '350',  label: 'Rápido' },
];

interface Props {
  token: string;
  onClose: () => void;
}

export function TimelinePlayer({ token, onClose }: Props) {
  const { timelineFrames, timelineIndex, setTimelineFrames, setTimelineFrame, activateTimeline, deactivateTimeline } = useMapStore();
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [familiaOptions, setFamiliaOptions] = useState<{ value: string; label: string }[]>([]);
  const [familia, setFamilia] = useState('');
  const [speed, setSpeed] = useState('700');
  const [totalEvents, setTotalEvents] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFrames = useCallback(async (familiaFilter: string) => {
    setLoading(true);
    activateTimeline();
    try {
      const params = new URLSearchParams();
      if (familiaFilter) params.set('familiaEvento', familiaFilter);
      const res = await fetch(`/api/v1/emergencias/timeline?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { frames: TimelineFrame[]; familias: string[]; total: number };
      setTimelineFrames(data.frames);
      setTotalEvents(data.total);
      if (data.frames.length > 0) setTimelineFrame(0);

      // On the initial (unfiltered) call, populate dropdown from actual DB values
      if (!familiaFilter && data.familias.length > 0) {
        setFamiliaOptions([
          { value: '', label: 'Todas las familias' },
          ...data.familias.sort().map((f) => ({ value: f, label: f })),
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [token, activateTimeline, setTimelineFrames, setTimelineFrame]);

  useEffect(() => {
    void fetchFrames('');
    return () => deactivateTimeline();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Playback interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || timelineFrames.length === 0) return;

    intervalRef.current = setInterval(() => {
      const next = (useMapStore.getState().timelineIndex + 1) % timelineFrames.length;
      setTimelineFrame(next);
      if (next === 0) setIsPlaying(false);
    }, parseInt(speed, 10));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, timelineFrames.length, setTimelineFrame]);

  const currentFrame = timelineFrames[timelineIndex];

  const step = (delta: number) => {
    const next = Math.max(0, Math.min(timelineFrames.length - 1, timelineIndex + delta));
    setTimelineFrame(next);
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimelineFrame(parseInt(e.target.value, 10));
  };

  const handleClose = () => {
    setIsPlaying(false);
    deactivateTimeline();
    onClose();
  };

  const handleApplyFilter = () => {
    setIsPlaying(false);
    void fetchFrames(familia);
  };

  const eventCount = currentFrame?.events.reduce((s, e) => s + e.count, 0) ?? 0;

  const dropdownOptions = familiaOptions.length > 0
    ? familiaOptions
    : [{ value: '', label: 'Todas las familias' }];

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute bottom-0 left-0 right-0 z-20"
      style={{
        background: 'rgba(9,9,11,0.93)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Top row: filters + close */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 flex-wrap"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="text-[11px] font-semibold text-white flex-shrink-0">Línea de tiempo histórica</span>
        <div style={{ width: 220 }}>
          <SelectField
            value={familia}
            onChange={setFamilia}
            options={dropdownOptions}
            placeholder="Todas las familias"
          />
        </div>
        <button
          onClick={handleApplyFilter}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-medium text-white disabled:opacity-50 transition-colors"
          style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.2)' }}
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : 'Aplicar'}
        </button>
        <div style={{ width: 110 }}>
          <SelectField value={speed} onChange={setSpeed} options={SPEED_OPTIONS} placeholder="Normal" />
        </div>
        {totalEvents > 0 && (
          <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: 'oklch(0.44 0 0)' }}>
            {totalEvents.toLocaleString('es-PE')} eventos totales
          </span>
        )}
        <button
          onClick={handleClose}
          className="rounded-lg p-1 transition-colors hover:bg-white/5 flex-shrink-0"
          style={{ color: 'oklch(0.44 0 0)' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Playback row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Transport controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => step(-1)}
            disabled={loading || timelineIndex === 0}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/5 disabled:opacity-30"
            style={{ color: 'oklch(0.54 0 0)' }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setIsPlaying((v) => !v)}
            disabled={loading || timelineFrames.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
            style={{ background: isPlaying ? 'oklch(0.60 0.18 240)' : 'rgba(255,255,255,0.08)' }}
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin text-white" />
            ) : isPlaying ? (
              <Pause size={13} className="text-white" />
            ) : (
              <Play size={13} className="text-white" />
            )}
          </button>
          <button
            onClick={() => step(1)}
            disabled={loading || timelineIndex >= timelineFrames.length - 1}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/5 disabled:opacity-30"
            style={{ color: 'oklch(0.54 0 0)' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Current frame label */}
        <div className="flex-shrink-0 w-20 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentFrame?.anio}-${currentFrame?.mes}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex flex-col"
            >
              <span className="text-sm font-bold text-white tabular-nums">{currentFrame?.anio ?? '—'}</span>
              <span className="text-[10px]" style={{ color: 'oklch(0.50 0 0)' }}>
                {currentFrame ? (MESES[currentFrame.mes] ?? `M${currentFrame.mes}`) : '—'}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slider */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={Math.max(0, timelineFrames.length - 1)}
            value={timelineIndex}
            onChange={handleSlider}
            disabled={loading || timelineFrames.length === 0}
            className="w-full"
            style={{
              accentColor: 'oklch(0.60 0.18 240)',
              height: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          />
          {timelineFrames.length > 0 && (() => {
            const years = [...new Set(timelineFrames.map((f) => f.anio))];
            const step = Math.ceil(years.length / 8);
            return (
              <div className="flex justify-between mt-1 px-0.5">
                {years.filter((_, i) => i % step === 0).map((y) => (
                  <span key={y} className="text-[9px] tabular-nums" style={{ color: 'oklch(0.36 0 0)' }}>{y}</span>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Event count */}
        <div className="flex-shrink-0 w-16 text-right">
          <AnimatePresence mode="wait">
            <motion.span
              key={eventCount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs tabular-nums font-medium"
              style={{ color: eventCount > 50 ? '#ef4444' : eventCount > 20 ? '#f97316' : 'oklch(0.56 0 0)' }}
            >
              {eventCount > 0 ? `${eventCount} ev` : loading ? '' : '0 ev'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
