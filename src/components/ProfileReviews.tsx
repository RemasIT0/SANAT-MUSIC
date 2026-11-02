// src/components/ProfileReviews.tsx
// Reseñas de un perfil: etiquetas ("Puntual", "Buen músico"...) y comentarios.
// Solo puede reseñar quien chateó con la persona (lo verifica la base).
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useDialog } from './DialogProvider'
import Avatar from './Avatar'
import type { IconType } from 'react-icons'
import { FaClock, FaGuitar, FaSmile, FaCheckDouble, FaLightbulb, FaStar, FaPen, FaTimes, FaSpinner, FaTrash, FaReply } from 'react-icons/fa'

export const REVIEW_TAGS: Record<string, { label: string; icon: IconType; color: string }> = {
  puntual: { label: 'Puntual', icon: FaClock, color: '#22d3ee' },
  buen_musico: { label: 'Buen músico', icon: FaGuitar, color: '#a855f7' },
  buena_onda: { label: 'Buena onda', icon: FaSmile, color: '#facc15' },
  responsable: { label: 'Responsable', icon: FaCheckDouble, color: '#22c55e' },
  creativo: { label: 'Creativo', icon: FaLightbulb, color: '#f97316' },
  profesional: { label: 'Profesional', icon: FaStar, color: '#ec4899' },
}

interface Review { id: string; reviewer_id: string; tags: string[]; comment: string; created_at: string; reply?: string | null; replied_at?: string | null; reviewer?: any }

