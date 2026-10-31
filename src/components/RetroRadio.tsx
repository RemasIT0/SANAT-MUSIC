// src/components/RetroRadio.tsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  FaPlay, FaPause, FaXmark, FaRadio, 
  FaGuitar, FaFlag, FaHeadphones, FaRecordVinyl 
} from 'react-icons/fa6'
import { PiCassetteTapeFill } from 'react-icons/pi'
import { IoVolumeHighSharp } from "react-icons/io5"
import { FaVolumeXmark } from "react-icons/fa6"

const RADIO_STATIONS = [
  { id: '1', name: 'Rock Nacional (SANAT)', icon: FaGuitar, url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
  { id: '2', name: 'Radio Nacional Rock', icon: FaFlag, url: 'https://sa.mp3.icecast.magma.edge-access.net/sc_rad38' },
  { id: '3', name: 'Rock & Pop Argentina', icon: FaHeadphones, url: 'https://26683.live.streamtheworld.com/ROCK_AND_POP_SC' },
  { id: '4', name: 'Vorterix (Rock/Alternativo)', icon: FaGuitar, url: 'https://26683.live.streamtheworld.com/VORTERIX_FM_SC' },
  { id: '5', name: 'Clásicos del Rock (Respaldo)', icon: FaRecordVinyl, url: 'https://stream.zeno.fm/yn65fsaurfhvv' }
]

// Para elegir texto negro o blanco según qué tan claro sea el color del perfil
const isLightColor = (hex: string) => {
  const c = hex.replace('#', '')
  if (c.length < 6) return false
  const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16))
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160
}

