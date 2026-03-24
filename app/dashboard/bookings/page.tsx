import { createClient } from '@supabase/supabase-js'

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

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    schedule: 'bg-green-100 text-green-700',
    reschedule: 'bg-amber-100 text-amber-700',
    cancel: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${styles[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  )
}

export default async function BookingsPage() {
  const bookings = await getBookings()
  const upcoming = bookings.filter((b: any) => b.booking_type !== 'cancel' && new Date(b.scheduled_at) > new Date())
  const past = bookings.filter((b: any) => b.booking_type === 'cancel' || new Date(b.scheduled_at) <= new Date())

  return (
    <div className="p-8 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="text-slate-500 text-sm mt-1">{upcoming.length} upcoming · {past.length} past/cancelled</p>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Upcoming Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['Client', 'Phone', 'Email', 'Scheduled', 'Type'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {upcoming.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-700 font-medium text-sm">No upcoming sessions</p>
                      <p className="text-slate-400 text-xs mt-1">Bookings made through Eh-va will appear here automatically.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                upcoming.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {b.clients?.first_name?.[0] ?? '?'}
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {b.clients?.first_name} {b.clients?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono whitespace-nowrap">{b.clients?.phone_number}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{b.clients?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">{formatDateTime(b.scheduled_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><TypeBadge type={b.booking_type} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Past */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Past & Cancelled</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['Client', 'Phone', 'Email', 'Scheduled', 'Type'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {past.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-slate-700 font-medium text-sm">No past or cancelled sessions</p>
                      <p className="text-slate-400 text-xs mt-1">Completed and cancelled bookings will be archived here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                past.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors opacity-75">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {b.clients?.first_name?.[0] ?? '?'}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {b.clients?.first_name} {b.clients?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono whitespace-nowrap">{b.clients?.phone_number}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{b.clients?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDateTime(b.scheduled_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><TypeBadge type={b.booking_type} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
