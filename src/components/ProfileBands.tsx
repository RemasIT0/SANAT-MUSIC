// src/components/ProfileBands.tsx
// Bandas en las que toca una persona (sección del perfil).
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { BandLogo } from '../pages/Bandas'
import { FaCrown, FaPlus } from 'react-icons/fa'

export default function ProfileBands({ profileId, isMine, themeColor }: { profileId: string; isMine: boolean; themeColor: string }) {
  const navigate = useNavigate()
  const [bands, setBands] = useState<{ id: string; name: string; logo_url: string | null; role: string; instrument: string }[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: memberships, error } = await supabase.from('band_members').select('band_id, role, instrument').eq('user_id', profileId).eq('status', 'active')
      if (error || !memberships?.length) { setBands([]); return }
      const { data } = await supabase.from('bands').select('id, name, logo_url').in('id', memberships.map(m => m.band_id))
      setBands((data || []).map(b => {
        const m = memberships.find(x => x.band_id === b.id)!
        return { ...b, role: m.role, instrument: m.instrument }
      }))
    }
    load()
  }, [profileId])

  if (!bands.length && !isMine) return null

  return (
    <section className="bg-[#1a1a1a] border rounded-2xl p-4 md:p-5" style={{ borderColor: themeColor + '40' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-white font-semibold">Bandas</h3>
        {isMine && <button onClick={() => navigate('/bandas')} className="text-xs text-gray-300 hover:text-white flex items-center gap-1"><FaPlus size={9} /> {bands.length ? 'Buscar o crear' : 'Crear o unirme a una banda'}</button>}
      </div>
      {bands.length === 0 ? (
        <p className="text-sm text-gray-400">Todavía no estás en ninguna banda.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {bands.map(b => (
            <button key={b.id} onClick={() => navigate(`/banda/${b.id}`)} className="flex items-center gap-2.5 pr-3 p-1.5 rounded-xl bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-500/60">
              <BandLogo band={b} size={36} />
              <div className="text-left">
                <p className="text-sm text-white flex items-center gap-1.5">{b.name} {b.role === 'admin' && <FaCrown className="text-amber-300" size={10} />}</p>
                {b.instrument && <p className="text-[11px] text-gray-400">{b.instrument}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
