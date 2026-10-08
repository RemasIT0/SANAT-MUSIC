// src/components/PostModal.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FaTimes, FaSpinner, FaBullseye } from 'react-icons/fa'

// Los mismos géneros fijos que usamos en el perfil
const GENEROS_FIJOS = [
  { name: 'Rock', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  { name: 'Pop', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
  { name: 'Folklore', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
  { name: 'Cumbia', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  { name: 'Jazz', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  { name: 'Electrónica', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  { name: 'Indie', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' }
]

const INTENCIONES = [
  'Busco banda',
  'Busco músicos para mi proyecto',
  'Ofrezco mis servicios (session musician)',
  'Solo quiero conocer gente'
]

interface PostModalProps {
  isOpen: boolean
  onClose: () => void
  existingPost?: { content: string; intention?: string; genres?: string[] } | null
  onPostSaved: () => void
}

export default function PostModal({ isOpen, onClose, existingPost, onPostSaved }: PostModalProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [intention, setIntention] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar datos si estamos editando
  useEffect(() => {
    if (isOpen) {
      setContent(existingPost?.content || '')
      setIntention(existingPost?.intention || '')
      setSelectedGenres(existingPost?.genres || [])
    }
  }, [isOpen, existingPost])

  if (!isOpen) return null

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('posts')
        .upsert({
          user_id: user.id,
          content: content.trim(),
          intention: intention,
          genres: selectedGenres,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      onPostSaved()
      onClose()
    } catch (error) {
      alert('Error al guardar la publicación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            {existingPost ? 'Editar mi publicación' : 'Nueva publicación'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-transparent">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Texto principal */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">¿Qué querés contar o buscar?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ej: Soy guitarrista, busco bajista y baterista para tocar rock los fines de semana..."
              rows={4}
              maxLength={500}
              className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-purple-600 transition-colors resize-none text-sm"
              required
            />
          </div>

          {/* Intención */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
              <FaBullseye size={10} /> ¿Cuál es tu intención con este post?
            </label>
            <select
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
            >
              <option value="">Seleccioná una opción...</option>
              {INTENCIONES.map(int => <option key={int} value={int}>{int}</option>)}
            </select>
          </div>

          {/* Géneros para este post */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Géneros de esta publicación</label>
            <div className="flex flex-wrap gap-2">
              {GENEROS_FIJOS.map((genero) => {
                const isSelected = selectedGenres.includes(genero.name)
                return (
                  <button
                    key={genero.name}
                    type="button"
                    onClick={() => toggleGenre(genero.name)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      isSelected ? `${genero.color} scale-105` : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-500'
                    }`}
                  >
                    #{genero.name}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : (existingPost ? 'Guardar cambios' : 'Publicar')}
          </button>
        </form>
      </div>
    </div>
  )
}