'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/Toast'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import { EmptyState } from '@/components/EmptyState'

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
  cost_cents: number | null
  notes: string | null
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

function formatDuration(secs: number | null | undefined) {
  if (secs === null || secs === undefined) return '—'
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatCost(cents: number | null) {
  if (cents === null) return '—'
  return `$${(cents / 100).toFixed(3)}`
}

// Format E.164 Singapore number as +65 xxxx xxxx
function formatPhone(phone: string | null) {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('65') && digits.length === 10) {
    return `+65 ${digits.slice(2, 6)} ${digits.slice(6)}`
  }
  if (digits.length === 8) {
    return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`
  }
  return phone
}

// Derive call direction from available data — all current calls are inbound phone calls
function callDirection(call: Call): string {
  if (!call.phone_number || call.phone_number === 'unknown') return 'Web'
  return 'Inbound'
}

// Show VAPI ended_reason in a readable form
function formatEndedReason(reason: string | null): string {
  if (!reason) return '—'
  return reason
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Show raw success_eval — VAPI returns nuanced text, not just true/false
function EvalCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-300 text-xs">—</span>

  const lower = value.toLowerCase()
  const isPass = lower === 'true' || lower === 'success' || lower === 'passed' || lower === '1'
  const isFail = lower === 'false' || lower === 'failed' || lower === '0'

  if (isPass || isFail) {
    return (
      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
        isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {isPass ? 'Pass' : 'Fail'}
      </span>
    )
  }

  // Longer eval text — show truncated with title tooltip
  return (
    <span
      className="block text-xs text-slate-600 max-w-[160px] truncate"
      title={value}
    >
      {value}
    </span>
  )
}

function DirectionBadge({ direction }: { direction: string }) {
  const styles: Record<string, string> = {
    Inbound: 'bg-blue-50 text-blue-700',
    Outbound: 'bg-violet-50 text-violet-700',
    Web: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${styles[direction] ?? 'bg-slate-100 text-slate-500'}`}>
      {direction}
    </span>
  )
}

