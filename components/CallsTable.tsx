'use client'

import { useState, useEffect } from 'react'

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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = () => {
    const text = [summary ? `Summary:\n${summary}` : '', `Transcript:\n${transcript}`].filter(Boolean).join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transcript-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="transcript-modal-title" className="text-base font-semibold text-slate-900">Call Transcript</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              aria-label="Copy transcript to clipboard"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button
              onClick={onClose}
              aria-label="Close transcript"
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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

type SortKey = 'started_at' | 'duration_seconds' | 'caller_type' | 'success_eval'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`w-3 h-3 inline ml-1 ${active ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {dir === 'asc' || !active
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
    </svg>
  )
}

function exportCSV(calls: Call[]) {
  const headers = ['First Name','Last Name','Phone','Type','Email','DISC','Duration (s)','Success','Date']
  const rows = calls.map(c => [
    c.clients?.first_name ?? '',
    c.clients?.last_name ?? '',
    c.phone_number,
    c.caller_type,
    c.clients?.email ?? '',
    c.clients?.disc_profile ?? '',
    c.duration_seconds ?? '',
    c.success_eval ?? '',
    c.started_at ? new Date(c.started_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }) : '',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `call-logs-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function CallsTable({ calls }: { calls: Call[] }) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('started_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedTranscript, setSelectedTranscript] = useState<{ transcript: string; summary: string | null } | null>(null)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = calls
    .filter((c) => {
      const q = search.toLowerCase()
      const name = `${c.clients?.first_name ?? ''} ${c.clients?.last_name ?? ''}`.toLowerCase()
      const phone = (c.phone_number ?? '').toLowerCase()
      const email = (c.clients?.email ?? '').toLowerCase()
      if (q && !name.includes(q) && !phone.includes(q) && !email.includes(q)) return false
      if (dateFrom && c.started_at && new Date(c.started_at) < new Date(dateFrom)) return false
      if (dateTo && c.started_at && new Date(c.started_at) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
    .sort((a, b) => {
      let av: any, bv: any
      if (sortKey === 'started_at') { av = a.started_at ?? ''; bv = b.started_at ?? '' }
      else if (sortKey === 'duration_seconds') { av = a.duration_seconds ?? -1; bv = b.duration_seconds ?? -1 }
      else if (sortKey === 'caller_type') { av = a.caller_type; bv = b.caller_type }
      else { av = a.success_eval ?? ''; bv = b.success_eval ?? '' }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const sortableCols: { label: string; key: SortKey }[] = [
    { label: 'Date', key: 'started_at' },
    { label: 'Duration', key: 'duration_seconds' },
    { label: 'Type', key: 'caller_type' },
    { label: 'Success', key: 'success_eval' },
  ]

  return (
    <>
      {selectedTranscript && (
        <TranscriptModal
          transcript={selectedTranscript.transcript}
          summary={selectedTranscript.summary}
          onClose={() => setSelectedTranscript(null)}
        />
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-xs text-slate-500 whitespace-nowrap">From</label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <label htmlFor="date-to" className="text-xs text-slate-500 whitespace-nowrap">To</label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100">
              Clear
            </button>
          )}
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['First Name', 'Last Name', 'Number', 'DISC', 'Zoom Meeting', 'Email',
                  'Objective 1', 'Objective 2', 'Objective 3', 'Objective 4',
                  'Transcript', 'Recording'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
                {sortableCols.map(({ label, key }) => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    <button onClick={() => toggleSort(key)} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors">
                      {label}
                      <SortIcon active={sortKey === key} dir={sortDir} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={16}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <p className="text-slate-700 font-medium text-sm">No calls yet</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-xs">
                        {search ? 'No calls match your search.' : 'Calls will appear here once Eh-va starts receiving inbound calls.'}
                      </p>
                      {!search && (
                        <div className="mt-5 grid grid-cols-3 gap-3 text-xs max-w-sm w-full">
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-left">
                            <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center mb-2">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="font-medium text-slate-600">Transcript</div>
                            <div className="text-slate-400 mt-0.5">Full call transcript</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-left">
                            <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center mb-2">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            </div>
                            <div className="font-medium text-slate-600">Recording</div>
                            <div className="text-slate-400 mt-0.5">Audio playback link</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-left">
                            <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center mb-2">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="font-medium text-slate-600">Success eval</div>
                            <div className="text-slate-400 mt-0.5">AI call evaluation</div>
                          </div>
                        </div>
                      )}
                    </div>
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
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {call.clients?.disc_profile ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {call.clients?.zoom_meeting ? formatDateTime(call.clients.zoom_meeting) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {call.clients?.email ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px]">
                      <span className="block truncate" title={call.clients?.objective_1 ?? ''}>{call.clients?.objective_1 ?? <span className="text-slate-300">—</span>}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={call.clients?.objective_2 ?? ''}>{call.clients?.objective_2 ?? <span className="text-slate-300">—</span>}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={call.clients?.objective_3 ?? ''}>{call.clients?.objective_3 ?? <span className="text-slate-300">—</span>}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={call.clients?.objective_4 ?? ''}>{call.clients?.objective_4 ?? <span className="text-slate-300">—</span>}</span>
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
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CallerTypeBadge type={call.caller_type} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SuccessBadge value={call.success_eval} />
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
