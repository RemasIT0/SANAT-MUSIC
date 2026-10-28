// src/components/RetroTV.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { FaSignal } from 'react-icons/fa'

interface Ad {
  id: string
  title: string
  message: string | null
  image_url: string | null
}

export default function RetroTV() {
  const [ads, setAds] = useState<Ad[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isStatic, setIsStatic] = useState(true)

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('id, title, message, image_url')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setAds(data || [])
      } catch (error) {
        console.error('Error al cargar anuncios:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAds()
  }, [])

  useEffect(() => {
    if (ads.length === 0) return
    
    const interval = setInterval(() => {
      setIsStatic(true)
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % ads.length)
        setIsStatic(false)
      }, 500)
    }, 7000)

    return () => clearInterval(interval)
  }, [ads.length])

  useEffect(() => {
    if (!loading && ads.length > 0) {
      const timer = setTimeout(() => setIsStatic(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, ads])

  const currentAd = ads[currentIndex]

  return (
    // ✅ CAMBIO: ml-auto empuja la TV a la derecha. max-w-[400px] le da más espacio para los anuncios.
<div className="w-full max-w-[340px]">    
      <div className="relative bg-gradient-to-br from-[#3a2f28] via-[#2a221c] to-[#1a1510] rounded-lg p-2 shadow-[0_8px_24px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#1a1510]">
        
        {/* Contenido interno: Pantalla + Panel derecho */}
        <div className="flex gap-1.5">
          
          {/* PANTALLA (75% del ancho) */}
          <div className="flex-[3] relative">
            {/* Marco interior de la pantalla (bisel) */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-sm p-1.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]">
              {/* Pantalla CRT con bordes curvos */}
              <div className="relative aspect-[4/3] bg-black overflow-hidden rounded-[8%] shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                
                {/* Scanlines */}
                <div 
                  className="absolute inset-0 z-20 pointer-events-none opacity-40"
                  style={{
                    background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 3px)'
                  }}
                />

                {/* Curvatura CRT (viñeta) */}
                <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

                {/* Brillo de pantalla */}
                <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent" />

                {/* Contenido */}
                <div className="absolute inset-0 z-10 flex items-center justify-center p-2">
                  {loading ? (
                    <div className="text-center">
                      <div className="text-purple-400 font-mono text-[10px] animate-pulse tracking-wider">
                        ● SINTONIZANDO...
                      </div>
                    </div>
                  ) : ads.length === 0 ? (
                    <div className="text-center">
                      <FaSignal className="text-red-500 text-lg mx-auto mb-1 animate-pulse" />
                      <p className="text-gray-500 font-mono text-[9px] tracking-widest">SIN SEÑAL</p>
                    </div>
                  ) : (
                    <>
                      {/* Imagen de fondo */}
                      {currentAd?.image_url && (
                        <img 
                          src={currentAd.image_url} 
                          alt={currentAd.title} 
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isStatic ? 'opacity-0' : 'opacity-70'}`} 
                        />
                      )}

                      {/* Estática */}
                      {isStatic && (
                        <div className="absolute inset-0 bg-gray-400 animate-pulse z-30" 
                             style={{ 
                               backgroundImage: 'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0px, rgba(0,0,0,0.3) 2px)',
                               backgroundSize: '4px 4px'
                             }} 
                        />
                      )}

                      {/* Texto del anuncio */}
                      <div className={`relative z-30 text-center px-2 transition-all duration-500 ${isStatic ? 'blur-sm opacity-0' : 'blur-0 opacity-100'}`}>
                        <h3 className="text-white font-bold text-xs md:text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,1)] mb-0.5 leading-tight">
                          {currentAd?.title}
                        </h3>
                        {currentAd?.message && (
                          <p className="text-gray-200 text-[9px] md:text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,1)] line-clamp-2 leading-tight">
                            {currentAd.message}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PANEL DERECHO (25% del ancho) - Rejilla + Perillas */}
          <div className="flex-[1] flex flex-col gap-1.5">
            {/* Rejilla del altavoz */}
            <div className="flex-1 bg-gradient-to-b from-[#1a1510] to-[#0f0c08] rounded-sm p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
              <div className="h-full flex flex-col justify-evenly gap-[2px]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-full h-[2px] bg-[#2a221c] rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]" />
                ))}
              </div>
            </div>

            {/* Perilla superior (Canal) */}
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a4038] to-[#1a1510] border border-[#0a0805] shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center relative">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#2a221c] to-[#0a0805] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center">
                  <div className="w-[2px] h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Perilla inferior (Volumen) */}
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a4038] to-[#1a1510] border border-[#0a0805] shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center relative">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#2a221c] to-[#0a0805] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center">
                  <div className="w-[2px] h-2 bg-gray-400 rounded-full rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de canal (abajo) */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)] animate-pulse"></div>
            <span className="text-[8px] font-mono text-gray-500 tracking-wider">
              CH {currentIndex + 1}/{ads.length || 1}
            </span>
          </div>
          <span className="text-[8px] font-mono text-gray-600">SANAT TV</span>
        </div>
      </div>
    </div>
  )
}