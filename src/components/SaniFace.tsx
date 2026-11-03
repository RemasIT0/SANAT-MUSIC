// src/components/SaniFace.tsx
// Cara de Sani para la cabecera del asistente: solo el rostro, con aire intelectual
// y soberbio (ceja levantada, párpados caídos, monóculo y sonrisa de costado).
export default function SaniFace({ color = '#a855f7', size = 40 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Sani, el asistente">
      {/* Cabeza cuadrada como la mascota, apenas inclinada con el mentón arriba */}
      <g transform="rotate(-6 32 34)">
        <rect x="7" y="9" width="50" height="50" rx="5" fill={color} stroke="#000" strokeWidth="3.5" />

        {/* Cejas: una bien levantada (soberbia), la otra baja y recta */}
        <path d="M14 21 Q20 13 27 17" fill="none" stroke="#000" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M37 22 L49 21" stroke="#000" strokeWidth="3.2" strokeLinecap="round" />

        {/* Ojo izquierdo: párpado caído, mirada de costado */}
        <rect x="14" y="24" width="13" height="11" rx="2" fill="#fff" stroke="#000" strokeWidth="2.5" />
        <rect x="21" y="28" width="5" height="5" rx="1" fill="#000" />
        <rect x="14" y="24" width="13" height="5" fill="#000" />

        {/* Ojo derecho con monóculo y cadenita */}
        <rect x="37" y="24" width="13" height="11" rx="2" fill="#fff" stroke="#000" strokeWidth="2.5" />
        <rect x="44" y="28" width="5" height="5" rx="1" fill="#000" />
        <rect x="37" y="24" width="13" height="4" fill="#000" />
        <circle cx="43.5" cy="29.5" r="9.5" fill="rgba(255,255,255,0.18)" stroke="#facc15" strokeWidth="2.2" />
        <circle cx="43.5" cy="29.5" r="9.5" fill="none" stroke="#000" strokeWidth="0.8" />
        <path d="M46 26 L49 23" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
        <path d="M52 34 Q56 44 50 54" fill="none" stroke="#facc15" strokeWidth="1.6" strokeDasharray="2 1.6" />

        {/* Sonrisa de costado, satisfecha consigo misma */}
        <path d="M22 47 Q32 49 41 43" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        <path d="M41 43 L43 41" stroke="#000" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  )
}
