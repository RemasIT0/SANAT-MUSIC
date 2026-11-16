// src/components/AnimatedBackground.tsx
// Fondo de casi todas las pantallas: un CD negro con colmillos impresos en blanco,
// girando despacio. La mandíbula "muerde" lento y el borde plateado refleja la luz.
import { useMemo } from 'react'

const BONE = '#e9e6e1'

// ---------- Dientes (dibujados en un lienzo de 1000 x 1000, centro en 500,500) ----------

// Diente cuadrado de punta redondeada; "up" = la punta mira hacia arriba
function tooth(x: number, w: number, base: number, tip: number) {
  const up = tip < base
  const r = Math.min(14, w / 3)
  const t = up ? tip + r : tip - r
  return `M${x} ${base} L${x} ${t} Q${x} ${tip} ${x + r} ${tip} L${x + w - r} ${tip} Q${x + w} ${tip} ${x + w} ${t} L${x + w} ${base} Z`
}

// Colmillo largo y curvo que termina en punta
function fang(x: number, w: number, base: number, tip: number, lean: number) {
  const mid = (base + tip) / 2
  return `M${x} ${base} C${x - 2} ${mid} ${x + w * 0.3 + lean} ${tip - (tip - base) * 0.12} ${x + w * 0.5 + lean} ${tip} C${x + w * 0.7 + lean} ${tip - (tip - base) * 0.2} ${x + w + 2} ${mid} ${x + w} ${base} Z`
}

// Arriba: la encía sigue una curva suave; abajo, lo mismo dado vuelta
const gumTop = (x: number) => 178 + ((x - 500) / 170) ** 2 * 26
const gumBottom = (x: number) => 828 - ((x - 500) / 170) ** 2 * 30

const UPPER = [
  ...[0, 1, 2, 3, 4, 5].map(i => { const x = 346 + i * 52; return tooth(x, 46, gumTop(x + 23), gumTop(x + 23) + 92 - Math.abs(i - 2.5) * 6) }),
  fang(284, 52, gumTop(310) - 4, 476, 6),
  fang(664, 52, gumTop(690) - 4, 476, -6),
  tooth(222, 50, gumTop(247) + 8, gumTop(247) + 118),
  tooth(728, 50, gumTop(753) + 8, gumTop(753) + 118),
  tooth(160, 46, gumTop(183) + 30, gumTop(183) + 120),
  tooth(794, 46, gumTop(817) + 30, gumTop(817) + 120),
]
const LOWER = [
  ...[0, 1, 2, 3, 4].map(i => { const x = 372 + i * 52; return tooth(x, 46, gumBottom(x + 23), gumBottom(x + 23) - 86 + Math.abs(i - 2) * 6) }),
  fang(298, 50, gumBottom(323) + 4, 560, 8),
  fang(652, 50, gumBottom(677) + 4, 560, -8),
  tooth(232, 50, gumBottom(257) - 6, gumBottom(257) - 112),
  tooth(718, 50, gumBottom(743) - 6, gumBottom(743) - 112),
  tooth(172, 44, gumBottom(194) - 30, gumBottom(194) - 116),
  tooth(784, 44, gumBottom(806) - 30, gumBottom(806) - 116),
]

const layer = 'absolute inset-0 w-full h-full'

// Bordes gastados, como serigrafía (cada mandíbula es su propia capa: el filtro se dibuja una sola vez)
function Jaw({ id, paths, className }: { id: string; paths: string[]; className: string }) {
  return (
    <svg viewBox="0 0 1000 1000" className={`${layer} ${className}`} aria-hidden="true">
      <defs>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="ruido" />
          <feDisplacementMap in="SourceGraphic" in2="ruido" scale="12" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill={BONE}>{paths.map((d, i) => <path key={i} d={d} />)}</g>
    </svg>
  )
}

function FangDisc() {
  return (
    <div className="relative w-full h-full">
      {/* Disco negro, borde plateado y salpicado de tinta */}
      <svg viewBox="0 0 1000 1000" className={layer} aria-hidden="true">
        <defs>
          <filter id="cd-salpicado">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
            <feColorMatrix values="0 0 0 0 0.91  0 0 0 0 0.9  0 0 0 0 0.88  0 0 0 26 -18.2" />
          </filter>
          <clipPath id="cd-boca"><ellipse cx="500" cy="500" rx="370" ry="360" /></clipPath>
        </defs>
        <circle cx="500" cy="500" r="494" fill="#050505" />
        <circle cx="500" cy="500" r="490" fill="none" stroke="#d4d4d8" strokeWidth="4" />
        <circle cx="500" cy="500" r="481" fill="none" stroke="#6b6b70" strokeWidth="2" />
        <rect x="120" y="120" width="760" height="760" filter="url(#cd-salpicado)" clipPath="url(#cd-boca)" opacity="0.7" />
      </svg>
      {/* Mandíbulas: muerden despacio */}
      <Jaw id="cd-gastado-arriba" paths={UPPER} className="cd-mandibula-arriba" />
      <Jaw id="cd-gastado-abajo" paths={LOWER} className="cd-mandibula-abajo" />
      {/* Centro del CD */}
      <svg viewBox="0 0 1000 1000" className={layer} aria-hidden="true">
        <defs>
          <radialGradient id="cd-centro" cx="45%" cy="40%" r="65%">
            <stop offset="0" stopColor="#b9b9be" />
            <stop offset="1" stopColor="#77777c" />
          </radialGradient>
        </defs>
        <circle cx="500" cy="500" r="128" fill="#d4d4d8" />
        <circle cx="500" cy="500" r="122" fill="url(#cd-centro)" />
        <circle cx="500" cy="500" r="92" fill="none" stroke="#5f5f64" strokeWidth="3" />
        <circle cx="500" cy="500" r="80" fill="none" stroke="#a1a1a6" strokeWidth="1.5" />
        <circle cx="500" cy="500" r="56" fill="#0b0b0b" stroke="#3f3f44" strokeWidth="2" />
      </svg>
    </div>
  )
}

export default function AnimatedBackground() {
  // Posiciones fijas (no cambian en cada render)
  const motas = useMemo(() => Array.from({ length: 15 }, () => ({ left: Math.random() * 100, top: Math.random() * 100, delay: Math.random() * 3 })), [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0f0f0f]">
      {/* Gradiente base oscuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0a0a0a]" />

      {/* CD con colmillos */}
      <div className="cd-fondo absolute top-1/2 left-1/2 w-[min(85vw,800px)] h-[min(85vw,800px)] -translate-x-1/2 -translate-y-1/2">
        <div className="cd-giro w-full h-full rounded-full shadow-2xl shadow-black/60">
          <FangDisc />
        </div>
        {/* Reflejo del borde: queda quieto mientras el disco gira */}
        <div className="cd-reflejo absolute inset-0 rounded-full pointer-events-none" />
        {/* Velo para que el contenido se lea encima */}
        <div className="absolute inset-0 rounded-full bg-[#0f0f0f]/45 pointer-events-none" />
      </div>

      {/* Partículas brillantes sutiles */}
      {motas.map((m, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-gray-400 rounded-full animate-twinkle"
          style={{ left: `${m.left}%`, top: `${m.top}%`, animationDelay: `${m.delay}s`, opacity: 0.2 }}
        />
      ))}
    </div>
  )
}
