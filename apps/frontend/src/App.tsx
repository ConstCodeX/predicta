import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AppToolbar } from './components/AppToolbar';
import { AIChatPanel } from './features/chat/AIChatPanel';
import { CsvUploadPanel } from './features/csv-upload/CsvUploadPanel';
import { MapDashboard } from './features/map/MapDashboard';

export default function App() {
  const [csvOpen, setCsvOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapDashboard />

      <AppToolbar
        csvOpen={csvOpen}
        chatOpen={chatOpen}
        onToggleCsv={() => setCsvOpen((v) => !v)}
        onToggleChat={() => { setChatOpen((v) => !v); setCsvOpen(false); }}
      />

      <AnimatePresence>
        {csvOpen && <CsvUploadPanel onClose={() => setCsvOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && <AIChatPanel onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
