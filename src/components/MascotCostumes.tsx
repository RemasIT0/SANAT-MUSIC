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
  | 'emo' | 'gotico' | 'grunge' | 'nerd' | 'unicornio' | 'siniestro' | 'payaso'
  | 'bufon' | 'verdugo' | 'sombra' | 'infectado' | 'penitente' | 'lord'
  | 'darkking' | 'mago' | 'princesa'
  | 'gaucha' | 'rapera' | 'turra' | 'grungera' | 'dama' | 'maga'

// Lista para los selectores (Editar perfil / Onboarding)
export const MASCOT_EXPRESSIONS: { id: MascotExpression; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'feliz', label: 'Feliz' },
  { id: 'pensativo', label: 'Pensativo' },
  { id: 'rockero', label: 'Rockero' },
  { id: 'melenudo', label: 'Melenudo' },
  { id: 'blackmetal', label: 'Black metal' },
  { id: 'gotico', label: 'Gótico' },
  { id: 'emo', label: 'Emo' },
  { id: 'grunge', label: 'Grunge m' },
  { id: 'grungera', label: 'Grunge f' },
  { id: 'punk', label: 'Punk' },
  { id: 'gaucho', label: 'Gaucho' },
  { id: 'gaucha', label: 'Gaucha' },
  { id: 'rapero', label: 'Rapero' },
  { id: 'rapera', label: 'Rapera' },
  { id: 'turro', label: 'Turro' },
  { id: 'turra', label: 'Turra' },
  { id: 'dj', label: 'DJ' },
  { id: 'otaku', label: 'Otaku' },
  { id: 'nerd', label: 'Nerd' },
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
  { id: 'unicornio', label: 'Unicornio/evil' },
  { id: 'siniestro', label: 'Siniestro' },
  { id: 'payaso', label: 'Payaso' },
  { id: 'bufon', label: 'Bufón' },
  { id: 'verdugo', label: 'Verdugo' },
  { id: 'sombra', label: 'Sombra' },
  { id: 'infectado', label: 'Infectado' },
  { id: 'penitente', label: 'Penitente' },
  { id: 'lord', label: 'Lord' },
  { id: 'dama', label: 'Dama de armadura' },
  { id: 'mago', label: 'Mago sabio' },
  { id: 'maga', label: 'Maga' },
  { id: 'princesa', label: 'Princesa guerrera' },
  { id: 'darkking', label: 'Dark King' },
]

// Solo la cuenta admin puede elegirlas (la base de datos también lo controla)
export const ADMIN_ONLY_EXPRESSIONS: MascotExpression[] = ['darkking']

interface CostumeCtx {
  color: string
  eye: { x: number; y: number }
}

