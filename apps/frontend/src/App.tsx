import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AppToolbar } from './components/AppToolbar';
import { AIChatPanel } from './features/chat/AIChatPanel';
import { CsvUploadPanel } from './features/csv-upload/CsvUploadPanel';
import { LoginPage } from './features/auth/LoginPage';
import { useAuthStore } from './features/auth/useAuthStore';
import { MapDashboard } from './features/map/MapDashboard';

export default function App() {
  const { token } = useAuthStore();
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
        {csvOpen && token && <CsvUploadPanel key="csv" token={token} onClose={() => setCsvOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && token && <AIChatPanel key="chat" token={token} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {!token && <LoginPage key="login" />}
      </AnimatePresence>
    </div>
  );
}
