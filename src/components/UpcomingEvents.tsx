// src/components/UpcomingEvents.tsx
// Tira horizontal con los próximos eventos de la agenda (en el Inicio).
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { EVENT_TYPES } from '../pages/Agenda'
import { FaCalendarAlt, FaChevronRight } from 'react-icons/fa'

export default function UpcomingEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    supabase.from('events').select('id, title, starts_at, place, event_type')
      .gte('starts_at', new Date().toISOString()).order('starts_at').limit(8)
      .then(({ data }) => setEvents(data || []))
  }, [])

  if (!events.length) return null

  return (
    <section className="bg-[#1a1a1a]/90 border border-[#2a2a2a] rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><FaCalendarAlt className="text-purple-400" size={13} /> Próximos eventos</h2>
        <button onClick={() => navigate('/home?seccion=eventos')} className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1">Ver agenda <FaChevronRight size={9} /></button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
        {events.map(ev => {
          const type = EVENT_TYPES[ev.event_type] || EVENT_TYPES.otro
          const date = new Date(ev.starts_at)
          return (
            <button key={ev.id} onClick={() => navigate(`/home?seccion=eventos&evento=${ev.id}`)} className="snap-start flex-shrink-0 w-44 text-left p-2.5 rounded-xl bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-500/60 transition-colors">
              <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: type.color }}>
                <type.icon size={9} /> {date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-white font-semibold truncate mt-1">{ev.title}</p>
              <p className="text-xs text-gray-400 truncate">{ev.place}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
