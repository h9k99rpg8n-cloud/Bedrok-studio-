import {createRoot} from 'react-dom/client';
import 'boxicons/css/boxicons.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// PWA v4.0.0-alpha: registra el service worker solo en producción.
// Si el registro falla (por ejemplo, en un origen sin HTTPS o sin SW),
// la app sigue funcionando como web normal.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn(
        '[Bedrock Studio] No se pudo registrar el service worker:',
        error,
      );
    });
  });
}
