// src/components/AsistenteBot.tsx
// Sani: asistente de ayuda. Entiende preguntas escritas (por palabras clave),
// recomienda canciones y, para el admin, tiene una pestaña con datos del sistema.
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Mascot from './Mascot'
import { FaTimes, FaArrowRight, FaUndo, FaPaperPlane, FaExternalLinkAlt, FaUserShield, FaQuestionCircle } from 'react-icons/fa'
import {
  TOPICS, CATEGORIES, SONGS, SONG_GENRES, SONG_KEYWORDS,
  youtubeSearch, normalize, matchTopic, matchGenre, type BotAction,
} from './asistente/helpTopics'
import { ADMIN_QUERIES, matchAdminQuery } from './asistente/adminQueries'
import { ADMIN_EMAIL } from '../hooks/useAdminAlerts'

interface ChatEntry {
  from: 'bot' | 'user'
  text: string
  lines?: string[]
  actions?: BotAction[]
}

type Mode = 'help' | 'admin'

const GREETINGS = ['hola', 'buenas', 'hey', 'que tal', 'buen dia', 'buenas tardes', 'buenas noches']
const THANKS = ['gracias', 'genial', 'joya', 'buenisimo', 'perfecto', 'de una']

export default function AsistenteBot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { user, profile, openSuggestionModal } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL

  const [mode, setMode] = useState<Mode>('help')
  const [helpEntries, setHelpEntries] = useState<ChatEntry[]>([])
  const [adminEntries, setAdminEntries] = useState<ChatEntry[]>([])
  const [category, setCategory] = useState<number | null>(null)
  const [showGenres, setShowGenres] = useState(false)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSongRef = useRef('')

  const entries = mode === 'help' ? helpEntries : adminEntries
  const setEntries = mode === 'help' ? setHelpEntries : setAdminEntries

  const firstName = profile?.display_name?.split(' ')[0] || ''
  const helpGreeting: ChatEntry = {
    from: 'bot',
    text: `¡Hola${firstName ? ` ${firstName}` : ''}! Soy Sani 🎸 Escribime tu duda con tus palabras o elegí un tema abajo. También te puedo recomendar una canción.`,
  }
  const adminGreeting: ChatEntry = {
    from: 'bot',
    text: 'Modo admin 🛡️ Preguntame por reportes, sugerencias, usuarios nuevos, baneados o lo que hiciste en el panel.',
  }

  useEffect(() => {
    if (!open) return
    if (helpEntries.length === 0) setHelpEntries([helpGreeting])
    if (isAdmin && adminEntries.length === 0) setAdminEntries([adminGreeting])
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [entries, thinking])

  const push = (...items: ChatEntry[]) => setEntries(prev => [...prev, ...items])

  // ---------- Canciones ----------
  const songEntry = (genreArg?: string): ChatEntry => {
    const myGenres = (profile?.genres || []).filter(g => SONG_GENRES.includes(g))
    const pool = genreArg ? [genreArg] : myGenres.length ? myGenres : SONG_GENRES
    const genre = pool[Math.floor(Math.random() * pool.length)]
    const options = SONGS[genre].filter(s => `${s.artist}-${s.title}` !== lastSongRef.current)
    const song = options[Math.floor(Math.random() * options.length)]
    lastSongRef.current = `${song.artist}-${song.title}`
    const intro = !genreArg && myGenres.length ? `Como te gusta el ${genre}, te recomiendo:` : `Un tema de ${genre} para vos:`
    return {
      from: 'bot',
      text: `${intro} 🎧 "${song.title}" de ${song.artist}.`,
      actions: [
        { label: 'Escuchar en YouTube', href: youtubeSearch(song.artist, song.title) },
        { label: `Otra de ${genre}`, run: 'song', genre },
      ],
    }
  }

  // ---------- Respuestas de ayuda ----------
  const answerHelp = (text: string) => {
    const norm = normalize(text)
    const genre = matchGenre(text)
    if (SONG_KEYWORDS.some(k => norm.includes(k)) || (genre && norm.split(' ').length <= 3)) {
      push(songEntry(genre ?? undefined))
      return
    }
    const topicId = matchTopic(text)
    if (topicId) {
      const topic = TOPICS[topicId]
      push({ from: 'bot', text: topic.answer, actions: topic.actions })
      return
    }
    if (GREETINGS.some(g => norm.startsWith(g))) {
      push({ from: 'bot', text: '¡Hola! 👋 ¿En qué te ayudo? Podés preguntarme cómo publicar, editar tu perfil, subir un audio o pedirme una canción.' })
      return
    }
    if (THANKS.some(t => norm.includes(t))) {
      push({ from: 'bot', text: '¡De nada! Si necesitás algo más, acá estoy 🤘' })
      return
    }
    push({
      from: 'bot',
      text: 'Mmm, no estoy seguro de haber entendido 🤔 Probá con otras palabras (por ejemplo "cómo subo un audio") o elegí un tema de abajo. Si no lo encontrás, mandanos una sugerencia.',
      actions: [{ label: 'Escribir sugerencia', run: 'suggestion' }],
    })
  }

  // ---------- Respuestas del admin ----------
  const answerAdmin = async (queryId: string | null) => {
    if (!queryId) {
      push({ from: 'bot', text: 'No entendí la consulta. Probá con: "reportes", "sugerencias", "qué borré", "usuarios nuevos", "baneados" o "resumen".' })
      return
    }
    setThinking(true)
    try {
      const answer = await ADMIN_QUERIES[queryId].run()
      push({ from: 'bot', text: answer.text, lines: answer.lines, actions: answer.actions })
    } catch (error: any) {
      push({ from: 'bot', text: 'No pude consultar los datos: ' + (error.message || 'error desconocido') })
    } finally {
      setThinking(false)
    }
  }

  // ---------- Entradas del usuario ----------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    push({ from: 'user', text })
    if (mode === 'admin') answerAdmin(matchAdminQuery(text))
    else answerHelp(text)
  }

  const askTopic = (topicId: string) => {
    if (topicId === '__song') { setShowGenres(true); return }
    const topic = TOPICS[topicId]
    push({ from: 'user', text: topic.question }, { from: 'bot', text: topic.answer, actions: topic.actions })
  }

  const askSong = (genre?: string) => {
    push({ from: 'user', text: genre ? `Recomendame algo de ${genre}` : 'Recomendame una canción' }, songEntry(genre))
  }

  const askAdmin = (queryId: string) => {
    push({ from: 'user', text: ADMIN_QUERIES[queryId].label.replace(/^\S+\s/, '') })
    answerAdmin(queryId)
  }

  const runAction = (action: BotAction) => {
    if (action.href) { window.open(action.href, '_blank', 'noopener,noreferrer'); return }
    if (action.run === 'song') { askSong(action.genre); return }
    onClose()
    if (action.to) navigate(action.to)
    if (action.run === 'suggestion') openSuggestionModal()
  }

  const restart = () => {
    if (mode === 'admin') setAdminEntries([adminGreeting])
    else setHelpEntries([helpGreeting])
    setCategory(null)
    setShowGenres(false)
  }

  if (!open) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto z-[70] sm:w-96 h-[min(34rem,calc(100dvh-8rem-var(--banner-h,0px)))] bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[scaleIn_0.2s_ease-out]">
      {/* Cabecera */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="w-10 h-10 rounded-full bg-[#0f0f0f] border border-purple-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
          <div className="mt-2 pointer-events-none"><Mascot color={profile?.avatar_color || '#a855f7'} size={22} expression={mode === 'admin' ? 'rockero' : 'feliz'} /></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Sani</p>
          <p className={`text-[11px] ${mode === 'admin' ? 'text-amber-300' : 'text-green-400'}`}>{mode === 'admin' ? 'Asistente del admin' : 'Asistente de SANAT'}</p>
        </div>
        <button onClick={restart} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10" title="Volver a empezar" aria-label="Volver a empezar"><FaUndo size={13} /></button>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10" aria-label="Cerrar asistente"><FaTimes size={16} /></button>
      </div>

      {/* Pestañas (solo el admin ve la segunda) */}
      {isAdmin && (
        <div className="grid grid-cols-2 border-b border-[#2a2a2a] text-xs font-semibold">
          <button onClick={() => setMode('help')} className={`py-2 flex items-center justify-center gap-1.5 transition-colors ${mode === 'help' ? 'text-white bg-purple-900/30 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}><FaQuestionCircle size={11} /> Ayuda</button>
          <button onClick={() => setMode('admin')} className={`py-2 flex items-center justify-center gap-1.5 transition-colors ${mode === 'admin' ? 'text-white bg-amber-900/20 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'}`}><FaUserShield size={11} /> Admin</button>
        </div>
      )}

      {/* Conversación */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {entries.map((entry, i) => (
          <div key={i} className={`flex ${entry.from === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.25s_ease-out]`}>
            <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${entry.from === 'user' ? 'bg-purple-700 text-white rounded-br-md' : 'bg-[#222] text-gray-100 rounded-bl-md'}`}>
              {entry.text}
              {entry.lines && (
                <ul className="mt-2 space-y-1.5">
                  {entry.lines.map((line, j) => <li key={j} className="text-[13px] text-gray-200 border-l-2 border-purple-500/50 pl-2">{line}</li>)}
                </ul>
              )}
              {entry.actions && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {entry.actions.map(action => (
                    <button key={action.label} onClick={() => runAction(action)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors">
                      {action.label} {action.href ? <FaExternalLinkAlt size={9} /> : <FaArrowRight size={9} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-[#222] text-gray-400 text-sm flex gap-1">
              <span className="animate-bounce">•</span><span className="animate-bounce [animation-delay:150ms]">•</span><span className="animate-bounce [animation-delay:300ms]">•</span>
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias rápidas */}
      <div className="border-t border-[#2a2a2a] bg-[#1a1a1a] px-3 pt-2.5">
        {mode === 'admin' ? (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
            {Object.entries(ADMIN_QUERIES).map(([id, q]) => (
              <button key={id} onClick={() => askAdmin(id)} disabled={thinking} className="flex-shrink-0 px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-100 text-xs hover:bg-amber-900/20 transition-colors disabled:opacity-50">{q.label}</button>
            ))}
          </div>
        ) : showGenres ? (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
            <button onClick={() => setShowGenres(false)} className="flex-shrink-0 px-3 py-1.5 rounded-full border border-[#3a3a3a] text-gray-300 text-xs hover:bg-white/5">← Volver</button>
            <button onClick={() => askSong()} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-purple-700 text-white text-xs">🎲 Sorprendeme</button>
            {SONG_GENRES.map(g => (
              <button key={g} onClick={() => askSong(g)} className="flex-shrink-0 px-3 py-1.5 rounded-full border border-purple-500/40 text-purple-100 text-xs hover:bg-purple-900/30">{g}</button>
            ))}
          </div>
        ) : (
          <>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
              {CATEGORIES.map((cat, i) => (
                <button key={cat.label} onClick={() => setCategory(category === i ? null : i)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors ${category === i ? 'bg-purple-700 text-white' : 'border border-[#3a3a3a] text-gray-200 hover:bg-white/5'}`}>{cat.label}</button>
              ))}
            </div>
            {category !== null && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 animate-[fadeIn_0.2s_ease-out]">
                {CATEGORIES[category].topics.map(id => (
                  <button key={id} onClick={() => askTopic(id)} className="flex-shrink-0 px-3 py-1.5 rounded-full border border-purple-500/40 text-purple-100 text-xs hover:bg-purple-900/30">
                    {id === '__song' ? '🎧 Recomendame una canción' : TOPICS[id].question}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Escribir */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 pb-3 pt-1 bg-[#1a1a1a]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'admin' ? 'Ej: ¿qué borré hoy?' : 'Escribí tu pregunta...'}
          className="flex-1 min-w-0 bg-[#0f0f0f] border border-[#2a2a2a] rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500"
          aria-label="Escribí tu pregunta"
        />
        <button type="submit" disabled={!input.trim() || thinking} className="w-10 h-10 rounded-full bg-purple-700 hover:bg-purple-600 disabled:bg-[#2a2a2a] disabled:text-gray-300 text-white flex items-center justify-center flex-shrink-0 transition-colors" aria-label="Enviar">
          <FaPaperPlane size={13} />
        </button>
      </form>
    </div>
  )
}
