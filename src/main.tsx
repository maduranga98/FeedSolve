import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n/config'
import { initPerformanceMonitoring } from './lib/performance'
import { initializeSentry, startSessionHeartbeat } from './lib/monitoring'
import { ErrorBoundary } from './components/Shared/ErrorBoundary'

// Initialize monitoring
initializeSentry()
initPerformanceMonitoring()
startSessionHeartbeat()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
