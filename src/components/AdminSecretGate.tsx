// src/components/AdminSecretGate.tsx
// Pregunta secreta para la cuenta admin. La verificación ocurre en Supabase
// (verify_admin_secret); esta pantalla solo la pide y espera la respuesta.
import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FaUserShield, FaSpinner, FaSignOutAlt, FaLock } from 'react-icons/fa'

type GateStatus = 'checking' | 'locked' | 'unlocked'

export default function AdminSecretGate({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<GateStatus>('checking')
  const [question, setQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const checkUnlocked = async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('is_admin_verified')
    // PGRST202 = la función no existe: el SQL de seguridad todavía no se instaló
    if (error?.code === 'PGRST202') {
      console.warn('Pregunta secreta no instalada en Supabase (SEGURIDAD_admin_y_likes.sql)')
      return true
    }
    return !!data
  }

  useEffect(() => {
    const init = async () => {
      if (await checkUnlocked()) { setStatus('unlocked'); return }
      const { data } = await supabase.rpc('get_admin_question')
      setQuestion(data ?? null)
      setStatus('locked')
    }
    init()
  }, [])

  // El desbloqueo dura 12 h: revisar cada 5 min y volver a pedir la pregunta si venció
  useEffect(() => {
    if (status !== 'unlocked') return
    const interval = setInterval(async () => {
      if (!(await checkUnlocked())) {
        const { data } = await supabase.rpc('get_admin_question')
        setQuestion(data ?? null)
        setAnswer('')
        setStatus('locked')
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() || sending) return
    setSending(true)
    setError('')
    const { data, error } = await supabase.rpc('verify_admin_secret', { p_answer: answer })
    setSending(false)
    if (error) { setError(error.message); return }
    if (data) { setStatus('unlocked'); return }
    setAnswer('')
    setError('Respuesta incorrecta.')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (status === 'unlocked') return <>{children}</>

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f0f0f]">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center mb-4">
          <FaUserShield className="text-purple-400" size={24} />
        </div>
        <h1 className="text-white text-xl text-center mb-1">Verificación de admin</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Respondé tu pregunta secreta para entrar con esta cuenta.</p>

        {status === 'checking' ? (
          <div className="flex justify-center py-6"><FaSpinner className="animate-spin text-purple-500" size={24} /></div>
        ) : question ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Pregunta</p>
              <p className="text-white text-sm">{question}</p>
            </div>
            <input
              type="password"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Tu respuesta"
              autoFocus
              autoComplete="off"
              className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={sending || !answer.trim()} className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors">
              {sending ? <FaSpinner className="animate-spin" /> : <FaLock size={13} />} Verificar
            </button>
          </form>
        ) : (
          <p className="text-amber-300 text-sm text-center bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">
            La pregunta secreta no está configurada. Corré el script de seguridad en Supabase.
          </p>
        )}

        <button onClick={handleSignOut} className="w-full mt-4 py-2.5 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
          <FaSignOutAlt size={13} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