function CallIdCell({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const short = id.slice(0, 8)

  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={copy}
      title={id}
      className="flex items-center gap-1.5 group text-left"
    >
      <span className="text-xs font-mono text-slate-500 group-hover:text-slate-800 transition-colors">
        {short}
      </span>
      <svg
        className={`w-3 h-3 flex-shrink-0 transition-colors ${copied ? 'text-green-500' : 'text-slate-300 group-hover:text-slate-500'}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        {copied
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
        }
      </svg>
    </button>
  )
}

function RecordingModal({ url, callerName, duration, onClose }: {
  url: string
  callerName: string
  duration: number | null
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recording-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 id="recording-modal-title" className="text-base font-semibold text-slate-900">Call Recording</h2>
            <p className="text-xs text-slate-400 mt-0.5">{callerName}{duration !== null ? ` · ${formatDuration(duration)}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-6 space-y-4">
          <audio controls autoPlay={false} className="w-full rounded-lg" src={url}>
            Your browser does not support the audio element.
          </audio>
          <div className="flex justify-end">
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function TranscriptModal({ callId, transcript, summary, initialNotes, onClose, onNotesSaved }: {
  callId: string
  transcript: string
  summary: string | null
  initialNotes: string | null
  onClose: () => void
  onNotesSaved: (id: string, notes: string) => void
}) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)

  const handleCopy = () => {
    const text = [summary ? `Summary:\n${summary}` : '', `Transcript:\n${transcript}`].filter(Boolean).join('\n\n')
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: callId, notes }),
      })
      if (!res.ok) throw new Error()
      onNotesSaved(callId, notes)
      toast('Notes saved', 'success')
    } catch {
      toast('Failed to save notes', 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transcript-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="transcript-modal-title" className="text-base font-semibold text-slate-900">Call Transcript</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
            >
              <svg className={`w-3.5 h-3.5 ${copied ? 'text-green-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {copied
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                }
              </svg>
              <span className={copied ? 'text-green-600' : ''}>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
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
          {/* Notes */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</h3>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add a note about this call…"
              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            <div className="flex justify-end mt-1.5">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes || notes === (initialNotes ?? '')}
                className="text-xs font-medium px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {savingNotes ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type SortKey = 'started_at' | 'duration_seconds' | 'cost_cents'
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
  const headers = ['Call ID', 'Date', 'Phone', 'Name', 'Direction', 'Duration (s)', 'Ended Reason', 'Eval', 'Cost']
  const rows = calls.map(c => [
    c.vapi_call_id,
    c.started_at ? new Date(c.started_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }) : '',
    c.phone_number,
    [c.clients?.first_name, c.clients?.last_name].filter(Boolean).join(' '),
    callDirection(c),
    c.duration_seconds ?? '',
    c.ended_reason ?? '',
    c.success_eval ?? '',
    c.cost_cents !== null ? (c.cost_cents / 100).toFixed(3) : '',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `call-logs-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const SORTABLE: { label: string; key: SortKey }[] = [
  { label: 'Date', key: 'started_at' },
  { label: 'Duration', key: 'duration_seconds' },
  { label: 'Cost', key: 'cost_cents' },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const REFRESH_INTERVAL_MS = 60_000

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: 11 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-3.5 rounded bg-slate-100 animate-skeleton ${
            i === 0 ? 'w-16' : i === 2 ? 'w-24' : i === 3 ? 'w-14' : i === 4 ? 'w-28' : 'w-12'
          }`} />
        </td>
      ))}
    </tr>
  )
}

export function CallsTable() {
  const { toast } = useToast()
  const [calls, setCalls] = useState<Call[]>([])
  const [loadingCalls, setLoadingCalls] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('started_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selectedTranscript, setSelectedTranscript] = useState<{ callId: string; transcript: string; summary: string | null; notes: string | null } | null>(null)
  const [selectedRecording, setSelectedRecording] = useState<{ url: string; callerName: string; duration: number | null } | null>(null)
  const [selectedEndedReason, setSelectedEndedReason] = useState<{ reason: string; summary: string | null; vapiCallId: string } | null>(null)

  const fetchCalls = useCallback(async (silent = false) => {
    if (!silent) setLoadingCalls(true)
    try {
      const r = await fetch('/api/calls')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      setCalls(Array.isArray(data) ? data : [])
      setLastRefreshed(new Date())
    } catch {
      if (!silent) toast('Failed to load call logs', 'error')
    } finally {
      if (!silent) setLoadingCalls(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCalls(false)
    const interval = setInterval(() => fetchCalls(true), REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchCalls])

  // Live push: re-fetch silently whenever a call row changes in Supabase
  useRealtimeTable('calls', useCallback(() => fetchCalls(true), [fetchCalls]))

  useEffect(() => { setPage(1) }, [search, dateFrom, dateTo, sortKey, sortDir, pageSize])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = calls
    .filter(c => {
      const q = search.toLowerCase()
      const name = `${c.clients?.first_name ?? ''} ${c.clients?.last_name ?? ''}`.toLowerCase()
      const phone = (c.phone_number ?? '').toLowerCase()
      const id = (c.vapi_call_id ?? '').toLowerCase()
      if (q && !name.includes(q) && !phone.includes(q) && !id.includes(q)) return false
      if (dateFrom && c.started_at && new Date(c.started_at) < new Date(dateFrom)) return false
      if (dateTo && c.started_at && new Date(c.started_at) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
    .sort((a, b) => {
      let av: any, bv: any
      if (sortKey === 'started_at') { av = a.started_at ?? ''; bv = b.started_at ?? '' }
      else if (sortKey === 'duration_seconds') { av = a.duration_seconds ?? -1; bv = b.duration_seconds ?? -1 }
      else { av = a.cost_cents ?? -1; bv = b.cost_cents ?? -1 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Static headers + sortable headers merged into one row
  const staticCols = ['Call ID', 'Phone', 'Name', 'Direction', 'Ended Reason', 'Transcript', 'Recording', 'Eval']

  return (
    <>
      {selectedTranscript && (
        <TranscriptModal
          callId={selectedTranscript.callId}
          transcript={selectedTranscript.transcript}
          summary={selectedTranscript.summary}
          initialNotes={selectedTranscript.notes}
          onClose={() => setSelectedTranscript(null)}
          onNotesSaved={(id, savedNotes) => {
            setCalls(prev => prev.map(c => c.id === id ? { ...c, notes: savedNotes } : c))
            setSelectedTranscript(prev => prev ? { ...prev, notes: savedNotes } : null)
          }}
        />
      )}
      {selectedRecording && (
        <RecordingModal
          url={selectedRecording.url}
          callerName={selectedRecording.callerName}
          duration={selectedRecording.duration}
          onClose={() => setSelectedRecording(null)}
        />
      )}
      {selectedEndedReason && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEndedReason(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Call End Details</h2>
              <button onClick={() => setSelectedEndedReason(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Ended Reason</p>
                <code className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 block font-mono">
                  {selectedEndedReason.reason}
                </code>
              </div>
              {selectedEndedReason.summary && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Call Summary</p>
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                    {selectedEndedReason.summary}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">VAPI Call ID</p>
                <code className="text-xs text-slate-500 font-mono">{selectedEndedReason.vapiCallId}</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by name, phone, or call ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-xs text-slate-500 whitespace-nowrap">From</label>
          <input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          <label htmlFor="date-to" className="text-xs text-slate-500 whitespace-nowrap">To</label>
          <input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }}
              className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100">
              Clear
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-xs text-slate-400 hidden sm:block">
              Updated {lastRefreshed.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchCalls(false)}
            disabled={loadingCalls}
            title="Refresh"
            className="flex items-center justify-center w-8 h-8 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <svg className={`w-3.5 h-3.5 text-slate-500 ${loadingCalls ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Mobile card list — shown below lg breakpoint */}
      <div className="lg:hidden space-y-3">
        {loadingCalls ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 animate-skeleton flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-32 rounded bg-slate-100 animate-skeleton" />
                  <div className="h-3 w-24 rounded bg-slate-100 animate-skeleton" />
                </div>
                <div className="h-5 w-16 rounded-full bg-slate-100 animate-skeleton" />
              </div>
              <div className="h-3 w-40 rounded bg-slate-100 animate-skeleton" />
            </div>
          ))
        ) : paginated.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <EmptyState
              illustration="calls"
              title="No calls yet"
              description={search ? 'No calls match your search.' : 'Calls will appear here once Eh-va starts receiving inbound calls.'}
            />
          </div>
        ) : (
          paginated.map(call => {
            const callerName = [call.clients?.first_name, call.clients?.last_name].filter(Boolean).join(' ')
            const initials = callerName
              ? callerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              : '?'
            return (
              <div key={call.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                {/* Header row */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {callerName || <span className="text-slate-400">Unknown</span>}
                    </div>
                    <div className="text-xs font-mono text-slate-500">{formatPhone(call.phone_number)}</div>
                  </div>
                  <DirectionBadge direction={callDirection(call)} />
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{formatDateTime(call.started_at)}</span>
                  {call.duration_seconds !== null && <span>{formatDuration(call.duration_seconds)}</span>}
                  {call.cost_cents !== null && <span className="font-mono">{formatCost(call.cost_cents)}</span>}
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-3 pt-1 border-t border-slate-50">
                  {call.ended_reason && (
                    <button
                      onClick={() => setSelectedEndedReason({ reason: call.ended_reason!, summary: call.summary, vapiCallId: call.vapi_call_id })}
                      className="text-xs text-slate-500 hover:text-slate-900 hover:underline underline-offset-2 flex-1 text-left truncate"
                    >
                      {formatEndedReason(call.ended_reason)}
                    </button>
                  )}
                  <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                    {call.transcript && (
                      <button
                        onClick={() => setSelectedTranscript({ callId: call.id, transcript: call.transcript!, summary: call.summary, notes: call.notes })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Transcript
                      </button>
                    )}
                    {call.recording_url && (
                      <button
                        onClick={() => setSelectedRecording({ url: call.recording_url!, callerName: callerName || call.phone_number, duration: call.duration_seconds })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Recording
                      </button>
                    )}
                    <EvalCell value={call.success_eval} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Table — hidden on mobile */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {staticCols.slice(0, 4).map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
                {/* Sortable: Date, Duration */}
                {SORTABLE.slice(0, 2).map(({ label, key }) => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    <button onClick={() => toggleSort(key)} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors">
                      {label} <SortIcon active={sortKey === key} dir={sortDir} />
                    </button>
                  </th>
                ))}
                {staticCols.slice(4).map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
                {/* Cost last — sortable */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  <button onClick={() => toggleSort('cost_cents')} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors">
                    Cost <SortIcon active={sortKey === 'cost_cents'} dir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingCalls ? (
                Array.from({ length: pageSize }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12}>
                    <EmptyState
                      illustration="calls"
                      title="No calls yet"
                      description={search ? 'No calls match your search.' : 'Calls will appear here once Eh-va starts receiving inbound calls.'}
                    />
                  </td>
                </tr>
              ) : (paginated.map(call => {
                  const callerName = [call.clients?.first_name, call.clients?.last_name].filter(Boolean).join(' ') || call.phone_number
                  return (
                    <tr key={call.id} className="hover:bg-slate-50 transition-colors">

                      {/* Call ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CallIdCell id={call.vapi_call_id} />
                      </td>
                      {/* Phone */}
                      <td className="px-4 py-3 text-sm font-mono text-slate-600 whitespace-nowrap">
                        {formatPhone(call.phone_number)}
                      </td>
                      {/* Name */}
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">
                        {callerName !== call.phone_number
                          ? callerName
                          : <span className="text-slate-300">—</span>}
                      </td>
                      {/* Direction */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <DirectionBadge direction={callDirection(call)} />
                      </td>
                      {/* Date (sortable) */}
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(call.started_at)}
                      </td>
                      {/* Duration (sortable) */}
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      {/* Ended Reason — clickable for details */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {call.ended_reason ? (
                          <button
                            onClick={() => setSelectedEndedReason({ reason: call.ended_reason!, summary: call.summary, vapiCallId: call.vapi_call_id })}
                            className="text-xs text-slate-500 hover:text-slate-900 hover:underline underline-offset-2 transition-colors text-left"
                          >
                            {formatEndedReason(call.ended_reason)}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      {/* Transcript */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {call.transcript ? (
                          <button
                            onClick={() => setSelectedTranscript({ callId: call.id, transcript: call.transcript!, summary: call.summary, notes: call.notes })}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      {/* Recording */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {call.recording_url ? (
                          <button
                            onClick={() => setSelectedRecording({ url: call.recording_url!, callerName, duration: call.duration_seconds })}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                          >
                            Play
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      {/* Eval */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EvalCell value={call.success_eval} />
                      </td>
                      {/* Cost — last */}
                      <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {formatCost(call.cost_cents)}
                      </td>
                    </tr>
                  )
                }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination footer */}
      {filtered.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-xs">Rows per page</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Page info + prev/next */}
          <div className="flex items-center gap-3">
            <span className="text-xs">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
