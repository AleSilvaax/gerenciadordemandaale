
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { cleanupPerformance, optimizePerformance } from './utils/performanceUtils'

// Otimizações de performance
cleanupPerformance();
optimizePerformance();

// Ensuring React is properly imported and used
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
