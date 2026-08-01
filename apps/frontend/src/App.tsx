import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { TopNav, type AppView } from './components/TopNav';
import { LoginPage } from './features/auth/LoginPage';
import { useAuthStore } from './features/auth/useAuthStore';
import { AdminPanel } from './features/admin/AdminPanel';
import { MapDashboard } from './features/map/MapDashboard';
import { MapToolbar, type MapTool } from './features/map/MapToolbar';
import { TimelinePlayer } from './features/map/timeline/TimelinePlayer';
import { DataExplorerPanel } from './features/data/DataExplorerPanel';
import { AnalyticsPanel } from './features/analytics/AnalyticsPanel';
import { HeatmapPanel } from './features/heatmap/HeatmapPanel';
import { ScenariosPanel } from './features/escenarios/ScenariosPanel';
import { AIChatPanel } from './features/chat/AIChatPanel';
import { UnifiedPredictionsPanel } from './features/predictions/UnifiedPredictionsPanel';
import type { SEIRModelResponse } from './features/seir-model/seir-types';

type SEIRSubTab = 'epidemico' | 'humanitario' | 'economico';

export default function App() {
  const { token } = useAuthStore();
  const [view, setView]             = useState<AppView>('map');
  const [activeTool, setActiveTool] = useState<MapTool | null>(null);
  const [seirResult, setSeirResult] = useState<SEIRModelResponse | null>(null);
  const [seirSubTab, setSeirSubTab] = useState<SEIRSubTab>('epidemico');

  const handleChangeView = (v: AppView) => {
    setView(v);
    if (v !== 'map') setActiveTool(null);
  };

  const handleToggleTool = (tool: MapTool) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  const isMapView       = view === 'map';
  const predictionsOpen = token && isMapView && activeTool === 'predictions';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {token && <TopNav view={view} onChangeView={handleChangeView} />}

      <div className="relative flex-1 overflow-hidden">

        {/* ── Map — always mounted, shrinks when predictions panel open ── */}
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width:      predictionsOpen ? '50%' : '100%',
            transition: 'width 0.45s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <MapDashboard seirData={predictionsOpen ? seirResult : null} seirSubTab={seirSubTab} />
        </div>

        {/* ── Map toolbar — only in map view ── */}
        {token && isMapView && (
          <>
            <MapToolbar activeTool={activeTool} onToggle={handleToggleTool} />

            <AnimatePresence>
              {activeTool === 'timeline' && (
                <TimelinePlayer key="timeline" token={token} onClose={() => setActiveTool(null)} />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {activeTool === 'heatmap' && (
                <HeatmapPanel key="heatmap" token={token} onClose={() => setActiveTool(null)} />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {activeTool === 'scenarios' && (
                <ScenariosPanel key="scenarios" token={token} onClose={() => setActiveTool(null)} />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {activeTool === 'chat' && (
                <AIChatPanel key="chat" token={token} onClose={() => setActiveTool(null)} />
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── Unified Predictions panel — 50/50 split from right ── */}
        <AnimatePresence>
          {predictionsOpen && (
            <motion.div
              key="predictions"
              className="absolute top-0 right-0 h-full z-20"
              style={{ width: '50%' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <UnifiedPredictionsPanel
                token={token}
                onClose={() => setActiveTool(null)}
                onResult={setSeirResult}
                onSubTabChange={setSeirSubTab}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Full-screen overlays ── */}
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

        {/* ── Login overlay ── */}
        <AnimatePresence>
          {!token && <LoginPage key="login" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