export default function ProfileReviews({ profileId, profileName, themeColor }: { profileId: string; profileName: string; themeColor: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { confirm } = useDialog()
  const [reviews, setReviews] = useState<Review[]>([])
  const [available, setAvailable] = useState(true)
  const [canReview, setCanReview] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Respuesta del dueño del perfil
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySaving, setReplySaving] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [repliesEnabled, setRepliesEnabled] = useState(true)

  const isMine = user?.id === profileId
  const myReview = reviews.find(r => r.reviewer_id === user?.id)

  const load = async () => {
    let { data, error }: { data: any[] | null; error: any } = await supabase.from('user_reviews').select('id, reviewer_id, tags, comment, created_at, reply, replied_at').eq('reviewed_id', profileId).order('created_at', { ascending: false })
    // Si todavía no se corrió el SQL de respuestas, se cargan sin ellas
    if (error && /reply/.test(error.message)) {
      setRepliesEnabled(false)
      ;({ data, error } = await supabase.from('user_reviews').select('id, reviewer_id, tags, comment, created_at').eq('reviewed_id', profileId).order('created_at', { ascending: false }))
    }
    if (error) { setAvailable(false); return }
    const ids = [...new Set((data || []).map(r => r.reviewer_id))]
    const { data: reviewers } = ids.length ? await supabase.from('profiles').select('id, display_name, avatar_url, avatar_color').in('id', ids) : { data: [] as any[] }
    setReviews((data || []).map(r => ({ ...r, reviewer: reviewers?.find(p => p.id === r.reviewer_id) })))
  }

  useEffect(() => {
    load()
    if (user && !isMine) {
      supabase.rpc('have_chatted', { a: user.id, b: profileId }).then(({ data }) => setCanReview(!!data))
    }
  }, [profileId, user])

  const openForm = () => {
    setTags(myReview?.tags || [])
    setComment(myReview?.comment || '')
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    if (!user || !tags.length) return
    setSaving(true)
    setError('')
    const payload = { reviewer_id: user.id, reviewed_id: profileId, tags, comment: comment.trim(), updated_at: new Date().toISOString() }
    const { error } = await supabase.from('user_reviews').upsert(payload, { onConflict: 'reviewer_id,reviewed_id' })
    setSaving(false)
    if (error) { setError(/row-level security|policy/i.test(error.message) ? 'Solo podés reseñar a alguien con quien hayan chateado los dos.' : 'No se pudo guardar la reseña.'); return }
    setShowForm(false)
    load()
  }

  const remove = async () => {
    if (!myReview || !(await confirm({ title: '¿Borrar tu reseña?', confirmLabel: 'Borrar', danger: true }))) return
    await supabase.from('user_reviews').delete().eq('id', myReview.id)
    setShowForm(false)
    load()
  }

  const startReply = (r: Review) => {
    setReplyingId(r.id)
    setReplyText(r.reply || '')
    setReplyError('')
  }

  const saveReply = async (r: Review, text: string) => {
    if (replySaving) return
    setReplySaving(true)
    setReplyError('')
    const { error } = await supabase.rpc('reply_to_review', { p_review: r.id, p_reply: text })
    setReplySaving(false)
    if (error) { setReplyError(/reply_to_review/.test(error.message) ? 'Falta activar las respuestas en Supabase (SQL de la etapa 4).' : 'No se pudo guardar la respuesta.'); return }
    setReplyingId(null)
    load()
  }

  const deleteReply = async (r: Review) => {
    if (!(await confirm({ title: '¿Borrar tu respuesta?', confirmLabel: 'Borrar', danger: true }))) return
    saveReply(r, '')
  }

  if (!available) return null

  // Cantidad de veces que se eligió cada etiqueta
  const tagCounts = Object.keys(REVIEW_TAGS)
    .map(key => ({ key, count: reviews.filter(r => r.tags.includes(key)).length }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count)
  const withComments = reviews.filter(r => r.comment || r.reply).slice(0, isMine ? 20 : 5)

  if (!reviews.length && (isMine || !canReview)) return null

  return (
    <section className="bg-[#1a1a1a] border rounded-2xl p-4 md:p-5" style={{ borderColor: themeColor + '40' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-white font-semibold">Reseñas {reviews.length > 0 && <span className="text-gray-400 font-normal text-sm">({reviews.length})</span>}</h3>
        {!isMine && canReview && (
          <button onClick={openForm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90" style={{ backgroundColor: themeColor }}>
            <FaPen size={10} /> {myReview ? 'Editar mi reseña' : 'Dejar reseña'}
          </button>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400">Todavía nadie reseñó a {profileName}. Como ya chatearon, podés ser el primero.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {tagCounts.map(({ key, count }) => {
              const tag = REVIEW_TAGS[key]
              return (
                <span key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0f0f0f] border border-[#2a2a2a] text-xs text-gray-100">
                  <tag.icon style={{ color: tag.color }} size={12} /> {tag.label} <span className="text-gray-400">×{count}</span>
                </span>
              )
            })}
          </div>
          {withComments.length > 0 && (
            <ul className="space-y-2">
              {withComments.map(r => (
                <li key={r.id} className="flex gap-2.5">
                  <button onClick={() => navigate(`/perfil/${r.reviewer_id}`)} className="flex-shrink-0" aria-label={r.reviewer?.display_name}>
                    <Avatar url={r.reviewer?.avatar_url || null} name={r.reviewer?.display_name || '?'} color={r.reviewer?.avatar_color || '#333'} size={30} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="bg-[#0f0f0f] rounded-xl px-3 py-2">
                      <p className="text-xs text-gray-400">{r.reviewer?.display_name || 'Usuario'} · {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
                      {r.comment && <p className="text-sm text-gray-100 break-words">{r.comment}</p>}
                    </div>

                    {/* Respuesta del dueño del perfil */}
                    {r.reply && replyingId !== r.id && (
                      <div className="mt-1.5 ml-3 pl-3 border-l-2 rounded-r-xl bg-[#0f0f0f]/60 py-1.5 pr-3" style={{ borderColor: themeColor }}>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1"><FaReply size={9} /> Respuesta de {profileName}</p>
                        <p className="text-sm text-gray-100 break-words">{r.reply}</p>
                        {isMine && (
                          <div className="flex gap-3 mt-1">
                            <button onClick={() => startReply(r)} className="text-[11px] text-gray-400 hover:text-white">Editar</button>
                            <button onClick={() => deleteReply(r)} className="text-[11px] text-gray-400 hover:text-red-300">Borrar</button>
                          </div>
                        )}
                      </div>
                    )}
                    {isMine && repliesEnabled && !r.reply && r.comment && replyingId !== r.id && (
                      <button onClick={() => startReply(r)} className="mt-1 ml-3 text-xs text-gray-400 hover:text-white flex items-center gap-1.5"><FaReply size={10} /> Responder</button>
                    )}
                    {replyingId === r.id && (
                      <div className="mt-1.5 ml-3">
                        <textarea value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 300))} rows={2} autoFocus placeholder={`Respondele a ${r.reviewer?.display_name || 'esta persona'}...`} className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-sm text-white resize-none focus:outline-none focus:border-purple-500 placeholder:text-gray-500" />
                        {replyError && <p className="text-xs text-red-400 mt-1">{replyError}</p>}
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-[11px] text-gray-500">{replyText.length}/300</span>
                          <div className="flex gap-2">
                            <button onClick={() => setReplyingId(null)} className="px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-[#2a2a2a]">Cancelar</button>
                            <button onClick={() => saveReply(r, replyText)} disabled={replySaving || !replyText.trim()} className="px-3 py-1.5 rounded-lg text-xs text-white font-semibold disabled:opacity-40 flex items-center gap-1.5" style={{ backgroundColor: themeColor }}>
                              {replySaving && <FaSpinner className="animate-spin" size={10} />} Responder
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full sm:max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-[slideUp_0.25s_ease-out]">
            <button onClick={() => setShowForm(false)} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
            <h3 id="review-title" className="text-white text-lg mb-1">Reseñá a {profileName}</h3>
            <p className="text-sm text-gray-400 mb-4">Elegí una o más etiquetas que lo describan.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(REVIEW_TAGS).map(([key, tag]) => {
                const active = tags.includes(key)
                return (
                  <button key={key} onClick={() => setTags(prev => active ? prev.filter(t => t !== key) : [...prev, key])} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${active ? 'bg-white/10 border-white/40 text-white' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-300'}`}>
                    <tag.icon style={{ color: tag.color }} /> {tag.label}
                  </button>
                )
              })}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value.slice(0, 200))} rows={3} placeholder="Comentario (opcional)" className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-sm text-white resize-none focus:outline-none focus:border-purple-500 placeholder:text-gray-500" />
            <p className="text-[11px] text-gray-500 text-right">{comment.length}/200</p>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            <div className="flex gap-2 mt-4">
              {myReview && <button onClick={remove} className="px-3 rounded-xl text-red-300 hover:bg-red-900/20" aria-label="Borrar reseña"><FaTrash /></button>}
              <button onClick={save} disabled={saving || !tags.length} className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2" style={{ backgroundColor: themeColor }}>
                {saving && <FaSpinner className="animate-spin" />} Publicar reseña
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
