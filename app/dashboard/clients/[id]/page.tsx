import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getClientData(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const [{ data: client }, { data: calls }, { data: bookings }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('calls')
      .select('id, started_at, duration_seconds, ended_reason, transcript, summary, success_eval, cost_cents')
      .eq('client_id', id)
      .order('started_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('id, booking_type, scheduled_at, status, email')
      .eq('client_id', id)
      .order('scheduled_at', { ascending: false }),
  ])
  return { client, calls: calls ?? [], bookings: bookings ?? [] }
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(secs: number | null) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60), s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatCost(cents: number | null) {
  if (cents === null) return '—'
  return `$${(cents / 100).toFixed(3)}`
}

function extractOverallScore(text: string | null): string | null {
  if (!text) return null
  const m = text.match(/\*\*Overall Score:\*\*\s*(\d+\/\d+)/)
  return m ? m[1] : null
}

function scorePillClass(score: string | null): string {
  if (!score) return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
  const [num, den] = score.split('/').map(Number)
  const r = den ? num / den : 0
  if (r >= 0.9) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  if (r >= 0.7) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  if (r >= 0.5) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
  return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
}

function EvalBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
  const lower = value.toLowerCase()
  if (lower === 'true' || lower === 'success') return <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Pass</span>
  if (lower === 'false' || lower === 'failed') return <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">Fail</span>
  const score = extractOverallScore(value)
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${scorePillClass(score)}`}>{score ?? '—'}</span>
}

function BookingTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    schedule: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    reschedule: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    cancel: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[type] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
      {type}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    cancelled: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[status] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
      {status}
    </span>
  )
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { client, calls, bookings } = await getClientData(id)
  if (!client) notFound()

  const objectives = [client.objective_1, client.objective_2, client.objective_3, client.objective_4].filter(Boolean)
  const totalCost = calls.reduce((sum: number, c: any) => sum + (c.cost_cents ?? 0), 0)
  const activeBookings = bookings.filter((b: any) => b.booking_type !== 'cancel' && b.status === 'active' && new Date(b.scheduled_at) > new Date()).length
  const initials = [client.first_name?.[0], client.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <div className="p-6 lg:p-8 animate-fade-in-up max-w-5xl">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Link>
      </div>

      {/* Profile hero */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900 p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-2xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {client.first_name} {client.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{client.phone_number}</span>
              {client.email && (
                <a href={`mailto:${client.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{client.email}</a>
              )}
              {client.disc_profile && (
                <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                  {client.disc_profile}
                </span>
              )}
            </div>
            {client.zoom_meeting && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5">
                <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-slate-700 dark:text-slate-300">Zoom:</span>
                <span>{formatDateTime(client.zoom_meeting)}</span>
              </div>
            )}
          </div>
          <div className="text-right text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            <div>Client since</div>
            <div className="font-medium text-slate-600 dark:text-slate-400 mt-0.5">{formatDateTime(client.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Calls', value: calls.length, icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
          { label: 'Total Bookings', value: bookings.length, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Active Bookings', value: activeBookings, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Cost', value: formatCost(totalCost || null), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900 px-4 py-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Objectives */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Financial Objectives</h2>
          {objectives.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No objectives recorded.</p>
          ) : (
            <ol className="space-y-2.5">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{obj}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Booking history */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Booking History</h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No bookings recorded.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">{formatDateTime(b.scheduled_at)}</div>
                    {b.email && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{b.email}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <BookingTypeBadge type={b.booking_type} />
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Call history */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Call History</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">{calls.length} call{calls.length !== 1 ? 's' : ''}</span>
        </div>
        {calls.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">No calls recorded.</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {calls.map((c: any) => (
              <div key={c.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateTime(c.started_at)}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDuration(c.duration_seconds)}</div>
                    {c.ended_reason && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap hidden md:block">
                        {c.ended_reason.replace(/-/g, ' ').replace(/\b\w/g, (x: string) => x.toUpperCase())}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{formatCost(c.cost_cents)}</span>
                    <EvalBadge value={c.success_eval} />
                  </div>
                </div>
                {c.summary && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{c.summary}</p>
                )}
                {c.transcript && (
                  <details className="mt-2 group">
                    <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline list-none flex items-center gap-1 w-fit">
                      <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      View transcript
                    </summary>
                    <pre className="mt-2 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 max-h-64 overflow-y-auto">{c.transcript}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
