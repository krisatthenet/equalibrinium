import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/i18n.js'; // Initialize i18n before rendering App
import App from '@/App.jsx';
import '@/index.css';

// After a new deployment, cached HTML may reference old chunk hashes that no
// longer exist on the server. Intercept those load errors and force a reload.
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <App />
  );
}