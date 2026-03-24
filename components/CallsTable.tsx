'use client'

import { useState } from 'react'

type Call = {
  id: string
  vapi_call_id: string
  phone_number: string
  caller_type: string
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  ended_reason: string | null
  transcript: string | null
  summary: string | null
  success_eval: string | null
  recording_url: string | null
  clients: {
    id: string
    first_name: string | null
    last_name: string | null
    phone_number: string
    email: string | null
    disc_profile: string | null
    zoom_meeting: string | null
    objective_1: string | null
    objective_2: string | null
    objective_3: string | null
    objective_4: string | null
  } | null
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

function CallerTypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
      type === 'returning' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
    }`}>
      {type === 'returning' ? 'Returning' : 'New'}
    </span>
  )
}

function TranscriptModal({ transcript, summary, onClose }: { transcript: string; summary: string | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Call Transcript</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {summary && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Summary</h3>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">{summary}</p>
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Full Transcript</h3>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-lg p-3">{transcript}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CallsTable({ calls }: { calls: Call[] }) {
  const [search, setSearch] = useState('')
  const [selectedTranscript, setSelectedTranscript] = useState<{ transcript: string; summary: string | null } | null>(null)

  const filtered = calls.filter((c) => {
    const q = search.toLowerCase()
    const name = `${c.clients?.first_name ?? ''} ${c.clients?.last_name ?? ''}`.toLowerCase()
    const phone = (c.phone_number ?? '').toLowerCase()
    const email = (c.clients?.email ?? '').toLowerCase()
    return !q || name.includes(q) || phone.includes(q) || email.includes(q)
  })

  return (
    <>
      {selectedTranscript && (
        <TranscriptModal
          transcript={selectedTranscript.transcript}
          summary={selectedTranscript.summary}
          onClose={() => setSelectedTranscript(null)}
        />
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {[
                  'First Name', 'Last Name', 'Number', 'Type',
                  'DISC', 'Zoom Meeting', 'Email',
                  'Objective 1', 'Objective 2', 'Objective 3', 'Objective 4',
                  'Duration', 'Success', 'Transcript', 'Recording', 'Date',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No calls found.
                  </td>
                </tr>
              ) : (
                filtered.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap font-medium">
                      {call.clients?.first_name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap">
                      {call.clients?.last_name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap font-mono">
                      {call.phone_number}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CallerTypeBadge type={call.caller_type} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {call.clients?.disc_profile ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {call.clients?.zoom_meeting
                        ? formatDateTime(call.clients.zoom_meeting)
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {call.clients?.email ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px]">
                      <span className="block truncate" title={call.clients?.objective_1 ?? ''}>
                        {call.clients?.objective_1 ?? <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={call.clients?.objective_2 ?? ''}>
                        {call.clients?.objective_2 ?? <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={call.clients?.objective_3 ?? ''}>
                        {call.clients?.objective_3 ?? <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={call.clients?.objective_4 ?? ''}>
                        {call.clients?.objective_4 ?? <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SuccessBadge value={call.success_eval} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {call.transcript ? (
                        <button
                          onClick={() => setSelectedTranscript({ transcript: call.transcript!, summary: call.summary })}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {call.recording_url ? (
                        <a
                          href={call.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                        >
                          Play
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(call.started_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
