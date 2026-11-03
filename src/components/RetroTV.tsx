// src/components/RetroTV.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

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
        // Por función: los bloqueadores de publicidad cortan las direcciones con "ads"
        let { data, error }: { data: any[] | null; error: any } = await supabase.rpc('tele_activos')
        if (error) {
          ;({ data, error } = await supabase
            .from('ads')
            .select('id, title, message, image_url')
            .eq('is_active', true)
            .order('created_at', { ascending: false }))
        }

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
  const channel = String((ads.length ? currentIndex : 0) + 2).padStart(2, '0')

  return (
    <div className="w-full max-w-[340px] select-none" aria-label="SANAT TV: anuncios de la comunidad">
      {/* Antena de dos varillas */}
      <div className="relative h-9 mx-auto w-28" aria-hidden="true">
        <span className="absolute bottom-0 left-1/2 w-[2px] h-11 bg-gradient-to-t from-[#9ca3af] to-[#e5e7eb] origin-bottom -rotate-[28deg] rounded-full" />
        <span className="absolute bottom-0 left-1/2 w-[2px] h-11 bg-gradient-to-t from-[#9ca3af] to-[#e5e7eb] origin-bottom rotate-[24deg] rounded-full" />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-9 h-3 rounded-t-full bg-gradient-to-b from-[#2a2a2a] to-[#141414] border border-[#2a2a2a]" />
      </div>

      {/* Mueble de madera */}
      <div className="relative rounded-[18px] p-[10px] border border-[#2a2a2a] shadow-[0_10px_28px_rgba(0,0,0,0.65)]"
        style={{
          // Paleta de SANAT: grafito con una veta apenas visible (combina con las tarjetas #1a1a1a)
          background: 'repeating-linear-gradient(92deg, #1c1c1e 0 6px, #212123 6px 9px, #1a1a1c 9px 15px), #1c1c1e',
          boxShadow: '0 10px 28px rgba(0,0,0,0.65), 0 0 0 1px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -3px 0 rgba(0,0,0,0.4)',
        }}>
        {/* Frente de plástico crema */}
        <div className="flex gap-2 rounded-xl p-2 bg-gradient-to-b from-[#161616] to-[#101010] border border-[#2a2a2a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {/* Pantalla abombada */}
          <div className="flex-[3] p-[6px] rounded-[16px] bg-[#0a0a0a] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[22%/26%] bg-[#0b0910] tv-flicker">
              {/* Contenido */}
              <div className="absolute inset-0 z-10 flex items-center justify-center p-2">
                {loading ? (
                  <p className="tv-osd text-[9px] text-[#d8b4fe] animate-pulse">SINTONIZANDO...</p>
                ) : ads.length === 0 ? (
                  <div className="text-center">
                    <p className="tv-osd text-[10px] text-[#d8b4fe]">SIN SEÑAL</p>
                    <p className="tv-osd text-[7px] text-[#d8b4fe]/70 mt-1">BUSCANDO CANALES</p>
                  </div>
                ) : (
                  <>
                    {currentAd?.image_url && (
                      <img src={currentAd.image_url} alt={currentAd.title} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isStatic ? 'opacity-0' : 'opacity-75'}`} style={{ filter: 'saturate(1.25) contrast(1.1)' }} />
                    )}
                    <div className={`relative z-10 text-center px-2 transition-all duration-500 ${isStatic ? 'blur-sm opacity-0' : 'blur-0 opacity-100'}`}>
                      <h3 className="text-white font-bold text-xs md:text-sm leading-tight" style={{ textShadow: '0 0 6px rgba(255,255,255,0.6), 1px 0 0 rgba(255,0,80,0.6), -1px 0 0 rgba(0,200,255,0.6)' }}>
                        {currentAd?.title}
                      </h3>
                      {currentAd?.message && (
                        <p className="text-gray-100 text-[9px] md:text-[10px] line-clamp-2 leading-tight mt-0.5" style={{ textShadow: '0 1px 2px #000' }}>{currentAd.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Lluvia de estática al cambiar de canal (o sin señal) */}
              {(isStatic || (!loading && ads.length === 0)) && (
                <div className={`absolute inset-0 z-20 tv-noise ${!loading && ads.length === 0 ? 'opacity-25' : 'opacity-90'}`} aria-hidden="true" />
              )}

              {/* Cartel de canal, como en las teles viejas */}
              {!loading && ads.length > 0 && (
                <span className="absolute top-2 right-3 z-30 tv-osd text-[10px] text-[#d8b4fe]" style={{ textShadow: '0 0 6px #a855f7' }}>CH {channel}</span>
              )}

              {/* Efecto de tubo: líneas, franja que baja, viñeta y reflejo del vidrio */}
              <div className="absolute inset-0 z-30 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, transparent 1px 3px)' }} />
              <div className="absolute inset-x-0 z-30 h-1/4 pointer-events-none tv-roll" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
              <div className="absolute inset-0 z-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)' }} />
              <div className="absolute inset-0 z-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 28% 18%, rgba(255,255,255,0.22), transparent 38%)' }} />
            </div>
          </div>

          {/* Panel de controles */}
          <div className="flex-1 flex flex-col items-center justify-between py-1">
            {[0, 45].map(angle => (
              <div key={angle} className="w-9 h-9 rounded-full border border-[#2a2a2a] bg-gradient-to-br from-[#2a2a2a] to-[#121212] shadow-[0_2px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-center" aria-hidden="true">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-start justify-center pt-[3px]" style={{ rotate: `${angle}deg` }}>
                  <span className="w-[2px] h-2 bg-[#a855f7] rounded-full" />
                </div>
              </div>
            ))}
            {/* Parlante */}
            <div className="w-full grid grid-cols-4 gap-[3px] px-1" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, i) => <span key={i} className="aspect-square rounded-full bg-[#0a0a0a] shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />)}
            </div>
          </div>
        </div>

        {/* Placa de la marca y luz de encendido */}
        <div className="flex items-center justify-between mt-2 px-2">
          <span className="text-[9px] font-black tracking-[0.25em] text-[#d8b4fe] italic">SANAT</span>
          <span className="text-[8px] font-mono text-gray-500">CH {channel} · {ads.length || 0} AVISOS</span>
          <span className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_6px_rgba(168,85,247,0.9)]" aria-hidden="true" />
        </div>
      </div>

      {/* Patitas */}
      <div className="flex justify-between px-8" aria-hidden="true">
        <span className="w-6 h-2 bg-[#1a1a1a] rounded-b-md border border-t-0 border-[#2a2a2a]" />
        <span className="w-6 h-2 bg-[#1a1a1a] rounded-b-md border border-t-0 border-[#2a2a2a]" />
      </div>
    </div>
  )
}
