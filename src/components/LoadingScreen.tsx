// src/components/LoadingScreen.tsx
import { FaMusic } from 'react-icons/fa'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Preparando tu espacio...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-[#0f0f0f] z-50 flex flex-col items-center justify-center">
      {/* Ícono de nota musical animado */}
      <div className="mb-8 relative">
        <FaMusic className="text-purple-600 text-7xl animate-bounce" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border-2 border-purple-600/30 rounded-full animate-ping" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-purple-600/20 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Mensaje */}
      <p className="text-white text-lg font-medium mb-6 tracking-wide">{message}</p>

      {/* Barra de progreso */}
      <div className="w-64 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div className="h-full bg-purple-600 rounded-full animate-[loadBar_2s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes loadBar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}