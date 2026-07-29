import { motion } from 'framer-motion';
import { BarChart2, Database, LogOut, Map, Shield, Users } from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';

export type AppView = 'map' | 'data' | 'analytics' | 'users';

interface Props {
  view: AppView;
  onChangeView: (v: AppView) => void;
}

const NAV_ITEMS: { id: AppView; label: string; icon: React.ReactNode; superadminOnly?: boolean }[] = [
  { id: 'map',       label: 'Mapa',      icon: <Map size={13} /> },
  { id: 'data',      label: 'Datos',     icon: <Database size={13} /> },
  { id: 'analytics', label: 'Análisis',  icon: <BarChart2 size={13} /> },
  { id: 'users',     label: 'Usuarios',  icon: <Users size={13} />, superadminOnly: true },
];

export function TopNav({ view, onChangeView }: Props) {
  const { user, logout } = useAuthStore();

  return (
    <div
      className="flex h-11 flex-shrink-0 items-center px-4 gap-4 z-40 relative"
      style={{
        background: 'rgba(9,9,11,0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 mr-2">
        <Shield size={14} style={{ color: 'oklch(0.60 0.18 240)' }} />
        <span className="text-sm font-bold text-white tracking-tight">Predicta</span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />

      {/* Nav items */}
      <nav className="flex items-center gap-0.5">
        {NAV_ITEMS.map((item) => {
          if (item.superadminOnly && user?.role !== 'SUPERADMIN') return null;
          const active = view === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                color: active ? 'white' : 'oklch(0.52 0 0)',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
            >
              {item.icon}
              {item.label}
            </motion.button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User info + logout */}
      <div className="flex items-center gap-2">
        {user?.role === 'SUPERADMIN' && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: 'rgba(96,165,250,0.12)', color: 'oklch(0.60 0.18 240)', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            ADMIN
          </span>
        )}
        <span className="text-[11px]" style={{ color: 'oklch(0.46 0 0)' }}>
          {user?.name ?? user?.email}
        </span>
        <motion.button
          onClick={logout}
          whileTap={{ scale: 0.92 }}
          title="Cerrar sesión"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:bg-white/5"
          style={{ color: 'oklch(0.46 0 0)' }}
        >
          <LogOut size={12} />
          Salir
        </motion.button>
      </div>
    </div>
  );
}
