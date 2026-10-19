// src/pages/Inicio.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { 
  FaMapMarkerAlt, FaMusic, FaFilter, FaSpinner, FaGuitar, 
  FaSearch, FaEdit, FaEnvelope, FaPlus, FaBullseye, FaTrash, FaExclamationTriangle 
} from 'react-icons/fa'
import { IoMegaphone } from "react-icons/io5";
import Mascot from '../components/Mascot'
import PostModal from '../components/PostModal'
import MessageDrawer from '../components/MessageDrawer'
import Toast from '../components/Toast'
import AnimatedBackground from '../components/AnimatedBackground'
import Avatar from '../components/Avatar'

const tucumanLocations: Record<string, string[]> = {
  "Burruyacú": ["Burruyacú", "El Chañar", "El Naranjo y El Sunchal", "El Puestito", "El Timbó", "Gobernador Garmendia", "Gobernador Piedrabuena", "La Ramada y La Cruz", "Padre Monti", "Siete de Abril", "Villa Benjamín Araoz"],
  "Capital": ["San Miguel de Tucumán"],
  "Chicligasta": ["Concepción", "Alpachiri y El Molino", "Alto Verde y Los Gucheas", "Arcadia", "Gastona y Belicha", "La Trinidad", "Medinas"],
  "Cruz Alta": ["Banda del Río Salí", "Alderetes", "Colombres", "Delfín Gallo", "El Bracho y El Cevilar", "El Naranjito", "La Florida y Luisiana", "Las Cejas", "Los Bulacio y Los Villagra", "Los Pereyra", "Los Pérez", "Los Ralos", "Ranchillos y San Miguel", "San Andrés"],
  "Famaillá": ["Famaillá"],
  "Graneros": ["Graneros", "Lamadrid", "Taco Ralo"],
  "Juan Bautista Alberdi": ["Juan Bautista Alberdi", "Escaba", "Villa Belgrano"],
  "La Cocha": ["La Cocha", "El Sacrificio", "Huasa Pampa", "Rumi Punco", "San Ignacio", "San José de la Cocha", "Yánima"],
  "Leales": ["Bella Vista", "Agua Dulce y La Soledad", "El Mojón", "Esquina y Mancopa", "Estación Araox y Tacanas", "Las Talas", "Los Gómez", "Los Puestos", "Manuel García Fernández", "Quilmes y Los Sueldos", "Río Colorado", "Santa Rosa de Leales", "Villa de Leales"],
  "Lules": ["Lules", "El Manantial", "San Felipe y Santa Bárbara", "San Pablo y Villa Nougués"],
  "Monteros": ["Monteros", "Acheral", "Amberes", "Capitán Cáceres", "El Cercado", "Los Sosas", "Río Seco", "Santa Lucía", "Santa Rosa y Los Rojo", "Sargento Moya", "Soldado Maldonado", "Teniente Berdina", "Villa Quinteros"],
  "Río Chico": ["Aguilares", "El Polear", "Los Sarmientos y La Tipa", "Monte Bello", "Santa Ana"],
  "Simoca": ["Simoca", "Atahona", "Buena Vista", "Ciudacita", "Manuela Pedraza", "Monteagudo", "Pampa Mayo", "Río Chico y Nueva Trinidad", "San Pedro y San Antonio", "Santa Cruz y La Tuna", "Villa Chigligasta", "Yerba Buena"],
  "Tafí del Valle": ["Tafí del Valle", "Amaichá del Valle", "Colalao del Valle", "El Mollar"],
  "Tafí Viejo": ["Tafí Viejo", "Anca Juli", "Choromoro", "El Cadillal", "La Esperanza", "Las Talitas", "Los Nogales", "Raco"],
  "Trancas": ["Trancas", "San Pedro de Colalao", "Tapia"],
  "Yerba Buena": ["Yerba Buena", "Cevil Redondo", "San Javier"]
}
const departamentos = Object.keys(tucumanLocations)

