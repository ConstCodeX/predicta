import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Apply persisted theme before first paint to avoid flash
try {
  const stored = JSON.parse(localStorage.getItem('predicta-theme') ?? '{}') as { state?: { theme?: string } };
  if (stored?.state?.theme === 'light') document.documentElement.classList.add('light');
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
