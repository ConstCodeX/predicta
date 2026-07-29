import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AppToolbar } from './components/AppToolbar';
import { TopNav, type AppView } from './components/TopNav';
import { AIChatPanel } from './features/chat/AIChatPanel';
import { CsvUploadPanel } from './features/csv-upload/CsvUploadPanel';
import { LoginPage } from './features/auth/LoginPage';
import { useAuthStore } from './features/auth/useAuthStore';
import { MapDashboard } from './features/map/MapDashboard';
import { DataExplorerPanel } from './features/data/DataExplorerPanel';
import { AnalyticsPanel } from './features/analytics/AnalyticsPanel';
import { UsersPanel } from './features/users/UsersPanel';

export default function App() {
  const { token } = useAuthStore();
  const [view, setView] = useState<AppView>('map');
  const [csvOpen, setCsvOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleChangeView = (v: AppView) => {
    setView(v);
    if (v !== 'map') { setCsvOpen(false); setChatOpen(false); }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top navigation (only when authenticated) */}
      {token && <TopNav view={view} onChangeView={handleChangeView} />}

      {/* Main area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map always mounted for performance */}
        <MapDashboard />

        {/* Non-map views overlay */}
        <AnimatePresence>
          {token && view === 'data' && (
            <div key="data" className="absolute inset-0 z-20">
              <DataExplorerPanel token={token} />
            </div>
          )}
          {token && view === 'analytics' && (
            <div key="analytics" className="absolute inset-0 z-20">
              <AnalyticsPanel token={token} />
            </div>
          )}
          {token && view === 'users' && (
            <div key="users" className="absolute inset-0 z-20">
              <UsersPanel token={token} />
            </div>
          )}
        </AnimatePresence>

        {/* Map-specific tools (only visible in map view) */}
        {token && view === 'map' && (
          <>
            <AppToolbar
              csvOpen={csvOpen}
              chatOpen={chatOpen}
              onToggleCsv={() => setCsvOpen((v) => !v)}
              onToggleChat={() => { setChatOpen((v) => !v); setCsvOpen(false); }}
            />
            <AnimatePresence>
              {csvOpen && <CsvUploadPanel key="csv" token={token} onClose={() => setCsvOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
              {chatOpen && <AIChatPanel key="chat" token={token} onClose={() => setChatOpen(false)} />}
            </AnimatePresence>
          </>
        )}

        {/* Login overlay */}
        <AnimatePresence>
          {!token && <LoginPage key="login" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
