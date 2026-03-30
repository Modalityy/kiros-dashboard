import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// PATCH — update scheduled_at and sync to client zoom_meeting
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase()
  const { scheduled_at } = await req.json()

  if (!scheduled_at) return NextResponse.json({ error: 'scheduled_at required' }, { status: 400 })

  // Update booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ scheduled_at })
    .eq('id', params.id)
    .select('client_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync to client zoom_meeting
  if (booking?.client_id) {
    await supabase
      .from('clients')
      .update({ zoom_meeting: scheduled_at })
      .eq('id', booking.client_id)
  }

  return NextResponse.json({ ok: true })
}

// DELETE — cancel the booking and clear client zoom_meeting
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase()

  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', params.id)
    .select('client_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Clear zoom_meeting on client
  if (booking?.client_id) {
    await supabase
      .from('clients')
      .update({ zoom_meeting: '' })
      .eq('id', booking.client_id)
  }

  return NextResponse.json({ ok: true })
}
