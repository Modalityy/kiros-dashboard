'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import { EmptyState } from '@/components/EmptyState'

type Client = {
  id: string
  phone_number: string
  first_name: string | null
  last_name: string | null
  email: string | null
  disc_profile: string | null
  zoom_meeting: string | null
  objective_1: string | null
  objective_2: string | null
  objective_3: string | null
  objective_4: string | null
  created_at: string
  updated_at: string
}

type EditableField =
  | 'first_name' | 'last_name' | 'email' | 'disc_profile'
  | 'phone_number' | 'zoom_meeting'
  | 'objective_1' | 'objective_2' | 'objective_3' | 'objective_4'

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

// Convert ISO string → datetime-local input value (YYYY-MM-DDTHH:mm in SGT)
function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  // Offset to SGT (+8)
  const sgt = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  return sgt.toISOString().slice(0, 16)
}

// Convert datetime-local value back to ISO (treating input as SGT)
function datetimeLocalToIso(local: string): string {
  if (!local) return ''
  // local is YYYY-MM-DDTHH:mm, interpret as SGT (+08:00)
  return new Date(local + ':00+08:00').toISOString()
}

const EMPTY_ADD_FORM = {
  phone_number: '',
  first_name: '',
  last_name: '',
  email: '',
  disc_profile: '',
  zoom_meeting: '',
  objective_1: '',
  objective_2: '',
  objective_3: '',
  objective_4: '',
}

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: (c: Client) => void }) {
  const [form, setForm] = useState(EMPTY_ADD_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleAdd = async () => {
    if (!form.phone_number.trim()) { setError('Phone number is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        zoom_meeting: form.zoom_meeting ? datetimeLocalToIso(form.zoom_meeting) : null,
      }
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add client')
      onAdded(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-client-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-slate-900 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 id="add-client-title" className="text-base font-semibold text-slate-900 dark:text-white">Add Client</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="add-phone" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="add-phone"
              type="tel"
              value={form.phone_number}
              onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              placeholder="+65 9123 4567"
              className="w-full text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['first_name', 'last_name'] as const).map((field) => (
              <div key={field}>
                <label htmlFor={`add-${field}`} className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  id={`add-${field}`}
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-email" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <input
                id="add-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label htmlFor="add-disc" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">DISC Profile</label>
              <input
                id="add-disc"
                type="text"
                value={form.disc_profile}
                onChange={(e) => setForm((f) => ({ ...f, disc_profile: e.target.value }))}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="add-zoom" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Appointment (SGT)</label>
            <input
              id="add-zoom"
              type="datetime-local"
              value={form.zoom_meeting}
              onChange={(e) => setForm((f) => ({ ...f, zoom_meeting: e.target.value }))}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            />
          </div>

          <div>
            <p className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Objectives</p>
            <div className="space-y-2">
              {(['objective_1', 'objective_2', 'objective_3', 'objective_4'] as const).map((field, i) => (
                <input
                  key={field}
                  type="text"
                  aria-label={`Objective ${i + 1}`}
                  placeholder={`Objective ${i + 1}`}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
          >
            {saving ? 'Adding…' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── InlineCell — defined OUTSIDE ClientsTable so React doesn't remount it on every render ──

type InlineCellProps = {
  clientId: string
  field: EditableField
  value: string | null
  activeCell: { clientId: string; field: EditableField } | null
  savingCell: { clientId: string; field: EditableField } | null
  draft: string
  mono?: boolean
  onStart: () => void
  onDraftChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
}

function InlineCell({
  clientId, field, value, activeCell, savingCell, draft, mono,
  onStart, onDraftChange, onCommit, onCancel,
}: InlineCellProps) {
  const isActive = activeCell?.clientId === clientId && activeCell.field === field
  const isSaving = savingCell?.clientId === clientId && savingCell.field === field
  const isDatetime = field === 'zoom_meeting'

  if (isActive) {
    if (isDatetime) {
      return (
        <input
          autoFocus
          type="datetime-local"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); onCommit() }
            if (e.key === 'Escape') onCancel()
          }}
          className="text-sm border border-blue-400 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        />
      )
    }
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onCommit() }
          if (e.key === 'Escape') onCancel()
        }}
        className={`w-full min-w-[100px] text-sm border border-blue-400 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 ${mono ? 'font-mono' : ''}`}
      />
    )
  }

  const displayValue = isDatetime ? formatDateTime(value) : (value || '—')

  return (
    <button
      onClick={onStart}
      title="Click to edit"
      className={`group flex items-center gap-1 w-full text-left text-sm rounded px-1 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
    >
      {isSaving && (
        <span className="w-3 h-3 border border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
      )}
      <span className={`block truncate ${value ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'} ${mono ? 'font-mono' : ''}`}>
        {displayValue}
      </span>
      <svg className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
      </svg>
    </button>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────

export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [activeCell, setActiveCell] = useState<{ clientId: string; field: EditableField } | null>(null)
  const [draft, setDraft] = useState('')
  const [savingCell, setSavingCell] = useState<{ clientId: string; field: EditableField } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchClients = useCallback(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  useRealtimeTable('clients', fetchClients)

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase()
    const phone = (c.phone_number ?? '').toLowerCase()
    const email = (c.email ?? '').toLowerCase()
    return !q || name.includes(q) || phone.includes(q) || email.includes(q)
  })

  const handleAdded = (newClient: Client) => {
    setClients((cs) => [newClient, ...cs])
    setAdding(false)
  }

  const startEdit = (client: Client, field: EditableField) => {
    setActiveCell({ clientId: client.id, field })
    if (field === 'zoom_meeting') {
      setDraft(isoToDatetimeLocal(client.zoom_meeting))
    } else {
      setDraft(client[field] ?? '')
    }
  }

  const cancelEdit = () => setActiveCell(null)

  const handleDelete = async (client: Client) => {
    setDeletingId(client.id)
    setConfirmDelete(null)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.error ?? `Delete failed (${res.status})`)
      } else {
        setClients(cs => cs.filter(c => c.id !== client.id))
      }
    } catch {
      setDeleteError('Network error — could not delete client.')
    } finally {
      setDeletingId(null)
    }
  }

  const commitEdit = async (client: Client, field: EditableField) => {
    setActiveCell(null)

    // For datetime fields, convert local → ISO before comparing/saving
    let valueToSave: string | null
    if (field === 'zoom_meeting') {
      valueToSave = draft ? datetimeLocalToIso(draft) : null
      if (valueToSave === client.zoom_meeting) return
    } else {
      const trimmed = draft.trim()
      if (trimmed === (client[field] ?? '')) return
      valueToSave = trimmed || null
    }

    setSavingCell({ clientId: client.id, field })
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: valueToSave }),
      })
      if (res.ok) {
        setClients((cs) => cs.map((c) => c.id === client.id ? { ...c, [field]: valueToSave } : c))
      }
    } finally {
      setSavingCell(null)
    }
  }

  return (
    <>
      {adding && (
        <AddClientModal onClose={() => setAdding(false)} onAdded={handleAdded} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-slate-900 w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Delete client?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {[confirmDelete.first_name, confirmDelete.last_name].filter(Boolean).join(' ') || confirmDelete.phone_number}
              </span>{' '}
              will be permanently removed from the database.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {deleteError && (
        <div className="mb-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg px-4 py-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {deleteError}
          <button onClick={() => setDeleteError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                {['Name', 'Phone', 'Email', 'DISC', 'Appointment', 'Objective 1', 'Obj 2', 'Obj 3', 'Obj 4', 'Since', ''].map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-3.5 rounded bg-slate-100 dark:bg-slate-800 animate-skeleton ${j === 0 ? 'w-28' : j === 1 ? 'w-24' : j === 2 ? 'w-32' : 'w-16'}`} />
                      </td>
                    ))}
                    <td className="px-4 py-3"><div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 animate-skeleton" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState
                      illustration="clients"
                      title="No clients yet"
                      description={search ? 'No clients match your search.' : 'Clients are added automatically when a caller books through Eh-va, or add one manually above.'}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((client) => {
                  const cellProps = (field: EditableField, extra?: { mono?: boolean }) => ({
                    clientId: client.id,
                    field,
                    value: client[field],
                    activeCell,
                    savingCell,
                    draft,
                    mono: extra?.mono,
                    onStart: () => startEdit(client, field),
                    onDraftChange: setDraft,
                    onCommit: () => commitEdit(client, field),
                    onCancel: cancelEdit,
                  })

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                            {client.first_name?.[0] ?? '?'}
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <InlineCell {...cellProps('first_name')} />
                            <span className="text-slate-300 dark:text-slate-600 text-xs flex-shrink-0">·</span>
                            <InlineCell {...cellProps('last_name')} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 min-w-[140px]">
                        <InlineCell {...cellProps('phone_number', { mono: true })} />
                      </td>
                      <td className="px-4 py-2 min-w-[160px]">
                        <InlineCell {...cellProps('email')} />
                      </td>
                      <td className="px-4 py-2 min-w-[80px]">
                        <InlineCell {...cellProps('disc_profile')} />
                      </td>
                      <td className="px-4 py-2 min-w-[180px]">
                        <InlineCell {...cellProps('zoom_meeting')} />
                      </td>
                      <td className="px-4 py-2 min-w-[160px] max-w-[200px]">
                        <InlineCell {...cellProps('objective_1')} />
                      </td>
                      <td className="px-4 py-2 min-w-[140px] max-w-[180px]">
                        <InlineCell {...cellProps('objective_2')} />
                      </td>
                      <td className="px-4 py-2 min-w-[140px] max-w-[180px]">
                        <InlineCell {...cellProps('objective_3')} />
                      </td>
                      <td className="px-4 py-2 min-w-[140px] max-w-[180px]">
                        <InlineCell {...cellProps('objective_4')} />
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {formatDateTime(client.created_at)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() => setConfirmDelete(client)}
                          disabled={deletingId === client.id}
                          className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors disabled:opacity-40"
                          aria-label="Delete client"
                          title="Delete client"
                        >
                          {deletingId === client.id ? (
                            <span className="w-3.5 h-3.5 border border-slate-300 dark:border-slate-600 border-t-red-400 rounded-full animate-spin block" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
            Click any cell to edit · Enter to save · Esc to cancel
          </div>
        )}
      </div>
    </>
  )
}
