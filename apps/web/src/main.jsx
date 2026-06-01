import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/i18n.js'; // Initialize i18n before rendering App
import App from '@/App.jsx';
import '@/index.css';

// After a new deployment, cached HTML may reference old chunk hashes that no
// longer exist on the server. Reload once to get fresh HTML + new chunk URLs.
// Cap at 2 reloads per session to avoid an infinite loop if chunks are broken.
window.addEventListener('vite:preloadError', () => {
  const key = 'vite_preload_reloads';
  const count = parseInt(sessionStorage.getItem(key) || '0', 10);
  if (count < 2) {
    sessionStorage.setItem(key, String(count + 1));
    window.location.reload();
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <App />
  );
}