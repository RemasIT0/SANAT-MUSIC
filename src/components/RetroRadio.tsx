// src/components/RetroRadio.tsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FaPlay, FaPause, FaMusic, FaXmark, FaRadio } from 'react-icons/fa6'

// ✅ USAMOS STREAMS DE AUDIO DIRECTOS (MP3/AAC). 
// Son 100% estables en segundo plano. Los navegadores bloquean iframes de YouTube ocultos.
const RADIO_STATIONS = [
  { id: '1', name: '🎸 Rock Nacional (SANAT)', url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
  { id: '2', name: '🎧 Lo-Fi Beats', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv' },
  { id: '3', name: '🎷 Jazz & Blues', url: 'http://jazz-wr04.ice.infomaniak.ch/jazz-wr04-128.mp3' },
  { id: '4', name: '🎹 Clásica', url: 'http://icecast.omroep.nl/radio4-bb-mp3' },
]

export default function RetroRadio() {
  const { profile } = useAuth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentStationIndex, setCurrentStationIndex] = useState(0)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentStation = RADIO_STATIONS[currentStationIndex]
  const themeColor = profile?.theme_color || '#a855f7'

  // ✅ CONTROL NATIVO DEL AUDIO: La forma más robusta y sin errores de "Abort"
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      // Intentamos reproducir. Si el navegador lo bloquea, lo capturamos sin romper la app
      audio.play().catch((e) => {
        console.warn("Reproducción bloqueada por el navegador (se requiere interacción del usuario):", e)
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentStationIndex])

  const changeStation = (index: number) => {
    if (index === currentStationIndex) return
    setCurrentStationIndex(index)
    // El useEffect de arriba se disparará automáticamente y reproducirá la nueva estación
  }

  const togglePlay = () => {
    setIsPlaying(prev => !prev)
  }

  return (
    <>
      {/* ✅ ETIQUETA DE AUDIO NATIVA: Invisible pero 100% funcional en segundo plano */}
      <audio 
        ref={audioRef} 
        src={currentStation.url} 
        preload="none"
        style={{ display: 'none' }} 
      />
      
      <div 
        className={`fixed z-40 transition-all duration-500 ease-in-out cursor-pointer ${
          isExpanded ? 'top-4 right-4 w-72 sm:w-80' : 'top-4 right-4 w-16 sm:w-20'
        }`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {/* CASSETTE (Interfaz visual) */}
        <div className="relative z-10 bg-gradient-to-b from-gray-900 via-black to-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          
          {isExpanded && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 animate-[slideDown_0.3s_ease-out]">
              <div className="bg-yellow-100 px-4 py-1 rounded-sm shadow-md border border-yellow-200/50 relative" style={{ transform: 'rotate(-2deg)', clipPath: 'polygon(0% 5%, 100% 0%, 98% 100%, 2% 95%)' }}>
                <span className="text-xs font-bold text-gray-900 tracking-widest" style={{ fontFamily: 'monospace' }}>SANAT RADIO</span>
                <div className="absolute -top-1 left-2 w-6 h-2 bg-yellow-200/60 rotate-12"></div>
                <div className="absolute -top-1 right-2 w-6 h-2 bg-yellow-200/60 -rotate-12"></div>
              </div>
            </div>
          )}

          <div className={`bg-gradient-to-b from-white via-gray-100 to-gray-200 transition-all duration-500 ${isExpanded ? 'pt-6 pb-3 px-4' : 'pt-2 pb-1 px-2'}`}>
            {isExpanded ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-800 tracking-wider flex items-center gap-1"><FaRadio size={10} /> SELECCIONAR CINTA</span>
                </div>
                <select 
                  value={currentStationIndex}
                  onChange={(e) => changeStation(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-gray-800 text-gray-200 text-xs rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
                >
                  {RADIO_STATIONS.map((station, index) => (
                    <option key={station.id} value={index}>{station.name}</option>
                  ))}
                </select>
              </>
            ) : (
              <div className="flex items-center justify-center"><FaMusic className="text-gray-600 text-xs" /></div>
            )}
          </div>

          <div className={`transition-all duration-500 ${isExpanded ? 'p-4' : 'p-2'}`} style={{ background: `linear-gradient(to bottom, ${themeColor}dd, ${themeColor}99, ${themeColor}dd)` }}>
            <div className={`bg-black rounded-lg flex items-center justify-center gap-3 transition-all duration-500 ${isExpanded ? 'p-3' : 'p-1.5'}`}>
              <div className={`rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isExpanded ? 'w-10 h-10' : 'w-5 h-5'} ${isPlaying ? 'animate-spin' : ''}`} style={{ borderColor: themeColor + '80', animationDuration: '2s' }}>
                <div className={`rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center transition-all duration-500 ${isExpanded ? 'w-6 h-6' : 'w-3 h-3'}`}>
                  <div className={`rounded-full transition-all duration-500 ${isExpanded ? 'w-2 h-2' : 'w-1 h-1'}`} style={{ backgroundColor: themeColor }}></div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="flex-1 h-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded relative overflow-hidden flex items-center justify-center">
                  {isPlaying && <div className="absolute inset-0 animate-pulse" style={{ background: `linear-gradient(to right, transparent, ${themeColor}40, transparent)` }}></div>}
                  <span className="text-[8px] text-gray-500 font-mono z-10 truncate px-1">{currentStation.name.split(' ').slice(1).join(' ')}</span>
                </div>
              )}

              <div className={`rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isExpanded ? 'w-10 h-10' : 'w-5 h-5'} ${isPlaying ? 'animate-spin' : ''}`} style={{ borderColor: themeColor + '80', animationDuration: '2s' }}>
                <div className={`rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center transition-all duration-500 ${isExpanded ? 'w-6 h-6' : 'w-3 h-3'}`}>
                  <div className={`rounded-full transition-all duration-500 ${isExpanded ? 'w-2 h-2' : 'w-1 h-1'}`} style={{ backgroundColor: themeColor }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className={`bg-black border-t-2 border-gray-800 transition-all duration-500 ${isExpanded ? 'p-3' : 'p-1.5'}`}>
            {isExpanded ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse shadow-lg' : 'bg-gray-800'}`} style={{ backgroundColor: isPlaying ? '#22c55e' : undefined, boxShadow: isPlaying ? `0 0 10px ${themeColor}` : undefined }}></div>
                  <span className="text-[8px] text-gray-500 font-mono">{isPlaying ? 'PLAY' : 'STOP'}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 hover:scale-110" style={{ backgroundColor: isPlaying ? themeColor : 'transparent', borderColor: themeColor, color: isPlaying ? 'white' : themeColor }}>
                  {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="text-gray-600 hover:text-gray-400 transition-colors"><FaXmark size={14} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ color: isPlaying ? themeColor : '#9ca3af' }}>
                  {isPlaying ? <FaPause size={8} /> : <FaPlay size={8} className="ml-0.5" />}
                </button>
              </div>
            )}
          </div>

          {isExpanded && (
            <>
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center"><div className="w-0.5 h-full bg-gray-500 rotate-45"></div></div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center"><div className="w-0.5 h-full bg-gray-500 rotate-45"></div></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center"><div className="w-0.5 h-full bg-gray-500 rotate-45"></div></div>
              <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center"><div className="w-0.5 h-full bg-gray-500 rotate-45"></div></div>
            </>
          )}
        </div>
      </div>
    </>
  )
}