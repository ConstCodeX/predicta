import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { TopNav, type AppView } from './components/TopNav';
import { LoginPage } from './features/auth/LoginPage';
import { useAuthStore } from './features/auth/useAuthStore';
import { AIChatPanel } from './features/chat/AIChatPanel';
import { AdminPanel } from './features/admin/AdminPanel';
import { MapDashboard } from './features/map/MapDashboard';
import { MapToolbar, type MapTool } from './features/map/MapToolbar';
import { TimelinePlayer } from './features/map/timeline/TimelinePlayer';
import { DataExplorerPanel } from './features/data/DataExplorerPanel';
import { AnalyticsPanel } from './features/analytics/AnalyticsPanel';
import { PredictionsPanel } from './features/predictions/PredictionsPanel';
import { HeatmapPanel } from './features/heatmap/HeatmapPanel';
import { ScenariosPanel } from './features/escenarios/ScenariosPanel';

export default function App() {
  const { token } = useAuthStore();
  const [view, setView] = useState<AppView>('map');
  const [activeTool, setActiveTool] = useState<MapTool | null>(null);

  const handleChangeView = (v: AppView) => {
    setView(v);
    if (v !== 'map') setActiveTool(null);
  };

  const handleToggleTool = (tool: MapTool) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  const isMapView = view === 'map';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {token && <TopNav view={view} onChangeView={handleChangeView} />}

      <div className="relative flex-1 overflow-hidden">
        {/* Map is always mounted underneath */}
        <MapDashboard />

        {/* Map tools — only in map view */}
        {token && isMapView && (
          <>
            <MapToolbar activeTool={activeTool} onToggle={handleToggleTool} />

            {/* Timeline player — bottom bar */}
            <AnimatePresence>
              {activeTool === 'timeline' && (
                <TimelinePlayer
                  key="timeline"
                  token={token}
                  onClose={() => setActiveTool(null)}
                />
              )}
            </AnimatePresence>

            {/* Predictions side panel */}
            <AnimatePresence>
              {activeTool === 'predictions' && (
                <PredictionsPanel
                  key="predictions"
                  token={token}
                  onClose={() => setActiveTool(null)}
                />
              )}
            </AnimatePresence>

            {/* Heatmap side panel */}
            <AnimatePresence>
              {activeTool === 'heatmap' && (
                <HeatmapPanel
                  key="heatmap"
                  token={token}
                  onClose={() => setActiveTool(null)}
                />
              )}
            </AnimatePresence>

            {/* Scenarios panel */}
            <AnimatePresence>
              {activeTool === 'scenarios' && (
                <ScenariosPanel
                  key="scenarios"
                  token={token}
                  onClose={() => setActiveTool(null)}
                />
              )}
            </AnimatePresence>

            {/* AI chat panel */}
            <AnimatePresence>
              {activeTool === 'chat' && (
                <AIChatPanel
                  key="chat"
                  token={token}
                  onClose={() => setActiveTool(null)}
                />
              )}
            </AnimatePresence>
          </>
        )}

        {/* Full-screen page overlays */}
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
          {token && view === 'admin' && (
            <div key="admin" className="absolute inset-0 z-20">
              <AdminPanel token={token} onClose={() => handleChangeView('map')} />
            </div>
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
