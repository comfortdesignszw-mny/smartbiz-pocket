import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Register service worker immediately to cache the application shell and allow 100% offline start/restart in production
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[SmartBiz PWA] New version ready for offline caching.');
      },
      onOfflineReady() {
        console.log('[SmartBiz PWA] 100% Offline Ready: Zero active internet required to start.');
      },
      onRegisterError(error) {
        console.warn('[SmartBiz PWA] Service worker registration notice:', error);
      },
    });
  } else {
    // In development mode with disabled HMR, clean up any stale service workers from earlier tests
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

