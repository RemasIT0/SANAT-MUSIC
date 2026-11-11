import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx' // 👈 Agregamos esta línea
import { initPwa } from './lib/pwa'
import { DialogProvider } from './components/DialogProvider'
import AppErrorBoundary from './components/AppErrorBoundary'
import { initMonitoring } from './lib/monitoring'

// App instalable + notificaciones del dispositivo
initPwa()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)

// Aviso automático de errores: se carga cuando la página ya terminó de abrir
window.addEventListener('load', () => { initMonitoring() })