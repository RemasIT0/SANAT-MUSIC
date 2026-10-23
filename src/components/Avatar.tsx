// src/components/Avatar.tsx
import { useState } from 'react'

interface AvatarProps {
  url: string | null
  name: string
  color: string
  size?: number
  isOnline?: boolean
}

export default function Avatar({ url, name, color, size = 50, isOnline = false }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (url && !imgError) {
    return (
      <div className="relative inline-block">
        <img
          src={url}
          alt={name}
          className="rounded-full object-cover border-2 border-gray-700/50"
          style={{ width: size, height: size }}
          onError={() => setImgError(true)}
        />
        {isOnline && (
          <span 
            className="absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-[#0f0f0f] animate-pulse"
            style={{ 
              width: Math.max(size * 0.3, 14), 
              height: Math.max(size * 0.3, 14),
              zIndex: 10
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative inline-block">
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
      {isOnline && (
        <span 
          className="absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-[#0f0f0f] animate-pulse"
          style={{ 
            width: Math.max(size * 0.3, 14), 
            height: Math.max(size * 0.3, 14),
             zIndex: 10          }}
        />
      )}
    </div>
  )
}