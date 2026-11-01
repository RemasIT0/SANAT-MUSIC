// src/components/free/FreeElementView.tsx
// Dibuja un elemento del perfil libre. Lo usan el editor y la vista pública.
import type { CSSProperties } from 'react'
import type { Profile } from '../../types'
import { FONTS, STICKERS, type FreeElement } from '../../types/freeLayout'
import Mascot from '../Mascot'
import { ProfileAudioPlayer } from '../ProfileAudio'
import {
  FaGuitar, FaMapMarkerAlt, FaUserFriends, FaLink, FaInstagram, FaYoutube, FaSpotify, FaTiktok, FaTwitter, FaImage,
} from 'react-icons/fa'

const SOCIAL_ICONS: Record<string, any> = { Instagram: FaInstagram, YouTube: FaYoutube, Spotify: FaSpotify, TikTok: FaTiktok, 'Twitter/X': FaTwitter }

const NO_PADDING = ['photo', 'image', 'sticker', 'mascot', 'box']

export function elementBoxStyle(el: FreeElement): CSSProperties {
  const s = el.style
  return {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    zIndex: el.z,
    background: s.bg,
    color: s.color,
    border: s.borderWidth > 0 ? `${s.borderWidth}px solid ${s.borderColor}` : 'none',
    borderRadius: Math.min(s.radius, Math.min(el.w, el.h) / 2),
    opacity: s.opacity,
    boxShadow: s.shadow ? '6px 6px 0 rgba(0,0,0,0.85)' : undefined,
    fontFamily: FONTS[s.font]?.css,
    fontSize: s.fontSize,
    textAlign: s.align,
    padding: NO_PADDING.includes(el.type) ? 0 : 14,
    overflow: 'hidden',
    boxSizing: 'border-box',
  }
}

export default function FreeElementView({ el, profile, friendsCount, interactive = true }: {
  el: FreeElement
  profile: Profile | null
  friendsCount: number
  interactive?: boolean
}) {
  const chip = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(128,128,128,0.18)] border border-[rgba(128,128,128,0.4)] m-1 text-[0.8em]'
  const accent = el.style.borderColor

  switch (el.type) {
    case 'name':
      return (
        <div className="h-full flex flex-col justify-center">
          <p className="leading-tight break-words">{profile?.display_name}</p>
          <p className="opacity-70 text-[0.4em] mt-1" style={{ fontFamily: FONTS.sans.css }}>@{profile?.username}</p>
        </div>
      )
    case 'photo':
      return profile?.avatar_url
        ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
        : <div className="w-full h-full flex items-center justify-center text-[3em] font-bold" style={{ backgroundColor: profile?.avatar_color || '#333' }}>{profile?.display_name?.[0]?.toUpperCase()}</div>
    case 'mascot': {
      const size = Math.max(20, Math.min(el.w * 0.7, (el.h - 20) * 0.75))
      return (
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <Mascot color={profile?.avatar_color || '#a855f7'} size={size} expression={profile?.expression || 'normal'} />
        </div>
      )
    }
    case 'bio':
      return <p className="whitespace-pre-wrap break-words leading-relaxed">{profile?.bio || 'Sin biografía todavía.'}</p>
    case 'instruments':
      return (
        <div className="flex flex-wrap -m-1">
          {profile?.instruments?.length
            ? profile.instruments.map((inst, i) => <span key={i} className={chip}><FaGuitar style={{ color: accent }} /> {inst.name} <span className="opacity-60">· {inst.level}</span></span>)
            : <span className="opacity-60">Sin instrumentos</span>}
        </div>
      )
    case 'genres':
      return (
        <div className="flex flex-wrap -m-1">
          {profile?.genres?.length
            ? profile.genres.map((g, i) => <span key={i} className={chip}>#{g}</span>)
            : <span className="opacity-60">Sin géneros</span>}
        </div>
      )
    case 'location':
      return <p className="h-full flex items-center gap-2"><FaMapMarkerAlt style={{ color: accent }} className="flex-shrink-0" /> {profile?.localidad || 'Sin ubicación'}{profile?.departamento ? `, ${profile.departamento}` : ''}</p>
    case 'friends':
      return <p className="h-full flex items-center gap-2"><FaUserFriends style={{ color: accent }} className="flex-shrink-0" /> {friendsCount} {friendsCount === 1 ? 'amigo' : 'amigos'}</p>
    case 'audio':
      return profile?.audio_url
        ? <div className={interactive ? '' : 'pointer-events-none'} style={{ fontFamily: FONTS.sans.css, fontSize: 14 }}><ProfileAudioPlayer url={profile.audio_url} name={profile.display_name} color={accent} /></div>
        : <p className="opacity-60 h-full flex items-center">🎤 Todavía no subiste un audio (se sube en "Editar datos").</p>
    case 'social':
      return (
        <div className="flex flex-wrap -m-1">
          {el.links?.length
            ? el.links.map((link, i) => {
                const Icon = SOCIAL_ICONS[link.platform] || FaLink
                return interactive
                  ? <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={`${chip} hover:bg-white/20`}><Icon /> {link.platform}</a>
                  : <span key={i} className={chip}><Icon /> {link.platform}</span>
              })
            : <span className="opacity-60 flex items-center gap-2"><FaLink /> Agregá tus redes</span>}
        </div>
      )
    case 'text':
      return <p className="whitespace-pre-wrap break-words leading-snug">{el.content}</p>
    case 'image':
      return el.content
        ? <img src={el.content} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
        : <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-60 bg-white/5"><FaImage size={32} /><span className="text-sm">Subí una imagen</span></div>
    case 'sticker': {
      const sticker = STICKERS[el.content || 'estrella']
      const size = Math.min(el.w, el.h) * 0.8
      return (
        <div className="w-full h-full flex items-center justify-center leading-none select-none" style={{ fontSize: size }}>
          {sticker ? <sticker.icon size={size} color={el.style.color} /> : el.content}
        </div>
      )
    }
    case 'box':
    default:
      return null
  }
}
