'use client'

import { useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

/**
 * Subscribes to INSERT / UPDATE / DELETE events on a Supabase table.
 * Calls `onchange` whenever any row changes — the caller decides how to refetch.
 *
 * Prerequisites:
 *   1. Enable Realtime for the table in Supabase dashboard:
 *      Database → Replication → toggle the table on
 *   2. NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local
 */
export function useRealtimeTable(table: string, onchange: () => void) {
  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => onchange()
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [table, onchange])
}
