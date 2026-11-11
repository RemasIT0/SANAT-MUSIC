// src/components/AppErrorBoundary.tsx
// Si una pantalla se rompe, en vez de quedar en blanco muestra un mensaje amable
// con un botón para recargar, y avisa del error (Sentry).
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '../lib/monitoring'

interface State { failed: boolean }

export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-6 text-center">
        <div className="max-w-sm space-y-4">
          <p className="text-white text-lg font-semibold">Algo salió mal en esta pantalla</p>
          <p className="text-sm text-gray-400">Ya nos llegó el aviso para arreglarlo. Probá recargar; tus datos están a salvo.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold">Recargar</button>
            <button onClick={() => { window.location.href = '/home' }} className="px-5 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-white text-sm">Ir al Inicio</button>
          </div>
        </div>
      </div>
    )
  }
}