export default function RetroRadio() {
  const { profile } = useAuth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentStationIndex, setCurrentStationIndex] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentStation = RADIO_STATIONS[currentStationIndex]
  const themeColor = profile?.theme_color || '#a855f7'
  const tabTextColor = isLightColor(themeColor) ? '#111' : '#fff'

  // MEMORIA
  useEffect(() => {
    const savedStation = localStorage.getItem('sanat_radio_station')
    const savedVolume = localStorage.getItem('sanat_radio_volume')
    if (savedStation) setCurrentStationIndex(parseInt(savedStation))
    if (savedVolume) setVolume(parseFloat(savedVolume))
  }, [])

  useEffect(() => { localStorage.setItem('sanat_radio_station', currentStationIndex.toString()) }, [currentStationIndex])
  useEffect(() => { 
    localStorage.setItem('sanat_radio_volume', volume.toString())
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // ▶️ CONTROL DE AUDIO
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch((e) => {
        console.warn("Reproducción bloqueada (se requiere interacción):", e)
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentStationIndex])

  const changeStation = (index: number) => {
    if (index === currentStationIndex) return
    setCurrentStationIndex(index)
  }

  const togglePlay = () => setIsPlaying(prev => !prev)

  return (
    <>
      <audio ref={audioRef} src={currentStation.url} preload="none" style={{ display: 'none' }} />
      
      {/* Pestaña colgando del borde superior izquierdo */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed right-3 z-[45] flex items-center gap-1.5 h-8 px-2.5 sm:pr-3 rounded-b-xl border-2 border-t-0 border-black/30 transition-transform hover:translate-y-0.5"
        style={{ top: 'var(--banner-h, 0px)', backgroundColor: themeColor, color: tabTextColor, boxShadow: `0 4px 14px ${themeColor}80` }}
        title={isPlaying ? `Sonando: ${currentStation.name}` : 'SANAT Radio'}
        aria-label="Abrir radio"
        aria-expanded={isExpanded}
      >
        <PiCassetteTapeFill size={18} />
        <span className="hidden sm:inline text-[11px] font-extrabold tracking-widest">RADIO</span>
        {isPlaying && (
          <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-[3px] rounded-sm radio-bar" style={{ backgroundColor: tabTextColor, animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        )}
      </button>

      <div className="fixed right-3 z-[45] w-72 sm:w-80" style={{ top: 'calc(var(--banner-h, 0px) + 2.5rem)' }}>
        {isExpanded && (
          <div className="relative z-10 bg-gradient-to-b from-gray-900 via-black to-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-[slideDown_0.25s_ease-out]">
            
            {/* Etiqueta estilo cassette */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-yellow-100 px-4 py-1 rounded-sm shadow-md border border-yellow-200/50 relative" style={{ transform: 'rotate(-2deg)', clipPath: 'polygon(0% 5%, 100% 0%, 98% 100%, 2% 95%)' }}>
                <span className="text-xs font-bold text-gray-900 tracking-widest font-mono">SANAT RADIO</span>
                <div className="absolute -top-1 left-2 w-6 h-2 bg-yellow-200/60 rotate-12"></div>
                <div className="absolute -top-1 right-2 w-6 h-2 bg-yellow-200/60 -rotate-12"></div>
              </div>
            </div>

            {/* 1. Selector de Estación (Más alto "py-3" para fácil toque en móvil) */}
            <div className="bg-gradient-to-b from-white via-gray-100 to-gray-200 pt-6 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-800 tracking-wider flex items-center gap-1"><FaRadio size={10} /> SELECCIONAR CINTA</span>
              </div>
              <select 
                value={currentStationIndex}
                onChange={(e) => { e.stopPropagation(); changeStation(Number(e.target.value)) }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-3 border border-gray-600 focus:outline-none focus:border-purple-500 font-medium cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                {RADIO_STATIONS.map((station, index) => (
                  <option key={station.id} value={index} className="bg-gray-900 text-white">{station.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Visual del Cassette (Intacto, con los íconos vectoriales) */}
            <div className="p-4" style={{ background: `linear-gradient(to bottom, ${themeColor}dd, ${themeColor}99, ${themeColor}dd)` }}>
              <div className="bg-black rounded-lg flex items-center justify-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center animate-spin" style={{ borderColor: themeColor + '80', animationDuration: '2s' }}>
                  <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></div>
                  </div>
                </div>
                
                <div className="flex-1 h-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded relative overflow-hidden flex items-center justify-center gap-2 px-2 border border-gray-700">
                  {isPlaying && <div className="absolute inset-0 animate-pulse" style={{ background: `linear-gradient(to right, transparent, ${themeColor}40, transparent)` }}></div>}
                  <currentStation.icon className="text-gray-400 flex-shrink-0 z-10" size={14} />
                  <span className="text-[9px] text-gray-300 font-mono z-10 truncate font-bold">{currentStation.name}</span>
                </div>

                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center animate-spin" style={{ borderColor: themeColor + '80', animationDuration: '2s' }}>
                  <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Controles Principales (Más notorios para móvil, pero estilo retro) */}
            <div className="bg-black border-t-2 border-gray-800 p-4">
              <div className="flex flex-col gap-4">
                
                {/* Slider de Volumen (Más grueso "h-2" y fácil de arrastrar) */}
                <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                  <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                    {isMuted || volume === 0 ? <FaVolumeXmark size={16} /> : <IoVolumeHighSharp size={16} />}
                  </button>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={isMuted ? 0 : volume} 
                    onChange={(e) => { e.stopPropagation(); setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-gray-500 text-xs w-8 text-right flex-shrink-0 font-mono">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                </div>

                {/* Botón Play/Pause (Más grande "w-12 h-12") y Cerrar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse shadow-lg' : 'bg-gray-800'}`} style={{ backgroundColor: isPlaying ? '#22c55e' : undefined, boxShadow: isPlaying ? `0 0 10px ${themeColor}` : undefined }}></div>
                    <span className="text-[10px] text-gray-500 font-mono">{isPlaying ? 'PLAY' : 'STOP'}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 hover:scale-110 active:scale-95"
                    style={{ 
                      backgroundColor: isPlaying ? themeColor : 'transparent', 
                      borderColor: themeColor, 
                      color: isPlaying ? 'white' : themeColor,
                      boxShadow: isPlaying ? `0 0 15px ${themeColor}60` : 'none'
                    }}
                  >
                    {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} className="ml-1" />}
                  </button>
                  
                  <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="text-gray-600 hover:text-gray-400 transition-colors p-1">
                    <FaXmark size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tornillos decorativos */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center"><div className="w-0.5 h-full bg-gray-500 rotate-45"></div></div>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center"><div className="w-0.5 h-full bg-gray-500 rotate-45"></div></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center"><div className="w-0.5 h-full bg-gray-500 rotate-45"></div></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center"><div className="w-0.5 h-full bg-gray-500 rotate-45"></div></div>
          </div>
        )}
      </div>
    </>
  )
}