// src/components/PostModal.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FaTimes, FaSpinner, FaBullseye } from 'react-icons/fa'
import Toast from './Toast'

const GENEROS_FIJOS = [
  { name: 'Rock', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  { name: 'Pop', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
  { name: 'Folklore', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
  { name: 'Cumbia', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  { name: 'Jazz', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  { name: 'Electrónica', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  { name: 'Indie', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' },
  { name: 'Metal', color: 'bg-gray-800/40 text-gray-300 border-gray-600' },
  { name: 'Grunge', color: 'bg-stone-700/40 text-stone-300 border-stone-500' }
]

// Instrumentos sugeridos para "Busco músicos" (también se puede escribir otro)
const COMMON_INSTRUMENTS = ['Guitarra', 'Bajo', 'Batería', 'Voz', 'Teclado', 'Piano', 'Saxo', 'Violín', 'Trompeta', 'Percusión', 'DJ / Productor', 'Charango']
export const SEEKING_MUSICIANS = 'Busco músicos para mi proyecto'

const INTENCIONES = [
  'Busco banda',
  'Busco músicos para mi proyecto',
  'Ofrezco mis servicios (session musician)',
  'Solo quiero conocer gente'
]

interface PostModalProps {
  isOpen: boolean
  onClose: () => void
  existingPost?: { id?: string; content: string; intention?: string; genres?: string[]; looking_for?: string[]; match_scope?: string } | null
  onPostSaved: () => void
}

export default function PostModal({ isOpen, onClose, existingPost, onPostSaved }: PostModalProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [intention, setIntention] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  // Coincidencias: qué instrumentos se buscan y en qué zona
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [matchScope, setMatchScope] = useState<'departamento' | 'provincia'>('departamento')
  const [customInstrument, setCustomInstrument] = useState('')
  const [loading, setLoading] = useState(false)
  // Después de guardar, el botón queda bloqueado hasta que el modal se cierra
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [originalData, setOriginalData] = useState({ content: '', intention: '', genres: [] as string[] })

  useEffect(() => {
    if (isOpen) {
      const initialContent = existingPost?.content || ''
      const initialIntention = existingPost?.intention || ''
      const initialGenres = existingPost?.genres || []

      setContent(initialContent)
      setIntention(initialIntention)
      setSelectedGenres(initialGenres)

      setOriginalData({ content: initialContent, intention: initialIntention, genres: initialGenres })
      setLookingFor(Array.isArray(existingPost?.looking_for) ? existingPost!.looking_for! : [])
      setMatchScope(existingPost?.match_scope === 'provincia' ? 'provincia' : 'departamento')
      setCustomInstrument('')
      setToast(null)
      setSaved(false)
    }
  }, [isOpen, existingPost])

  if (!isOpen) return null

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    )
  }

  const isSeeking = intention === SEEKING_MUSICIANS
  const isFormValid = content.trim().length > 0 && intention !== '' && selectedGenres.length > 0 && (!isSeeking || lookingFor.length > 0)

  const toggleInstrument = (name: string) =>
    setLookingFor(prev => prev.some(i => i.toLowerCase() === name.toLowerCase()) ? prev.filter(i => i.toLowerCase() !== name.toLowerCase()) : prev.length >= 6 ? prev : [...prev, name])

  const addCustomInstrument = () => {
    const name = customInstrument.trim()
    if (name.length < 3) return
    if (!lookingFor.some(i => i.toLowerCase() === name.toLowerCase())) toggleInstrument(name)
    setCustomInstrument('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isFormValid || loading || saved) return

    const hasChanges =
      content.trim() !== originalData.content ||
      intention !== originalData.intention ||
      JSON.stringify(lookingFor) !== JSON.stringify(existingPost?.looking_for || []) ||
      matchScope !== (existingPost?.match_scope === 'provincia' ? 'provincia' : 'departamento') ||
      JSON.stringify(selectedGenres) !== JSON.stringify(originalData.genres)

    if (!hasChanges && existingPost) {
      setToast({ message: 'No realizaste ningún cambio', type: 'info' })
      return
    }

    setLoading(true)
    try {
      // Solo se permite una publicación por usuario: verificar antes de crear
      if (!existingPost?.id) {
        const { data: existing } = await supabase.from('posts').select('id').eq('user_id', user.id).limit(1)
        if (existing && existing.length > 0) {
          setToast({ message: 'Ya tenés una publicación activa. Editala o eliminala para crear otra.', type: 'info' })
          return
        }
      }

      const base = { content: content.trim(), intention, genres: selectedGenres, updated_at: new Date().toISOString() }
      const matching = { looking_for: isSeeking ? lookingFor : [], match_scope: matchScope }
      const save = (fields: Record<string, unknown>) => existingPost?.id
        ? supabase.from('posts').update(fields).eq('id', existingPost.id)
        : supabase.from('posts').insert({ user_id: user.id, ...fields })

      let { error } = await save({ ...base, ...matching })
      // Si la base todavía no tiene las columnas de coincidencias, guardar igual sin ellas
      if (error && /looking_for|match_scope/.test(error.message)) ({ error } = await save(base))
      if (error) throw new Error('Error en la base de datos: ' + error.message)

      const successMessage = existingPost ? 'Publicación actualizada correctamente' : 'Publicación creada correctamente'
      setToast({ message: successMessage, type: 'success' })
      setSaved(true)

      setTimeout(() => {
        onPostSaved()
        onClose()
      }, 1500)

    } catch (error: any) {
      setToast({ message: error.message || 'Error al guardar', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6 shadow-2xl my-8 mb-24 relative animate-[scaleIn_0.2s_ease-out] overflow-y-auto max-h-[90vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{existingPost ? 'Editar mi publicación' : 'Nueva publicación'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-transparent transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">¿Qué querés contar o buscar? *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ej: Soy guitarrista, busco bajista... (Podés agregar links a YouTube/SoundCloud. Nota: Accedé a enlaces externos bajo tu propia responsabilidad)."
              rows={4}
              maxLength={500}
              className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-purple-600 transition-colors resize-none text-sm"
              required
            />
            <p className="text-right text-[10px] text-gray-600 mt-1">{content.length}/500</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
              <FaBullseye size={10} /> ¿Cuál es tu intención con este post? *
            </label>
            <select
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
              required
            >
              <option value="">Seleccioná una opción...</option>
              {INTENCIONES.map(int => <option key={int} value={int}>{int}</option>)}
            </select>
            {intention && intention !== SEEKING_MUSICIANS && intention !== 'Solo quiero conocer gente' && (
              <p className="text-[11px] text-gray-400 mt-1.5">Les vamos a avisar a quienes buscan tu instrumento en tu zona.</p>
            )}
          </div>

          {isSeeking && (
            <div className="p-3 rounded-xl border border-purple-700/40 bg-purple-950/20 space-y-3">
              <div>
                <label className="text-xs text-gray-200 mb-2 block font-semibold">¿Qué instrumentos buscás? * <span className="font-normal text-gray-400">(hasta 6)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {[...COMMON_INSTRUMENTS, ...lookingFor.filter(i => !COMMON_INSTRUMENTS.some(c => c.toLowerCase() === i.toLowerCase()))].map(name => {
                    const active = lookingFor.some(i => i.toLowerCase() === name.toLowerCase())
                    return (
                      <button key={name} type="button" onClick={() => toggleInstrument(name)} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-300 hover:border-purple-500'}`}>
                        {name}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <input value={customInstrument} onChange={e => setCustomInstrument(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomInstrument() } }} maxLength={30} placeholder="Otro instrumento..." className="flex-1 p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500" />
                  <button type="button" onClick={addCustomInstrument} className="px-3 rounded-lg bg-[#2a2a2a] text-white text-sm hover:bg-[#333]">Agregar</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-200 mb-2 block font-semibold">¿Dónde?</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['departamento', 'Mi departamento'], ['provincia', 'Toda Tucumán']] as const).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setMatchScope(value)} className={`py-2 rounded-lg text-xs border ${matchScope === value ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-300'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-gray-300">Al publicar, SANAT les avisa a los músicos que tocan esos instrumentos en la zona y comparten algún género.</p>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Géneros de esta publicación * (Mínimo 1)</label>
            <div className="flex flex-wrap gap-2">
              {GENEROS_FIJOS.map((genero) => {
                const isSelected = selectedGenres.includes(genero.name)
                return (
                  <button
                    key={genero.name}
                    type="button"
                    onClick={() => toggleGenre(genero.name)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      isSelected ? `${genero.color} scale-105 shadow-lg` : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {isSelected && '# '}{genero.name}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || saved || !isFormValid}
            className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${
              loading || saved || !isFormValid
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-purple-700 text-white hover:bg-purple-600 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]'
            }`}
          >
            {loading ? <><FaSpinner className="animate-spin" /> Guardando...</> : saved ? '¡Listo!' : (existingPost ? 'Guardar cambios' : 'Publicar')}
          </button>

          {!isFormValid && !loading && (
            <p className="text-center text-xs text-gray-500 mt-2 animate-pulse">
              * Completá el texto, la intención y al menos un género{isSeeking ? ', y elegí qué instrumentos buscás' : ''}.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}