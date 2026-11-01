// src/components/AdminStatsCharts.tsx
// Estadísticas del admin: altas por semana, mensajes por día y lo más elegido.
// Datos agregados de la función admin_stats() (solo el admin verificado).
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { FaSpinner, FaTable, FaChartBar } from 'react-icons/fa'

// Un solo color de serie (validado contra el fondo oscuro); textos en tonos neutros
const SERIES = '#9085e9'
const GRID = '#2a2a2a'

interface Stats {
  users_per_week: { week: string; count: number }[]
  messages_per_day: { day: string; count: number }[]
  top_genres: { name: string; count: number }[]
  top_places: { name: string; count: number }[]
  totals: { users: number; active_week: number; posts: number; messages: number; bands: number; events: number }
}

const niceMax = (value: number) => {
  if (value <= 4) return 4
  const step = Math.pow(10, Math.floor(Math.log10(value)))
  return Math.ceil(value / step) * step
}
const shortDate = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${Number(d)}/${Number(m)}`
}

function ChartCard({ title, subtitle, table, children }: { title: string; subtitle: string; table: [string, number][]; children: React.ReactNode }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <button onClick={() => setShowTable(v => !v)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white flex-shrink-0">
          {showTable ? <><FaChartBar size={11} /> Ver gráfico</> : <><FaTable size={11} /> Ver tabla</>}
        </button>
      </div>
      {showTable ? (
        <table className="w-full text-sm">
          <tbody>
            {table.map(([label, value]) => (
              <tr key={label} className="border-b border-[#222] last:border-0">
                <td className="py-1.5 text-gray-300">{label}</td>
                <td className="py-1.5 text-right text-white tabular-nums">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : children}
    </section>
  )
}

// Columnas verticales con una línea de base, grilla suave y detalle al pasar el dedo/mouse
function ColumnChart({ data, unit, labelEvery = 1 }: { data: { label: string; tip: string; value: number }[]; unit: string; labelEvery?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = niceMax(Math.max(...data.map(d => d.value), 0))
  const last = data.length - 1
  return (
    <div className="relative pl-8">
      {/* Grilla y escala */}
      <div className="absolute left-0 right-0 top-0 h-40 pointer-events-none">
        {[1, 0.5].map(f => (
          <div key={f} className="absolute left-0 right-0 flex items-center" style={{ top: `${(1 - f) * 100}%` }}>
            <span className="w-7 text-right pr-1.5 text-[10px] text-gray-500 tabular-nums -translate-y-1/2">{Math.round(max * f)}</span>
            <div className="flex-1 border-t border-dashed" style={{ borderColor: GRID }} />
          </div>
        ))}
      </div>
      <div className="relative h-40 flex items-end border-b border-gray-600" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <button
            key={d.label}
            type="button"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onClick={() => setHover(hover === i ? null : i)}
            aria-label={`${d.tip}: ${d.value} ${unit}`}
            className="relative flex-1 h-full flex items-end justify-center focus:outline-none"
          >
            <span
              className="block w-full max-w-[24px] mx-[1px] rounded-t transition-opacity"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0, backgroundColor: SERIES, opacity: hover === null || hover === i ? 1 : 0.45 }}
            />
            {/* Etiqueta directa solo en el último valor */}
            {i === last && hover === null && d.value > 0 && (
              <span className="absolute text-[11px] font-semibold text-white tabular-nums" style={{ bottom: `calc(${(d.value / max) * 100}% + 4px)` }}>{d.value}</span>
            )}
            {hover === i && (
              <span className={`absolute z-10 whitespace-nowrap px-2 py-1 rounded-lg bg-[#0b0b0b] border border-[#333] text-[11px] shadow-xl ${i > data.length / 2 ? 'right-0' : 'left-0'}`} style={{ bottom: `calc(${(d.value / max) * 100}% + 6px)` }}>
                <span className="text-gray-400">{d.tip}</span> <span className="text-white font-semibold tabular-nums">{d.value} {unit}</span>
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="flex mt-1.5">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 text-center text-[10px] text-gray-500 tabular-nums">{i % labelEvery === (last % labelEvery) ? d.label : ''}</span>
        ))}
      </div>
    </div>
  )
}

