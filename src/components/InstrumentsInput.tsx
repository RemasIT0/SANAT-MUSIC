// src/components/InstrumentsInput.tsx
// Lista editable de instrumentos (nombre libre + nivel). Hasta 6.
import type { Instrument } from '../types'
import { FaGuitar, FaPlus, FaTimes } from 'react-icons/fa'

export const MAX_INSTRUMENTS = 6
const LEVELS: Instrument['level'][] = ['Principiante', 'Intermedio', 'Avanzado', 'Profesional']

export const emptyInstrument = (): Instrument => ({ name: '', level: 'Intermedio' })

// Limpia la lista para guardar: sin vacíos ni repetidos
export const cleanInstruments = (list: Instrument[]): Instrument[] => {
  const seen = new Set<string>()
  return list
    .map(i => ({ name: i.name.trim(), level: i.level }))
    .filter(i => {
      const key = i.name.toLowerCase()
      if (!i.name || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export default function InstrumentsInput({ value, onChange }: { value: Instrument[]; onChange: (list: Instrument[]) => void }) {
  const update = (index: number, patch: Partial<Instrument>) =>
    onChange(value.map((inst, i) => (i === index ? { ...inst, ...patch } : inst)))

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Tus instrumentos</label>
      {value.map((inst, index) => (
        <div key={index} className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <FaGuitar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              value={inst.name}
              onChange={e => update(index, { name: e.target.value })}
              maxLength={30}
              placeholder={index === 0 ? 'Instrumento principal (ej: guitarra)' : 'Otro instrumento (ej: voz, bajo)'}
              className="w-full p-3 pl-9 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors placeholder:text-gray-500"
              aria-label={`Instrumento ${index + 1}`}
            />
          </div>
          <select
            value={inst.level}
            onChange={e => update(index, { level: e.target.value as Instrument['level'] })}
            className="w-32 sm:w-36 p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600"
            aria-label={`Nivel en instrumento ${index + 1}`}
          >
            {LEVELS.map(level => <option key={level}>{level}</option>)}
          </select>
          {value.length > 1 && (
            <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className="px-3 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-gray-400 hover:text-red-400" aria-label="Quitar instrumento">
              <FaTimes size={12} />
            </button>
          )}
        </div>
      ))}
      {value.length < MAX_INSTRUMENTS && (
        <button type="button" onClick={() => onChange([...value, emptyInstrument()])} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#3a3a3a] text-sm text-gray-300 hover:text-white hover:border-purple-500 transition-colors">
          <FaPlus size={11} /> Agregar otro instrumento
        </button>
      )}
    </div>
  )
}
