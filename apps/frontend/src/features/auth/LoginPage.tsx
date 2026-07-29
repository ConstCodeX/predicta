import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from './useAuthStore';

export function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try { await login(email.trim(), password); } catch { /* error en store */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.06 }}
        style={{
          width: 360,
          background: '#0c0c0e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.75rem',
          overflow: 'hidden',
        }}
      >
        {/* Accent top bar */}
        <div style={{ height: 2, background: 'oklch(0.60 0.18 240)' }} />

        <div style={{ padding: '2.25rem 2rem 2rem' }}>
          {/* Brand */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              marginBottom: '0.5rem',
            }}>
              Predicta
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'oklch(0.46 0 0)', lineHeight: 1.5 }}>
              Análisis anticipatorio del Fenómeno del Niño en el Perú
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.6875rem', color: 'oklch(0.48 0 0)', fontWeight: 500, letterSpacing: '0.02em' }}>
                CORREO
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="tu@correo.com"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.8125rem',
                  color: 'white',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => !error && (e.target.style.borderColor = 'rgba(255,255,255,0.22)')}
                onBlur={(e) => !error && (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.6875rem', color: 'oklch(0.48 0 0)', fontWeight: 500, letterSpacing: '0.02em' }}>
                CONTRASEÑA
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="••••••••"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '0.5rem',
                    padding: '0.625rem 2.5rem 0.625rem 0.75rem',
                    fontSize: '0.8125rem',
                    color: 'white',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => !error && (e.target.style.borderColor = 'rgba(255,255,255,0.22)')}
                  onBlur={(e) => !error && (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '0.625rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'oklch(0.42 0 0)',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: '0.6875rem', color: '#f87171', margin: '-0.25rem 0 0' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.6875rem',
                borderRadius: '0.5rem',
                background: isLoading ? 'rgba(96,165,250,0.5)' : 'oklch(0.60 0.18 240)',
                border: 'none',
                color: 'white',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
                opacity: !email || !password ? 0.5 : 1,
              }}
            >
              {isLoading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
