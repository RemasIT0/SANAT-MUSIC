// src/pages/Inicio.tsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { 
  FaMapMarkerAlt, FaMusic, FaFilter, FaSpinner, FaGuitar, 
  FaSearch, FaEdit, FaEnvelope, FaPlus, FaBullseye, FaTrash, 
  FaExclamationTriangle, FaChevronRight, FaExternalLinkAlt, 
  FaRegEnvelope, FaTimes, FaPaperPlane, FaQuestionCircle, FaEnvelopeOpenText,
  FaFlag, FaHeart, FaFire, FaUser
} from 'react-icons/fa'

import { IoIosTime } from "react-icons/io"
import { IoMegaphone } from "react-icons/io5"

import { isUserOnline } from '../hooks/useOnlineStatus'
import Mascot from '../components/Mascot'
import PostModal from '../components/PostModal'
import Toast from '../components/Toast'
import AnimatedBackground from '../components/AnimatedBackground'
import Avatar from '../components/Avatar'
import { useHiddenUsers } from '../hooks/useHiddenUsers'
import WelcomeModal from '../components/WelcomeModal'
import RetroTV from '../components/RetroTV'

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
  { name: 'Indie', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' },
  { name: 'Metal', color: 'bg-gray-800/40 text-gray-300 border-gray-600' },       
  { name: 'Grunge', color: 'bg-stone-700/40 text-stone-300 border-stone-500' }    
]

const INTENCIONES_FILTRO = ['Todas', 'Busco banda', 'Busco músicos para mi proyecto', 'Ofrezco mis servicios (session musician)', 'Solo quiero conocer gente']
const POSTS_PER_PAGE = 10 

interface PostWithAuthor {
  id: string; user_id: string; content: string; created_at: string; updated_at: string; 
  intention: string; genres: string[]; display_name: string; username: string; 
  avatar_color: string; avatar_url: string | null; expression: string;
  instruments: { name: string; level: string }[]; departamento: string; localidad: string;
  last_seen?: string; 
  likes_count?: number;      
  is_liked_by_me?: boolean;
}

const renderContentWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1 inline-flex" onClick={(e) => e.stopPropagation()}>{part} <FaExternalLinkAlt size={10} /></a>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function Home() {
  const { user, showSuggestionModal, showHelpModal, closeSuggestionModal, closeHelpModal } = useAuth()
  const navigate = useNavigate()
  const hiddenIds = useHiddenUsers()
  const [hasOwnPost, setHasOwnPost] = useState(false)
  
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // ✅ NUEVO: Lista de todos los usuarios para el directorio
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loadingAllUsers, setLoadingAllUsers] = useState(false)

  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [myPost, setMyPost] = useState<PostWithAuthor | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [filterDepartamento, setFilterDepartamento] = useState('Todos')
  const [filterLocalidad, setFilterLocalidad] = useState('Todas')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterIntention, setFilterIntention] = useState('Todas')
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [suggestionText, setSuggestionText] = useState('')
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'user', id: string, userId: string } | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [isReporting, setIsReporting] = useState(false) 

  const [filterSort, setFilterSort] = useState<'recientes' | 'populares'>('recientes')

  const [showLikersModal, setShowLikersModal] = useState(false)
  const [likersList, setLikersList] = useState<any[]>([])
  const [loadingLikers, setLoadingLikers] = useState(false)

  // Cantidad de likes que el usuario ya vio (por cuenta): el punto rojo
  // aparece solo si el post tiene más likes que esa cantidad
  const likesSeenKey = `sanat_likes_seen_${user?.id}`
  const [seenLikes, setSeenLikes] = useState(() => {
    try { return parseInt(localStorage.getItem(likesSeenKey) || '0') } catch { return 0 }
  })
  const markLikesSeen = (count: number) => {
    setSeenLikes(count)
    try { localStorage.setItem(likesSeenKey, count.toString()) } catch {}
  }

  // Paginación: offset real en la BD (independiente de los posts filtrados)
  const offsetRef = useRef(0)
  const isFetchingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleToggleLike = async (postId: string, postOwnerId?: string) => {
    if (!user) return;
    
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        const isLiked = p.is_liked_by_me;
        return {
          ...p,
          is_liked_by_me: !isLiked,
          likes_count: isLiked ? (p.likes_count || 0) - 1 : (p.likes_count || 0) + 1
        };
      }
      return p;
    }));

    try {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('post_likes').delete().eq('id', existingLike.id);
        try { await supabase.from('notifications').delete().eq('post_id', postId).eq('actor_id', user.id).eq('type', 'like'); } catch(e) {}
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        if (postOwnerId && postOwnerId !== user.id) {
          try {
            await supabase.from('notifications').insert({ 
              user_id: postOwnerId, 
              actor_id: user.id, 
              post_id: postId, 
              type: 'like' 
            });
          } catch(e) {}
        }
      }
    } catch (error) {
      console.error("Error al actualizar like:", error);
      fetchPosts(false); 
    }
  }

  const handleViewLikers = async (postId: string) => {
    setLoadingLikers(true)
    setShowLikersModal(true)
    markLikesSeen(myPost?.likes_count || 0)

    try {
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('user_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (likesData && likesData.length > 0) {
        const userIds = likesData.map((l: any) => l.user_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, avatar_color')
          .in('id', userIds)
        setLikersList(profilesData || [])
      } else {
        setLikersList([])
      }
    } catch (error) {
      console.error('Error al cargar likers:', error)
    } finally {
      setLoadingLikers(false)
    }
  }

  // Likes de cada post: la cantidad viene de la función get_like_counts (no revela quién dio like)
  // y "likedByMe" de mis propios likes. Si la función aún no existe en Supabase, se cuentan a mano.
  const fetchLikesInfo = async (postIds: string[]) => {
    const likesMap: Record<string, { count: number; likedByMe: boolean }> = {};
    postIds.forEach(id => { likesMap[id] = { count: 0, likedByMe: false } });
    const [countsRes, mineRes] = await Promise.all([
      supabase.rpc('get_like_counts', { post_ids: postIds.map(String) }),
      supabase.from('post_likes').select('post_id').eq('user_id', user?.id).in('post_id', postIds)
    ]);
    if (!countsRes.error) {
      countsRes.data?.forEach((row: any) => { if (likesMap[row.post_id]) likesMap[row.post_id].count = Number(row.likes) });
    } else {
      const { data } = await supabase.from('post_likes').select('post_id').in('post_id', postIds);
      data?.forEach(like => { if (likesMap[like.post_id]) likesMap[like.post_id].count++ });
    }
    mineRes.data?.forEach(like => { if (likesMap[like.post_id]) likesMap[like.post_id].likedByMe = true });
    return likesMap;
  }

  // Agrega autor y likes a una lista de posts
  const enrichPosts = async (postsData: any[]): Promise<PostWithAuthor[]> => {
    if (postsData.length === 0) return [];
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const postIds = postsData.map(p => p.id);

    const [profilesResponse, likesMap] = await Promise.all([
      supabase.from('profiles').select('id, display_name, username, avatar_color, avatar_url, expression, instruments, departamento, localidad, last_seen').in('id', userIds),
      fetchLikesInfo(postIds)
    ]);

    return postsData.map(post => {
      const author = profilesResponse.data?.find(p => p.id.toString() === post.user_id.toString());
      const likeInfo = likesMap[post.id] || { count: 0, likedByMe: false };
      return {
        ...post,
        ...(author || {}),
        id: post.id,
        user_id: post.user_id,
        likes_count: likeInfo.count,
        is_liked_by_me: likeInfo.likedByMe
      };
    }).filter(p => p.display_name);
  }

  // Mi publicación se busca aparte, así aparece aunque no esté en la primera página
  const fetchMyPost = async () => {
    if (!user) return;
    const { data } = await supabase.from('posts').select('*').eq('user_id', user.id).limit(1).maybeSingle();
    const [enriched] = data ? await enrichPosts([data]) : [];
    setMyPost(enriched || null);
    setHasOwnPost(!!data);
  }

  const fetchPosts = async (isLoadMore = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isLoadMore) setLoadingMore(true); else setLoading(true);
    try {
      const start = isLoadMore ? offsetRef.current : 0;
      let query = supabase.from('posts').select('*').order('updated_at', { ascending: false }).range(start, start + POSTS_PER_PAGE - 1);
      if (user) query = query.neq('user_id', user.id);
      const { data: postsData, error: postsError } = await query;
      if (postsError) throw postsError;

      if (!isLoadMore) await fetchMyPost();

      const combined = await enrichPosts(postsData || []);
      offsetRef.current = start + (postsData?.length || 0);
      if (isLoadMore) setPosts(prev => [...prev, ...combined]); else setPosts(combined);
      setHasMore((postsData?.length || 0) === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error al cargar feed:', error);
      setToast({ message: 'Error al cargar publicaciones', type: 'error' });
    } finally {
      isFetchingRef.current = false;
      setLoading(false); setLoadingMore(false);
    }
  }

  useEffect(() => { fetchPosts(false); }, [])

  // Scroll infinito: cuando el final del feed entra en pantalla, cargar la siguiente página
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchPosts(true);
    }, { rootMargin: '300px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, posts.length])

  useEffect(() => {
    if (isSearchOpen && allUsers.length === 0) {
      const loadAllUsers = async () => {
        setLoadingAllUsers(true)
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, avatar_color, instruments, last_seen')
            .order('display_name', { ascending: true })
            .limit(100) // Límite razonable para no sobrecargar
          
          if (!error && data) {
            // Filtrar al usuario actual y los ocultos
            const filtered = data.filter(p => p.id !== user?.id && !hiddenIds.includes(p.id))
            setAllUsers(filtered)
          }
        } catch (error) {
          console.error('Error al cargar usuarios:', error)
        } finally {
          setLoadingAllUsers(false)
        }
      }
      loadAllUsers()
    }
  }, [isSearchOpen])

  const handleDepartamentoChange = (dep: string) => { setFilterDepartamento(dep); setFilterLocalidad('Todas'); }
  
  const filteredPosts = posts.filter(p => {
    return (filterDepartamento === 'Todos' || p.departamento === filterDepartamento) &&
           (filterLocalidad === 'Todas' || p.localidad === filterLocalidad) &&
           (filterGenre === '' || p.genres?.includes(filterGenre)) &&
           (filterIntention === 'Todas' || p.intention === filterIntention);
  })

  const otherPosts = filteredPosts
    .filter(p => p.user_id !== user?.id && !hiddenIds.includes(p.user_id))
    .sort((a, b) => {
      if (filterSort === 'populares') {
        return (b.likes_count || 0) - (a.likes_count || 0);
      }
      return 0;
    });  

  const myLikes = myPost?.likes_count || 0
  const hasNewLikes = myLikes > seenLikes

  // Si alguien quitó su like, bajar el contador visto para detectar likes nuevos después
  useEffect(() => {
    if (myPost && myLikes < seenLikes) markLikesSeen(myLikes)
  }, [myLikes])

  const openCreateModal = () => { 
    if (hasOwnPost) {
      setToast({ message: 'Ya tenés una publicación activa. Editá o eliminá la existente.', type: 'info' })
      return
    }
    setIsEditing(false)
    setIsModalOpen(true) 
  }
  
  const openEditModal = () => { setIsEditing(true); setIsModalOpen(true) }

  const handleDeletePost = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('user_id', user.id);
      if (error) throw error;
      setMyPost(null);
      setHasOwnPost(false);
      setShowDeleteModal(false);
      setToast({ message: 'Publicación eliminada correctamente', type: 'success' });
    } catch (error: any) {
      setToast({ message: 'Error al eliminar: ' + error.message, type: 'error' });
    }
  }

  const handleUserSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      // Si hay poco texto, mostrar todos los usuarios
      setSearchResults([])
      return;
    }
    
    // Filtrar la lista ya cargada (más rápido que consultar la BD)
    const queryLower = query.toLowerCase().trim();
    const filtered = allUsers.filter(p => 
      p.display_name?.toLowerCase().includes(queryLower) || 
      p.username?.toLowerCase().includes(queryLower)
    );
    setSearchResults(filtered);
  }

  const handleOpenReport = (type: 'post' | 'user', id: string, userId: string) => {
    setReportTarget({ type, id, userId })
    setReportReason('')
    setReportModalOpen(true)
  }

  const handleSubmitReport = async () => {
    if (!reportReason.trim() || !user || !reportTarget) return
    setIsReporting(true)
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: reportTarget.userId,
        post_id: reportTarget.type === 'post' ? reportTarget.id : null,
        reason: reportReason
      })
      if (error) throw error
      setToast({ message: 'Reporte enviado. Gracias por ayudar a mantener la comunidad segura.', type: 'success' })
      setReportModalOpen(false)
      setReportTarget(null)
    } catch (error: any) {
      setToast({ message: 'Error al enviar reporte: ' + error.message, type: 'error' })
    } finally {
      setIsReporting(false)
    }
  }

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !user) return;
    setIsSendingSuggestion(true);
    try {
      const { error } = await supabase.from('suggestions').insert({ user_id: user.id, content: suggestionText });
      if (error) throw error;
      setToast({ message: '¡Gracias por tu sugerencia! Nos ayuda a mejorar.', type: 'success' });
      setSuggestionText('');
      closeSuggestionModal();
    } catch (error: any) {
      setToast({ message: 'Error al enviar: ' + error.message, type: 'error' });
    } finally {
      setIsSendingSuggestion(false);
    }
  }

  // Función para renderizar cada usuario en la lista (reutilizable)
  const renderUserItem = (profile: any) => (
    <div 
      key={profile.id} 
      onClick={() => { navigate(`/perfil/${profile.id}`); setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }} 
      className="flex items-center gap-3 p-3 hover:bg-[#2a2a2a] rounded-xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-[#3a3a3a]"
    >
      <div className="relative">
        <Avatar url={profile.avatar_url} name={profile.display_name} color={profile.avatar_color || '#333'} size={45} isOnline={isUserOnline(profile.last_seen)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate group-hover:text-purple-400 transition-colors">{profile.display_name}</p>
        <p className="text-gray-500 text-xs truncate">@{profile.username}</p>
        {profile.instruments?.length > 0 && (
          <p className="text-purple-400/70 text-[10px] mt-0.5 flex items-center gap-1">
            <FaGuitar size={8} /> {profile.instruments[0].name}
          </p>
        )}
      </div>
      <FaChevronRight className="text-gray-600 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200" size={14} />
    </div>
  )

  return (
    <div className="min-h-screen relative text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      <WelcomeModal />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <main className="max-w-6xl mx-auto px-4 pt-10 pb-6 space-y-6">
        
       <div className="space-y-4 w-full">
          
          {/* Fila 1: Barra de búsqueda  */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500/50 rounded-xl p-3.5 flex items-center justify-center md:justify-start md:gap-3 text-gray-400 hover:text-white transition-all group shadow-lg shadow-purple-900/5"
          >
            <FaSearch className="text-purple-500 group-hover:scale-110 transition-transform flex-shrink-0" size={18} />
            <span className="text-sm font-medium truncate">Buscar músicos por @usuario o nombre...</span>
          </button>

          {/* Fila 2: Televisión Retro (CENTRADA) */}
          <div className="flex justify-center">
            <RetroTV />
          </div>
          
        </div>

        {loading ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 text-center">
            <FaSpinner className="animate-spin text-3xl text-purple-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Cargando tu publicación...</p>
          </div>
        ) : myPost ? (
          <div className="bg-gradient-to-br from-purple-900/10 to-[#1a1a1a] border-2 border-purple-600/40 rounded-2xl p-5 md:p-6 shadow-lg shadow-purple-900/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5"><span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span> Mi publicación</span>
              <span className="text-gray-600 text-xs">{new Date(myPost.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-end gap-1">
                <Avatar url={myPost.avatar_url || null} name={myPost.display_name} color={myPost.avatar_color || '#333'} size={50} isOnline={isUserOnline(myPost.last_seen)} />
                <Mascot color={myPost.avatar_color || '#333'} size={24} expression={(myPost.expression as any) || 'normal'} />
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
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words mb-4 pl-[62px] md:pl-[62px]">{renderContentWithLinks(myPost.content)}</p>            
            <div className="flex flex-wrap gap-2 mb-4 pl-[62px] md:pl-[62px]">
              {myPost.intention && (<span className="px-2.5 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-[10px] font-bold rounded-full flex items-center gap-1"><FaBullseye size={8} /> {myPost.intention}</span>)}
              {myPost.genres?.map((genre, idx) => { const genData = GENEROS_FIJOS.find(g => g.name === genre); return <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${genData?.color || 'bg-gray-800 text-gray-400 border-gray-700'}`}>#{genre}</span> })}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-purple-600/20 pl-[62px] md:pl-[62px]">
              <button 
                onClick={() => handleViewLikers(myPost.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border relative ${
                  myPost.is_liked_by_me ? 'bg-red-900/20 text-red-500 border-red-800/50' : 'bg-[#0f0f0f] text-gray-400 border-[#2a2a2a] hover:text-red-400 hover:border-red-900/50'
                }`}
              >
                <FaHeart size={14} className={myPost.is_liked_by_me ? 'animate-pulse' : ''} />
                <span className="text-xs font-bold">{myPost.likes_count || 0} Ver likes</span>
                
                {hasNewLikes && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#1a1a1a] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                )}
              </button>

              <button onClick={openEditModal} className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all"><FaEdit size={12} className="text-purple-400" /> Editar</button>
              <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-800/50 hover:bg-red-900/40 rounded-lg text-sm text-red-400 hover:text-red-300 transition-all"><FaTrash size={12} /> Eliminar</button>
            </div>
          </div>
        ) : hasOwnPost ? (
          <div className="bg-[#1a1a1a] border border-purple-600/40 rounded-2xl p-8 text-center">
            <FaSpinner className="animate-spin text-3xl text-purple-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Cargando tu publicación...</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-900/15 to-[#1a1a1a] border-2 border-dashed border-purple-600/40 rounded-2xl p-8 md:p-10 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center border-2 border-purple-600/40"><IoMegaphone className="text-purple-400 text-3xl" /></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center animate-pulse"><FaPlus className="text-white text-xs" /></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">¡Creá tu primera publicación!</h3>
                <p className="text-gray-400 text-sm max-w-md">Contá a la comunidad qué buscás. <span className="text-purple-400 font-semibold">Solo podés tener una publicación</span>.</p>
              </div>
              <button onClick={openCreateModal} className="mt-2 flex items-center gap-2 px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/30 hover:scale-105"><FaPlus size={14} /> Crear mi publicación</button>
            </div>
          </div>
        )}

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <button onClick={() => setShowFilters(!showFilters)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-[#222]">
            <div className="flex items-center gap-2">
              <FaFilter className="text-purple-500" size={14} />
              <span className="text-white text-sm font-semibold">Filtros de búsqueda</span>
              {(filterDepartamento !== 'Todos' || filterLocalidad !== 'Todas' || filterGenre !== '' || filterIntention !== 'Todas') && <span className="w-2 h-2 bg-purple-500 rounded-full"></span>}
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
                <button onClick={() => { setFilterDepartamento('Todos'); setFilterLocalidad('Todas'); setFilterGenre(''); setFilterIntention('Todas'); }} className="text-xs text-purple-400 hover:text-purple-300 font-medium"> Limpiar filtros</button>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setFilterSort('recientes')} className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${filterSort === 'recientes' ? 'bg-purple-600 text-white border-purple-600' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-400'}`}>
              <IoIosTime className="text-lg" /> Más Recientes
            </button>
            <button onClick={() => setFilterSort('populares')} className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${filterSort === 'populares' ? 'bg-purple-600 text-white border-purple-600' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-400'}`}>
              <FaHeart className="text-lg" /> Más me gusta
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FaMusic className="text-purple-500" /> Feed de la comunidad <span className="text-sm text-gray-500 font-normal">({otherPosts.length})</span></h3>
          </div>
          {loading ? (<div className="flex justify-center py-12"><FaSpinner className="animate-spin text-3xl text-purple-600" /></div>) : otherPosts.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl"><FaSearch className="text-gray-600 text-4xl mx-auto mb-3" /><p className="text-gray-400">No hay publicaciones con estos filtros.</p></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherPosts.map((post) => (
                  <div key={post.id || post.user_id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-purple-600/30 transition-colors flex flex-col">
                    <div className="flex items-start gap-3 mb-3 cursor-pointer" onClick={() => navigate(`/perfil/${post.user_id}`)}>
                      <div className="flex items-end gap-1">
                        <Avatar url={post.avatar_url || null} name={post.display_name} color={post.avatar_color || '#333'} size={45} isOnline={isUserOnline(post.last_seen)} />
                        <Mascot color={post.avatar_color || '#333'} size={20} expression={(post.expression as any) || 'normal'} />
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
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words mb-3 flex-1">{renderContentWithLinks(post.content)}</p>
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#2a2a2a] mb-3">
                      {post.intention && (<span className="px-2.5 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-[10px] font-bold rounded-full flex items-center gap-1"><FaBullseye size={8} /> {post.intention}</span>)}
                      {post.genres?.map((genre, idx) => { const genData = GENEROS_FIJOS.find(g => g.name === genre); return <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${genData?.color || 'bg-gray-800 text-gray-400 border-gray-700'}`}>#{genre}</span> })}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                      <button onClick={() => handleToggleLike(post.id, post.user_id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${post.is_liked_by_me ? 'bg-red-900/20 text-red-500 border border-red-800/50' : 'bg-[#0f0f0f] text-gray-400 border border-[#2a2a2a] hover:text-red-400 hover:border-red-900/50'}`}>
                        <FaHeart size={14} className={post.is_liked_by_me ? 'animate-pulse' : ''} />
                        <span className="text-xs font-bold">{post.likes_count || 0}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/chat/${post.user_id}?post=${post.id}`)} className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                          <FaEnvelope size={12} className="text-purple-400" /> <span className="hidden sm:inline">Enviar mensaje</span>
                        </button>
                        <button onClick={() => handleOpenReport('post', post.id, post.user_id)} className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-red-400 transition-colors">
                          <FaFlag size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* Marcador invisible: al verse en pantalla se carga la siguiente página */}
          {!loading && hasMore && (
            <div ref={sentinelRef} className="flex justify-center items-center gap-2 py-8 text-sm text-gray-500">
              {loadingMore && <><FaSpinner className="animate-spin text-purple-500" /> Cargando más publicaciones...</>}
            </div>
          )}
          {!loading && !hasMore && posts.length > 0 && (
            <p className="text-center text-xs text-gray-600 py-8">No hay más publicaciones</p>
          )}
        </div>
      </main>

      {/* ✅ CAJÓN DESLIZANTE DE BÚSQUEDA CON DIRECTORIO DE USUARIOS */}
      {isSearchOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-[fadeIn_0.3s_ease-out]" 
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }} 
          />
          <div className="fixed top-[var(--banner-h,0px)] bottom-0 left-0 w-full max-w-sm bg-[#1a1a1a] border-r border-[#2a2a2a] z-50 shadow-2xl transform transition-transform duration-300 ease-out animate-[slideInLeft_0.3s_ease-out] flex flex-col">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between bg-[#1a1a1a]">
              <h3 className="text-white font-bold flex items-center gap-2">
                <FaUser className="text-purple-500" /> 
                {searchQuery.length >= 2 ? 'Resultados' : 'Directorio de Músicos'}
              </h3>
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-[#2a2a2a]">
              <div className="relative group">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={14} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Filtrar músicos por nombre o @usuario..." 
                  value={searchQuery} 
                  onChange={(e) => handleUserSearch(e.target.value)} 
                  className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-600 text-sm" 
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
              {/* Contador de usuarios */}
              <p className="text-[10px] text-gray-500 mt-2 text-center">
                {searchQuery.length >= 2 
                  ? `${searchResults.length} músico${searchResults.length !== 1 ? 's' : ''} encontrado${searchResults.length !== 1 ? 's' : ''}`
                  : `${allUsers.length} músico${allUsers.length !== 1 ? 's' : ''} en la comunidad`
                }
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {loadingAllUsers ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <FaSpinner className="animate-spin text-purple-600 text-2xl" />
                  <p className="text-gray-500 text-sm">Cargando músicos...</p>
                </div>
              ) : searchQuery.length >= 2 ? (
                // Modo búsqueda: mostrar resultados filtrados
                searchResults.length > 0 ? (
                  searchResults.map(renderUserItem)
                ) : (
                  <div className="text-center py-12">
                    <FaSearch className="text-4xl mx-auto mb-3 opacity-30 text-gray-600" />
                    <p className="text-gray-500 text-sm">No se encontraron músicos con "{searchQuery}"</p>
                  </div>
                )
              ) : (
                // Modo directorio: mostrar todos los usuarios
                allUsers.length > 0 ? (
                  allUsers.map(renderUserItem)
                ) : (
                  <div className="text-center py-12">
                    <FaUser className="text-4xl mx-auto mb-3 opacity-30 text-gray-600" />
                    <p className="text-gray-500 text-sm">Aún no hay músicos en la comunidad.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}

      {showLikersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLikersModal(false)} />
          <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaHeart className="text-gray-500" /> Les gustó tu post
              </h3>
              <button onClick={() => setShowLikersModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            {loadingLikers ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : likersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Mascot color="#9ca3af" size={80} expression="pensativo" />
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {likersList.map((liker: any) => (
                  <div 
                    key={liker.id} 
                    onClick={() => { setShowLikersModal(false); navigate(`/perfil/${liker.id}`); }}
                    className="flex items-center gap-3 p-2 hover:bg-[#2a2a2a] rounded-lg cursor-pointer transition-colors"
                  >
                    <Avatar url={liker.avatar_url} name={liker.display_name} color={liker.avatar_color || '#333'} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{liker.display_name}</p>
                      <p className="text-gray-500 text-xs truncate">@{liker.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setReportModalOpen(false)} />
          <div className="relative bg-[#1a1a1a] border border-red-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center"><FaFlag className="text-red-400" size={20} /></div>
              <h3 className="text-xl font-bold text-white">Reportar publicación</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">Tu reporte es anónimo para el usuario. Selecciona un motivo:</p>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-red-500 mb-4">
              <option value="">Selecciona un motivo...</option>
              <option value="Spam o publicidad">Spam o publicidad</option>
              <option value="Comportamiento abusivo o acoso">Comportamiento abusivo o acoso</option>
              <option value="Contenido inapropiado">Contenido inapropiado</option>
              <option value="Información falsa">Información falsa</option>
              <option value="Otro motivo">Otro motivo</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setReportModalOpen(false)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-medium">Cancelar</button>
              <button onClick={handleSubmitReport} disabled={isReporting || !reportReason} className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2">
                {isReporting ? <FaSpinner className="animate-spin" /> : <FaFlag />} {isReporting ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-red-900/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-red-900/20">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-950/60 rounded-full flex items-center justify-center border border-red-700/50"><FaExclamationTriangle className="text-red-400" size={28} /></div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">¿Eliminar publicación?</h3>
            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">Esta acción no se puede deshacer. Tu publicación desaparecerá del feed.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] hover:text-white transition-all font-medium border border-[#3a3a3a]">Cancelar</button>
              <button onClick={handleDeletePost} className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"><FaTrash size={14} /> Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} existingPost={isEditing ? myPost : null} onPostSaved={() => { setHasOwnPost(true); fetchMyPost() }} />
    </div>
  )
}