interface Costume {
  back?: (c: CostumeCtx) => ReactNode
  face: (c: CostumeCtx) => ReactNode
  front?: (c: CostumeCtx) => ReactNode
  hideBody?: boolean   // sin la caja del cuerpo: el disfraz es toda la cabeza
  hideLimbs?: boolean  // sin brazos ni pies (por ejemplo, una sombra)
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

// Ojos cuadrados con pestañas (versiones femeninas)
function LashEyes({ eye, lids = false }: { eye: CostumeCtx['eye']; lids?: boolean }) {
  return (
    <div className="flex gap-3">
      {[0, 1].map(i => (
        <div key={i} className="relative">
          {/* Tres pestañas hacia el lado de afuera */}
          {[0, 1, 2].map(j => (
            <div key={j} className="absolute w-[3px] h-2 bg-black rounded-full" style={{
              top: -6 + j * 2,
              [i === 0 ? 'left' : 'right']: -1 + j * 4,
              transform: `rotate(${(i === 0 ? -1 : 1) * (35 - j * 15)}deg)`,
            }} />
          ))}
          <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-center justify-center overflow-hidden">
            <div className="w-4 h-4 bg-black rounded-sm" style={{ transform: `translate(${eye.x}px, ${eye.y}px)` }} />
            {lids && <div className="absolute top-0 left-0 right-0 h-[40%] bg-black" />}
          </div>
        </div>
      ))}
    </div>
  )
}

function ThinBrows({ tilt = 0 }: { tilt?: number }) {
  return (
    <div className="flex gap-5 w-full justify-center">
      <div className="w-6 h-1 bg-black rounded-full" style={{ transform: `rotate(${tilt}deg)` }} />
      <div className="w-6 h-1 bg-black rounded-full" style={{ transform: `rotate(${-tilt}deg)` }} />
    </div>
  )
}

function Cheeks() {
  return (
    <div className="flex gap-12 -mt-1" aria-hidden="true">
      <div className="w-4 h-2 rounded-full bg-pink-400/70" />
      <div className="w-4 h-2 rounded-full bg-pink-400/70" />
    </div>
  )
}

function Lips({ color, smirk = false }: { color: string; smirk?: boolean }) {
  return (
    <svg width="32" height="14" viewBox="0 0 32 14" className="mt-1">
      {smirk
        ? <path d="M4 8 Q16 12 28 4 Q20 13 10 12 Z" fill={color} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        : <path d="M5 5 Q11 2 16 5 Q21 2 27 5 Q22 13 16 13 Q10 13 5 5 Z" fill={color} stroke={INK} strokeWidth="2" strokeLinejoin="round" />}
      <path d="M11 6 L14 6" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
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

  emo: {
    // Pelo de fondo: capas desfiladas y en punta, negro azabache
    back: () => (
      <Layer top={-18} left={-18} w={136} h={104}>
        <path d="M16 44 Q22 4 68 2 Q114 4 120 44 L130 76 L114 66 L122 98 L104 78 L100 52 L36 52 L32 78 L14 98 L22 66 L6 76 Z" fill="#0b0b0f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M16 60 L10 72 M120 60 L126 72 M28 70 L22 88 M108 70 L114 88" stroke="#2a2a33" strokeWidth="2.5" strokeLinecap="round" />
      </Layer>
    ),
    // Flequillo largo de costado: mechones en punta que tapan un ojo, con mechita de color
    front: () => (
      <Layer top={-16} left={-8} w={118} h={88} className="z-20">
        <path d="M2 26 Q26 2 70 2 Q104 2 116 24 L108 32 L100 22 L96 36 L86 26 L70 54 L74 36 L54 62 L58 42 L38 72 L42 50 L20 76 L26 52 L4 66 Z" fill="#0b0b0f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        {/* Mechita de color */}
        <path d="M78 6 Q66 22 56 58 L60 42 Q68 22 86 8 Z" fill="#22d3ee" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        {/* Brillos del pelo */}
        <path d="M24 22 Q40 10 58 8 M30 34 L44 26 M16 46 L28 38" fill="none" stroke="#3f3f4a" strokeWidth="2.2" strokeLinecap="round" />
      </Layer>
    ),
    face: ({ eye }) => (
      <svg width="84" height="70" viewBox="0 0 84 70" className="mt-2">
        {/* Ojo visible con delineado grueso y lágrima */}
        <rect x="47" y="14" width="26" height="20" rx="3" fill="#fff" stroke={INK} strokeWidth="3" />
        <rect x={55 + eye.x} y={19 + eye.y} width="10" height="10" rx="2" fill={INK} />
        <path d="M44 13 L74 12 L82 6" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M60 38 Q58 44 60 46 Q62 44 60 38 Z" fill="#93c5fd" stroke={INK} strokeWidth="1.2" />
        {/* Boca triste con piercing */}
        <path d="M30 58 Q42 50 54 58" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="47" cy="61" r="3" fill="none" stroke="#d1d5db" strokeWidth="2.2" />
      </svg>
    ),
  },

  gotico: {
    // Pelo largo y lacio
    back: () => (
      <Layer top={-12} left={-34} w={168} h={118}>
        <path d="M26 34 Q30 0 84 0 Q138 0 142 34 L152 112 L128 108 L124 58 L44 58 L40 108 L16 112 Z" fill="#111" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M24 62 L20 104 M144 62 L148 104" stroke="#3f3f46" strokeWidth="2.5" strokeLinecap="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Flequillo recto */}
        <Layer top={-6} left={-4} w={108} h={30} className="z-20">
          <path d="M2 24 L2 10 Q54 -8 106 10 L106 24 Z" fill="#111" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </Layer>
        {/* Gargantilla con cruz */}
        <Layer top={88} left={22} w={56} h={30} className="z-20">
          <rect x="2" y="2" width="52" height="7" rx="3" fill="#111" stroke={INK} strokeWidth="2" />
          <rect x="25" y="9" width="6" height="18" fill="#d1d5db" stroke={INK} strokeWidth="1.5" />
          <rect x="20" y="13" width="16" height="5" fill="#d1d5db" stroke={INK} strokeWidth="1.5" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <svg width="80" height="60" viewBox="0 0 80 60" className="mt-6">
        {/* Sombra violeta y ojos */}
        {[18, 62].map(cx => (
          <g key={cx}>
            <ellipse cx={cx} cy="16" rx="14" ry="11" fill="#581c87" />
            <rect x={cx - 10} y="9" width="20" height="15" rx="3" fill="#fff" stroke={INK} strokeWidth="2.5" />
            <rect x={cx - 4 + eye.x * 0.8} y={13 + eye.y * 0.6} width="8" height="8" rx="1.5" fill={INK} />
            <path d={`M${cx - 12} 8 L${cx + 12} 6`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
        {/* Lunar y labios negros */}
        <circle cx="58" cy="40" r="1.8" fill={INK} />
        <path d="M30 44 Q40 40 50 44 Q40 52 30 44 Z" fill="#111" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },

  grunge: {
    // Pelo largo y desprolijo
    back: () => (
      <Layer top={-6} left={-28} w={156} h={120}>
        <path d="M26 26 Q40 0 78 2 Q118 0 130 26 L142 98 L130 92 L128 112 L116 96 L110 50 L46 50 L40 96 L28 112 L26 92 L14 98 Z" fill="#a16207" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 50 L18 92 M134 50 L138 92 M32 60 L30 100 M124 60 L126 100" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Gorro de lana */}
        <Layer top={-30} left={-6} w={112} h={46} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M8 34 Q8 2 56 2 Q104 2 104 34 Z" fill="#365314" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="4" y="30" width="104" height="12" rx="3" fill="#4d7c0f" stroke={INK} strokeWidth="3" />
          <path d="M20 31 L20 41 M32 31 L32 41 M44 31 L44 41 M56 31 L56 41 M68 31 L68 41 M80 31 L80 41 M92 31 L92 41" stroke="#365314" strokeWidth="2" />
        </Layer>
        {/* Mechones que caen sobre la cara */}
        <Layer top={10} left={-4} w={108} h={30} className="z-20">
          <path d="M4 0 L12 26 L18 4 Z M90 4 L96 28 L104 0 Z" fill="#a16207" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <>
        <div className="mt-5"><SquareEyes eye={eye} lids /></div>
        {/* Barba de varios días y boca apática */}
        <svg width="60" height="30" viewBox="0 0 60 30" className="mt-2">
          <line x1="18" y1="10" x2="42" y2="10" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          {[[10, 18], [16, 22], [24, 20], [32, 23], [40, 20], [46, 22], [52, 17], [20, 27], [30, 28], [40, 27]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.3" fill={INK} opacity="0.6" />
          ))}
        </svg>
      </>
    ),
  },

  nerd: {
    // Remolino de pelo
    back: () => (
      <Layer top={-18} left={20} w={60} h={24}>
        <path d="M4 24 Q8 4 30 6 Q52 4 56 24 Z" fill="#422006" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M30 6 Q34 -4 42 2" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </Layer>
    ),
    // Moño
    front: () => (
      <Layer top={90} left={30} w={40} h={20} className="z-20">
        <path d="M20 10 L2 2 L2 18 Z M20 10 L38 2 L38 18 Z" fill="#dc2626" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="15" y="5" width="10" height="10" rx="2" fill="#b91c1c" stroke={INK} strokeWidth="2.5" />
      </Layer>
    ),
    face: ({ eye }) => (
      <svg width="88" height="72" viewBox="0 0 88 72" className="mt-1">
        {/* Anteojos grandes con cinta */}
        {[24, 64].map(cx => (
          <g key={cx}>
            <circle cx={cx} cy="24" r="17" fill="#e0f2fe" stroke={INK} strokeWidth="4" />
            <circle cx={cx + eye.x} cy={24 + eye.y} r="6" fill={INK} />
            <circle cx={cx - 2 + eye.x} cy={22 + eye.y} r="2" fill="#fff" />
          </g>
        ))}
        <rect x="38" y="18" width="12" height="9" rx="2" fill="#fef3c7" stroke={INK} strokeWidth="2" />
        <path d="M40 20 L48 25 M48 20 L40 25" stroke={INK} strokeWidth="1.2" />
        {/* Pecas */}
        {[[12, 48], [18, 50], [70, 48], [76, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#92400e" />)}
        {/* Sonrisa con dientes de conejo */}
        <path d="M28 52 Q44 66 60 52" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="38" y="57" width="6" height="8" fill="#fff" stroke={INK} strokeWidth="1.8" />
        <rect x="44" y="57" width="6" height="8" fill="#fff" stroke={INK} strokeWidth="1.8" />
      </svg>
    ),
  },

  unicornio: {
    // Crin oscura con fuego violeta y rojo
    back: () => (
      <Layer top={-16} left={-22} w={70} h={120}>
        <path d="M44 16 Q20 8 10 30 Q2 46 12 56 Q0 70 10 84 Q2 98 14 112 Q22 96 30 100 Q26 84 34 78 Q28 62 38 56 Q34 40 48 34 Z" fill="#4c0519" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 24 Q20 30 18 46 M30 60 Q18 70 20 86" fill="none" stroke="#a21caf" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 30 Q28 40 28 52" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Cuerno en espiral, oscuro y con la punta encendida */}
        <Layer top={-50} left={39} w={22} h={56} className="z-20" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }}>
          <path d="M11 2 Q13 30 20 54 L2 54 Q9 30 11 2 Z" fill="#2e1065" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M4 46 Q11 40 18 47 M5 36 Q11 31 16 37 M7 26 Q11 22 14 27 M8 16 Q11 13 13 17" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="11" cy="4" r="2.5" fill="#fecaca" />
        </Layer>
        {/* Orejas puntiagudas */}
        <Layer top={-16} left={4} w={92} h={22} className="z-10">
          <path d="M4 22 L10 2 L24 20 Z M88 22 L82 2 L68 20 Z" fill="#4c0519" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <svg width="80" height="64" viewBox="0 0 80 64" className="mt-3">
        {/* Cejas malvadas y ojos rojos con pupila de reptil */}
        <path d="M6 6 L32 14 M74 6 L48 14" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        {[20, 60].map(cx => (
          <g key={cx}>
            <ellipse cx={cx} cy="24" rx="11" ry="9" fill="#ef4444" stroke={INK} strokeWidth="3" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
            <ellipse cx={cx + eye.x * 0.7} cy={24 + eye.y * 0.5} rx="2.2" ry="7" fill={INK} />
          </g>
        ))}
        {/* Sonrisa con colmillos */}
        <path d="M14 42 Q40 62 66 42 Q40 52 14 42 Z" fill={INK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 46 L28 56 L31 48 Z M56 46 L52 56 L49 48 Z" fill="#fff" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },

  siniestro: {
    // Pelo corto detrás de los costados (no pasa de la mitad de las patas)
    back: () => (
      <Layer top={-8} left={-12} w={124} h={94}>
        <path d="M12 30 Q16 0 62 0 Q108 0 112 30 L116 88 L104 80 L100 92 L92 78 L92 40 L32 40 L32 78 L24 92 L20 80 L8 88 Z" fill="#0a0a0c" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Casquete de pelo que cubre TODO el borde de arriba del cuadrado, esquinas incluidas */}
        <Layer top={-12} left={-8} w={116} h={58} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M0 52 L0 22 Q4 0 58 0 Q112 0 116 22 L116 52 L106 40 L100 54 L90 38 L82 50 L72 36 L64 48 L56 34 L48 48 L40 36 L30 50 L22 38 L14 54 L8 40 Z" fill="#0a0a0c" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 14 Q40 6 58 6 M70 8 Q88 10 100 18" fill="none" stroke="#2c2c33" strokeWidth="2.2" strokeLinecap="round" />
        </Layer>
        {/* Mechones a los costados, sobre los bordes de la caja */}
        <Layer top={28} left={-8} w={20} h={50} className="z-20">
          <path d="M2 0 L18 0 L16 40 L10 30 L4 48 Z" fill="#0a0a0c" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </Layer>
        <Layer top={28} left={88} w={20} h={50} className="z-20">
          <path d="M2 0 L18 0 L16 48 L10 32 L4 40 Z" fill="#0a0a0c" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </Layer>
      </>
    ),
    // Máscara de porcelana grande, que ocupa casi toda la cara
    face: ({ eye }) => (
      <svg width="86" height="80" viewBox="0 0 86 80" className="mt-1">
        <path d="M6 6 Q43 -3 80 6 Q87 40 76 62 Q43 84 10 62 Q-1 40 6 6 Z" fill="#f1ede4" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M66 10 L58 24 L64 33 L56 45" fill="none" stroke="#6b6b6b" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="27" cy="34" rx="8.5" ry="10.5" fill="#050505" />
        <ellipse cx="59" cy="34" rx="8.5" ry="10.5" fill="#050505" />
        <circle cx={27 + eye.x * 0.6} cy={34 + eye.y * 0.6} r="2" fill="#e5e7eb" />
        <circle cx={59 + eye.x * 0.6} cy={34 + eye.y * 0.6} r="2" fill="#e5e7eb" />
        <path d="M15 56 Q43 72 71 56" fill="none" stroke="#7f1d1d" strokeWidth="3.6" strokeLinecap="round" />
        <path d="M22 56 L21 63 M30 61 L29.5 68 M39 63 L39 70 M47 63 L47.5 70 M56 61 L57 68 M64 56 L65.5 63" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },

  payaso: {
    // Mechones de pelo a los costados
    back: () => (
      <Layer top={-6} left={-30} w={160} h={60}>
        <path d="M30 40 Q8 44 4 28 Q14 30 14 20 Q2 14 10 4 Q20 12 28 8 Q30 22 36 30 Z" fill="#ea580c" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M130 40 Q152 44 156 28 Q146 30 146 20 Q158 14 150 4 Q140 12 132 8 Q130 22 124 30 Z" fill="#ea580c" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Sombrerito torcido */}
        <Layer top={-30} left={56} w={40} h={36} className="z-20" style={{ transform: 'rotate(14deg)' }}>
          <rect x="2" y="26" width="36" height="7" rx="2" fill="#111" stroke={INK} strokeWidth="2.5" />
          <rect x="9" y="6" width="22" height="22" rx="2" fill="#111" stroke={INK} strokeWidth="2.5" />
          <rect x="9" y="19" width="22" height="5" fill="#7f1d1d" />
        </Layer>
        {/* Gorguera (cuello de payaso) */}
        <Layer top={88} left={10} w={80} h={22} className="z-20">
          <path d="M2 4 Q10 20 20 6 Q30 20 40 6 Q50 20 60 6 Q70 20 78 4 Z" fill="#e5e7eb" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <svg width="86" height="80" viewBox="0 0 86 80" className="mt-2">
        {/* Maquillaje blanco corrido */}
        <path d="M8 10 Q43 0 78 10 Q86 44 74 66 Q43 84 12 66 Q0 44 8 10 Z" fill="#f4f4f5" />
        {/* Rombos negros sobre los ojos */}
        <polygon points="24,4 30,22 24,40 18,22" fill="#111" />
        <polygon points="62,4 68,22 62,40 56,22" fill="#111" />
        {/* Ojos con párpados caídos: cara de pocos amigos */}
        {[24, 62].map(cx => (
          <g key={cx}>
            <ellipse cx={cx} cy="22" rx="8" ry="7" fill="#fff" stroke={INK} strokeWidth="2" />
            <circle cx={cx + eye.x * 0.7} cy={23 + eye.y * 0.5} r="3.5" fill={INK} />
            <path d={`M${cx - 9} 19 L${cx + 9} 19 L${cx + 9} 14 Q${cx} 12 ${cx - 9} 14 Z`} fill="#f4f4f5" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          </g>
        ))}
        <path d="M12 10 L34 15 M74 10 L52 15" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        {/* Nariz roja */}
        <circle cx="43" cy="40" r="7" fill="#dc2626" stroke={INK} strokeWidth="2.5" />
        <circle cx="41" cy="38" r="2" fill="#fca5a5" />
        {/* Sonrisa pintada hacia abajo y la boca de verdad torcida */}
        <path d="M20 66 Q43 52 66 66" fill="none" stroke="#b91c1c" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
        <path d="M32 60 Q42 56 54 62" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },

  bufon: {
    // Gorro de bufón de dos puntas con cascabeles
    back: () => (
      <Layer top={-34} left={-14} w={128} h={50}>
        <path d="M30 46 Q18 18 2 8 Q20 4 40 22 L50 46 Z" fill="#581c87" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M98 46 Q110 18 126 8 Q108 4 88 22 L78 46 Z" fill="#111" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M40 46 Q64 14 88 46 Z" fill="#7f1d1d" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="4" cy="9" r="5" fill="#facc15" stroke={INK} strokeWidth="2" />
        <circle cx="124" cy="9" r="5" fill="#facc15" stroke={INK} strokeWidth="2" />
      </Layer>
    ),
    face: ({ eye }) => (
      <svg width="88" height="82" viewBox="0 0 88 82" className="mt-1">
        {/* Media máscara: mitad blanca, mitad negra */}
        <path d="M44 4 Q14 4 8 30 Q6 60 44 78 Z" fill="#f4f4f5" />
        <path d="M44 4 Q74 4 80 30 Q82 60 44 78 Z" fill="#111" />
        <path d="M44 4 L44 78" stroke={INK} strokeWidth="2" />
        {/* Ojos invertidos */}
        <circle cx="26" cy="30" r="8" fill="#111" />
        <circle cx={26 + eye.x * 0.6} cy={30 + eye.y * 0.6} r="2.5" fill="#fff" />
        <circle cx="62" cy="30" r="8" fill="#f4f4f5" />
        <circle cx={62 + eye.x * 0.6} cy={30 + eye.y * 0.6} r="2.5" fill="#111" />
        {/* Sonrisa enorme con dientes en punta */}
        <path d="M14 52 Q44 74 74 52 Q44 62 14 52 Z" fill="#7f1d1d" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M22 55 L26 62 L30 57 L34 64 L38 58 L42 65 L46 58 L50 64 L54 57 L58 62 L62 55" fill="none" stroke="#f4f4f5" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },

  verdugo: {
    // Capucha negra en punta que tapa la cabeza y la nariz; la boca y el mentón quedan al aire
    front: ({ eye }) => (
      <Layer top={-24} left={-10} w={120} h={134} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
        <path d="M60 0 Q102 8 110 46 L112 124 L100 114 L92 128 L84 110 L80 74 Q60 82 40 74 L36 110 L28 128 L20 114 L8 124 L10 46 Q18 8 60 0 Z" fill="#111114" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M60 4 Q56 18 58 30" fill="none" stroke="#2c2c33" strokeWidth="2.2" strokeLinecap="round" />
        {/* Agujeros de los ojos, con mirada enojada */}
        {[40, 80].map((cx, i) => (
          <g key={cx}>
            <path d={`M${cx - 13} 48 Q${cx} 38 ${cx + 13} 48 Q${cx} 58 ${cx - 13} 48 Z`} fill="#f4f1ea" stroke={INK} strokeWidth="2.5" />
            <circle cx={cx + eye.x * 0.6} cy={48 + eye.y * 0.4} r="3.4" fill={INK} />
            <path d={i === 0 ? `M${cx - 14} 39 L${cx + 13} 46 L${cx + 13} 40 Z` : `M${cx + 14} 39 L${cx - 13} 46 L${cx - 13} 40 Z`} fill="#111114" />
          </g>
        ))}
      </Layer>
    ),
    // Boca seria y mentón (en el color de la mascota, debajo de la capucha)
    face: () => (
      <svg width="40" height="26" viewBox="0 0 40 26" className="mt-[58px]">
        <path d="M6 10 Q20 4 34 10" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M14 20 Q20 23 26 20" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
  },

  sombra: {
    // Sin caja ni brazos: una sombra con aura del color de la mascota, que aparece y se desvanece
    hideBody: true,
    hideLimbs: true,
    front: ({ color, eye }) => (
      <Layer top={-18} left={-18} w={136} h={140} className="z-20 mascot-fade">
        <defs>
          <radialGradient id="sombra-aura" cx="50%" cy="45%" r="55%">
            <stop offset="0.45" stopColor={color} stopOpacity="0.55" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sombra-cuerpo" cx="50%" cy="42%" r="55%">
            <stop offset="0" stopColor="#000" stopOpacity="0.95" />
            <stop offset="0.65" stopColor="#0b0716" stopOpacity="0.9" />
            <stop offset="1" stopColor={color} stopOpacity="0.35" />
          </radialGradient>
          <filter id="sombra-difusa" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {/* Aura de color alrededor */}
        <ellipse cx="68" cy="66" rx="64" ry="62" fill="url(#sombra-aura)" filter="url(#sombra-difusa)" />
        {/* Cuerpo de humo */}
        <path d="M68 10 Q112 12 118 58 Q122 88 110 108 L114 130 L98 116 L90 134 L78 118 L68 136 L58 118 L46 134 L38 116 L22 130 L26 108 Q14 88 18 58 Q24 12 68 10 Z" fill="url(#sombra-cuerpo)" filter="url(#sombra-difusa)" />
        {/* Ojos que brillan */}
        <path d={`M${42 + eye.x} ${62 + eye.y} Q${52 + eye.x} ${53 + eye.y} ${62 + eye.x} ${62 + eye.y} Q${52 + eye.x} ${66 + eye.y} ${42 + eye.x} ${62 + eye.y} Z`} fill="#f0f9ff" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <path d={`M${74 + eye.x} ${62 + eye.y} Q${84 + eye.x} ${53 + eye.y} ${94 + eye.x} ${62 + eye.y} Q${84 + eye.x} ${66 + eye.y} ${74 + eye.x} ${62 + eye.y} Z`} fill="#f0f9ff" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      </Layer>
    ),
    face: () => null,
  },

  infectado: {
    // Venas verdes sobre el cuerpo
    back: () => null,
    front: () => (
      <>
        <Layer top={4} left={4} w={92} h={92} className="z-[15]">
          <path d="M6 70 L18 60 L16 48 M86 22 L74 30 L78 42 M70 86 L64 74 L72 66" fill="none" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        </Layer>
        {/* Máscara de gas con dos filtros */}
        <Layer top={52} left={14} w={72} h={44} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M18 4 L54 4 Q64 20 54 36 L18 36 Q8 20 18 4 Z" fill="#3f3f46" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="10" cy="26" r="9" fill="#52525b" stroke={INK} strokeWidth="2.5" />
          <circle cx="62" cy="26" r="9" fill="#52525b" stroke={INK} strokeWidth="2.5" />
          <path d="M6 26 L14 26 M58 26 L66 26 M28 18 L44 18 M28 24 L44 24" stroke="#18181b" strokeWidth="2" strokeLinecap="round" />
        </Layer>
        {/* Parche de peligro biológico */}
        <Layer top={-6} left={74} w={26} h={26} className="z-20">
          <circle cx="13" cy="13" r="11" fill="#facc15" stroke={INK} strokeWidth="2.5" />
          <circle cx="13" cy="13" r="3" fill="#111" />
          <path d="M13 4 L13 9 M5 18 L9 15.5 M21 18 L17 15.5" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <svg width="80" height="40" viewBox="0 0 80 40" className="mb-8">
        {/* Antiparras con ojos amarillentos */}
        <rect x="2" y="8" width="76" height="8" rx="4" fill="#111" />
        {[22, 58].map(cx => (
          <g key={cx}>
            <circle cx={cx} cy="20" r="13" fill="#d9f99d" stroke={INK} strokeWidth="3.5" />
            <circle cx={cx + eye.x * 0.7} cy={20 + eye.y * 0.7} r="4" fill="#3f6212" />
          </g>
        ))}
      </svg>
    ),
  },

  penitente: {
    // Capirote: capucha alta y puntiaguda, con rosario
    back: () => (
      <Layer top={-62} left={20} w={60} h={70}>
        <path d="M30 2 L56 70 L4 70 Z" fill="#4a0d0d" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M30 14 L40 52 M30 14 L20 52" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
      </Layer>
    ),
    front: ({ eye }) => (
      <>
        {/* Tela que cubre la cara, con dos ranuras */}
        <Layer top={-6} left={-4} w={108} h={84} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path fillRule="evenodd" d="M4 8 Q54 -6 104 8 L106 78 Q80 70 54 80 Q28 70 2 78 Z M24 34 L46 34 L44 40 L26 40 Z M62 34 L84 34 L82 40 L64 40 Z" fill="#4a0d0d" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx={35 + eye.x * 0.5} cy="37" r="2.2" fill="#fde68a" />
          <circle cx={73 + eye.x * 0.5} cy="37" r="2.2" fill="#fde68a" />
          <path d="M14 60 Q54 52 94 60" fill="none" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
        </Layer>
        {/* Rosario de cuentas con cruz */}
        <Layer top={76} left={18} w={64} h={36} className="z-20">
          <path d="M4 4 Q32 26 60 4" fill="none" stroke="#a16207" strokeWidth="1.5" />
          {[[8, 8], [16, 14], [24, 18], [40, 18], [48, 14], [56, 8]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill="#d6d3d1" stroke={INK} strokeWidth="1" />)}
          <rect x="30" y="18" width="4" height="15" fill="#d6d3d1" stroke={INK} strokeWidth="1" />
          <rect x="26" y="22" width="12" height="4" fill="#d6d3d1" stroke={INK} strokeWidth="1" />
        </Layer>
      </>
    ),
    face: () => null,
  },

  lord: {
    // Penacho carmesí que cae hacia atrás desde la cresta del yelmo
    back: () => (
      <Layer top={-58} left={-30} w={120} h={110}>
        <path d="M86 40 Q70 0 34 6 Q8 12 2 44 Q16 26 30 30 Q12 44 10 74 Q26 52 40 52 Q30 70 34 98 Q46 70 60 62 Q60 50 86 40 Z" fill="#9f1239" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M70 26 Q48 18 26 32 M64 44 Q42 44 24 62 M58 56 Q46 66 40 84" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
      </Layer>
    ),
    front: ({ eye }) => (
      <>
        {/* Hombreras */}
        {[-24, 96].map(left => (
          <Layer key={left} top={52} left={left} w={30} h={24} className="z-20">
            <path d="M3 22 Q2 4 15 2 Q28 4 27 22 Z" fill="url(#lord-steel)" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M6 14 L24 14" stroke="#64748b" strokeWidth="2" />
          </Layer>
        ))}
        {/* Yelmo cerrado, un poco más grande que el cuerpo */}
        <Layer top={-30} left={-14} w={128} h={132} className="z-20" style={{ filter: 'drop-shadow(4px 4px 0 #000)' }}>
          <defs>
            <linearGradient id="lord-steel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#94a3b8" />
              <stop offset="0.35" stopColor="#e2e8f0" />
              <stop offset="0.6" stopColor="#cbd5e1" />
              <stop offset="1" stopColor="#64748b" />
            </linearGradient>
          </defs>
          {/* Cuerpo del yelmo: cúpula y mejillas que bajan */}
          <path d="M10 124 L8 50 Q10 6 64 4 Q118 6 120 50 L118 124 Q64 132 10 124 Z" fill="url(#lord-steel)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          {/* Cresta central */}
          <path d="M64 4 L64 44" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 6 L60 44 M68 6 L68 44" stroke="#64748b" strokeWidth="1.5" />
          {/* Banda de la frente con remaches */}
          <path d="M9 40 Q64 30 119 40 L119 48 Q64 38 9 48 Z" fill="#475569" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          {[18, 40, 64, 88, 110].map(x => <circle key={x} cx={x} cy={x === 64 ? 37 : 41} r="2.4" fill="#e2e8f0" stroke={INK} strokeWidth="1" />)}
          {/* Ranura de la visera con ojos que brillan */}
          <path d="M14 56 Q64 50 114 56 L114 68 Q64 62 14 68 Z" fill="#0b0b0f" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx={42 + eye.x * 0.9} cy={61 + eye.y * 0.4} r="3.2" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 4px #f59e0b)' }} />
          <circle cx={86 + eye.x * 0.9} cy={61 + eye.y * 0.4} r="3.2" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 4px #f59e0b)' }} />
          {/* Arista de la visera */}
          <path d="M64 68 L64 122" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          {/* Agujeros para respirar, en cruz a cada lado */}
          {[[30, 82], [38, 82], [30, 92], [38, 92], [30, 102], [90, 82], [98, 82], [90, 92], [98, 92], [98, 102]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" fill="#0b0b0f" />
          ))}
          {/* Borde inferior con remaches */}
          <path d="M11 116 Q64 124 117 116" fill="none" stroke="#475569" strokeWidth="4" />
          {[22, 44, 64, 84, 106].map(x => <circle key={x} cx={x} cy={x === 64 ? 120 : 118} r="2.2" fill="#e2e8f0" stroke={INK} strokeWidth="1" />)}
          {/* Brillo del metal */}
          <path d="M24 22 Q34 12 50 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </Layer>
      </>
    ),
    // La cara la tapa el yelmo
    face: () => null,
  },

  darkking: {
    // Exclusivo del admin: rey hechicero de túnica gris raída, guantelete de armadura y corona sobre la capucha
    hideBody: true,
    hideLimbs: true,
    back: () => (
      <Layer top={20} left={-40} w={180} h={116}>
        {/* Túnica gris, gastada y rasgada */}
        <path d="M90 0 Q142 6 170 42 L176 112 L164 102 L158 116 L148 96 L140 112 L128 98 L118 114 L108 96 L98 112 L90 98 L82 114 L72 96 L62 112 L52 98 L42 116 L32 96 L22 114 L16 102 L4 112 L10 42 Q38 6 90 0 Z" fill="#4a4a50" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        {/* Rasgaduras y pliegues */}
        <path d="M40 70 L46 104 L36 92 Z M122 64 L128 100 L118 88 Z M78 80 L82 108 L74 98 Z" fill="#1f1f23" />
        <path d="M28 46 L22 96 M152 46 L158 96 M56 36 L52 90 M124 36 L128 90 M90 30 L90 86" stroke="#35353a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 46 Q90 20 166 46" fill="none" stroke="#5c5c63" strokeWidth="2" strokeLinecap="round" />
      </Layer>
    ),
    front: ({ eye }) => (
      <>
        {/* Capucha gris oscura con el rostro en sombra */}
        <Layer top={0} left={-6} w={112} h={108} className="z-20" style={{ filter: 'drop-shadow(4px 4px 0 #000)' }}>
          <defs>
            <linearGradient id="darkking-llama" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#ff3b3b" stopOpacity="0.85" />
              <stop offset="0.55" stopColor="#fb923c" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="darkking-vacio" cx="50%" cy="50%" r="55%">
              <stop offset="0" stopColor="#000" />
              <stop offset="1" stopColor="#141416" />
            </radialGradient>
          </defs>
          <path d="M56 2 Q100 4 106 50 L108 104 Q56 112 4 104 L6 50 Q12 4 56 2 Z" fill="#323238" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M56 18 Q90 22 92 56 Q90 90 56 98 Q22 90 20 56 Q22 22 56 18 Z" fill="url(#darkking-vacio)" />
          <path d="M14 64 Q12 84 14 100 M98 64 Q100 84 98 100" fill="none" stroke="#45454c" strokeWidth="2.5" strokeLinecap="round" />
          {/* Ojos rojos horizontales, como dos rendijas encendidas */}
          {[40, 72].map(cx => (
            <g key={cx}>
              <ellipse cx={cx + eye.x * 0.6} cy={54 + eye.y * 0.3} rx="11" ry="4.5" fill="#ef4444" opacity="0.3" className="animate-pulse" />
              <ellipse cx={cx + eye.x * 0.6} cy={54 + eye.y * 0.3} rx="8" ry="2.2" fill="#ff3b3b" style={{ filter: 'drop-shadow(0 0 5px #ef4444)' }} />
              <ellipse cx={cx + eye.x * 0.6} cy={54 + eye.y * 0.3} rx="4" ry="0.9" fill="#ffe4e6" />
              {/* Aura de fuego que sube desde el ojo, suave */}
              <path d={`M${cx - 7 + eye.x * 0.6} ${53 + eye.y * 0.3} Q${cx - 6 + eye.x * 0.6} ${44 + eye.y * 0.3} ${cx - 1 + eye.x * 0.6} ${38 + eye.y * 0.3} Q${cx + 1 + eye.x * 0.6} ${44 + eye.y * 0.3} ${cx + 4 + eye.x * 0.6} ${42 + eye.y * 0.3} Q${cx + 7 + eye.x * 0.6} ${47 + eye.y * 0.3} ${cx + 7 + eye.x * 0.6} ${53 + eye.y * 0.3} Z`}
                fill="url(#darkking-llama)" className="darkking-flame" style={{ animationDelay: cx === 40 ? '0s' : '0.35s' }} />
            </g>
          ))}
        </Layer>
        {/* Corona de hierro oscuro: púas altas, finas y desparejas, fundida con la capucha (no tapa los ojos) */}
        <Layer top={-60} left={2} w={96} h={74} className="z-30" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <defs>
            <linearGradient id="darkking-hierro" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#141416" />
              <stop offset="0.5" stopColor="#3b3a3f" />
              <stop offset="1" stopColor="#141416" />
            </linearGradient>
          </defs>
          <path d="M8 72 L6 38 L12 46 L14 10 L20 44 L27 22 L32 46 L38 2 L44 44 L48 18 L52 44 L58 2 L64 46 L69 22 L76 44 L82 10 L84 46 L90 38 L88 72 Q48 64 8 72 Z" fill="url(#darkking-hierro)" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          {/* Filos que reflejan la luz */}
          <path d="M15 14 L17 42 M39 8 L41 42 M59 8 L61 42 M81 14 L81 42" stroke="#a8a29e" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
          {/* Aro de la corona y cresta que baja hacia la cara */}
          <path d="M8 62 Q48 54 88 62" fill="none" stroke="#57534e" strokeWidth="3" />
          <path d="M44 56 L48 74 L52 56 Z" fill="#2c2b30" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        </Layer>
        {/* Cresta central que separa los ojos, sobre el rostro en sombra */}
        <Layer top={12} left={45} w={10} h={56} className="z-30">
          <path d="M5 0 L9 10 L7 54 L3 54 L1 10 Z" fill="#2c2b30" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M5 4 L5 50" stroke="#6b6873" strokeWidth="1" />
        </Layer>
        {/* Brazo con guantelete de armadura oscura, con garras */}
        <Layer top={64} left={100} w={44} h={62} className="z-30" style={{ filter: 'drop-shadow(3px 3px 0 #000)', rotate: '-10deg' }}>
          <defs>
            <linearGradient id="darkking-acero" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3a3d45" />
              <stop offset="0.45" stopColor="#7c818c" />
              <stop offset="1" stopColor="#2a2c32" />
            </linearGradient>
          </defs>
          {/* Antebrazo en placas */}
          <path d="M6 4 L30 2 L32 30 L8 32 Z" fill="url(#darkking-acero)" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M7 12 L31 10 M7 21 L31 19" stroke="#1f2126" strokeWidth="2" />
          <path d="M30 4 L40 0 L33 12 Z" fill="#7c818c" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          {/* Mano en garra */}
          <path d="M6 32 L34 30 L36 42 L4 44 Z" fill="url(#darkking-acero)" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M6 44 L4 58 L10 48 Z M14 44 L13 60 L18 46 Z M22 44 L23 60 L26 45 Z M30 43 L34 56 L35 42 Z" fill="#2a2c32" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        </Layer>
        {/* Broche con forma de ojo en el pecho */}
        <Layer top={104} left={34} w={32} h={20} className="z-30">
          <path d="M2 10 Q16 -2 30 10 Q16 22 2 10 Z" fill="#f59e0b" stroke={INK} strokeWidth="2" />
          <ellipse cx="16" cy="10" rx="2" ry="6" fill={INK} />
        </Layer>
      </>
    ),
    face: () => null,
  },

  mago: {
    // Mago sabio: sombrero puntiagudo con estrellas, barba larga y bastón con orbe
    front: () => (
      <>
        {/* Sombrero: el ala tapa todo el borde de arriba de la caja */}
        <Layer top={-64} left={-16} w={132} h={84} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M30 66 Q46 34 60 10 Q68 -2 84 4 L78 12 Q76 30 100 66 Z" fill="#1e1b4b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 58 Q66 50 96 58 L98 66 Q66 58 32 66 Z" fill="#6d28d9" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M2 70 Q66 54 130 70 Q66 86 2 70 Z" fill="#1e1b4b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {/* Estrellas y luna */}
          <path d="M58 30 L60 35 L65 35 L61 38 L62 43 L58 40 L54 43 L55 38 L51 35 L56 35 Z" fill="#fde047" />
          <path d="M76 44 L77 47 L80 47 L78 49 L79 52 L76 50 L73 52 L74 49 L72 47 L75 47 Z" fill="#fde047" />
          <path d="M48 50 A5 5 0 1 0 52 42 A4 4 0 1 1 48 50 Z" fill="#fde047" />
        </Layer>
        {/* Barba larga y bigote */}
        <Layer top={48} left={6} w={88} h={78} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M4 8 Q44 -4 84 8 Q82 44 68 60 L62 76 L54 62 L46 78 L38 62 L30 76 L24 60 Q6 44 4 8 Z" fill="#f1f5f9" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M28 26 Q30 46 36 58 M48 26 Q46 48 46 66 M64 26 Q60 46 56 58" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 10 Q30 2 44 12 Q58 2 74 10 Q64 22 44 17 Q24 22 14 10 Z" fill="#e2e8f0" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </Layer>
        {/* Bastón con orbe que brilla */}
        <Layer top={-18} left={98} w={28} h={132} className="z-30">
          <path d="M14 26 L12 130" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <path d="M14 26 L12 130" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
          <path d="M6 28 Q14 18 22 28" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
          <circle cx="14" cy="14" r="10" fill="#67e8f9" stroke={INK} strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 7px #22d3ee)' }} />
          <circle cx="11" cy="11" r="3" fill="#fff" opacity="0.85" />
        </Layer>
      </>
    ),
    // Ojos tranquilos y cejas blancas y tupidas
    face: ({ eye }) => (
      <svg width="70" height="30" viewBox="0 0 70 30" className="mb-11">
        <path d="M4 8 L10 4 L14 8 L20 3 L26 7 L30 5 M40 5 L44 7 L50 3 L56 8 L60 4 L66 8" fill="none" stroke="#f1f5f9" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        {[17, 53].map(cx => (
          <g key={cx}>
            <ellipse cx={cx} cy="19" rx="9" ry="7" fill="#fff" stroke={INK} strokeWidth="2.5" />
            <circle cx={cx + eye.x * 0.6} cy={20 + eye.y * 0.4} r="3.6" fill={INK} />
            <path d={`M${cx - 10} 16 Q${cx} 11 ${cx + 10} 16 L${cx + 10} 13 Q${cx} 8 ${cx - 10} 13 Z`} fill={INK} />
          </g>
        ))}
      </svg>
    ),
  },

  princesa: {
    // Princesa guerrera: pelo cobrizo con trenza, diadema, hombrera y espada
    back: () => (
      <Layer top={-12} left={-16} w={132} h={112}>
        <path d="M16 40 Q20 2 66 2 Q112 2 116 40 L122 100 L108 92 L104 104 L96 90 L94 44 L38 44 L36 90 L28 104 L24 92 L10 100 Z" fill="#9a3412" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Pelo: casquete con flequillo de costado que cubre el borde de arriba */}
        <Layer top={-14} left={-8} w={116} h={50} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M0 46 L0 22 Q4 0 58 0 Q112 0 116 22 L116 46 Q104 34 92 40 Q80 22 62 30 Q44 18 26 34 Q14 30 0 46 Z" fill="#9a3412" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 14 Q44 6 64 8 M74 10 Q94 12 104 22" fill="none" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" />
        </Layer>
        {/* Diadema de plata con gema */}
        <Layer top={-12} left={18} w={64} h={24} className="z-30">
          <path d="M4 18 Q32 6 60 18" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path d="M4 18 Q32 6 60 18" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 2 L39 12 L32 20 L25 12 Z" fill="#3b82f6" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M31 6 L33 10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </Layer>
        {/* Trenza que cae por delante del hombro */}
        <Layer top={26} left={-10} w={24} h={92} className="z-20">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <ellipse key={i} cx={i % 2 ? 13 : 11} cy={8 + i * 12} rx="8" ry="8" fill="#9a3412" stroke={INK} strokeWidth="2.2" />
          ))}
          <rect x="6" y="76" width="12" height="5" rx="2" fill="#facc15" stroke={INK} strokeWidth="1.5" />
          <path d="M8 81 L6 90 L12 84 L18 90 L16 81 Z" fill="#9a3412" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        </Layer>
        {/* Hombrera de armadura */}
        <Layer top={48} left={90} w={32} h={28} className="z-30">
          <path d="M3 24 Q2 4 16 2 Q30 4 29 24 Z" fill="#cbd5e1" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M5 15 L27 15" stroke="#64748b" strokeWidth="2" />
          <circle cx="16" cy="9" r="2" fill="#facc15" stroke={INK} strokeWidth="1" />
        </Layer>
        {/* Espada al costado */}
        <Layer top={34} left={-34} w={26} h={92} className="z-10">
          <path d="M13 2 L18 10 L17 64 L9 64 L8 10 Z" fill="#e2e8f0" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M13 8 L13 60" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="1" y="64" width="24" height="6" rx="2" fill="#facc15" stroke={INK} strokeWidth="2" />
          <rect x="10" y="70" width="6" height="14" rx="1.5" fill="#7c2d12" stroke={INK} strokeWidth="1.8" />
          <circle cx="13" cy="87" r="3.5" fill="#facc15" stroke={INK} strokeWidth="1.8" />
        </Layer>
      </>
    ),
    // Mirada decidida, pintura de guerra y sonrisa confiada
    face: ({ eye }) => (
      <svg width="74" height="54" viewBox="0 0 74 54" className="mt-7">
        <path d="M8 6 L28 10 M66 6 L46 10" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        {[18, 56].map(cx => (
          <g key={cx}>
            <ellipse cx={cx} cy="20" rx="9" ry="9.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
            <circle cx={cx + eye.x * 0.6} cy={21 + eye.y * 0.5} r="5" fill="#1e3a8a" />
            <circle cx={cx + eye.x * 0.6} cy={21 + eye.y * 0.5} r="2.4" fill={INK} />
            <circle cx={cx - 2 + eye.x * 0.6} cy={18 + eye.y * 0.5} r="1.5" fill="#fff" />
            <path d={`M${cx - 10} 14 Q${cx} 6 ${cx + 10} 14`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
        {/* Pintura de guerra en las mejillas */}
        <path d="M4 34 L16 32 M5 39 L17 37 M70 34 L58 32 M69 39 L57 37" stroke="#dc2626" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M26 42 Q38 50 50 41" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },

  gaucha: {
    // Trenzas largas que salen de abajo del sombrero
    back: () => (
      <Layer top={6} left={-16} w={132} h={116}>
        {[10, 122].map(x => (
          <g key={x}>
            {[0, 1, 2, 3, 4, 5, 6].map(i => <ellipse key={i} cx={x + (i % 2 ? 2 : -2)} cy={8 + i * 12} rx="8" ry="8" fill="#3b2314" stroke={INK} strokeWidth="2.2" />)}
            <path d={`M${x - 6} 92 L${x + 6} 92 L${x + 8} 104 L${x} 98 L${x - 8} 104 Z`} fill="#dc2626" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          </g>
        ))}
      </Layer>
    ),
    front: () => (
      <>
        {/* Sombrero de ala ancha con una flor */}
        <Layer top={-28} left={-16} w={132} h={34} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M38 26 L40 6 Q66 0 92 6 L94 26 Z" fill="#1f1f1f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="39" y="17" width="54" height="7" fill="#b91c1c" stroke={INK} strokeWidth="2" />
          <rect x="2" y="24" width="128" height="8" rx="3" fill="#1f1f1f" stroke={INK} strokeWidth="3" />
          {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="88" cy="16" rx="4" ry="7" fill="#f472b6" stroke={INK} strokeWidth="1.2" transform={`rotate(${a} 88 20)`} />)}
          <circle cx="88" cy="20" r="3" fill="#facc15" stroke={INK} strokeWidth="1" />
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
        <div className="mt-3"><LashEyes eye={eye} /></div>
        <Cheeks />
        <Lips color="#dc2626" />
      </>
    ),
  },

  rapera: {
    // Pelo largo y lacio que cae debajo de la gorra
    back: () => (
      <Layer top={-6} left={-26} w={152} h={114}>
        <path d="M18 30 Q24 2 76 2 Q128 2 134 30 L142 108 L124 100 L118 40 L34 40 L28 100 L10 108 Z" fill="#111" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M16 50 L14 98 M136 50 L138 98" stroke="#2a2a2a" strokeWidth="2.2" strokeLinecap="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Gorra con visera de costado */}
        <Layer top={-24} left={2} w={124} h={34} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M8 30 Q10 2 50 2 Q90 2 92 30 Z" fill="#db2777" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M80 26 L120 21 Q124 29 118 32 L84 32 Z" fill="#9d174d" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="50" cy="5" r="3" fill={INK} />
        </Layer>
        {/* Aros grandes de oro */}
        {[-12, 98].map(left => (
          <Layer key={left} top={48} left={left} w={16} h={22} className="z-20">
            <circle cx="8" cy="12" r="7" fill="none" stroke={INK} strokeWidth="4.5" />
            <circle cx="8" cy="12" r="7" fill="none" stroke="#fbbf24" strokeWidth="2.4" />
          </Layer>
        ))}
        {/* Cadena de oro con medalla */}
        <Layer top={72} left={18} w={64} h={40} className="z-20">
          <path d="M4 2 Q32 30 60 2" fill="none" stroke={INK} strokeWidth="6" />
          <path d="M4 2 Q32 30 60 2" fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="4 2" />
          <circle cx="32" cy="27" r="10" fill="#fbbf24" stroke={INK} strokeWidth="2.5" />
          <path d="M28 33 L28 22 L37 20 L37 31" fill="none" stroke={INK} strokeWidth="2" />
          <circle cx="26" cy="33" r="2.4" fill={INK} />
          <circle cx="35" cy="31" r="2.4" fill={INK} />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <div className="flex flex-col items-center -mt-2">
        <ThinBrows tilt={-6} />
        <div className="mt-1"><LashEyes eye={eye} lids /></div>
        <Lips color="#be185d" smirk />
      </div>
    ),
  },

  turra: {
    // Pelo largo y planchado, atado bien atrás
    back: () => (
      <Layer top={-4} left={-24} w={148} h={112}>
        <path d="M16 28 Q22 2 74 2 Q126 2 132 28 L138 106 L122 98 L116 36 L32 36 L26 98 L10 106 Z" fill="#3b2314" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M14 46 L12 96 M134 46 L136 96" stroke="#5a3a22" strokeWidth="2.2" strokeLinecap="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Gorra plana con la visera levantada, torcida */}
        <Layer top={-33} left={6} w={96} h={36} className="z-20" style={{ transform: 'rotate(-7deg)', filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M12 30 Q14 4 48 4 Q82 4 84 30 Z" fill="#111" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="38" y="12" width="20" height="9" rx="2" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <path d="M4 26 L92 21 L94 30 L6 34 Z" fill="#111" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M8 31 L91 27" stroke="#ec4899" strokeWidth="2" />
          <circle cx="70" cy="26" r="3" fill="#fbbf24" stroke={INK} strokeWidth="1" />
        </Layer>
        {/* Aros de plata */}
        {[-11, 97].map(left => (
          <Layer key={left} top={48} left={left} w={14} h={20} className="z-20">
            <circle cx="7" cy="11" r="6" fill="none" stroke={INK} strokeWidth="4" />
            <circle cx="7" cy="11" r="6" fill="none" stroke="#e5e7eb" strokeWidth="2" />
          </Layer>
        ))}
        {/* Cadenita de plata con corazón */}
        <Layer top={74} left={26} w={48} h={30} className="z-20">
          <path d="M2 2 Q24 20 46 2" fill="none" stroke={INK} strokeWidth="4.5" />
          <path d="M2 2 Q24 20 46 2" fill="none" stroke="#e5e7eb" strokeWidth="2.5" strokeDasharray="3 2" />
          <path d="M24 26 L17 19 Q14 14 19 12 Q22 11 24 15 Q26 11 29 12 Q34 14 31 19 Z" fill="#e5e7eb" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <div className="flex flex-col items-center -mt-2">
        {/* Ceja con corte y otra levantada */}
        <div className="flex gap-4 w-full justify-center">
          <div className="flex gap-[3px]" style={{ transform: 'rotate(8deg)' }}>
            <div className="w-3 h-1 bg-black rounded-full" />
            <div className="w-2 h-1 bg-black rounded-full" />
          </div>
          <div className="w-6 h-1 bg-black rounded-full" style={{ transform: 'rotate(-14deg) translateY(-2px)' }} />
        </div>
        <div className="mt-1"><LashEyes eye={eye} lids /></div>
        <Lips color="#9d174d" smirk />
      </div>
    ),
  },

  grungera: {
    // Pelo largo y desprolijo, con raíces oscuras
    back: () => (
      <Layer top={-6} left={-30} w={160} h={124}>
        <path d="M26 26 Q40 0 80 2 Q120 0 134 26 L146 104 L132 96 L130 118 L116 98 L112 50 L48 50 L44 98 L30 118 L28 96 L14 104 Z" fill="#ca8a04" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 50 L18 96 M138 50 L142 96 M32 60 L30 104 M128 60 L130 104" stroke="#a16207" strokeWidth="2.5" strokeLinecap="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Gorro de lana */}
        <Layer top={-30} left={-6} w={112} h={46} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M8 34 Q8 2 56 2 Q104 2 104 34 Z" fill="#7f1d1d" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="4" y="30" width="104" height="12" rx="3" fill="#991b1b" stroke={INK} strokeWidth="3" />
          <path d="M20 31 L20 41 M32 31 L32 41 M44 31 L44 41 M56 31 L56 41 M68 31 L68 41 M80 31 L80 41 M92 31 L92 41" stroke="#7f1d1d" strokeWidth="2" />
        </Layer>
        {/* Mechones que caen sobre la cara */}
        <Layer top={10} left={-4} w={108} h={36} className="z-20">
          <path d="M2 0 L12 34 L20 4 Z M88 4 L96 34 L106 0 Z" fill="#ca8a04" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </Layer>
      </>
    ),
    face: ({ eye }) => (
      <>
        {/* Delineado corrido y párpados caídos */}
        <div className="mt-5 relative">
          <LashEyes eye={eye} lids />
          <div className="absolute -bottom-1.5 left-0 right-0 flex gap-3 justify-center opacity-60" aria-hidden="true">
            <div className="w-7 h-1.5 bg-black rounded-full blur-[1px]" />
            <div className="w-7 h-1.5 bg-black rounded-full blur-[1px]" />
          </div>
        </div>
        {/* Arito en la nariz y boca apática oscura */}
        <svg width="40" height="22" viewBox="0 0 40 22" className="mt-1">
          <circle cx="26" cy="5" r="3" fill="none" stroke="#d1d5db" strokeWidth="2" />
          <path d="M10 15 Q20 13 30 15 Q20 19 10 15 Z" fill="#4c0519" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </>
    ),
  },

  dama: {
    // Penacho carmesí que cae hacia atrás desde la cresta del yelmo
    back: () => (
      <>
      {/* Trenza rubia que asoma por debajo del yelmo */}
      <Layer top={70} left={86} w={30} h={66}>
        {[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={i % 2 ? 16 : 13} cy={8 + i * 11} rx="8" ry="7.5" fill="#facc15" stroke={INK} strokeWidth="2.2" />)}
        <rect x="8" y="56" width="12" height="5" rx="2" fill="#86198f" stroke={INK} strokeWidth="1.5" />
      </Layer>
      <Layer top={-58} left={-30} w={120} h={110}>
        <path d="M86 40 Q70 0 34 6 Q8 12 2 44 Q16 26 30 30 Q12 44 10 74 Q26 52 40 52 Q30 70 34 98 Q46 70 60 62 Q60 50 86 40 Z" fill="#86198f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M70 26 Q48 18 26 32 M64 44 Q42 44 24 62 M58 56 Q46 66 40 84" fill="none" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" />
      </Layer>
      </>
    ),
    front: ({ eye }) => (
      <>
        {/* Hombreras */}
        {[-24, 96].map(left => (
          <Layer key={left} top={52} left={left} w={30} h={24} className="z-20">
            <path d="M3 22 Q2 4 15 2 Q28 4 27 22 Z" fill="url(#dama-steel)" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M6 14 L24 14" stroke="#64748b" strokeWidth="2" />
          </Layer>
        ))}
        {/* Yelmo cerrado, un poco más grande que el cuerpo */}
        <Layer top={-30} left={-14} w={128} h={132} className="z-20" style={{ filter: 'drop-shadow(4px 4px 0 #000)' }}>
          <defs>
            <linearGradient id="dama-steel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#94a3b8" />
              <stop offset="0.35" stopColor="#e2e8f0" />
              <stop offset="0.6" stopColor="#cbd5e1" />
              <stop offset="1" stopColor="#64748b" />
            </linearGradient>
          </defs>
          {/* Cuerpo del yelmo: cúpula y mejillas que bajan */}
          <path d="M10 124 L8 50 Q10 6 64 4 Q118 6 120 50 L118 124 Q64 132 10 124 Z" fill="url(#dama-steel)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          {/* Cresta central */}
          <path d="M64 4 L64 44" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 6 L60 44 M68 6 L68 44" stroke="#64748b" strokeWidth="1.5" />
          {/* Banda de la frente con remaches */}
          <path d="M9 40 Q64 30 119 40 L119 48 Q64 38 9 48 Z" fill="#475569" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          {[18, 40, 64, 88, 110].map(x => <circle key={x} cx={x} cy={x === 64 ? 37 : 41} r="2.4" fill="#e2e8f0" stroke={INK} strokeWidth="1" />)}
          {/* Ranura de la visera con ojos que brillan */}
          <path d="M14 56 Q64 50 114 56 L114 68 Q64 62 14 68 Z" fill="#0b0b0f" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <ellipse cx={42 + eye.x * 0.9} cy={61 + eye.y * 0.4} rx="4" ry="3" fill="#f0abfc" style={{ filter: 'drop-shadow(0 0 4px #d946ef)' }} /><path d={`M${35 + eye.x * 0.9} 57 L${32 + eye.x * 0.9} 54 M${38 + eye.x * 0.9} 56 L${37 + eye.x * 0.9} 53`} stroke="#f0abfc" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx={86 + eye.x * 0.9} cy={61 + eye.y * 0.4} rx="4" ry="3" fill="#f0abfc" style={{ filter: 'drop-shadow(0 0 4px #d946ef)' }} /><path d={`M${93 + eye.x * 0.9} 57 L${96 + eye.x * 0.9} 54 M${90 + eye.x * 0.9} 56 L${91 + eye.x * 0.9} 53`} stroke="#f0abfc" strokeWidth="1.4" strokeLinecap="round" />
          {/* Arista de la visera */}
          <path d="M64 68 L64 122" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          {/* Agujeros para respirar, en cruz a cada lado */}
          {[[30, 82], [38, 82], [30, 92], [38, 92], [30, 102], [90, 82], [98, 82], [90, 92], [98, 92], [98, 102]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" fill="#0b0b0f" />
          ))}
          {/* Borde inferior con remaches */}
          <path d="M11 116 Q64 124 117 116" fill="none" stroke="#475569" strokeWidth="4" />
          {[22, 44, 64, 84, 106].map(x => <circle key={x} cx={x} cy={x === 64 ? 120 : 118} r="2.2" fill="#e2e8f0" stroke={INK} strokeWidth="1" />)}
          {/* Brillo del metal */}
          <path d="M24 22 Q34 12 50 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </Layer>
      </>
    ),
    // La cara la tapa el yelmo
    face: () => null,
  },

  maga: {
    // Maga: sombrero puntiagudo con estrellas, pelo plateado largo y bastón con orbe
    back: () => (
      <Layer top={-4} left={-22} w={144} h={128}>
        <path d="M20 30 Q26 2 72 2 Q118 2 124 30 L134 124 L118 112 L112 126 L102 106 L98 44 L46 44 L42 106 L32 126 L26 112 L10 124 Z" fill="#e2e8f0" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 54 L18 112 M122 54 L126 112 M34 64 L32 116 M110 64 L112 116" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
      </Layer>
    ),
    front: () => (
      <>
        {/* Sombrero: el ala tapa todo el borde de arriba de la caja */}
        <Layer top={-64} left={-16} w={132} h={84} className="z-20" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }}>
          <path d="M30 66 Q46 34 60 10 Q68 -2 84 4 L78 12 Q76 30 100 66 Z" fill="#312e81" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 58 Q66 50 96 58 L98 66 Q66 58 32 66 Z" fill="#db2777" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M2 70 Q66 54 130 70 Q66 86 2 70 Z" fill="#312e81" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {/* Estrellas y luna */}
          <path d="M58 30 L60 35 L65 35 L61 38 L62 43 L58 40 L54 43 L55 38 L51 35 L56 35 Z" fill="#fde047" />
          <path d="M76 44 L77 47 L80 47 L78 49 L79 52 L76 50 L73 52 L74 49 L72 47 L75 47 Z" fill="#fde047" />
          <path d="M48 50 A5 5 0 1 0 52 42 A4 4 0 1 1 48 50 Z" fill="#fde047" />
        </Layer>
        {/* Bastón con orbe que brilla */}
        <Layer top={-18} left={98} w={28} h={132} className="z-30">
          <path d="M14 26 L12 130" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <path d="M14 26 L12 130" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
          <path d="M6 28 Q14 18 22 28" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
          <circle cx="14" cy="14" r="10" fill="#f0abfc" stroke={INK} strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 7px #e879f9)' }} />
          <circle cx="11" cy="11" r="3" fill="#fff" opacity="0.85" />
        </Layer>
      </>
    ),
    // Mirada tranquila con pestañas, rubor y sonrisa sabia
    face: ({ eye }) => (
      <div className="flex flex-col items-center mt-2">
        <ThinBrows tilt={-4} />
        <div className="mt-1"><LashEyes eye={eye} lids /></div>
        <Cheeks />
        <Lips color="#be185d" />
      </div>
    ),
  },
}
