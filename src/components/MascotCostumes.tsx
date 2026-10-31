// src/components/MascotCostumes.tsx
// Disfraces de la mascota. Todo se dibuja en el espacio de 100x100 del cuerpo
// (Mascot.tsx lo escala). Cada disfraz tiene:
//   back  -> detrás del cuerpo (pelo, alas, orejas)
//   face  -> la cara, dentro del cuerpo
//   front -> encima del cuerpo (sombreros, accesorios)
import type { CSSProperties, ReactNode } from 'react'

export type MascotExpression =
  | 'normal' | 'feliz' | 'pensativo' | 'rockero'
  | 'halloween' | 'punk' | 'gaucho' | 'melenudo' | 'murcielago'
  | 'conejo' | 'dj' | 'astronauta' | 'rapero'
  | 'turro' | 'zombie' | 'esqueleto' | 'otaku' | 'blackmetal' | 'fantasma'
  | 'timido' | 'cerdito' | 'pollito'

// Lista para los selectores (Editar perfil / Onboarding)
export const MASCOT_EXPRESSIONS: { id: MascotExpression; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'feliz', label: 'Feliz' },
  { id: 'pensativo', label: 'Pensativo' },
  { id: 'rockero', label: 'Rockero' },
  { id: 'melenudo', label: 'Melenudo' },
  { id: 'blackmetal', label: 'Black metal' },
  { id: 'punk', label: 'Punk' },
  { id: 'gaucho', label: 'Gaucho' },
  { id: 'rapero', label: 'Rapero' },
  { id: 'turro', label: 'Turro' },
  { id: 'dj', label: 'DJ' },
  { id: 'otaku', label: 'Otaku' },
  { id: 'timido', label: 'Tímido' },
  { id: 'cerdito', label: 'Cerdito' },
  { id: 'pollito', label: 'Pollito' },
  { id: 'astronauta', label: 'Astronauta' },
  { id: 'murcielago', label: 'Murciélago' },
  { id: 'conejo', label: 'Conejo' },
  { id: 'halloween', label: 'Halloween' },
  { id: 'zombie', label: 'Zombie' },
  { id: 'esqueleto', label: 'Esqueleto' },
  { id: 'fantasma', label: 'Fantasma' },
]

interface CostumeCtx {
  color: string
  eye: { x: number; y: number }
}

interface Costume {
  back?: (c: CostumeCtx) => ReactNode
  face: (c: CostumeCtx) => ReactNode
  front?: (c: CostumeCtx) => ReactNode
}

const INK = '#000'

// SVG posicionado sobre el cuerpo (coordenadas en unidades del cuerpo)
function Layer({ top, left, w, h, children, className = '', style }: {
  top: number; left: number; w: number; h: number; children: ReactNode; className?: string; style?: CSSProperties
}) {
  return (
    <svg className={`absolute pointer-events-none ${className}`} style={{ top, left, ...style }} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {children}
    </svg>
  )
}

// Ojos cuadrados clásicos de la mascota, con pupila que sigue al mouse
function SquareEyes({ eye, lids = false }: { eye: CostumeCtx['eye']; lids?: boolean }) {
  return (
    <div className="flex gap-3">
      {[0, 1].map(i => (
        <div key={i} className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-center justify-center overflow-hidden">
          <div className="w-4 h-4 bg-black rounded-sm" style={{ transform: `translate(${eye.x}px, ${eye.y}px)` }} />
          {lids && <div className="absolute top-0 left-0 right-0 h-[45%] bg-black" />}
        </div>
      ))}
    </div>
  )
}

function Brows({ tilt = 0 }: { tilt?: number }) {
  return (
    <div className="flex gap-4 w-full justify-center">
      <div className="w-6 h-1.5 bg-black rounded-sm" style={{ transform: `rotate(${tilt}deg)` }} />
      <div className="w-6 h-1.5 bg-black rounded-sm" style={{ transform: `rotate(${-tilt}deg)` }} />
    </div>
  )
}

