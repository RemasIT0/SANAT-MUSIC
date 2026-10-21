import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaKey } from 'react-icons/fa'
import Toast from '../components/Toast'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          setToast({ message: 'Las contraseñas no coinciden', type: 'error' })
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setToast({ message: 'La contraseña debe tener al menos 6 caracteres', type: 'error' })
          setLoading(false)
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split('@')[0],
              display_name: email.split('@')[0]
            }
          }
        })
        
        if (error) throw error

        setToast({ message: '¡Cuenta creada! Revisa tu email para confirmar.', type: 'success' })
        setTimeout(() => navigate('/verificar-email'), 4000)
        
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        navigate('/home', { replace: true })
      }
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('email not confirmed') || error.message?.toLowerCase().includes('no confirmado')) {
        setToast({ message: 'Debes confirmar tu email antes de entrar.', type: 'info' })
        setTimeout(() => navigate('/verificar-email'), 4000)
      } else {
        setToast({ message: error.message || 'Error inesperado', type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setToast({ message: 'Ingresa tu email primero para recuperar la contraseña', type: 'info' })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-contrasena`
      })
      if (error) throw error
      setToast({ message: 'Te enviamos un link a tu email para restablecer la contraseña', type: 'success' })
    } catch (error: any) {
      setToast({ message: error.message || 'Error al enviar el link', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`
    button.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0f0f0f] text-gray-200 px-4 py-6 font-sans overflow-hidden">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="guitar-bg">
        <div className="guitar-string"></div>
        <div className="guitar-string"></div>
        <div className="guitar-string"></div>
        <div className="guitar-string"></div>
        <div className="guitar-string"></div>
        <div className="guitar-string"></div>
      </div>

      {/* ✅ TARJETA CON PADDING RESPONSIVE */}
      <div className="relative z-10 w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl animate-[slideIn_0.8s_ease-out]">
        
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-wide">SANAT</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {isRegistering ? 'Creá tu cuenta para encontrar músicos.' : 'Iniciá sesión para continuar.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div className="relative w-full">
            <input
              className="cyber-input w-full p-3.5 pr-20 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-base sm:text-[15px] outline-none transition-all duration-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 placeholder:text-gray-600"
              type="email"
              placeholder="> tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <div className="mini-eq">
              <div className="eq-bar"></div><div className="eq-bar"></div><div className="eq-bar"></div><div className="eq-bar"></div>
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div className="relative w-full">
            <input
              className="cyber-input w-full p-3.5 pr-[85px] bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-base sm:text-[15px] outline-none transition-all duration-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 placeholder:text-gray-600"
              type={showPassword ? 'text' : 'password'}
              placeholder="> tu_contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors bg-transparent z-10 p-2"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
            <div className="mini-eq">
              <div className="eq-bar"></div><div className="eq-bar"></div><div className="eq-bar"></div><div className="eq-bar"></div>
            </div>
          </div>

          {/* CONFIRMAR CONTRASEÑA */}
          {isRegistering && (
            <div className="relative w-full">
              <input
                className="cyber-input w-full p-3.5 pr-[85px] bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-base sm:text-[15px] outline-none transition-all duration-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 placeholder:text-gray-600"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="> confirmar_contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors bg-transparent z-10 p-2"
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
              <div className="mini-eq">
                <div className="eq-bar"></div><div className="eq-bar"></div><div className="eq-bar"></div><div className="eq-bar"></div>
              </div>
            </div>
          )}
          
          {/* RECUPERAR CONTRASEÑA */}
          {!isRegistering && (
            <div className="text-right">
              <button 
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors bg-transparent flex items-center justify-end gap-1 ml-auto"
              >
                <FaKey size={10} /> ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
          
          {/* ✅ BOTÓN MÁS GRANDE EN MÓVIL */}
          <button
            ref={buttonRef}
            type="submit"
            disabled={loading}
            onClick={handleRipple}
            className="relative w-full py-3.5 sm:py-3 bg-purple-700 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden mt-2 text-base sm:text-sm"
          >
            {loading ? 'Procesando...' : isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-400 pt-5 mt-5 sm:pt-6 sm:mt-6 border-t border-[#2a2a2a]">
          {isRegistering ? (
            <p>
              ¿Ya tenés cuenta?{' '}
              <button 
                onClick={() => setIsRegistering(false)} 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors bg-transparent"
              >
                Inicia sesión
              </button>
            </p>
          ) : (
            <p>
              ¿No tenés cuenta?{' '}
              <button 
                onClick={() => setIsRegistering(true)} 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors bg-transparent"
              >
                Registrate
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}