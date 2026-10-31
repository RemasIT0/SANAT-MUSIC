// src/components/TestBanner.tsx
// Franja roja arriba de todo (ej. "versión de prueba"). La activa el admin.
import { useState, useEffect } from 'react'
import { useAppSettings, DEFAULT_BANNER_TEXT } from '../hooks/useAppSettings'
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa'

const BANNER_HEIGHT = '32px'
const HIDDEN_KEY = 'sanat_banner_hidden'

export default function TestBanner() {
  const { settings } = useAppSettings()
  const [hiddenText, setHiddenText] = useState(() => {
    try { return sessionStorage.getItem(HIDDEN_KEY) } catch { return null }
  })

  const text = settings?.banner_text?.trim() || DEFAULT_BANNER_TEXT
  // Cerrar la franja la oculta en esta sesión, salvo que el admin cambie el texto
  const visible = !!settings?.banner_enabled && hiddenText !== text

  // Correr el resto de la página (y la pestaña de la radio) para que la franja no tape nada
  useEffect(() => {
    const height = visible ? BANNER_HEIGHT : '0px'
    document.documentElement.style.setProperty('--banner-h', height)
    document.body.style.paddingTop = height
    return () => {
      document.documentElement.style.setProperty('--banner-h', '0px')
      document.body.style.paddingTop = '0px'
    }
  }, [visible])

  if (!visible) return null

  const hide = () => {
    try { sessionStorage.setItem(HIDDEN_KEY, text) } catch {}
    setHiddenText(text)
  }

  return (
    <div role="status" className="fixed top-0 inset-x-0 z-[80] flex items-center gap-2 px-3 bg-red-700 text-white text-xs font-semibold border-b border-red-900 shadow-lg" style={{ height: BANNER_HEIGHT }}>
      <FaExclamationTriangle className="flex-shrink-0 text-yellow-300" size={13} />
      <p className="flex-1 truncate">{text}</p>
      <button onClick={hide} className="p-1 rounded hover:bg-white/15 flex-shrink-0" aria-label="Ocultar aviso">
        <FaTimes size={12} />
      </button>
    </div>
  )
}
