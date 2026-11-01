// src/hooks/useSavedPosts.ts
// Publicaciones guardadas por el usuario (tabla saved_posts).
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useSavedPosts() {
  const { user } = useAuth()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('saved_posts').select('post_id').eq('user_id', user.id).limit(500).then(({ data, error }) => {
      if (error) { setAvailable(false); return }
      setSavedIds(new Set((data || []).map(r => r.post_id)))
    })
  }, [user])

  // Devuelve true si quedó guardada, false si se quitó, null si falló
  const toggleSave = useCallback(async (postId: string): Promise<boolean | null> => {
    if (!user) return null
    const wasSaved = savedIds.has(postId)
    setSavedIds(prev => { const next = new Set(prev); wasSaved ? next.delete(postId) : next.add(postId); return next })
    const { error } = wasSaved
      ? await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId)
      : await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId })
    if (error) {
      setSavedIds(prev => { const next = new Set(prev); wasSaved ? next.add(postId) : next.delete(postId); return next })
      return null
    }
    return !wasSaved
  }, [user, savedIds])

  return { savedIds, toggleSave, available }
}
