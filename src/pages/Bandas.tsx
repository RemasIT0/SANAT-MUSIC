// src/pages/Bandas.tsx
// Listado de bandas: buscar, filtrar las que buscan integrantes y crear una nueva.
import { useState, useEffect } from 'react'
import Toast from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import AnimatedBackground from '../components/AnimatedBackground'
import BandFormModal from '../components/BandFormModal'
import { RowSkeleton } from '../components/Skeleton'
import { FaUsers, FaPlus, FaSearch, FaMapMarkerAlt, FaUserPlus } from 'react-icons/fa'

export interface BandRow {
  id: string
  name: string
  bio: string
  genres: string[]
  departamento: string
  localidad: string
  logo_url: string | null
  looking_for: string[]
  created_by: string
  created_at: string
  members?: number
}

export function BandLogo({ band, size = 56 }: { band: Pick<BandRow, 'name' | 'logo_url'>; size?: number }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-800 to-[#141414] border border-[#2a2a2a] overflow-hidden flex items-center justify-center flex-shrink-0 text-white font-bold" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {band.logo_url ? <img src={band.logo_url} alt="" className="w-full h-full object-cover" /> : band.name.slice(0, 1).toUpperCase()}
    </div>
  )
}

export default function Bandas({ embedded = false }: { embedded?: boolean }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [bands, setBands] = useState<BandRow[]>([])
  const [myBandIds, setMyBandIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todas' | 'buscan' | 'zona' | 'mias'>('todas')
  const [invites, setInvites] = useState<string[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  // Se pueden crear varias bandas, con un tope para evitar spam (lo controla también la base)
  const MAX_BANDS = 5
  const openCreate = () => {
    if (bands.filter(b => b.created_by === user?.id).length >= MAX_BANDS) {
      setToast({ message: `Ya creaste ${MAX_BANDS} bandas, que es el máximo por perfil.`, type: 'info' })
      return
    }
    setShowCreate(true)
  }

  useEffect(() => {
    const load = async () => {
      const [bandsRes, membersRes] = await Promise.all([
        supabase.from('bands').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('band_members').select('band_id, user_id, status'),
      ])
      if (bandsRes.error) { setMissing(true); setLoading(false); return }
      const members = membersRes.data || []
      setBands((bandsRes.data || []).map(b => ({ ...b, members: members.filter(m => m.band_id === b.id && m.status === 'active').length })))
      setMyBandIds(new Set(members.filter(m => m.user_id === user?.id && m.status === 'active').map(m => m.band_id)))
      setInvites(members.filter(m => m.user_id === user?.id && m.status === 'invited').map(m => m.band_id))
      setLoading(false)
    }
    load()
  }, [user])

  const term = search.trim().toLowerCase()
  const visible = bands.filter(b => {
    if (term && !`${b.name} ${b.genres.join(' ')} ${b.localidad}`.toLowerCase().includes(term)) return false
    if (filter === 'buscan') return b.looking_for.length > 0
    if (filter === 'zona') return b.departamento === profile?.departamento
    if (filter === 'mias') return myBandIds.has(b.id)
    return true
  })

  const filters = [['todas', 'Todas'], ['buscan', 'Buscan integrantes'], ['zona', 'Mi zona'], ['mias', 'Mis bandas']] as const

  return (
    // "embedded": dentro de una pestaña del Inicio (sin fondo ni márgenes propios)
    <div className={embedded ? 'text-gray-200' : 'min-h-screen relative text-gray-200 pb-24'}>
      {!embedded && <AnimatedBackground />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main className={embedded ? 'space-y-4' : 'max-w-3xl mx-auto px-4 pt-10 pb-4 space-y-4'}>
        <div className="flex items-center justify-between gap-3">
          <h1 className={`nota ${embedded ? 'text-xl' : 'text-2xl'}`}><FaUsers className="text-purple-400" /> Bandas</h1>
          <button onClick={openCreate} disabled={missing || loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold disabled:opacity-40">
            <FaPlus size={11} /> Crear banda
          </button>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, género o localidad" className="w-full pl-9 pr-3 py-2.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filters.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${filter === id ? 'bg-purple-700 border-purple-500 text-white' : 'bg-[#141414] border-[#2a2a2a] text-gray-300 hover:text-white'}`}>{label}</button>
          ))}
        </div>

        {invites.length > 0 && (
          <div className="p-3 rounded-2xl bg-purple-900/25 border border-purple-500/50">
            <p className="text-sm text-white font-semibold mb-2">Te invitaron a {invites.length === 1 ? 'una banda' : `${invites.length} bandas`}</p>
            <div className="flex flex-wrap gap-2">
              {invites.map(id => {
                const band = bands.find(b => b.id === id)
                return band ? <button key={id} onClick={() => navigate(`/banda/${id}`)} className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold">Ver {band.name}</button> : null
              })}
            </div>
          </div>
        )}

        {missing && <p className="text-sm text-amber-200 bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">Falta activar las bandas: corré el SQL de la etapa 3 en Supabase.</p>}

        {loading ? (
          <div className="space-y-2"><RowSkeleton /><RowSkeleton /><RowSkeleton /></div>
        ) : visible.length === 0 ? (
          <div className="text-center py-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4">
            <FaUsers className="text-4xl mx-auto mb-3 text-gray-500" />
            <p className="text-gray-200 font-semibold">{bands.length ? 'No hay bandas con ese filtro' : 'Todavía no hay bandas'}</p>
            <p className="text-sm text-gray-400 mt-1">¿Tenés una banda o querés armar una? Creala y sumá integrantes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(band => (
              <button key={band.id} onClick={() => navigate(`/banda/${band.id}`)} className="w-full text-left flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500/60 rounded-2xl transition-colors">
                <BandLogo band={band} />
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold truncate">{band.name} {myBandIds.has(band.id) && <span className="ml-1 text-[10px] font-bold text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded">TU BANDA</span>}</p>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    <FaMapMarkerAlt size={9} /> {band.localidad || band.departamento || 'Tucumán'} · {band.members} integrante{band.members === 1 ? '' : 's'}
                    {band.genres.length > 0 && ` · ${band.genres.slice(0, 2).join(', ')}`}
                  </p>
                  {band.looking_for.length > 0 && (
                    <p className="text-[11px] text-amber-300 mt-1 truncate flex items-center gap-1"><FaUserPlus size={10} /> Buscan: {band.looking_for.join(', ')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      {showCreate && <BandFormModal onClose={() => setShowCreate(false)} onSaved={id => navigate(`/banda/${id}?invitar=1`)} />}
    </div>
  )
}
