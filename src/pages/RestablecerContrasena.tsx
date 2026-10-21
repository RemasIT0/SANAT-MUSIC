// src/pages/RestablecerContrasena.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Toast from '../components/Toast'
import { FaLock, FaEye, FaEyeSlash, FaSpinner, FaKey } from 'react-icons/fa'
import AnimatedBackground from '../components/AnimatedBackground'

export default function RestablecerContrasena() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const navigate = useNavigate()

  // Verificar si el link de recuperación es válido al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        setToast({ message: 'Link inválido o expirado. Solicita uno nuevo.', type: 'error' })
        setTimeout(() => navigate('/login'), 4000)
      } else {
        setIsValidSession(true)
      }
    }
    checkSession()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Las contraseñas no coinciden', type: 'error' })
      return
    }
    if (newPassword.length < 6) {
      setToast({ message: 'La contraseña debe tener al menos 6 caracteres', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      setToast({ message: '¡Contraseña actualizada con éxito!', type: 'success' })
      setTimeout(() => navigate('/login'), 3000)
    } catch (error: any) {
      setToast({ message: error.message || 'Error al actualizar la contraseña', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f0f] gap-4">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
        <p className="text-gray-400">Verificando link...</p>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0f0f0f] text-gray-200 p-4 font-sans overflow-hidden">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="guitar-bg">
        <div className="guitar-string"></div><div className="guitar-string"></div><div className="guitar-string"></div>
        <div className="guitar-string"></div><div className="guitar-string"></div><div className="guitar-string"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] p-8 sm:p-10 rounded-2xl shadow-2xl animate-[slideIn_0.8s_ease-out]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center border-2 border-purple-600/40 mx-auto mb-4">
            <FaKey className="text-purple-400 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Nueva Contraseña</h1>
          <p className="text-gray-400 text-sm">Ingresa tu nueva contraseña para tu cuenta.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NUEVA CONTRASEÑA */}
          <div className="relative w-full">
            <input
              className="cyber-input w-full p-3 pr-[85px] bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-[15px] outline-none transition-all duration-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 placeholder:text-gray-600"
              type={showPassword ? 'text' : 'password'}
              placeholder="> Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors bg-transparent z-10" tabIndex={-1}>
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>

          {/* CONFIRMAR CONTRASEÑA */}
          <div className="relative w-full">
            <input
              className="cyber-input w-full p-3 pr-[85px] bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-[15px] outline-none transition-all duration-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 placeholder:text-gray-600"
              type={showConfirm ? 'text' : 'password'}
              placeholder="> Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors bg-transparent z-10" tabIndex={-1}>
              {showConfirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3 bg-purple-700 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden mt-2 flex items-center justify-center gap-2"
          >
            {loading ? <><FaSpinner className="animate-spin" /> Guardando...</> : <><FaLock /> Actualizar Contraseña</>}
          </button>
        </form>
      </div>
    </div>
  )
}