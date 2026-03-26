import { createClient } from '@supabase/supabase-js'
import { BookingsTabs } from '@/components/BookingsTabs'

export const dynamic = 'force-dynamic'

async function getBookings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Mark past active bookings as completed
  await supabase
    .from('bookings')
    .update({ status: 'completed' } as any)
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

  if (error) {
    console.error('getBookings error:', error)
    return []
  }
  return data ?? []
}

export default async function BookingsPage() {
  const bookings = await getBookings()

  return (
    <div className="p-8 animate-fade-in-up">
      <BookingsTabs bookings={bookings} />
    </div>
  )
}
