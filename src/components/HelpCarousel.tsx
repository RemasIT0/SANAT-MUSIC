// src/components/HelpCarousel.tsx
// Centro de ayuda compacto: lo esencial para usar SANAT, todo a la vista de una vez.
import type { IconType } from 'react-icons'
import { FaEnvelopeOpenText, FaUserEdit, FaBullhorn, FaSearch, FaShieldAlt, FaLifeRing, FaTimes } from 'react-icons/fa'
import Mascot from './Mascot'

const ITEMS: { icon: IconType; color: string; titulo: string; texto: string }[] = [
  { icon: FaEnvelopeOpenText, color: '#a855f7', titulo: 'Confirmá tu email', texto: 'Si no te llega, mirá en Spam o Promociones.' },
  { icon: FaUserEdit, color: '#22c55e', titulo: 'Completá tu perfil', texto: 'Instrumentos, nivel, géneros y zona: así te encuentran.' },
  { icon: FaBullhorn, color: '#eab308', titulo: 'Publicá lo que buscás', texto: 'SANAT les avisa a los músicos de tu zona que coinciden.' },
  { icon: FaSearch, color: '#3b82f6', titulo: 'Buscá y escribí', texto: 'Usá los filtros, abrí un póster y mandá un mensaje.' },
  { icon: FaShieldAlt, color: '#ec4899', titulo: 'Cuidate', texto: 'Bloqueá o reportá a quien moleste. Nunca des datos bancarios.' },
  { icon: FaLifeRing, color: '#f97316', titulo: '¿Algo falla?', texto: 'Avisanos desde "Sugerencias" en el menú.' },
]

export default function HelpCarousel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Centro de ayuda">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center gap-3 mb-3">
          <Mascot color="#a855f7" size={44} expression="cartero" />
          <h3 className="flex-1 text-lg font-bold text-white">Lo básico de SANAT</h3>
          <button type="button" onClick={onClose} className="p-2 -mr-1 text-gray-400 hover:text-white" aria-label="Cerrar ayuda"><FaTimes size={16} /></button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ITEMS.map(({ icon: Icon, color, titulo, texto }) => (
            <li key={titulo} className="flex gap-3 px-3 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#262626]">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '26', color }}><Icon size={14} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white leading-tight">{titulo}</span>
                <span className="block text-xs text-gray-300 leading-snug mt-0.5">{texto}</span>
              </span>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onClose} className="w-full mt-3 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold">Entendido</button>
      </div>
    </div>
  )
}
