import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/i18n.js'; // Initialize i18n before rendering App
import App from '@/App.jsx';
import '@/index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <App />
  );
}