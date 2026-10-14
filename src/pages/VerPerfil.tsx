// src/pages/VerPerfil.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { type Profile } from '../types'
import Mascot from '../components/Mascot'
import { FaArrowLeft, FaMapMarkerAlt, FaGuitar, FaMusic, FaEnvelope, FaSpinner, FaImage } from 'react-icons/fa'

export default function VerPerfil() {
  const { id } = useParams() // El ID del usuario viene de la URL
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Traer el perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // 2. Traer sus publicaciones
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false })

        if (postsError) throw postsError
        setPosts(postsData || [])
      } catch (error) {
        console.error('Error al cargar perfil:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-gray-400">
        <p>Perfil no encontrado.</p>
      </div>
    )
  }

  // Verificar si es mi propio perfil
  const isMyProfile = user?.id === profile.id

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 font-sans">
      {/* Header simple */}
      <header className="sticky top-0 z-40 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#2a2a2a] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <FaArrowLeft className="text-white" />
          </button>
          <h1 className="text-white font-bold text-lg truncate">
            {profile.display_name || profile.username}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Tarjeta de Perfil */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* Mascota en grande */}
            <div className="bg-[#0f0f0f] p-4 rounded-xl border border-[#2a2a2a]">
              <Mascot color={profile.avatar_color || '#333'} size={140} />
            </div>

            {/* Info principal */}
            <div className="flex-1 text-center md:text-left w-full">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {profile.display_name}
              </h2>
              <p className="text-gray-500 text-sm mb-4">@{profile.username}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6 text-sm">
                <div className="flex items-center gap-2 bg-[#0f0f0f] px-3 py-2 rounded-lg border border-[#2a2a2a]">
                  <FaGuitar className="text-purple-500" />
                  <span className="text-gray-300">{profile.instruments?.[0]?.name || 'Sin instrumento'}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400">{profile.instruments?.[0]?.level || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0f0f0f] px-3 py-2 rounded-lg border border-[#2a2a2a]">
                  <FaMapMarkerAlt className="text-purple-500" />
                  <span className="text-gray-300">{profile.localidad}, {profile.departamento}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Sobre mí</h3>
                <p className="text-gray-300 leading-relaxed bg-[#0f0f0f] p-4 rounded-lg border border-[#2a2a2a]">
                  {profile.bio || 'Este usuario aún no escribió su biografía.'}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Géneros</h3>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {profile.genres?.map((genre, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-purple-900/20 border border-purple-700/40 text-purple-300 text-sm rounded-full">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!isMyProfile && (
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors">
                    <FaEnvelope />
                    Enviar mensaje
                  </button>
                )}
                {isMyProfile && (
<button 
  onClick={() => navigate('/editar-perfil')}
  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600 text-white font-semibold rounded-lg transition-colors"
>
  Editar mi perfil
</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Publicaciones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaMusic className="text-purple-500" />
              Publicaciones
            </h3>
            {isMyProfile && (
              <button className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                + Nueva publicación
              </button>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl">
              <FaImage className="text-gray-600 text-4xl mx-auto mb-3" />
              <p className="text-gray-400">Aún no hay publicaciones.</p>
              {isMyProfile && (
                <p className="text-gray-600 text-sm mt-1">¡Crea tu primera publicación!</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                  <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  <p className="text-gray-600 text-xs mt-3">
                    {new Date(post.created_at).toLocaleDateString('es-AR', { 
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' 
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}