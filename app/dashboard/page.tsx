import { getCalls, getUpcomingBookings } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

async function getStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = Date.now()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalCalls },
    { count: totalClients },
    { count: callsThisWeek },
    { count: callsThisMonth },
    upcomingBookings,
  ] = await Promise.all([
    supabase.from('calls').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('calls').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('calls').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
    getUpcomingBookings(5),
  ])

  // Success rate + new/returning split from last 50 calls
  const { data: recentCalls } = await supabase
    .from('calls')
    .select('success_eval, caller_type')
    .order('created_at', { ascending: false })
    .limit(50)

  const successCount = recentCalls?.filter(
    (c) => c.success_eval?.toLowerCase().includes('true') || c.success_eval === '1'
  ).length ?? 0
  const successRate = recentCalls?.length
    ? Math.round((successCount / recentCalls.length) * 100)
    : null

  const returningCount = recentCalls?.filter((c) => c.caller_type === 'returning').length ?? 0
  const newCount = recentCalls?.filter((c) => c.caller_type === 'new').length ?? 0

  return {
    totalCalls: totalCalls ?? 0,
    totalClients: totalClients ?? 0,
    callsThisWeek: callsThisWeek ?? 0,
    callsThisMonth: callsThisMonth ?? 0,
    upcomingBookings,
    successRate,
    returningCount,
    newCount,
  }
}

function StatCard({
  label,
  value,
  sub,
  color = 'blue',
}: {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'purple' | 'amber'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${colors[color]}`}>
        <span className="text-lg font-bold">#</span>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-sm font-medium text-slate-600 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="p-8 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, Gabriel. Here's what's happening.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-blue-50 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalCalls}</div>
          <div className="text-sm font-medium text-slate-600 mt-1">Total Calls</div>
          <div className="text-xs text-slate-400 mt-0.5">{stats.callsThisWeek} this week · {stats.callsThisMonth} this month</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-green-50 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalClients}</div>
          <div className="text-sm font-medium text-slate-600 mt-1">Total Clients</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-purple-50 text-purple-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.returningCount}</div>
          <div className="text-sm font-medium text-slate-600 mt-1">Returning Callers</div>
          <div className="text-xs text-slate-400 mt-0.5">{stats.newCount} new · last 50 calls</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-amber-50 text-amber-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {stats.successRate !== null ? `${stats.successRate}%` : '—'}
          </div>
          <div className="text-sm font-medium text-slate-600 mt-1">Call Success Rate</div>
          <div className="text-xs text-slate-400 mt-0.5">Last 50 calls</div>
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Upcoming Zoom Sessions</h2>
          <a href="/dashboard/bookings" className="text-sm text-blue-600 hover:underline font-medium">View all →</a>
        </div>
        {stats.upcomingBookings.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">No upcoming bookings.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {stats.upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {booking.clients?.first_name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm">
                    {booking.clients?.first_name} {booking.clients?.last_name}
                  </div>
                  <div className="text-xs text-slate-400">{booking.clients?.phone_number}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">{formatDateTime(booking.scheduled_at)}</div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                    booking.booking_type === 'schedule'
                      ? 'bg-green-100 text-green-700'
                      : booking.booking_type === 'reschedule'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {booking.booking_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
