import { useState } from 'react';
import { FileUp, Settings, Users, X } from 'lucide-react';
import { CsvUploadPanel } from '../csv-upload/CsvUploadPanel';
import { UsersPanel } from '../users/UsersPanel';
import { PromptConfigPanel } from '../config/PromptConfigPanel';

type AdminTab = 'csv' | 'users' | 'config';

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'csv',    label: 'Subir datos CSV', icon: <FileUp size={13} /> },
  { id: 'users',  label: 'Usuarios',        icon: <Users size={13} /> },
  { id: 'config', label: 'Config IA',       icon: <Settings size={13} /> },
];

interface Props {
  token: string;
  onClose: () => void;
}

export function AdminPanel({ token, onClose }: Props) {
  const [tab, setTab] = useState<AdminTab>('csv');

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: 'rgba(9,9,11,0.98)' }}
    >
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center gap-3 px-6 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="text-sm font-bold text-white">Administración</span>

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 ml-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                color: tab === t.id ? 'white' : 'oklch(0.50 0 0)',
                background: tab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="ml-auto rounded-lg p-1.5 transition-colors hover:bg-white/5"
          style={{ color: 'oklch(0.46 0 0)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {tab === 'csv'    && <CsvUploadPanel token={token} onClose={onClose} />}
        {tab === 'users'  && <UsersPanel token={token} />}
        {tab === 'config' && <PromptConfigPanel token={token} onClose={() => setTab('csv')} />}
      </div>
    </div>
  );
}
