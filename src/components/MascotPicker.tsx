// src/components/MascotPicker.tsx
import { useState } from 'react'
import Mascot from './Mascot'
import { MASCOT_EXPRESSIONS, type MascotExpression } from './MascotCostumes'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

const INITIAL_COUNT = 6

// Selector de diseño de mascota: muestra unos pocos y el resto bajo "Ver más"
export default function MascotPicker({ color, value, onChange }: {
  color: string
  value: MascotExpression
  onChange: (exp: MascotExpression) => void
}) {
  const [showAll, setShowAll] = useState(false)

  const firstOnes = MASCOT_EXPRESSIONS.slice(0, INITIAL_COUNT)
  const selectedIsHidden = !firstOnes.some(e => e.id === value)
  const visible = showAll
    ? MASCOT_EXPRESSIONS
    : selectedIsHidden
      ? [...firstOnes, ...MASCOT_EXPRESSIONS.filter(e => e.id === value)]
      : firstOnes
  const hiddenCount = MASCOT_EXPRESSIONS.length - visible.length

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-8 pt-6">
        {visible.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
              value === id ? 'border-purple-600 bg-purple-900/20' : 'border-[#2a2a2a] bg-[#0f0f0f] hover:border-gray-500'
            }`}
          >
            <Mascot color={color} size={40} expression={id} />
            <span className="text-[10px] text-gray-300 mt-1">{label}</span>
          </button>
        ))}
      </div>
      {(hiddenCount > 0 || showAll) && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] text-xs text-gray-300 hover:text-white hover:border-purple-500/60 transition-colors flex items-center justify-center gap-2"
        >
          {showAll
            ? <>Mostrar menos <FaChevronUp size={10} /></>
            : <>Ver más diseños ({hiddenCount}) <FaChevronDown size={10} /></>}
        </button>
      )}
    </div>
  )
}
