// src/components/RetroRadio.tsx
import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { FaPlay, FaPause, FaMusic, FaXmark } from 'react-icons/fa6'

export default function RetroRadio() {
  const { profile } = useAuth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const streamUrl = "https://stream.zeno.fm/0r0xa792kwzuv"
  const themeColor = profile?.theme_color || '#a855f7'

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={streamUrl} preload="none" />
      
      {/* CASSETTE - Se achica en móvil, se expande al tocar */}
      <div 
        className={`fixed z-40 transition-all duration-500 ease-in-out cursor-pointer ${
          isExpanded 
            ? 'top-4 right-4 w-72 sm:w-80' 
            : 'top-4 right-4 w-16 sm:w-20'
        }`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        
        {/* Cuerpo del Cassette */}
        <div className="bg-gradient-to-b from-gray-900 via-black to-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl relative overflow-hidden">
          
          {/* PEGATINA "SANAT" VINTAGE (solo visible cuando está expandido) */}
          {isExpanded && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 animate-[slideDown_0.3s_ease-out]">
              <div 
                className="bg-yellow-100 px-4 py-1 rounded-sm shadow-md border border-yellow-200/50 relative"
                style={{ 
                  transform: 'rotate(-2deg)',
                  clipPath: 'polygon(0% 5%, 100% 0%, 98% 100%, 2% 95%)'
                }}
              >
                <span className="text-xs font-bold text-gray-900 tracking-widest" style={{ fontFamily: 'monospace' }}>
                  SANAT
                </span>
                <div className="absolute -top-1 left-2 w-6 h-2 bg-yellow-200/60 rotate-12"></div>
                <div className="absolute -top-1 right-2 w-6 h-2 bg-yellow-200/60 -rotate-12"></div>
              </div>
            </div>
          )}

          {/* Parte superior - Etiqueta blanca */}
          <div className={`bg-gradient-to-b from-white via-gray-100 to-gray-200 transition-all duration-500 ${
            isExpanded ? 'pt-6 pb-3 px-4' : 'pt-2 pb-1 px-2'
          }`}>
            {isExpanded ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-800 tracking-wider">SIDE A</span>
                  <span className="text-[10px] font-bold text-gray-800 tracking-wider">30 MIN</span>
                </div>
                <div className="space-y-1">
                  <div className="h-px bg-gray-400"></div>
                  <div className="h-px bg-gray-400"></div>
                  <div className="h-px bg-gray-400"></div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <FaMusic className="text-gray-600 text-xs" />
              </div>
            )}
          </div>

          {/* Parte media - Ventana del cassette con carretes (COLOR DEL TEMA) */}
          <div 
            className={`transition-all duration-500 ${isExpanded ? 'p-4' : 'p-2'}`}
            style={{
              background: `linear-gradient(to bottom, ${themeColor}dd, ${themeColor}99, ${themeColor}dd)`
            }}
          >
            <div className={`bg-black rounded-lg flex items-center justify-center gap-3 transition-all duration-500 ${
              isExpanded ? 'p-3' : 'p-1.5'
            }`}>
              {/* Carrete izquierdo */}
              <div className={`rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                isExpanded ? 'w-10 h-10' : 'w-5 h-5'
              } ${isPlaying ? 'animate-spin' : ''}`} 
              style={{ borderColor: themeColor + '80', animationDuration: '2s' }}>
                <div className={`rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center transition-all duration-500 ${
                  isExpanded ? 'w-6 h-6' : 'w-3 h-3'
                }`}>
                  <div className={`rounded-full transition-all duration-500 ${
                    isExpanded ? 'w-2 h-2' : 'w-1 h-1'
                  }`} style={{ backgroundColor: themeColor }}></div>
                </div>
              </div>
              
              {/* Cinta magnética (solo visible cuando expandido) */}
              {isExpanded && (
                <div className="flex-1 h-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded relative overflow-hidden">
                  {isPlaying && (
                    <div className="absolute inset-0 animate-pulse" style={{ 
                      background: `linear-gradient(to right, transparent, ${themeColor}30, transparent)`
                    }}></div>
                  )}
                </div>
              )}

              {/* Carrete derecho */}
              <div className={`rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                isExpanded ? 'w-10 h-10' : 'w-5 h-5'
              } ${isPlaying ? 'animate-spin' : ''}`} 
              style={{ borderColor: themeColor + '80', animationDuration: '2s' }}>
                <div className={`rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center transition-all duration-500 ${
                  isExpanded ? 'w-6 h-6' : 'w-3 h-3'
                }`}>
                  <div className={`rounded-full transition-all duration-500 ${
                    isExpanded ? 'w-2 h-2' : 'w-1 h-1'
                  }`} style={{ backgroundColor: themeColor }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Parte inferior - Controles */}
          <div className={`bg-black border-t-2 border-gray-800 transition-all duration-500 ${
            isExpanded ? 'p-3' : 'p-1.5'
          }`}>
            {isExpanded ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse shadow-lg' : 'bg-gray-800'}`}
                    style={{ 
                      backgroundColor: isPlaying ? '#22c55e' : undefined,
                      boxShadow: isPlaying ? `0 0 10px ${themeColor}` : undefined
                    }}></div>
                  <span className="text-[8px] text-gray-500 font-mono">{isPlaying ? 'PLAY' : 'STOP'}</span>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 hover:scale-110"
                  style={{ 
                    backgroundColor: isPlaying ? themeColor : 'transparent',
                    borderColor: themeColor,
                    color: isPlaying ? 'white' : themeColor
                  }}
                >
                  {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <FaXmark size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: isPlaying ? themeColor : '#9ca3af' }}
                >
                  {isPlaying ? <FaPause size={8} /> : <FaPlay size={8} className="ml-0.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Tornillos decorativos (solo visibles cuando expandido) */}
          {isExpanded && (
            <>
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center">
                <div className="w-0.5 h-full bg-gray-500 rotate-45"></div>
              </div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center">
                <div className="w-0.5 h-full bg-gray-500 rotate-45"></div>
              </div>
              <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center">
                <div className="w-0.5 h-full bg-gray-500 rotate-45"></div>
              </div>
              <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gray-700 flex items-center justify-center">
                <div className="w-0.5 h-full bg-gray-500 rotate-45"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}