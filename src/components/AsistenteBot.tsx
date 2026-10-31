// src/components/AsistenteBot.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Mascot from './Mascot'
import { FaTimes, FaArrowRight, FaUndo } from 'react-icons/fa'

interface BotAction {
  label: string
  to?: string
  run?: 'suggestion'
}

interface Topic {
  id: string
  question: string
  answer: string
  actions?: BotAction[]
  children?: string[]
}

const TOPICS: Record<string, Topic> = {
  publicar: {
    id: 'publicar',
    question: '¿Cómo publico algo?',
    answer: 'En el Inicio tocá "Crear mi publicación". Contá qué buscás (banda, músicos, servicios), elegí géneros e intención. Solo podés tener UNA publicación activa: si querés cambiarla, editala o eliminala.',
    actions: [{ label: 'Ir al Inicio', to: '/home' }],
  },
  perfil: {
    id: 'perfil',
    question: 'Quiero editar mi perfil',
    answer: 'Tenés dos opciones: "Editar datos" cambia tu foto, nombre, bio, instrumentos, géneros y mascota. "Diseñar perfil" te deja armar tu perfil con módulos, colores y fondo a tu gusto.',
    actions: [
      { label: 'Editar datos', to: '/editar-perfil' },
      { label: 'Diseñar perfil', to: '/editar-perfil/diseno' },
    ],
  },
  mensajes: {
    id: 'mensajes',
    question: 'Mensajes y chat',
    answer: 'Podés escribirle a alguien desde su publicación o su perfil con "Enviar mensaje". En la Bandeja ves todas tus conversaciones. El punto verde indica que la persona está en línea ahora.',
    actions: [{ label: 'Ir a Mensajes', to: '/bandeja' }],
  },
  buscar: {
    id: 'buscar',
    question: '¿Cómo encuentro músicos?',
    answer: 'Arriba en el Inicio está el buscador: escribí un nombre o @usuario. Más abajo, en "Filtros de búsqueda", filtrás publicaciones por departamento, localidad, género e intención.',
    actions: [{ label: 'Ir al Inicio', to: '/home' }],
  },
  likes: {
    id: 'likes',
    question: '¿Quién le dio like a mi post?',
    answer: 'En tu publicación (arriba del Inicio) tocá "Ver likes". Si aparece un punto rojo es porque tenés likes nuevos que todavía no viste.',
    actions: [{ label: 'Ir al Inicio', to: '/home' }],
  },
  cuenta: {
    id: 'cuenta',
    question: 'Problemas con mi cuenta',
    answer: '¿Qué problema tenés?',
    children: ['login', 'password', 'ban'],
  },
  login: {
    id: 'login',
    question: 'No puedo iniciar sesión',
    answer: 'Revisá que hayas confirmado tu email (mirá también en spam). Si ves "email rate limit exceeded", esperá una hora y probá de nuevo.',
  },
  password: {
    id: 'password',
    question: 'Olvidé mi contraseña',
    answer: 'En la pantalla de inicio de sesión tocá "¿Olvidaste tu contraseña?". Te llega un email con un link para crear una nueva.',
  },
  ban: {
    id: 'ban',
    question: 'Mi cuenta fue suspendida',
    answer: 'Las cuentas se suspenden por reportes de la comunidad. Si creés que es un error, escribile al administrador desde la pantalla de cuenta suspendida.',
  },
  seguridad: {
    id: 'seguridad',
    question: 'Reportar o bloquear a alguien',
    answer: 'En una publicación tocá la banderita para reportarla. En el perfil de una persona podés reportarla o bloquearla: si la bloqueás, no pueden enviarse mensajes ni verse en el feed.',
  },
  radio: {
    id: 'radio',
    question: '¿Cómo uso la radio?',
    answer: 'Tocá el cassette de arriba a tu derecha para abrir los controles. La radio sigue sonando mientras navegás y recuerda tu última estación y volumen.',
  },
  contacto: {
    id: 'contacto',
    question: 'No encuentro mi respuesta',
    answer: 'Mandanos tu duda o sugerencia y la vamos a leer. ¡Nos ayuda a mejorar SANAT!',
    actions: [{ label: 'Escribir sugerencia', run: 'suggestion' }],
  },
}

const MAIN_MENU = ['publicar', 'perfil', 'mensajes', 'buscar', 'likes', 'cuenta', 'seguridad', 'radio', 'contacto']

interface ChatEntry {
  from: 'bot' | 'user'
  text: string
  actions?: BotAction[]
}

export default function AsistenteBot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { profile, openSuggestionModal } = useAuth()
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [options, setOptions] = useState<string[]>(MAIN_MENU)
  const scrollRef = useRef<HTMLDivElement>(null)

  const firstName = profile?.display_name?.split(' ')[0] || ''
  const greeting: ChatEntry = { from: 'bot', text: `¡Hola${firstName ? ` ${firstName}` : ''}! Soy Sani, el asistente de SANAT. ¿En qué te ayudo?` }

  useEffect(() => {
    if (open && entries.length === 0) setEntries([greeting])
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [entries])

  const askTopic = (topicId: string) => {
    const topic = TOPICS[topicId]
    setEntries(prev => [
      ...prev,
      { from: 'user', text: topic.question },
      { from: 'bot', text: topic.answer, actions: topic.actions },
    ])
    setOptions(topic.children || MAIN_MENU)
  }

  const runAction = (action: BotAction) => {
    onClose()
    if (action.to) navigate(action.to)
    if (action.run === 'suggestion') openSuggestionModal()
  }

  const restart = () => {
    setEntries([greeting])
    setOptions(MAIN_MENU)
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto z-[70] sm:w-96 h-[min(32rem,calc(100dvh-8rem))] bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[scaleIn_0.2s_ease-out]">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] bg-[#1a1a1a]">
            <div className="w-10 h-10 rounded-full bg-[#0f0f0f] border border-purple-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              <div className="mt-2 pointer-events-none"><Mascot color={profile?.avatar_color || '#a855f7'} size={22} expression="feliz" /></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Sani</p>
              <p className="text-green-400 text-[11px]">Asistente de SANAT</p>
            </div>
            <button onClick={restart} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10" title="Volver a empezar" aria-label="Volver a empezar"><FaUndo size={13} /></button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10" aria-label="Cerrar asistente"><FaTimes size={16} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
            {entries.map((entry, i) => (
              <div key={i} className={`flex ${entry.from === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.25s_ease-out]`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${entry.from === 'user' ? 'bg-purple-700 text-white rounded-br-md' : 'bg-[#222] text-gray-100 rounded-bl-md'}`}>
                  {entry.text}
                  {entry.actions && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {entry.actions.map(action => (
                        <button key={action.label} onClick={() => runAction(action)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors">
                          {action.label} <FaArrowRight size={9} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#2a2a2a] bg-[#1a1a1a] px-3 py-3">
            <p className="text-[11px] text-gray-400 mb-2 px-1">
              {options === MAIN_MENU ? 'Elegí una pregunta:' : 'Elegí una opción:'}
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-hide">
              {options.map(id => (
                <button key={id} onClick={() => askTopic(id)} className="px-3 py-1.5 rounded-full border border-purple-500/40 text-purple-200 text-xs hover:bg-purple-900/30 hover:border-purple-400 transition-colors">
                  {TOPICS[id].question}
                </button>
              ))}
              {options !== MAIN_MENU && (
                <button onClick={() => setOptions(MAIN_MENU)} className="px-3 py-1.5 rounded-full border border-[#3a3a3a] text-gray-300 text-xs hover:bg-white/5 transition-colors">
                  Volver al menú
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
