// src/components/PostModal.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FaTimes, FaSpinner, FaBullseye } from 'react-icons/fa'
import Toast from './Toast' // ✅ Importamos el Toast para reemplazar el alert

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
  
  // ✅ Estado para el Toast de notificación
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Cargar datos si estamos editando
  // ✅ Guardamos el estado original para detectar cambios reales
  const [originalData, setOriginalData] = useState({ content: '', intention: '', genres: [] as string[] })

  useEffect(() => {
    if (isOpen) {
      const initialContent = existingPost?.content || ''
      const initialIntention = existingPost?.intention || ''
      const initialGenres = existingPost?.genres || []
      
      setContent(initialContent)
      setIntention(initialIntention)
      setSelectedGenres(initialGenres)
      
      // Guardamos una copia del estado original
      setOriginalData({ 
        content: initialContent, 
        intention: initialIntention, 
        genres: initialGenres 
      })
      
      // 🧹 Limpiamos cualquier Toast viejo al abrir el modal
      setToast(null)
    }
  }, [isOpen, existingPost])
  if (!isOpen) return null

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    )
  }

  // 🛡️ VALIDACIÓN: El formulario es válido si tiene texto, intención y al menos 1 género
  const isFormValid = content.trim().length > 0 && intention !== '' && selectedGenres.length > 0
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isFormValid) return
    
    // 🔍 Detectamos si realmente hubo cambios
    const hasChanges = 
      content.trim() !== originalData.content ||
      intention !== originalData.intention ||
      JSON.stringify(selectedGenres) !== JSON.stringify(originalData.genres)

    // Si no hubo cambios, mostramos un mensaje informativo y no hacemos nada
    if (!hasChanges) {
      setToast({ message: 'No realizaste ningún cambio', type: 'info' })
      return
    }
    
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
      
      // ✅ Mensaje de éxito dinámico
      const successMessage = existingPost 
        ? 'Publicación actualizada correctamente' 
        : 'Publicación creada correctamente'
        
      setToast({ message: successMessage, type: 'success' })
      
      setTimeout(() => {
        onPostSaved()
        onClose()
      }, 1500)
      
    } catch (error: any) {
      setToast({ message: 'Error al guardar: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      
      {/* ✅ Renderizado del Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6 shadow-2xl my-8 relative animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            {existingPost ? 'Editar mi publicación' : 'Nueva publicación'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-transparent transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Texto principal */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">¿Qué querés contar o buscar? *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ej: Soy guitarrista, busco bajista y baterista para tocar rock los fines de semana..."
              rows={4}
              maxLength={500}
              className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-purple-600 transition-colors resize-none text-sm"
              required
            />
            <p className="text-right text-[10px] text-gray-600 mt-1">{content.length}/500</p>
          </div>

          {/* Intención */}
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
          </div>

          {/* Géneros para este post */}
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

          {/* 🛡️ BOTÓN CON VALIDACIÓN Y MENSAJE DE AYUDA */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${
              loading || !isFormValid
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-purple-700 text-white hover:bg-purple-600 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]'
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> Guardando...
              </>
            ) : (
              existingPost ? 'Guardar cambios' : 'Publicar'
            )}
          </button>
          
          {!isFormValid && !loading && (
            <p className="text-center text-xs text-gray-500 mt-2 animate-pulse">
              * Completa el texto, la intención y elige al menos un género para continuar.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}