// src/components/WelcomeModal.tsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Mascot from './Mascot'
import { FaBullhorn, FaLock, FaHandRock } from 'react-icons/fa'

export default function WelcomeModal() {
  const { user, profile } = useAuth()
  const [visible, setVisible] = useState(false)
  const dismissed = useRef(false) // Evita que reaparezca durante la sesión

  useEffect(() => {
    if (!user || !profile || dismissed.current) return

    // ✅ Ahora se verifica POR CUENTA (columna en la base de datos)
    const yaVio = (profile as any)?.welcome_seen === true

    if (!yaVio) {
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
  }, [user, profile])

  const handleClose = async () => {
    dismissed.current = true
    setVisible(false)
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ welcome_seen: true })
        .eq('id', user.id)
      if (error) console.error('No se pudo guardar welcome_seen:', error)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-[scaleIn_0.3s_ease-out]">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-purple-600/40 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-purple-900/30">
        
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-2xl"></div>
            <div className="relative mascot-wiggle">
              <Mascot color="#a855f7" size={90} expression="feliz" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          ¡Bienvenido a SANAT! 🎸
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          La comunidad de músicos de Tucumán. Antes de empezar, tené en cuenta estas 3 reglas de oro:
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
            <div className="w-9 h-9 bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaBullhorn className="text-purple-400" size={14} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Una publicación a la vez</p>
              <p className="text-gray-500 text-xs">Podés editarla cuando quieras, pero solo una activa por usuario.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
            <div className="w-9 h-9 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaLock className="text-blue-400" size={14} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Cuidá tus datos</p>
              <p className="text-gray-500 text-xs">No publiques teléfono ni dirección exacta. Coordiná por el chat interno.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
            <div className="w-9 h-9 bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaHandRock className="text-green-400" size={14} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Respeto ante todo</p>
              <p className="text-gray-500 text-xs">Somos músicos buscando conectar. El maltrato no tiene lugar acá.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/40 hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  )
}