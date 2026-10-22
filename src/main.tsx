import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Register service worker immediately to cache the application shell and allow 100% offline start/restart
if ('serviceWorker' in navigator) {
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
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