export const COSTUMES: Partial<Record<MascotExpression, Costume>> = {
  halloween: {
    front: () => (
      <>
        {/* Sombrero de bruja */}
        <Layer top={-46} left={-12} w={124} h={60} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M38 50 L58 8 Q62 0 72 4 L88 14 L74 15 L86 50 Z" fill="#2b1748" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 39 L85 39 L87 48 L38 48 Z" fill="#f97316" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="56" y="38" width="12" height="11" fill="#fbbf24" stroke={INK} strokeWidth="2.5" />
          <rect x="4" y="47" width="116" height="10" rx="3" fill="#2b1748" stroke={INK} strokeWidth="3" />
        </Layer>
        {/* Murciélago que vuela al costado */}
        <Layer top={4} left={104} w={34} h={18} className="z-20 mascot-bat">
          <path d="M17 6 Q14 2 12 6 Q8 1 1 4 Q6 7 5 12 Q9 9 12 12 Q14 10 17 14 Q20 10 22 12 Q25 9 29 12 Q28 7 33 4 Q26 1 22 6 Q20 2 17 6 Z" fill="#111" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="15.5" cy="7.5" r="1" fill="#fbbf24" />
          <circle cx="18.5" cy="7.5" r="1" fill="#fbbf24" />
        </Layer>
      </>
    ),
    face: ({ color, eye }) => (
      <>
        <div className="flex gap-3 mt-3">
          {[0, 1].map(i => (
            <svg key={i} width="30" height="26" viewBox="0 0 30 26">
              <polygon points="15,2 28,24 2,24" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
              <circle cx={15 + eye.x * 0.6} cy={16 + eye.y * 0.6} r="4.5" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 3px #f59e0b)' }} />
            </svg>
          ))}
        </div>
        <svg width="10" height="8" viewBox="0 0 10 8" className="mt-1"><polygon points="5,0 10,8 0,8" fill={INK} /></svg>
        <svg width="60" height="22" viewBox="0 0 60 22" className="mt-1">
          <path d="M2 4 Q30 20 58 4 L54 14 Q30 28 6 14 Z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <rect x="20" y="9" width="6" height="6" fill={color} />
          <rect x="34" y="9" width="6" height="6" fill={color} />
        </svg>
      </>
    ),
  },

  punk: {
    // Cresta mohicana fucsia
    back: () => (
      <Layer top={-30} left={24} w={52} h={36}>
        <polygon points="0,36 4,6 13,26 18,0 26,24 34,0 39,26 48,6 52,36" fill="#ec4899" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <polygon points="9,30 11,18 15,30" fill="#fbcfe8" />
        <polygon points="31,28 34,12 37,28" fill="#fbcfe8" />
      </Layer>
    ),
    // Aretes: argolla dorada y tachas
    front: () => (
      <>
        <Layer top={36} left={-13} w={16} h={22} className="z-20">
          <circle cx="8" cy="13" r="6" fill="none" stroke={INK} strokeWidth="5" />
          <circle cx="8" cy="13" r="6" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
        </Layer>
        <Layer top={26} left={-7} w={8} h={8} className="z-20">
          <circle cx="4" cy="4" r="3" fill="#e5e7eb" stroke={INK} strokeWidth="1.5" />
        </Layer>
        <Layer top={36} left={97} w={16} h={22} className="z-20">
          <circle cx="8" cy="13" r="6" fill="none" stroke={INK} strokeWidth="5" />
          <circle cx="8" cy="13" r="6" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <>
        <Brows tilt={14} />
        <div className="mt-1"><SquareEyes eye={eye} /></div>
        {/* Piercing en la nariz */}
        <svg width="12" height="10" viewBox="0 0 12 10" className="mt-1">
          <circle cx="6" cy="5" r="3.5" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
        </svg>
        {/* Sonrisa torcida con piercing en el labio */}
        <svg width="42" height="18" viewBox="0 0 42 18">
          <path d="M4 5 Q20 14 38 3" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <circle cx="27" cy="13" r="3.5" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
        </svg>
      </>
    ),
  },

  gaucho: {
    front: () => (
      <>
        {/* Sombrero de ala ancha */}
        <Layer top={-28} left={-16} w={132} h={34} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M38 26 L40 6 Q66 0 92 6 L94 26 Z" fill="#1f1f1f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="39" y="17" width="54" height="7" fill="#b91c1c" stroke={INK} strokeWidth="2" />
          <rect x="2" y="24" width="128" height="8" rx="3" fill="#1f1f1f" stroke={INK} strokeWidth="3" />
        </Layer>
        {/* Pañuelo al cuello */}
        <Layer top={84} left={28} w={44} h={28} className="z-20">
          <path d="M2 2 L42 2 L22 26 Z" fill="#dc2626" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="22" cy="5" r="5" fill="#b91c1c" stroke={INK} strokeWidth="2" />
          <circle cx="14" cy="11" r="1.5" fill="#fff" />
          <circle cx="28" cy="11" r="1.5" fill="#fff" />
          <circle cx="21" cy="18" r="1.5" fill="#fff" />
        </Layer>
        {/* Mate con bombilla */}
        <Layer top={54} left={102} w={30} h={40} className="z-20">
          <line x1="19" y1="2" x2="14" y2="18" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <line x1="19" y1="2" x2="14" y2="18" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M4 16 Q2 34 15 38 Q28 34 26 16 Z" fill="#92400e" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="3" y="13" width="24" height="5" rx="2" fill="#d6d3d1" stroke={INK} strokeWidth="2" />
          <circle cx="11" cy="26" r="2" fill="#65a30d" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <>
        <div className="mt-3"><SquareEyes eye={eye} /></div>
        {/* Bigotazo */}
        <svg width="58" height="18" viewBox="0 0 58 18" className="mt-2">
          <path d="M29 5 Q21 0 13 4 Q5 8 2 15 Q10 11 18 13 Q25 13 29 9 Q33 13 40 13 Q48 11 56 15 Q53 8 45 4 Q37 0 29 5 Z" fill="#3f2a14" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <svg width="20" height="8" viewBox="0 0 20 8">
          <path d="M3 2 Q10 7 17 2" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      </>
    ),
  },

  melenudo: {
    // Melena larga que cae por los costados
    back: () => (
      <Layer top={-12} left={-34} w={168} h={150}>
        <path d="M30 34 Q34 0 84 0 Q134 0 138 34 L160 128 L146 120 L142 144 L128 124 L120 138 L114 60 L54 60 L48 138 L40 124 L26 144 L22 120 L8 128 Z" fill="#3b2314" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 56 L14 112 M146 56 L154 112 M30 70 L28 128 M138 70 L140 128" stroke="#6b4429" strokeWidth="3" strokeLinecap="round" />
      </Layer>
    ),
    // Flequillo
    front: () => (
      <Layer top={-6} left={-4} w={108} h={28} className="z-20">
        <path d="M2 10 Q54 -6 106 10 L106 16 L96 26 L88 14 L76 24 L66 12 L54 24 L42 12 L32 24 L20 14 L12 26 L2 16 Z" fill="#3b2314" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </Layer>
    ),
    face: () => (
      <>
        {/* Lentes oscuros */}
        <svg width="66" height="20" viewBox="0 0 66 20" className="mt-7">
          <rect x="2" y="2" width="26" height="15" rx="4" fill="#111" stroke={INK} strokeWidth="3" />
          <rect x="38" y="2" width="26" height="15" rx="4" fill="#111" stroke={INK} strokeWidth="3" />
          <line x1="28" y1="7" x2="38" y2="7" stroke={INK} strokeWidth="3" />
          <line x1="7" y1="6" x2="13" y2="6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <line x1="43" y1="6" x2="49" y2="6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {/* Boca rockera con lengua afuera */}
        <svg width="32" height="26" viewBox="0 0 32 26" className="mt-2">
          <rect x="2" y="2" width="28" height="16" rx="6" fill={INK} />
          <path d="M9 12 L23 12 L23 20 Q16 26 9 20 Z" fill="#ef4444" stroke={INK} strokeWidth="2" />
          <line x1="16" y1="14" x2="16" y2="20" stroke="#b91c1c" strokeWidth="1.5" />
        </svg>
      </>
    ),
  },

  murcielago: {
    back: ({ color }) => (
      <>
        {/* Alas */}
        <Layer top={6} left={-52} w={204} h={76}>
          <path d="M56 14 Q30 0 2 10 Q10 22 6 34 Q16 30 22 44 Q30 36 38 52 Q44 40 56 50 Z" fill="#2e1065" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M148 14 Q174 0 202 10 Q194 22 198 34 Q188 30 182 44 Q174 36 166 52 Q160 40 148 50 Z" fill="#2e1065" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </Layer>
        {/* Orejas puntiagudas */}
        <Layer top={-24} left={4} w={92} h={32}>
          <polygon points="4,32 10,2 32,32" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="11,28 13,12 23,28" fill="#f9a8d4" />
          <polygon points="60,32 82,2 88,32" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="69,28 79,12 81,28" fill="#f9a8d4" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <>
        <Brows tilt={-8} />
        <div className="mt-1"><SquareEyes eye={eye} /></div>
        {/* Colmillos */}
        <svg width="38" height="18" viewBox="0 0 38 18" className="mt-2">
          <path d="M3 3 Q19 14 35 3" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <polygon points="10,7 15,8 12,16" fill="#fff" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="23,8 28,7 26,16" fill="#fff" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </>
    ),
  },

  conejo: {
    // Orejas largas
    back: ({ color }) => (
      <Layer top={-54} left={8} w={84} h={62}>
        <ellipse cx="18" cy="31" rx="12" ry="29" fill={color} stroke={INK} strokeWidth="3" />
        <ellipse cx="18" cy="34" rx="6" ry="21" fill="#f9a8d4" />
        <ellipse cx="66" cy="31" rx="12" ry="29" fill={color} stroke={INK} strokeWidth="3" transform="rotate(12 66 31)" />
        <ellipse cx="66" cy="34" rx="6" ry="21" fill="#f9a8d4" transform="rotate(12 66 34)" />
      </Layer>
    ),
    face: ({ eye }) => (
      <>
        <SquareEyes eye={eye} />
        {/* Nariz, cachetes y bigotes */}
        <svg width="84" height="20" viewBox="0 0 84 20" className="mt-1">
          <circle cx="10" cy="11" r="6" fill="#f472b6" opacity="0.5" />
          <circle cx="74" cy="11" r="6" fill="#f472b6" opacity="0.5" />
          <polygon points="36,3 48,3 42,11" fill="#f472b6" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M30 8 L14 4 M30 12 L14 15 M54 8 L70 4 M54 12 L70 15" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Boquita y dientes de conejo */}
        <svg width="26" height="18" viewBox="0 0 26 18">
          <rect x="7" y="5" width="6" height="9" rx="1" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <rect x="13" y="5" width="6" height="9" rx="1" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <path d="M3 3 Q8 8 13 3 Q18 8 23 3" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </>
    ),
  },

  dj: {
    // Auriculares con luces neón
    front: () => (
      <Layer top={-18} left={-12} w={124} h={74} className="z-20">
        <path d="M10 52 Q10 4 62 4 Q114 4 114 52" fill="none" stroke={INK} strokeWidth="10" />
        <path d="M10 52 Q10 4 62 4 Q114 4 114 52" fill="none" stroke="#374151" strokeWidth="5" />
        <rect x="1" y="40" width="18" height="30" rx="5" fill="#111" stroke={INK} strokeWidth="3" />
        <rect x="105" y="40" width="18" height="30" rx="5" fill="#111" stroke={INK} strokeWidth="3" />
        <rect x="5" y="46" width="10" height="18" rx="3" fill="#22d3ee" />
        <rect x="109" y="46" width="10" height="18" rx="3" fill="#22d3ee" />
      </Layer>
    ),
    face: ({ eye }) => (
      <>
        {/* Visor neón con un brillo que sigue al mouse */}
        <svg width="68" height="20" viewBox="0 0 68 20" className="mt-3">
          <rect x="2" y="2" width="64" height="16" rx="8" fill="#0e7490" stroke={INK} strokeWidth="3" />
          <rect x={20 + eye.x * 2} y={6 + eye.y * 0.4} width="28" height="5" rx="2.5" fill="#67e8f9" />
        </svg>
        {/* Sonrisa grande */}
        <svg width="46" height="22" viewBox="0 0 46 22" className="mt-3">
          <path d="M2 2 Q23 26 44 2 Z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 3 L38 3 L36 7 L10 7 Z" fill="#fff" />
        </svg>
      </>
    ),
  },

  astronauta: {
    front: () => (
      <>
        {/* Antena */}
        <Layer top={-32} left={42} w={16} h={22} className="z-20">
          <line x1="8" y1="22" x2="8" y2="7" stroke={INK} strokeWidth="3" />
          <circle cx="8" cy="6" r="4.5" fill="#ef4444" stroke={INK} strokeWidth="2" />
        </Layer>
        {/* Casco de vidrio */}
        <Layer top={-16} left={-16} w={132} h={132} className="z-20">
          <rect x="3" y="3" width="126" height="126" rx="34" fill="rgba(186,230,253,0.18)" stroke={INK} strokeWidth="3" />
          <path d="M22 44 Q26 22 48 15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
          <circle cx="100" cy="104" r="3" fill="#fff" opacity="0.6" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <>
        <Brows tilt={-6} />
        <div className="mt-2"><SquareEyes eye={eye} /></div>
        {/* Boca de asombro */}
        <div className="w-5 h-6 bg-black rounded-full mt-3" />
      </>
    ),
  },

  rapero: {
    front: () => (
      <>
        {/* Gorra con visera de costado */}
        <Layer top={-24} left={2} w={124} h={34} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M8 30 Q10 2 50 2 Q90 2 92 30 Z" fill="#dc2626" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M80 26 L120 21 Q124 29 118 32 L84 32 Z" fill="#991b1b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="50" cy="5" r="3" fill={INK} />
        </Layer>
        {/* Cadena de oro con medalla */}
        <Layer top={72} left={18} w={64} h={40} className="z-20">
          <path d="M4 2 Q32 30 60 2" fill="none" stroke={INK} strokeWidth="6" />
          <path d="M4 2 Q32 30 60 2" fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="4 2" />
          <circle cx="32" cy="27" r="10" fill="#fbbf24" stroke={INK} strokeWidth="2.5" />
          <text x="32" y="32" textAnchor="middle" fontSize="14" fontWeight="bold" fill={INK}>♪</text>
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <div className="flex flex-col items-center -mt-3">
        <Brows tilt={6} />
        <div className="mt-1"><SquareEyes eye={eye} lids /></div>
        {/* Sonrisa canchera */}
        <svg width="32" height="14" viewBox="0 0 32 14" className="mt-2">
          <path d="M3 9 Q17 13 29 3" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    ),
  },

  turro: {
    front: () => (
      <>
        {/* Gorra plana con la visera levantada, bien arriba y torcida */}
        <Layer top={-33} left={6} w={96} h={36} className="z-20" style={{ transform: 'rotate(-7deg)', filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M12 30 Q14 4 48 4 Q82 4 84 30 Z" fill="#111" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="38" y="12" width="20" height="9" rx="2" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <path d="M4 26 L92 21 L94 30 L6 34 Z" fill="#111" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M8 31 L91 27" stroke="#16a34a" strokeWidth="2" />
          <circle cx="70" cy="26" r="3" fill="#fbbf24" stroke={INK} strokeWidth="1" />
        </Layer>
        {/* Cadenita de plata con crucecita */}
        <Layer top={74} left={26} w={48} h={30} className="z-20">
          <path d="M2 2 Q24 20 46 2" fill="none" stroke={INK} strokeWidth="4.5" />
          <path d="M2 2 Q24 20 46 2" fill="none" stroke="#e5e7eb" strokeWidth="2.5" strokeDasharray="3 2" />
          <rect x="22" y="12" width="4" height="14" fill="#e5e7eb" stroke={INK} strokeWidth="1.5" />
          <rect x="18" y="15" width="12" height="4" fill="#e5e7eb" stroke={INK} strokeWidth="1.5" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <div className="flex flex-col items-center -mt-2">
        {/* Ceja con corte y ceja levantada, cara de canchero */}
        <div className="flex gap-4 w-full justify-center">
          <div className="flex gap-[3px]" style={{ transform: 'rotate(8deg)' }}>
            <div className="w-3 h-1.5 bg-black rounded-sm" />
            <div className="w-2 h-1.5 bg-black rounded-sm" />
          </div>
          <div className="w-6 h-1.5 bg-black rounded-sm" style={{ transform: 'rotate(-14deg) translateY(-2px)' }} />
        </div>
        <div className="mt-1"><SquareEyes eye={eye} lids /></div>
        {/* Sonrisa pícara con diente de oro */}
        <svg width="36" height="16" viewBox="0 0 36 16" className="mt-2">
          <path d="M3 4 Q18 16 33 2 L31 8 Q18 18 5 9 Z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <rect x="12" y="6" width="5" height="4" fill="#fff" />
          <rect x="18" y="6" width="5" height="4" fill="#fbbf24" />
        </svg>
      </div>
    ),
  },

  zombie: {
    front: () => (
      <>
        {/* Tinte verdoso de piel podrida */}
        <Layer top={0} left={0} w={100} h={100} className="z-20">
          <rect x="4" y="4" width="92" height="92" fill="#65a30d" opacity="0.25" />
        </Layer>
        {/* Cerebro al aire */}
        <Layer top={-14} left={6} w={48} h={26} className="z-20">
          <path d="M3 24 Q0 8 12 6 Q16 0 24 4 Q32 0 38 6 Q47 8 45 24 Z" fill="#f9a8d4" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M12 14 Q16 10 20 14 M24 10 Q28 14 32 10 M30 18 Q34 14 38 18" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" />
        </Layer>
        {/* Cicatriz con puntos */}
        <Layer top={62} left={66} w={28} h={14} className="z-20">
          <path d="M2 10 L26 3" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M6 5 L8 13 M12 3 L14 11 M18 2 L20 10 M23 0 L25 8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </Layer>
        {/* Curita */}
        <Layer top={8} left={68} w={28} h={14} className="z-20" style={{ transform: 'rotate(25deg)' }}>
          <rect x="1" y="2" width="26" height="10" rx="4" fill="#fde68a" stroke={INK} strokeWidth="2" />
          <rect x="10" y="3" width="8" height="8" fill="#fcd34d" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <>
        <div className="flex gap-3 items-end mt-2">
          {/* Ojo perdido, la pupila cuelga para abajo */}
          <div className="relative w-8 h-8 bg-white border-[3px] border-black rounded-sm flex items-end justify-center overflow-hidden">
            <div className="w-3 h-3 bg-black rounded-sm mb-0.5" style={{ transform: `translate(${eye.x * 0.5}px, 0)` }} />
          </div>
          {/* Ojo tachado */}
          <svg width="26" height="26" viewBox="0 0 26 26">
            <path d="M4 4 L22 22 M22 4 L4 22" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
        {/* Boca torcida con dientes y baba */}
        <svg width="46" height="28" viewBox="0 0 46 28" className="mt-2">
          <path d="M3 6 L43 2 L40 16 Q22 22 6 18 Z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <polygon points="10,6 15,5 12,11" fill="#fef9c3" />
          <polygon points="22,5 27,4 25,10" fill="#fef9c3" />
          <polygon points="33,3 38,3 36,9" fill="#fef9c3" />
          <path d="M30 17 Q31 24 29 27 Q27 24 28 18 Z" fill="#84cc16" stroke={INK} strokeWidth="1.5" />
        </svg>
      </>
    ),
  },

  esqueleto: {
    // Huesos cruzados detrás
    back: () => (
      <Layer top={-16} left={-16} w={132} h={132}>
        {[[14, 14, 118, 118], [118, 14, 14, 118]].map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth="14" strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f5f5f4" strokeWidth="8" strokeLinecap="round" />
            {[[x1, y1], [x2, y2]].map(([cx, cy], j) => (
              <g key={j}>
                <circle cx={cx + (cx < 66 ? -4 : 4)} cy={cy} r="7" fill="#f5f5f4" stroke={INK} strokeWidth="3" />
                <circle cx={cx} cy={cy + (cy < 66 ? -4 : 4)} r="7" fill="#f5f5f4" stroke={INK} strokeWidth="3" />
              </g>
            ))}
          </g>
        ))}
      </Layer>
    ),
    // Grieta en el cráneo
    front: () => (
      <Layer top={4} left={70} w={24} h={26} className="z-20">
        <path d="M22 2 L14 10 L18 14 L8 24" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </Layer>
    ),
    face: ({ eye }) => (
      <>
        {/* Cuencas vacías con lucecita que sigue al mouse */}
        <div className="flex gap-2 mt-1">
          {[0, 1].map(i => (
            <svg key={i} width="30" height="28" viewBox="0 0 30 28">
              <path d="M3 10 Q3 2 15 2 Q27 2 27 10 Q27 26 15 26 Q3 26 3 10 Z" fill={INK} />
              <circle cx={15 + eye.x * 0.8} cy={14 + eye.y * 0.8} r="3.5" fill="#f5f5f4" style={{ filter: 'drop-shadow(0 0 3px #e0f2fe)' }} />
            </svg>
          ))}
        </div>
        {/* Nariz de calavera */}
        <svg width="14" height="12" viewBox="0 0 14 12" className="mt-1">
          <path d="M7 12 L1 4 Q1 0 5 1 L7 3 L9 1 Q13 0 13 4 Z" fill={INK} />
        </svg>
        {/* Dientes */}
        <svg width="48" height="18" viewBox="0 0 48 18" className="mt-1">
          <rect x="2" y="2" width="44" height="14" rx="3" fill="#f5f5f4" stroke={INK} strokeWidth="2.5" />
          <path d="M2 9 L46 9 M11 2 L11 16 M20 2 L20 16 M29 2 L29 16 M38 2 L38 16" stroke={INK} strokeWidth="2" />
        </svg>
      </>
    ),
  },

  otaku: {
    // Orejas de gato de la vincha
    back: () => (
      <Layer top={-24} left={6} w={88} h={32}>
        <polygon points="4,32 12,2 34,30" fill="#fce7f3" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <polygon points="12,27 15,12 26,27" fill="#f472b6" />
        <polygon points="54,30 76,2 84,32" fill="#fce7f3" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <polygon points="62,27 73,12 76,27" fill="#f472b6" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Vincha */}
        <Layer top={-6} left={-4} w={108} h={20} className="z-20">
          <path d="M4 18 Q54 -6 104 18" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <path d="M4 18 Q54 -6 104 18" fill="none" stroke="#f472b6" strokeWidth="3.5" strokeLinecap="round" />
        </Layer>
        {/* Barra de luz (glowstick) en la mano */}
        <Layer top={26} left={104} w={22} h={56} className="z-20" style={{ transform: 'rotate(-14deg)' }}>
          <rect x="6" y="2" width="10" height="36" rx="5" fill="#f0abfc" stroke={INK} strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 5px #e879f9)' }} />
          <rect x="9" y="6" width="3" height="26" rx="1.5" fill="#fff" opacity="0.8" />
          <rect x="5" y="37" width="12" height="16" rx="2" fill="#111" stroke={INK} strokeWidth="2.5" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <>
        {/* Ojos de anime con brillos que siguen al mouse */}
        <div className="flex gap-3 mt-2">
          {[0, 1].map(i => (
            <svg key={i} width="30" height="34" viewBox="0 0 30 34">
              <path d="M2 8 Q15 0 28 8" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
              <ellipse cx="15" cy="19" rx="11" ry="13" fill={INK} />
              <ellipse cx="15" cy="21" rx="8.5" ry="10" fill="#4338ca" />
              <ellipse cx="15" cy="25" rx="6" ry="5" fill="#818cf8" />
              <circle cx={11 + eye.x * 0.5} cy={14 + eye.y * 0.5} r="4" fill="#fff" />
              <circle cx={19 + eye.x * 0.3} cy={25 + eye.y * 0.3} r="2" fill="#fff" />
            </svg>
          ))}
        </div>
        {/* Rubor */}
        <svg width="80" height="8" viewBox="0 0 80 8">
          <path d="M6 7 L10 1 M11 7 L15 1 M16 7 L20 1 M60 7 L64 1 M65 7 L69 1 M70 7 L74 1" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {/* Boca de gatito ω */}
        <svg width="24" height="10" viewBox="0 0 24 10" className="mt-1">
          <path d="M2 2 Q7 9 12 3 Q17 9 22 2" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </>
    ),
  },

  blackmetal: {
    // Melena larga y lacia, negra
    back: () => (
      <Layer top={-12} left={-34} w={168} h={150}>
        <path d="M30 34 Q34 0 84 0 Q134 0 138 34 L156 140 L140 132 L132 146 L120 138 L114 60 L54 60 L48 138 L36 146 L28 132 L12 140 Z" fill="#0a0a0a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 60 L16 122 M146 60 L152 122 M32 76 L30 132 M136 76 L138 132 M40 20 L36 46 M128 20 L132 46" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Raya al medio */}
        <Layer top={-6} left={-4} w={108} h={28} className="z-20">
          <path d="M0 26 L0 8 Q54 -8 108 8 L108 26 L96 18 Q80 8 56 10 L54 4 L52 10 Q28 8 12 18 Z" fill="#0a0a0a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </Layer>
        {/* Muñequeras con pinchos */}
        {[-20, 96].map(left => (
          <Layer key={left} top={70} left={left} w={24} h={16} className="z-20">
            <rect x="1" y="6" width="22" height="9" rx="2" fill="#1f1f1f" stroke={INK} strokeWidth="2" />
            <polygon points="3,6 6,0 9,6" fill="#d1d5db" stroke={INK} strokeWidth="1" />
            <polygon points="9,6 12,0 15,6" fill="#d1d5db" stroke={INK} strokeWidth="1" />
            <polygon points="15,6 18,0 21,6" fill="#d1d5db" stroke={INK} strokeWidth="1" />
          </Layer>
        ))}
      </>
    ),
    // Corpse paint
    face: ({ eye }) => (
      <svg width="80" height="78" viewBox="0 0 80 78" className="mt-3">
        <path d="M8 6 Q40 -2 72 6 L74 50 Q40 84 6 50 Z" fill="#f4f4f5" />
        <polygon points="6,14 14,18 16,8 22,16 30,6 32,18 37,22 32,30 34,40 24,34 16,42 14,32 6,30 12,24" fill={INK} />
        <polygon points="74,14 66,18 64,8 58,16 50,6 48,18 43,22 48,30 46,40 56,34 64,42 66,32 74,30 68,24" fill={INK} />
        <circle cx={22 + eye.x * 0.6} cy={25 + eye.y * 0.6} r="3" fill="#fff" />
        <circle cx={58 + eye.x * 0.6} cy={25 + eye.y * 0.6} r="3" fill="#fff" />
        <polygon points="36,40 44,40 40,46" fill={INK} />
        <path d="M26 54 Q40 48 54 54 L52 60 Q40 56 28 60 Z" fill={INK} />
        <path d="M30 60 L29 70 M40 58 L40 75 M50 60 L51 70" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },

  fantasma: {
    // Sábana que cubre el cuerpo, teñida apenas con el color del usuario
    front: ({ color, eye }) => {
      const sheet = 'M22 4 L106 4 Q120 4 120 18 L120 52 L125 66 Q128 74 120 74 L118 72 L118 112 Q109 124 100 112 Q91 124 82 112 Q73 124 64 112 Q55 124 46 112 Q37 124 28 112 Q19 124 10 112 L10 72 L8 74 Q0 74 3 66 L8 52 L8 18 Q8 4 22 4 Z'
      return (
        <Layer top={-8} left={-14} w={128} h={128} className="z-20" style={{ filter: 'drop-shadow(5px 5px 0 #000)' }}>
          <path d={sheet} fill="#f8fafc" />
          <path d={sheet} fill={color} opacity="0.18" />
          <path d={sheet} fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="48" cy="50" rx="8" ry="11" fill={INK} />
          <ellipse cx="80" cy="50" rx="8" ry="11" fill={INK} />
          <circle cx={46 + eye.x * 0.6} cy={46 + eye.y * 0.6} r="3" fill="#fff" />
          <circle cx={78 + eye.x * 0.6} cy={46 + eye.y * 0.6} r="3" fill="#fff" />
          <ellipse cx="38" cy="66" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.7" />
          <ellipse cx="90" cy="66" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.7" />
          <ellipse cx="64" cy="76" rx="7" ry="9" fill={INK} />
        </Layer>
      )
    },
    // La cara se dibuja sobre la sábana
    face: () => null,
  },

  timido: {
    // Brotecito en la cabeza
    back: () => (
      <Layer top={-26} left={38} w={24} h={30}>
        <path d="M12 30 L12 12" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M12 30 L12 12" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="6" cy="10" rx="6" ry="4" fill="#4ade80" stroke={INK} strokeWidth="2" transform="rotate(-25 6 10)" />
        <ellipse cx="18" cy="8" rx="6" ry="4" fill="#4ade80" stroke={INK} strokeWidth="2" transform="rotate(25 18 8)" />
      </Layer>
    ),
    // Gotita de nervios
    front: () => (
      <Layer top={14} left={80} w={12} h={16} className="z-20">
        <path d="M6 1 Q11 9 10 11 Q9 15 6 15 Q3 15 2 11 Q1 9 6 1 Z" fill="#93c5fd" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      </Layer>
    ),
    face: ({ eye }) => (
      <svg width="64" height="44" viewBox="0 0 64 44" className="mt-2">
        <path d="M10 6 L22 2 M54 6 L42 2" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx={18 + eye.x * 0.4} cy={16 + eye.y * 0.4} rx="4.5" ry="5.5" fill={INK} />
        <ellipse cx={46 + eye.x * 0.4} cy={16 + eye.y * 0.4} rx="4.5" ry="5.5" fill={INK} />
        <circle cx={16.5 + eye.x * 0.4} cy={14 + eye.y * 0.4} r="1.6" fill="#fff" />
        <circle cx={44.5 + eye.x * 0.4} cy={14 + eye.y * 0.4} r="1.6" fill="#fff" />
        <ellipse cx="8" cy="28" rx="7" ry="4" fill="#f9a8d4" opacity="0.85" />
        <ellipse cx="56" cy="28" rx="7" ry="4" fill="#f9a8d4" opacity="0.85" />
        <path d="M24 33 Q28 30 32 33 Q36 36 40 33" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },

  cerdito: {
    // Orejitas rosadas
    back: () => (
      <Layer top={-14} left={8} w={84} h={22}>
        <path d="M4 22 L10 3 Q12 0 15 3 L28 18 Z" fill="#f9a8d4" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M80 22 L74 3 Q72 0 69 3 L56 18 Z" fill="#f9a8d4" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      </Layer>
    ),
    // Estrellita
    front: () => (
      <Layer top={-8} left={96} w={18} h={18} className="z-20">
        <path d="M9 1 L11 7 L17 9 L11 11 L9 17 L7 11 L1 9 L7 7 Z" fill="#fde047" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      </Layer>
    ),
    face: () => (
      <svg width="64" height="50" viewBox="0 0 64 50" className="mt-2">
        {/* Ojos felices cerrados ^ ^ */}
        <path d="M10 14 Q16 6 22 14 M42 14 Q48 6 54 14" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="7" cy="26" rx="6" ry="3.5" fill="#f472b6" opacity="0.6" />
        <ellipse cx="57" cy="26" rx="6" ry="3.5" fill="#f472b6" opacity="0.6" />
        {/* Hocico */}
        <ellipse cx="32" cy="28" rx="12" ry="8" fill="#f9a8d4" stroke={INK} strokeWidth="2.5" />
        <ellipse cx="27.5" cy="28" rx="2" ry="3" fill={INK} />
        <ellipse cx="36.5" cy="28" rx="2" ry="3" fill={INK} />
        <path d="M28 41 Q32 45 36 41" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },

  pollito: {
    // Copete
    back: () => (
      <Layer top={-22} left={36} w={28} h={26}>
        <ellipse cx="8" cy="15" rx="4" ry="9" fill="#fde047" stroke={INK} strokeWidth="2" transform="rotate(-25 8 15)" />
        <ellipse cx="14" cy="11" rx="4" ry="10" fill="#fde047" stroke={INK} strokeWidth="2" />
        <ellipse cx="20" cy="15" rx="4" ry="9" fill="#fde047" stroke={INK} strokeWidth="2" transform="rotate(25 20 15)" />
      </Layer>
    ),
    face: ({ eye }) => (
      <svg width="64" height="46" viewBox="0 0 64 46" className="mt-2">
        <circle cx={18 + eye.x * 0.4} cy={15 + eye.y * 0.4} r="6.5" fill={INK} />
        <circle cx={46 + eye.x * 0.4} cy={15 + eye.y * 0.4} r="6.5" fill={INK} />
        <circle cx={15.5 + eye.x * 0.4} cy={12.5 + eye.y * 0.4} r="2.4" fill="#fff" />
        <circle cx={43.5 + eye.x * 0.4} cy={12.5 + eye.y * 0.4} r="2.4" fill="#fff" />
        <circle cx={20 + eye.x * 0.4} cy={18 + eye.y * 0.4} r="1.1" fill="#fff" />
        <circle cx={48 + eye.x * 0.4} cy={18 + eye.y * 0.4} r="1.1" fill="#fff" />
        <ellipse cx="7" cy="28" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.85" />
        <ellipse cx="57" cy="28" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.85" />
        {/* Piquito */}
        <path d="M24 28 L32 23 L40 28 L32 34 Z" fill="#fb923c" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 28 L40 28" stroke={INK} strokeWidth="1.5" />
      </svg>
    ),
  },
}
