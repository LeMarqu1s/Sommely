import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';
import App from './App';
import './index.css';

// Enregistrer le Service Worker pour les push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Initialiser Sentry si disponible (seulement si DSN non vide)
const sentry = import.meta.env.VITE_SENTRY_DSN;
if (sentry && typeof sentry === 'string' && sentry.length > 10) {
  import('./lib/errorTracking').then(({ initSentry }) => initSentry()).catch(() => {});
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Élément #root introuvable');

try {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (err) {
  rootEl.innerHTML = `
    <div style="padding: 24px; font-family: system-ui; max-width: 600px;">
      <h1 style="color: #722F37;">Erreur de chargement Sommely</h1>
      <pre style="background: #f5f5f5; padding: 16px; overflow: auto; font-size: 12px;">${String(err)}</pre>
      <p>Ouvre la console (F12) pour plus de détails.</p>
    </div>
  `;
  console.error('Sommely load error:', err);
}

