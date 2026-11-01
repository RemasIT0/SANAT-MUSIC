// src/components/NearbyMusicians.tsx
// "Músicos cerca tuyo": gente de tu departamento, ordenada por afinidad
// (misma localidad, géneros en común, en línea ahora).
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useHiddenUsers } from '../hooks/useHiddenUsers'
import { isUserOnline } from '../hooks/useOnlineStatus'
import Avatar from './Avatar'
import { FaMapMarkerAlt, FaGuitar, FaComment, FaHeadphones, FaChevronDown, FaChevronUp } from 'react-icons/fa'

// Se recuerda en este dispositivo si la persona prefiere tenerla oculta
const HIDDEN_KEY = 'sanat-nearby-hidden'
const readHidden = () => { try { return localStorage.getItem(HIDDEN_KEY) === '1' } catch { return false } }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

export default function NearbyMusicians() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const hiddenIds = useHiddenUsers()
  const [people, setPeople] = useState<any[]>([])
  const [collapsed, setCollapsed] = useState(readHidden)

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(HIDDEN_KEY, next ? '1' : '0') } catch { /* sin almacenamiento: solo por esta vez */ }
  }

  useEffect(() => {
    if (!user || !profile?.departamento) return
    const load = async () => {
      const { data } = await supabase.from('profiles')
        .select('id, display_name, avatar_url, avatar_color, instruments, genres, localidad, departamento, last_seen, audio_url, is_banned')
        .eq('departamento', profile.departamento).neq('id', user.id).limit(80)
      const myGenres = (profile.genres || []).map(norm)
      const scored = (data || [])
        .filter(p => !p.is_banned)
        .map(p => {
          const shared = (p.genres || []).filter((g: string) => myGenres.includes(norm(g)))
          const score = (p.localidad === profile.localidad ? 3 : 0) + shared.length * 2 + (isUserOnline(p.last_seen) ? 2 : 0) + (p.audio_url ? 1 : 0)
          return { ...p, shared, score }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)
      setPeople(scored)
    }
    load()
  }, [user, profile?.departamento, profile?.localidad])

  const visible = people.filter(p => !hiddenIds.includes(p.id))
  if (!visible.length) return null

  return (
    <section aria-labelledby="nearby-title">
      <div className="flex items-center justify-between mb-2">
        <h3 id="nearby-title" className="text-sm font-semibold text-white flex items-center gap-2"><FaMapMarkerAlt className="text-purple-400" /> Músicos cerca tuyo</h3>
        <div className="flex items-center gap-1">
          {!collapsed && <button onClick={() => navigate('/demos')} className="text-xs text-purple-300 hover:text-white flex items-center gap-1.5 px-2 py-1"><FaHeadphones size={11} /> Escuchar demos</button>}
          <button onClick={toggleCollapsed} aria-expanded={!collapsed} aria-controls="nearby-list" className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1a1a1a]/80 border border-[#2a2a2a]">
            {collapsed ? <><FaChevronDown size={10} /> Mostrar ({visible.length})</> : <><FaChevronUp size={10} /> Ocultar</>}
          </button>
        </div>
      </div>
      {!collapsed && <div id="nearby-list" className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 snap-x snap-mandatory">
        {visible.map(p => (
          <div key={p.id} className="snap-start flex-shrink-0 w-40 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-3 flex flex-col items-center text-center">
            <button onClick={() => navigate(`/perfil/${p.id}`)} className="flex flex-col items-center w-full">
              <Avatar url={p.avatar_url || null} name={p.display_name} color={p.avatar_color || '#333'} size={60} isOnline={isUserOnline(p.last_seen)} />
              <p className="text-sm text-white font-semibold mt-2 truncate w-full">{p.display_name}</p>
              <p className="text-[11px] text-gray-400 truncate w-full flex items-center justify-center gap-1"><FaGuitar size={9} /> {p.instruments?.[0]?.name || 'Músico'}</p>
              <p className="text-[11px] text-gray-500 truncate w-full">{p.localidad}</p>
            </button>
            <p className="text-[10px] mt-1.5 h-4 truncate w-full text-purple-300">
              {p.shared.length ? `${p.shared.slice(0, 2).map((g: string) => g[0].toUpperCase() + g.slice(1)).join(', ')} en común` : p.localidad === profile?.localidad ? 'Tu misma localidad' : ''}
            </p>
            <button onClick={() => navigate(`/chat/${p.id}`)} className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-purple-700 text-white text-xs transition-colors"><FaComment size={10} /> Escribir</button>
          </div>
        ))}
      </div>}
    </section>
  )
}
