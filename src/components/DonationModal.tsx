// src/components/DonationModal.tsx
// Invitación (opcional) a colaborar con el mantenimiento de SANAT.
// El texto, el alias y el link los configura el admin desde su panel.
import { useState } from 'react'
import { FaHandHoldingHeart, FaCopy, FaCheck, FaExternalLinkAlt, FaTimes } from 'react-icons/fa'
import { DEFAULT_DONATION_TEXT, type AppSettings } from '../hooks/useAppSettings'

export default function DonationModal({ settings, onClose }: { settings: AppSettings; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText(settings.donation_alias || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // sin portapapeles: el alias igual queda visible para copiarlo a mano
    }
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="donation-title">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
        <div className="w-12 h-12 rounded-full bg-pink-900/30 text-pink-300 flex items-center justify-center mb-4"><FaHandHoldingHeart size={22} /></div>
        <h3 id="donation-title" className="text-white text-xl mb-2">Apoyá a SANAT</h3>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-5">{settings.donation_text?.trim() || DEFAULT_DONATION_TEXT}</p>

        {settings.donation_alias?.trim() && (
          <div className="mb-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Alias / CVU</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]">
              <span className="flex-1 font-mono text-white text-sm break-all">{settings.donation_alias}</span>
              <button onClick={copyAlias} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-xs text-white flex-shrink-0">
                {copied ? <><FaCheck className="text-green-400" /> Copiado</> : <><FaCopy /> Copiar</>}
              </button>
            </div>
          </div>
        )}

        {settings.donation_link?.trim() && (
          <a href={settings.donation_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-sm">
            Colaborar online <FaExternalLinkAlt size={11} />
          </a>
        )}

        <p className="text-[11px] text-gray-500 mt-4">Es totalmente voluntario: SANAT sigue siendo gratis para todos. ¡Gracias por bancar la música!</p>
      </div>
    </div>
  )
}
