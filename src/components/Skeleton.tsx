// src/components/Skeleton.tsx
// Esqueletos de carga: formas grises animadas con la forma del contenido que viene.
// Se sienten más rápidos que un spinner porque anticipan cómo va a quedar la pantalla.

export function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-[#262626] rounded-md animate-pulse ${className}`} />
}

// Tarjeta de publicación del feed
export function PostSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 space-y-3" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Bone className="w-11 h-11 rounded-full" />
        <div className="flex-1 space-y-2"><Bone className="h-3.5 w-1/3" /><Bone className="h-3 w-1/4" /></div>
      </div>
      <Bone className="h-3 w-full" /><Bone className="h-3 w-5/6" /><Bone className="h-3 w-2/3" />
      <div className="flex gap-2 pt-1"><Bone className="h-6 w-20 rounded-full" /><Bone className="h-6 w-16 rounded-full" /></div>
    </div>
  )
}

// Fila de conversación / amigo
export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl" aria-hidden="true">
      <Bone className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2"><Bone className="h-3.5 w-2/5" /><Bone className="h-3 w-4/5" /></div>
    </div>
  )
}

// Cabecera de perfil
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-4xl mx-auto pt-16" aria-label="Cargando perfil">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <Bone className="w-24 h-24 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2"><Bone className="h-6 w-1/2" /><Bone className="h-3.5 w-1/3" /><Bone className="h-3 w-2/5" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2"><Bone className="h-10" /><Bone className="h-10" /></div>
        <Bone className="h-3 w-full" /><Bone className="h-3 w-4/5" />
      </div>
      <PostSkeleton />
    </div>
  )
}

// Burbujas de chat
export function ChatSkeleton() {
  const rows = [['w-2/3', false], ['w-1/2', true], ['w-3/5', false], ['w-1/3', true], ['w-1/2', false]] as const
  return (
    <div className="space-y-3 py-4" aria-label="Cargando mensajes">
      {rows.map(([width, mine], i) => (
        <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><Bone className={`h-12 rounded-2xl ${width}`} /></div>
      ))}
    </div>
  )
}
