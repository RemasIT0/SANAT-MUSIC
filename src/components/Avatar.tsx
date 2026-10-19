// src/components/Avatar.tsx
import { useState } from 'react'

interface AvatarProps {
  url: string | null
  name: string
  color: string
  size?: number
}

export default function Avatar({ url, name, color, size = 50 }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  
  // Obtener las iniciales del nombre (ej: "Juan Perez" -> "JP")
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Si hay URL y la imagen no ha fallado al cargar, mostramos la foto
  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover border-2 border-gray-700/50"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)} // Si la imagen falla, cambiamos el estado para mostrar el fallback
      />
    )
  }

  // Si NO hay URL o la imagen falló, mostramos el círculo con iniciales y el color de la mascota
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold border-2 border-gray-700/50 select-none"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: color,
        fontSize: size * 0.4 // El texto se ajusta automáticamente al tamaño
      }}
    >
      {initials || '?'}
    </div>
  )
}