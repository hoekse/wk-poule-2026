import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow/latin-700.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import { App } from './App';
import { NavProvider, WinkelProvider } from './lib/winkel';
import './styles.css';

// Nieuwe versie van de app: automatisch bijwerken op de achtergrond (werkt daarna ook offline).
if ('serviceWorker' in navigator) registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WinkelProvider>
      <NavProvider>
        <App />
      </NavProvider>
    </WinkelProvider>
  </StrictMode>,
);
