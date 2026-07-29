import { motion } from 'framer-motion';
import { Loader2, PlusCircle, Shield, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'ANALYST';
  active: boolean;
  createdAt: string;
}

interface Props { token: string }

export function UsersPanel({ token }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'ANALYST' as 'ANALYST' | 'SUPERADMIN' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json() as User[];
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchUsers(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json() as User | { message: string };
      if (!res.ok) throw new Error((data as { message: string }).message);
      setUsers((prev) => [data as User, ...prev]);
      setForm({ email: '', name: '', password: '', role: 'ANALYST' });
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    const res = await fetch(`/api/v1/users/${id}/deactivate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: false } : u));
  };

  const inputCls = "w-full rounded-lg px-3 py-2 text-xs text-white outline-none";
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
      style={{ background: 'rgba(9,9,11,0.98)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
    >
      <div className="mx-auto max-w-2xl px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Gestión de usuarios</h2>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.46 0 0)' }}>Solo el superadmin puede añadir o desactivar usuarios.</p>
          </div>
          <motion.button
            onClick={() => setShowForm((v) => !v)}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white"
            style={{ background: 'oklch(0.60 0.18 240)' }}
          >
            <PlusCircle size={13} />
            Nuevo usuario
          </motion.button>
        </div>

        {/* Add user form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={createUser}
            className="flex flex-col gap-3 rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-xs font-semibold text-white">Crear nuevo analista</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Correo electrónico</label>
                <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="analista@indeci.gob.pe" className={inputCls} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Nombre completo</label>
                <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre Apellido" className={inputCls} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Contraseña inicial</label>
                <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="mín. 6 caracteres" className={inputCls} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px]" style={{ color: 'oklch(0.44 0 0)' }}>Rol</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'ANALYST' | 'SUPERADMIN' }))} className={inputCls} style={{ ...inputStyle, color: 'white' }}>
                  <option value="ANALYST">Analista</option>
                  <option value="SUPERADMIN">Superadmin</option>
                </select>
              </div>
            </div>
            {error && <p className="text-[11px]" style={{ color: '#f87171' }}>{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ background: 'oklch(0.60 0.18 240)' }}>
                {saving ? 'Guardando…' : 'Crear usuario'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white/5" style={{ color: 'oklch(0.50 0 0)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancelar
              </button>
            </div>
          </motion.form>
        )}

        {/* Users list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={18} className="animate-spin" style={{ color: 'oklch(0.50 0 0)' }} /></div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${u.active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`,
                  opacity: u.active ? 1 : 0.45,
                }}
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: u.role === 'SUPERADMIN' ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.06)' }}
                >
                  <Shield size={13} style={{ color: u.role === 'SUPERADMIN' ? 'oklch(0.60 0.18 240)' : 'oklch(0.44 0 0)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{u.name}</span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0"
                      style={u.role === 'SUPERADMIN'
                        ? { background: 'rgba(96,165,250,0.12)', color: 'oklch(0.60 0.18 240)' }
                        : { background: 'rgba(255,255,255,0.07)', color: 'oklch(0.50 0 0)' }
                      }
                    >
                      {u.role === 'SUPERADMIN' ? 'Admin' : 'Analista'}
                    </span>
                    {!u.active && <span className="text-[10px]" style={{ color: 'oklch(0.40 0 0)' }}>· inactivo</span>}
                  </div>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'oklch(0.44 0 0)' }}>{u.email}</p>
                </div>
                <span className="text-[10px] flex-shrink-0" style={{ color: 'oklch(0.36 0 0)' }}>
                  {new Date(u.createdAt).toLocaleDateString('es-PE')}
                </span>
                {u.active && u.role !== 'SUPERADMIN' && (
                  <button
                    onClick={() => deactivate(u.id)}
                    title="Desactivar usuario"
                    className="flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-red-500/10"
                    style={{ color: 'oklch(0.44 0 0)' }}
                  >
                    <UserX size={13} />
                  </button>
                )}
                {u.active && u.role === 'SUPERADMIN' && (
                  <UserCheck size={13} style={{ color: 'oklch(0.44 0 0)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
