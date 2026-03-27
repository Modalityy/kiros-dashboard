import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase()
  const body = await req.json()
  const allowed = [
    'first_name', 'last_name', 'email', 'disc_profile',
    'phone_number', 'zoom_meeting', 'objective_1', 'objective_2', 'objective_3', 'objective_4',
  ]
  const update: Record<string, string | null> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) {
      const val = typeof body[key] === 'string' ? body[key].trim() : body[key]
      update[key] = key === 'phone_number' ? normalizePhone(val) : (val || null)
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // When zoom_meeting is explicitly set, sync to the bookings table so it
  // appears in the Bookings / Calendar tab.
  if ('zoom_meeting' in body) {
    const newTime = update['zoom_meeting'] // ISO string or null

    if (newTime) {
      // Look for an existing active schedule booking for this client
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', params.id)
        .eq('booking_type', 'schedule')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        // Update the existing booking's time
        await supabase
          .from('bookings')
          .update({ scheduled_at: newTime })
          .eq('id', existing.id)
      } else {
        // Insert a new booking record
        await supabase.from('bookings').insert({
          client_id: params.id,
          booking_type: 'schedule',
          appointment_type: 'Zoom Meeting',
          scheduled_at: newTime,
          email: data.email ?? null,
          status: 'active',
        })
      }
    }
    // If zoom_meeting is cleared (null), leave existing bookings as-is —
    // the bookings page auto-marks past ones as completed.
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase()

  // 1. Remove bookings linked to this client
  await supabase.from('bookings').delete().eq('client_id', params.id)

  // 2. Nullify client_id on calls so call logs are kept but unlinked
  await supabase.from('calls').update({ client_id: null }).eq('client_id', params.id)

  // 3. Delete the client
  const { error } = await supabase.from('clients').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
