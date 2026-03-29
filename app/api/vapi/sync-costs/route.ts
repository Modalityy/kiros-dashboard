import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Backfills cost_cents from VAPI API for calls missing cost data
export async function POST() {
  const vapiKey = process.env.VAPI_PRIVATE_KEY
  if (!vapiKey) return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not set' }, { status: 500 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get our calls that have no cost yet but have a vapi_call_id
  const { data: missing } = await supabase
    .from('calls')
    .select('id, vapi_call_id')
    .is('cost_cents', null)
    .not('vapi_call_id', 'is', null)

  if (!missing?.length) return NextResponse.json({ updated: 0 })

  let updated = 0
  for (const row of missing) {
    try {
      const res = await fetch(`https://api.vapi.ai/call/${row.vapi_call_id}`, {
        headers: { Authorization: `Bearer ${vapiKey}` },
      })
      if (!res.ok) continue
      const call = await res.json()
      const costDollars: number | null = call.cost ?? null
      if (costDollars == null) continue
      await supabase
        .from('calls')
        .update({ cost_cents: Math.round(costDollars * 100) })
        .eq('id', row.id)
      updated++
    } catch { /* skip */ }
  }

  return NextResponse.json({ updated })
}
