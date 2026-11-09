import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { SessieProvider } from './lib/sessie';
import { MeldingProvider } from './components/Meldingen';
import './styles.css';

// Nieuwe versie van de app: automatisch bijwerken op de achtergrond.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessieProvider>
        <MeldingProvider>
          <App />
        </MeldingProvider>
      </SessieProvider>
    </BrowserRouter>
  </StrictMode>,
);