// Ranking en barras horizontales (nombre a la izquierda, cantidad al final)
function RankBars({ data, capitalize = false }: { data: { name: string; count: number }[]; capitalize?: boolean }) {
  if (!data.length) return <p className="text-sm text-gray-400">Sin datos todavía.</p>
  const max = Math.max(...data.map(d => d.count))
  return (
    <ul className="space-y-2">
      {data.map(d => (
        <li key={d.name} className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-3 items-center" title={`${d.name}: ${d.count}`}>
          <span className={`text-xs text-gray-300 truncate ${capitalize ? 'capitalize' : ''}`}>{d.name}</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="block h-3.5 rounded-r" style={{ width: `${(d.count / max) * 85}%`, minWidth: 2, backgroundColor: SERIES }} />
            <span className="text-xs text-white tabular-nums">{d.count}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function AdminStatsCharts() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('admin_stats').then(({ data, error }) => {
      if (error) setError(/admin_stats|function/i.test(error.message) && !/autorizado/i.test(error.message)
        ? 'Falta activar las estadísticas: corré el SQL de la etapa 3 en Supabase.'
        : 'No se pudieron cargar las estadísticas. Verificá la pregunta secreta del admin.')
      else setStats(data as Stats)
    })
  }, [])

  if (error) return <p className="text-sm text-amber-200 bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">{error}</p>
  if (!stats) return <div className="flex justify-center py-16 text-gray-400"><FaSpinner className="animate-spin" size={22} /></div>

  const t = stats.totals
  const tiles: [string, number, string?][] = [
    ['Músicos', t.users, `${t.active_week} activos esta semana`],
    ['Publicaciones', t.posts],
    ['Mensajes', t.messages],
    ['Bandas', t.bands],
    ['Eventos próximos', t.events],
  ]
  const weeks = stats.users_per_week.map(w => ({ label: shortDate(w.week), tip: `Semana del ${shortDate(w.week)}`, value: w.count }))
  const days = stats.messages_per_day.map(d => ({ label: shortDate(d.day), tip: shortDate(d.day), value: d.count }))
  const newThisWeek = weeks[weeks.length - 1]?.value || 0
  const msgsToday = days[days.length - 1]?.value || 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {tiles.map(([label, value, note], i) => (
          <div key={label} className={`${i === 0 ? 'col-span-2 sm:col-span-1 ' : ''}bg-[#141414] border border-[#2a2a2a] rounded-xl p-3`}>
            <p className="text-[11px] text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-white tabular-nums leading-tight">{value.toLocaleString('es-AR')}</p>
            {note && <p className="text-[10px] text-gray-500 mt-0.5">{note}</p>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Usuarios nuevos por semana" subtitle={`Últimas 8 semanas · ${newThisWeek} esta semana`} table={weeks.map(w => [w.tip, w.value])}>
          <ColumnChart data={weeks} unit="nuevos" />
        </ChartCard>
        <ChartCard title="Mensajes por día" subtitle={`Últimos 14 días · ${msgsToday} hoy`} table={days.map(d => [d.tip, d.value])}>
          <ColumnChart data={days} unit="mensajes" labelEvery={2} />
        </ChartCard>
        <ChartCard title="Géneros más elegidos" subtitle="Cantidad de perfiles que lo marcaron" table={stats.top_genres.map(g => [g.name, g.count])}>
          <RankBars data={stats.top_genres} capitalize />
        </ChartCard>
        <ChartCard title="Localidades con más músicos" subtitle="Según la zona del perfil" table={stats.top_places.map(p => [p.name, p.count])}>
          <RankBars data={stats.top_places} />
        </ChartCard>
      </div>
    </div>
  )
}
