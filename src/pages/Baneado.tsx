// src/pages/Baneado.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Mascot from '../components/Mascot'
import AnimatedBackground from '../components/AnimatedBackground'
import { FaBan, FaArrowLeft } from 'react-icons/fa'

export default function Baneado() {
  const navigate = useNavigate()
  const [reason] = useState(() => localStorage.getItem('sanat_ban_reason') || 'Sin motivo especificado')

  const irAlLogin = () => {
    localStorage.removeItem('sanat_ban_reason')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen relative text-gray-200 font-sans flex items-center justify-center p-4">
      <AnimatedBackground />
      <div className="relative bg-[#1a1a1a] border border-red-900/40 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center border-2 border-red-700/50">
            <FaBan className="text-red-400 text-3xl" />
          </div>
        </div>
        <div className="flex justify-center mb-4 opacity-70">
          <Mascot color="#6b7280" size={70} expression="normal" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Cuenta suspendida</h1>
        <p className="text-gray-400 text-sm mb-4">Tu cuenta fue suspendida por el equipo de SANAT.</p>
        <div className="bg-red-950/40 border border-red-900/40 rounded-lg p-3 mb-6 text-left">
          <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Motivo</p>
          <p className="text-sm text-gray-300">{reason}</p>
        </div>
        <p className="text-xs text-gray-500 mb-6">
          Si creés que es un error, escribinos a{' '}
          <a href="mailto:remaslove281@gmail.com" className="text-purple-400 hover:text-purple-300 font-semibold">remaslove281@gmail.com</a>
        </p>
        <button onClick={irAlLogin} className="w-full py-3 bg-[#2a2a2a] hover:bg-[#333] text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
          <FaArrowLeft /> Volver al inicio
        </button>
      </div>
    </div>
  )
}