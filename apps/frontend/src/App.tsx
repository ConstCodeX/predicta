import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AppToolbar } from './components/AppToolbar';
import { TopNav, type AppView } from './components/TopNav';
import { AIChatPanel } from './features/chat/AIChatPanel';
import { CsvUploadPanel } from './features/csv-upload/CsvUploadPanel';
import { LoginPage } from './features/auth/LoginPage';
import { useAuthStore } from './features/auth/useAuthStore';
import { MapDashboard } from './features/map/MapDashboard';
import { TimelinePlayer } from './features/map/timeline/TimelinePlayer';
import { DataExplorerPanel } from './features/data/DataExplorerPanel';
import { AnalyticsPanel } from './features/analytics/AnalyticsPanel';
import { UsersPanel } from './features/users/UsersPanel';
import { PredictionsPanel } from './features/predictions/PredictionsPanel';

export default function App() {
  const { token } = useAuthStore();
  const [view, setView] = useState<AppView>('map');
  const [csvOpen, setCsvOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [predictionsOpen, setPredictionsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const handleChangeView = (v: AppView) => {
    setView(v);
    if (v !== 'map') {
      setCsvOpen(false);
      setChatOpen(false);
      setTimelineOpen(false);
    }
    if (v === 'predictions') {
      setPredictionsOpen(true);
    } else {
      setPredictionsOpen(false);
    }
  };

  const handleToggleTimeline = () => {
    setTimelineOpen((v) => !v);
    setCsvOpen(false);
    setChatOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top navigation */}
      {token && (
        <TopNav
          view={view}
          onChangeView={handleChangeView}
          timelineActive={timelineOpen}
          onToggleTimeline={handleToggleTimeline}
        />
      )}

      {/* Main area — flex-1 fills remaining height below nav */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map always mounted */}
        <MapDashboard />

        {/* Timeline player — overlaid at bottom of map */}
        <AnimatePresence>
          {token && view === 'map' && timelineOpen && (
            <TimelinePlayer
              key="timeline"
              token={token}
              onClose={() => setTimelineOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Non-map overlays */}
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

        {/* Map-specific tools */}
        {token && view === 'map' && !timelineOpen && (
          <AppToolbar
            csvOpen={csvOpen}
            chatOpen={chatOpen}
            onToggleCsv={() => { setCsvOpen((v) => !v); setChatOpen(false); }}
            onToggleChat={() => { setChatOpen((v) => !v); setCsvOpen(false); }}
          />
        )}

        {/* Predictions side panel */}
        <AnimatePresence>
          {token && predictionsOpen && (
            <PredictionsPanel
              key="predictions"
              token={token}
              onClose={() => { setPredictionsOpen(false); setView('map'); }}
            />
          )}
        </AnimatePresence>

        {/* CSV upload modal */}
        <AnimatePresence>
          {token && csvOpen && (
            <CsvUploadPanel key="csv" token={token} onClose={() => setCsvOpen(false)} />
          )}
        </AnimatePresence>

        {/* AI chat panel */}
        <AnimatePresence>
          {token && chatOpen && (
            <AIChatPanel key="chat" token={token} onClose={() => setChatOpen(false)} />
          )}
        </AnimatePresence>

        {/* Login overlay */}
        <AnimatePresence>
          {!token && <LoginPage key="login" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
