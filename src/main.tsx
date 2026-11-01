import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx' // 👈 Agregamos esta línea
import { initPwa } from './lib/pwa'
import { DialogProvider } from './components/DialogProvider'

// App instalable + notificaciones del dispositivo
initPwa()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <DialogProvider>
        <App />
      </DialogProvider>
    </AuthProvider>
  </React.StrictMode>,
)