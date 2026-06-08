import React from 'react';
import ReactDOM from 'react-dom/client';
import './telemetry'; // Initialize Application Insights (must be early)
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
