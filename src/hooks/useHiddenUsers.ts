// src/hooks/useHiddenUsers.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useHiddenUsers() {
  const { user } = useAuth()
  const [hiddenIds, setHiddenIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [{ data: myBlocks }, { data: blockedMe }] = await Promise.all([
        supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id),
        supabase.from('blocks').select('blocker_id').eq('blocked_id', user.id),
      ])
      const ids = new Set<string>()
      myBlocks?.forEach(b => ids.add(b.blocked_id))
      blockedMe?.forEach(b => ids.add(b.blocker_id))
      setHiddenIds(Array.from(ids))
    }
    load()
  }, [user])

  return hiddenIds
}