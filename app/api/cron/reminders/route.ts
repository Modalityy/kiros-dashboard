import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSessionReminder } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Called by Vercel Cron daily at 09:00 SGT (01:00 UTC).
// Finds all active bookings scheduled between 24–25 hours from now and sends a reminder email.
export async function GET(request: Request) {
  // Verify cron secret so the route can't be triggered by arbitrary HTTP requests
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, scheduled_at, email, clients(first_name, email)')
    .eq('status', 'active')
    .neq('booking_type', 'cancel')
    .gte('scheduled_at', windowStart.toISOString())
    .lt('scheduled_at', windowEnd.toISOString())

  if (error) {
    console.error('[reminders] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  const failed: string[] = []

  for (const booking of bookings ?? []) {
    const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients as { first_name: string | null; email: string | null } | null
    const recipientEmail = booking.email ?? client?.email
    const firstName = client?.first_name ?? 'there'

    if (!recipientEmail) continue

    try {
      await sendSessionReminder({
        firstName,
        email: recipientEmail,
        dateTime: booking.scheduled_at,
      })
      sent++
    } catch (err: any) {
      console.error(`[reminders] Failed to send for booking ${booking.id}:`, err.message)
      failed.push(booking.id)
    }
  }

  return NextResponse.json({ sent, failed, total: bookings?.length ?? 0 })
}
