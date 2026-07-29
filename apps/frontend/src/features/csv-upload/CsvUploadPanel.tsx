import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FileUp, Upload, X, XCircle } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

type Phase = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResult {
  inserted: number;
  discarded: number;
  total: number;
  errors?: number;
}

interface Props {
  onClose: () => void;
}

export function CsvUploadPanel({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Solo se aceptan archivos .csv');
      setPhase('error');
      return;
    }

    setPhase('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        // Cap at 85% during upload — remaining jumps to 100 on server response
        setProgress(Math.round((e.loaded / e.total) * 85));
      }
    };

    xhr.onload = () => {
      setProgress(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadResult;
          setResult(data);
          setPhase('success');
        } catch {
          setErrorMsg('Respuesta inesperada del servidor');
          setPhase('error');
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText) as { message?: string };
          setErrorMsg(err.message ?? `Error del servidor (${xhr.status})`);
        } catch {
          setErrorMsg(`Error del servidor (${xhr.status})`);
        }
        setPhase('error');
      }
    };

    xhr.onerror = () => {
      setErrorMsg('Error de red. ¿Está el backend corriendo en el puerto 3001?');
      setPhase('error');
    };

    xhr.open('POST', '/api/v1/emergencias/upload');
    xhr.send(formData);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload],
  );

  const reset = () => {
    setPhase('idle');
    setProgress(0);
    setErrorMsg('');
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          width: 440,
          background: 'rgba(9,9,11,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '1rem',
        }}
        className="overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2">
            <Upload size={15} style={{ color: 'oklch(0.60 0.18 240)' }} />
            <h2 className="text-sm font-bold text-white">Subida CSV INDECI</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: 'oklch(0.5 0 0)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <AnimatePresence mode="wait">

            {/* ── IDLE ── */}
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl py-10 cursor-pointer transition-all"
                  style={{
                    border: `2px dashed ${isDragging ? 'oklch(0.60 0.18 240)' : 'rgba(255,255,255,0.12)'}`,
                    background: isDragging ? 'rgba(96,165,250,0.05)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <motion.div
                    animate={{ y: isDragging ? -5 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  >
                    <FileUp
                      size={34}
                      style={{ color: isDragging ? 'oklch(0.60 0.18 240)' : 'oklch(0.42 0 0)' }}
                    />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">
                      {isDragging ? 'Suelta para cargar' : 'Arrastra tu CSV aquí'}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: 'oklch(0.5 0 0)' }}>
                      o haz clic para seleccionar el archivo
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'oklch(0.5 0 0)' }}
                  >
                    Solo .csv · máx. 50 MB
                  </span>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
                />

                <p className="text-[11px] text-center" style={{ color: 'oklch(0.42 0 0)' }}>
                  Filas con{' '}
                  <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    duplicado=True
                  </code>{' '}
                  o{' '}
                  <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    parse_ok=False
                  </code>{' '}
                  serán descartadas automáticamente.
                </p>
              </motion.div>
            )}

            {/* ── UPLOADING ── */}
            {phase === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5 py-6"
              >
                <div className="flex justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      border: '3px solid rgba(255,255,255,0.07)',
                      borderTopColor: 'oklch(0.60 0.18 240)',
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-white">Procesando CSV…</span>
                    <span className="text-xs tabular-nums" style={{ color: 'oklch(0.55 0 0)' }}>
                      {progress}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'oklch(0.60 0.18 240)' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: 'linear', duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[11px]" style={{ color: 'oklch(0.45 0 0)' }}>
                    Filtrando duplicados y registros inválidos…
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {phase === 'success' && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} style={{ color: 'oklch(0.65 0.17 145)' }} />
                  <span className="text-sm font-semibold text-white">Carga completada</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total filas',  value: result.total,     color: 'oklch(0.72 0 0)' },
                    { label: 'Insertadas',   value: result.inserted,  color: 'oklch(0.65 0.17 145)' },
                    { label: 'Descartadas',  value: result.discarded, color: 'oklch(0.72 0.18 70)' },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 rounded-xl py-3"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <span className="text-xl font-bold tabular-nums" style={{ color }}>
                        {value.toLocaleString('es-PE')}
                      </span>
                      <span className="text-[10px]" style={{ color: 'oklch(0.48 0 0)' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                    style={{
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'oklch(0.65 0 0)',
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    Subir otro
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-all"
                    style={{ background: 'oklch(0.60 0.18 240)' }}
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── ERROR ── */}
            {phase === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <XCircle size={18} style={{ color: '#ef4444' }} />
                  <span className="text-sm font-semibold text-white">Error al procesar</span>
                </div>
                <div
                  className="rounded-lg px-4 py-3 text-xs leading-relaxed"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.22)',
                    color: '#f87171',
                  }}
                >
                  {errorMsg}
                </div>
                <button
                  onClick={reset}
                  className="rounded-lg py-2 text-xs font-semibold text-white transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Intentar de nuevo
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
