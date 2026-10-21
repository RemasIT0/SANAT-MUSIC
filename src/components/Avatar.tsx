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
  
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (url && !imgError) {
    return (
      <img
        src={url} // ✅ Sin el ?t=${Date.now()}, ahora el navegador usará el caché y será instantáneo
        alt={name}
        className="rounded-full object-cover border-2 border-gray-700/50"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold border-2 border-gray-700/50 select-none"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: color,
        fontSize: size * 0.4
      }}
    >
      {initials || '?'}
    </div>
  )
}