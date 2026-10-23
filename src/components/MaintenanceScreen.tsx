// src/components/MaintenanceScreen.tsx
import { FaTools, FaClock, FaEnvelope, FaArrowLeft } from 'react-icons/fa'

export default function MaintenanceScreen() {
  // ✅ Usamos window.location para garantizar que el botón funcione siempre
  const handleBackToLogin = () => {
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-purple-600/30 rounded-2xl p-8 shadow-2xl text-center animate-[fadeIn_0.5s_ease-out]">
        {/* Icono animado */}
        <div className="relative mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-purple-900 rounded-full flex items-center justify-center animate-pulse">
            <FaTools className="text-white text-4xl" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
            <FaClock className="text-white text-sm" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          SANAT está en mantenimiento
        </h1>

        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Estamos trabajando en mejorar la experiencia para todos los músicos. 
          La plataforma estará disponible muy pronto. ¡Gracias por tu paciencia!
        </p>

        <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-4 mb-6">
          <p className="text-purple-300 text-xs font-semibold mb-2">
            ¿Tenés consultas o querés ser de los primeros en probar?
          </p>
          <a 
            href="mailto:remaslove281@gmail.com" 
            className="flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            <FaEnvelope size={14} />
            remaslove281@gmail.com
          </a>
        </div>

        <button
          onClick={handleBackToLogin}
          className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
        >
          <FaArrowLeft size={16} /> Volver al Login
        </button>

        <div className="flex items-center justify-center gap-2 text-gray-600 text-xs mt-6">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Sistema en desarrollo activo</span>
        </div>
      </div>
    </div>
  )
}