const GENEROS_FIJOS = [
  { name: 'Rock', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  { name: 'Pop', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
  { name: 'Folklore', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
  { name: 'Cumbia', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  { name: 'Jazz', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  { name: 'Electrónica', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  { name: 'Indie', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' }
]

const INTENCIONES_FILTRO = ['Todas', 'Busco banda', 'Busco músicos para mi proyecto', 'Ofrezco mis servicios (session musician)', 'Solo quiero conocer gente']

interface PostWithAuthor {
  id?: string; 
  user_id: string; 
  content: string; 
  created_at: string; 
  updated_at: string; 
  intention: string; 
  genres: string[];
  display_name: string; 
  username: string; 
  avatar_color: string;
  avatar_url: string | null;
  expression: string;
  instruments: { name: string; level: string }[]; 
  departamento: string; 
  localidad: string;
}

export default function Home() {
  const { signOut, profile, user } = useAuth()
  const navigate = useNavigate()
  
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false) 
  
  const [filterDepartamento, setFilterDepartamento] = useState('Todos')
  const [filterLocalidad, setFilterLocalidad] = useState('Todas')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterIntention, setFilterIntention] = useState('Todas')
  const [showFilters, setShowFilters] = useState(false)
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('updated_at', { ascending: false })
      if (postsError) throw postsError

      if (postsData && postsData.length > 0) {
        const userIds = postsData.map(p => p.user_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_color, avatar_url, expression, instruments, departamento, localidad')        
        const combined: PostWithAuthor[] = postsData.map(post => {
          const author = profilesData?.find(p => p.id === post.user_id)
          return { 
            ...post, 
            ...(author || {}),
            id: post.id,
            user_id: post.user_id
          }
        }).filter(p => p.display_name)
        setPosts(combined)
      } else { setPosts([]) }
    } catch (error) { console.error('Error al cargar feed:', error) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPosts() }, [])

  const handleDepartamentoChange = (dep: string) => {
    setFilterDepartamento(dep)
    setFilterLocalidad('Todas')
  }

  const filteredPosts = posts.filter(p => {
    const matchesDep = filterDepartamento === 'Todos' || p.departamento === filterDepartamento
    const matchesLoc = filterLocalidad === 'Todas' || p.localidad === filterLocalidad
    const matchesGenre = filterGenre === '' || p.genres?.includes(filterGenre)
    const matchesIntention = filterIntention === 'Todas' || p.intention === filterIntention
    return matchesDep && matchesLoc && matchesGenre && matchesIntention
  })

  const myPost = posts.find(p => p.user_id === user?.id)
  const otherPosts = filteredPosts.filter(p => p.user_id !== user?.id)
  
  const openCreateModal = () => { setIsEditing(false); setIsModalOpen(true) }
  const openEditModal = () => { setIsEditing(true); setIsModalOpen(true) }

  const handleDeletePost = async () => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setPosts(posts.filter(p => p.user_id !== user.id))
      setShowDeleteModal(false)
      setToast({ message: 'Publicación eliminada correctamente', type: 'success' })
    } catch (error: any) {
      setToast({ message: 'Error al eliminar: ' + error.message, type: 'error' })
    }
  }

  return (
    <div className="min-h-screen relative  text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* SECCIÓN ANCLADA: MI PUBLICACIÓN O INVITACIÓN */}
        {myPost ? (
          <div className="bg-gradient-to-br from-purple-900/10 to-[#1a1a1a] border-2 border-purple-600/40 rounded-2xl p-5 md:p-6 shadow-lg shadow-purple-900/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                Mi publicación
              </span>
              <span className="text-gray-600 text-xs">
                {new Date(myPost.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-end gap-1">
                <Avatar url={myPost.avatar_url || null} name={myPost.display_name} color={myPost.avatar_color || '#333'} size={50} />
                <Mascot 
                  color={myPost.avatar_color || '#333'} 
                  size={24} 
                  expression={(myPost.expression as any) || 'normal'} 
                />
              </div>         
<div className="flex-1">
                <h4 className="text-white font-bold text-base">{myPost.display_name}</h4>
                <p className="text-gray-500 text-xs">@{myPost.username}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><FaGuitar className="text-purple-500" size={10} /> {myPost.instruments?.[0]?.name || 'Músico'}</span>
                  <span className="text-gray-700">•</span>
                  <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-purple-500" size={10} /> {myPost.localidad}</span>
                </div>
              </div>
            </div>

            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-4 pl-[62px] md:pl-[62px]">{myPost.content}</p>

            <div className="flex flex-wrap gap-2 mb-4 pl-[62px] md:pl-[62px]">
              {myPost.intention && (
                <span className="px-2.5 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <FaBullseye size={8} /> {myPost.intention}
                </span>
              )}
              {myPost.genres?.map((genre, idx) => {
                const genData = GENEROS_FIJOS.find(g => g.name === genre)
                return (
                  <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${genData?.color || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    #{genre}
                  </span>
                )
              })}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-purple-600/20 pl-[62px] md:pl-[62px]">
              <button onClick={openEditModal} className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                <FaEdit size={12} className="text-purple-400" /> Editar
              </button>
              
              <button 
                onClick={() => setShowDeleteModal(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-800/50 hover:bg-red-900/40 rounded-lg text-sm text-red-400 hover:text-red-300 transition-all"
              >
                <FaTrash size={12} /> Eliminar
              </button>

              <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all relative">
                <FaEnvelope size={12} className="text-purple-400" /> Mensajes
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1a1a1a]">0</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-900/15 to-[#1a1a1a] border-2 border-dashed border-purple-600/40 rounded-2xl p-8 md:p-10 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center border-2 border-purple-600/40">
                  <IoMegaphone className="text-purple-400 text-3xl" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <FaPlus className="text-white text-xs" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">¡Creá tu primera publicación!</h3>
                <p className="text-gray-400 text-sm max-w-md">Contá a la comunidad qué buscás. <span className="text-purple-400 font-semibold">Solo podés tener una publicación</span>.</p>
              </div>
              <button onClick={openCreateModal} className="mt-2 flex items-center gap-2 px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/30 hover:scale-105">
                <FaPlus size={14} /> Crear mi publicación
              </button>
            </div>
          </div>
        )}

        {/* FILTROS */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <button onClick={() => setShowFilters(!showFilters)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-[#222]">
            <div className="flex items-center gap-2">
              <FaFilter className="text-purple-500" size={14} />
              <span className="text-white text-sm font-semibold">Filtros de búsqueda</span>
              {(filterDepartamento !== 'Todos' || filterLocalidad !== 'Todas' || filterGenre !== '' || filterIntention !== 'Todas') && (
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              )}
            </div>
            <span className="text-gray-500 text-xs">{showFilters ? '▲ Ocultar' : '▼ Mostrar'}</span>
          </button>
          
          {showFilters && (
            <div className="px-5 pb-5 pt-4 space-y-4 border-t border-[#2a2a2a]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Departamento</label>
                  <select value={filterDepartamento} onChange={(e) => handleDepartamentoChange(e.target.value)} className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-600">
                    <option value="Todos">Todos los departamentos</option>
                    {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Localidad / Pueblo</label>
                  <select value={filterLocalidad} onChange={(e) => setFilterLocalidad(e.target.value)} className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-600">
                    <option value="Todas">Todas las localidades</option>
                    {filterDepartamento !== 'Todos' && tucumanLocations[filterDepartamento]?.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1"><FaBullseye size={10} /> Intención</label>
                <select value={filterIntention} onChange={(e) => setFilterIntention(e.target.value)} className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-600">
                  {INTENCIONES_FILTRO.map(int => <option key={int} value={int}>{int}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">Filtrar por Género</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button onClick={() => setFilterGenre('')} className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${filterGenre === '' ? 'bg-white text-black border-white' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-400'}`}>Todos</button>
                  {GENEROS_FIJOS.map((genero) => (
                    <button key={genero.name} onClick={() => setFilterGenre(filterGenre === genero.name ? '' : genero.name)} className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${filterGenre === genero.name ? `${genero.color} scale-105` : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-400'}`}>#{genero.name}</button>
                  ))}
                </div>
              </div>

              {(filterDepartamento !== 'Todos' || filterLocalidad !== 'Todas' || filterGenre !== '' || filterIntention !== 'Todas') && (
                <button onClick={() => { setFilterDepartamento('Todos'); setFilterLocalidad('Todas'); setFilterGenre(''); setFilterIntention('Todas'); }} className="text-xs text-purple-400 hover:text-purple-300 font-medium">✕ Limpiar filtros</button>
              )}
            </div>
          )}
        </div>

        {/* FEED DE OTROS USUARIOS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaMusic className="text-purple-500" /> Feed de la comunidad
              <span className="text-sm text-gray-500 font-normal">({otherPosts.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-3xl text-purple-600" /></div>
          ) : otherPosts.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl">
              <FaSearch className="text-gray-600 text-4xl mx-auto mb-3" />
              <p className="text-gray-400">No hay publicaciones con estos filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherPosts.map((post) => (
                <div key={post.id || post.user_id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-purple-600/30 transition-colors flex flex-col">
                  <div className="flex items-start gap-3 mb-3 cursor-pointer" onClick={() => navigate(`/perfil/${post.user_id}`)}>
                    <div className="flex items-end gap-1">
                      <Avatar url={post.avatar_url || null} name={post.display_name} color={post.avatar_color || '#333'} size={45} />
                      <Mascot 
                        color={post.avatar_color || '#333'} 
                        size={20} 
                        expression={(post.expression as any) || 'normal'} 
                      />
                    </div>                
                <div className="flex-1">
                      <h4 className="text-white font-bold text-sm hover:text-purple-400 transition-colors">{post.display_name}</h4>
                      <p className="text-gray-500 text-xs">@{post.username}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><FaGuitar className="text-purple-500" size={10} /> {post.instruments?.[0]?.name || 'Músico'}</span>
                        <span className="text-gray-700">•</span>
                        <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-purple-500" size={10} /> {post.localidad}</span>
                      </div>
                    </div>
                    <span className="text-gray-600 text-xs">{new Date(post.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                  </div>

                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-4 flex-1">{post.content}</p>

                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#2a2a2a] mb-3">
                    {post.intention && (
                      <span className="px-2.5 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <FaBullseye size={8} /> {post.intention}
                      </span>
                    )}
                    {post.genres?.map((genre, idx) => {
                      const genData = GENEROS_FIJOS.find(g => g.name === genre)
                      return <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${genData?.color || 'bg-gray-800 text-gray-400 border-gray-700'}`}>#{genre}</span>
                    })}
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                    <FaEnvelope size={12} className="text-purple-400" /> Enviar mensaje
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-red-900/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-red-900/20">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-950/60 rounded-full flex items-center justify-center border border-red-700/50">
                  <FaExclamationTriangle className="text-red-400" size={28} />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">¿Eliminar publicación?</h3>
            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
              Esta acción no se puede deshacer. Tu publicación desaparecerá del feed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] hover:text-white transition-all font-medium border border-[#3a3a3a]">
                Cancelar
              </button>
              <button onClick={handleDeletePost} className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-900/30">
                <FaTrash size={14} /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} existingPost={isEditing ? myPost : null} onPostSaved={fetchPosts} />
      <MessageDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} currentUserId={user?.id} />
    </div>
  )
}