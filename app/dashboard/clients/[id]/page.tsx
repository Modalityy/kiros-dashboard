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
      .select('id, started_at, ended_at, duration_seconds, caller_type, ended_reason, transcript, summary, success_eval, recording_url, cost_cents')
      .eq('client_id', id)
      .order('started_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('id, booking_type, scheduled_at, status')
      .eq('client_id', id)
      .order('scheduled_at', { ascending: false }),
  ])

  return { client, calls: calls ?? [], bookings: bookings ?? [] }
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(secs: number | null) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

function formatCost(cents: number | null) {
  if (cents === null) return '—'
  return `$${(cents / 100).toFixed(2)}`
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

function SuccessBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-400 text-xs">—</span>
  const isSuccess = value.toLowerCase().includes('true') || value === '1'
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
      isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isSuccess ? 'Success' : 'Failed'}
    </span>
  )
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { client, calls, bookings } = await getClientData(params.id)

  if (!client) notFound()

  const objectives = [client.objective_1, client.objective_2, client.objective_3, client.objective_4].filter(Boolean)

  return (
    <div className="p-8 animate-fade-in-up max-w-5xl">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Link>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
            {client.first_name?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{client.first_name} {client.last_name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="font-mono">{client.phone_number}</span>
              {client.email && <span>{client.email}</span>}
              {client.disc_profile && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {client.disc_profile}
                </span>
              )}
            </div>
            {client.zoom_meeting && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Next Zoom:</span> {formatDateTime(client.zoom_meeting)}
              </div>
            )}
          </div>
          <div className="text-right text-xs text-slate-400 flex-shrink-0">
            <div>Client since</div>
            <div className="font-medium text-slate-500">{formatDateTime(client.created_at)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Objectives */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Financial Objectives</h2>
          {objectives.length === 0 ? (
            <p className="text-sm text-slate-400">No objectives recorded.</p>
          ) : (
            <ol className="space-y-2">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700">{obj}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Calls', value: calls.length },
              { label: 'Total Bookings', value: bookings.length },
              {
                label: 'Active Bookings',
                value: bookings.filter((b: any) => b.booking_type !== 'cancel' && new Date(b.scheduled_at) > new Date()).length,
              },
              {
                label: 'Total Cost',
                value: formatCost(calls.reduce((sum: number, c: any) => sum + (c.cost_cents ?? 0), 0) || null),
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-4 py-3">
                <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                <div className="text-lg font-bold text-slate-800">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Booking History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['Scheduled', 'Type', 'Status'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.length === 0 ? (
                <tr><td colSpan={3} className="py-8 text-center text-sm text-slate-400">No bookings.</td></tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{formatDateTime(b.scheduled_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><TypeBadge type={b.booking_type} /></td>
                    <td className="px-4 py-3 text-sm text-slate-500 capitalize whitespace-nowrap">{b.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Call History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['Date', 'Duration', 'Ended Reason', 'Cost', 'Success', 'Summary'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {calls.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">No calls.</td></tr>
              ) : (
                calls.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(c.started_at)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDuration(c.duration_seconds)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.ended_reason ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{formatCost(c.cost_cents)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><SuccessBadge value={c.success_eval} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                      {c.summary
                        ? <span className="block truncate" title={c.summary}>{c.summary}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
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
