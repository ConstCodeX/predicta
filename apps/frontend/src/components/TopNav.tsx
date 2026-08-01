import { motion } from 'framer-motion';
import { LogOut, Map, Moon, Settings2, Shield, Sun } from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useThemeStore } from '../store/themeStore';

export type AppView = 'map' | 'data' | 'analytics' | 'admin';

interface Props {
  view: AppView;
  onChangeView: (v: AppView) => void;
}

const ACTIVE_ITEMS: { id: AppView; label: string; icon: React.ReactNode; superadminOnly?: boolean }[] = [
  { id: 'map',   label: 'Mapa',           icon: <Map size={13} /> },
  { id: 'data',  label: 'Datos',          icon: <Settings2 size={13} /> },
  { id: 'admin', label: 'Administración', icon: <Settings2 size={13} />, superadminOnly: true },
];

const SOON_ITEMS = ['Análisis'];

export function TopNav({ view, onChangeView }: Props) {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();

  return (
    <div
      className="flex h-11 flex-shrink-0 items-center px-4 gap-3 z-40 relative"
      style={{
        background: 'var(--c-nav)',
        borderBottom: '1px solid var(--c-divider)',
        backdropFilter: 'blur(16px)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 mr-1 flex-shrink-0">
        <Shield size={14} style={{ color: 'oklch(0.60 0.18 240)' }} />
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--c-text)' }}>Predicta</span>
      </div>

      <div className="flex-shrink-0" style={{ width: 1, height: 18, background: 'var(--c-divider)' }} />

      {/* Nav items */}
      <nav className="flex items-center gap-0.5 flex-shrink-0">
        {ACTIVE_ITEMS.map((item) => {
          if (item.superadminOnly && user?.role !== 'SUPERADMIN') return null;
          const active = view === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                color: active ? 'var(--c-text)' : 'oklch(0.52 0 0)',
                background: active ? 'var(--c-card-hi)' : 'transparent',
              }}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </motion.button>
          );
        })}

        {/* Próximamente */}
        {SOON_ITEMS.map((label) => (
          <div
            key={label}
            title="Próximamente"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-not-allowed select-none"
            style={{ color: 'oklch(0.36 0 0)' }}
          >
            <span className="hidden sm:inline">{label}</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide"
              style={{
                background: 'var(--c-card)',
                color: 'oklch(0.40 0 0)',
                border: '1px solid var(--c-border3)',
              }}
            >
              SOON
            </span>
          </div>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Theme toggle */}
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.90 }}
        title={theme === 'dark' ? 'Activar modo claro (proyector)' : 'Activar modo oscuro'}
        className="flex-shrink-0 rounded-lg p-1.5 transition-colors"
        style={{ color: 'oklch(0.50 0 0)', border: '1px solid var(--c-border2)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-card-hi)'; e.currentTarget.style.color = 'var(--c-text)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'oklch(0.50 0 0)'; }}
      >
        {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
      </motion.button>

      {/* User info + logout */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {user?.role === 'SUPERADMIN' && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold hidden sm:inline"
            style={{ background: 'rgba(96,165,250,0.12)', color: 'oklch(0.60 0.18 240)', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            ADMIN
          </span>
        )}
        <span className="text-[11px] hidden md:inline" style={{ color: 'oklch(0.46 0 0)' }}>
          {user?.name ?? user?.email}
        </span>
        <motion.button
          onClick={logout}
          whileTap={{ scale: 0.92 }}
          title="Cerrar sesión"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] transition-colors"
          style={{ color: 'oklch(0.46 0 0)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-card-hi)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={12} />
          <span className="hidden sm:inline">Salir</span>
        </motion.button>
      </div>
    </div>
  );
}
