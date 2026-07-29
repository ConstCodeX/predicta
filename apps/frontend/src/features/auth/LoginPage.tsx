import { motion } from 'framer-motion';
import { AlertTriangle, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAuthStore } from './useAuthStore';

const FEATURES = [
  'Análisis predictivo con datos históricos INDECI',
  'Alertas en el mapa por departamento y tipo de evento',
  'Ingesta de nuevos datasets CSV del SINPAD',
];

export function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email.trim(), password);
    } catch {
      // error ya está en el store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.08 }}
        style={{
          width: 420,
          background: 'rgba(9,9,11,0.95)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '1.25rem',
        }}
        className="overflow-hidden shadow-2xl"
      >
        {/* Header accent */}
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, oklch(0.60 0.18 240), oklch(0.55 0.22 280))',
          }}
        />

        <div className="px-8 py-8 flex flex-col gap-6">
          {/* Brand */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}
              >
                <Shield size={17} style={{ color: 'oklch(0.60 0.18 240)' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-none tracking-tight">Predicta</h1>
                <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.46 0 0)' }}>
                  Inteligencia Anticipatoria · El Niño Perú
                </p>
              </div>
            </div>
          </div>

          {/* Features list */}
          <div
            className="rounded-xl px-4 py-3.5 flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <div
                  className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: 'oklch(0.60 0.18 240)' }}
                />
                <span className="text-xs leading-relaxed" style={{ color: 'oklch(0.58 0 0)' }}>{f}</span>
              </div>
            ))}
            <p className="mt-1 text-[11px]" style={{ color: 'oklch(0.38 0 0)' }}>
              Acceso exclusivo para analistas autorizados del INDECI.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium" style={{ color: 'oklch(0.52 0 0)' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'oklch(0.42 0 0)' }}
                />
                <input
                  ref={emailRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  placeholder="analista@indeci.gob.pe"
                  className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-all placeholder-zinc-600"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)'}`,
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium" style={{ color: 'oklch(0.52 0 0)' }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'oklch(0.42 0 0)' }}
                />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="••••••••"
                  className="w-full rounded-lg py-2.5 pl-9 pr-9 text-sm text-white outline-none transition-all placeholder-zinc-600"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)'}`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                  style={{ color: 'oklch(0.40 0 0)' }}
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || !email || !password}
              whileTap={{ scale: 0.98 }}
              className="mt-1 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'oklch(0.60 0.18 240)' }}
            >
              {isLoading ? 'Verificando…' : 'Ingresar al sistema'}
            </motion.button>
          </form>

          <p className="text-center text-[11px]" style={{ color: 'oklch(0.34 0 0)' }}>
            Sistema clasificado · Solo personal autorizado
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
