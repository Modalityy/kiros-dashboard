import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()

  // Mark past active bookings as completed
  await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('status', 'active')
    .lt('scheduled_at', new Date().toISOString())

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      clients (
        first_name,
        last_name,
        phone_number,
        email
      )
    `)
    .order('scheduled_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
