'use client'

import { useState, useEffect } from 'react'

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


const EMPTY_ADD_FORM = {
  phone_number: '',
  first_name: '',
  last_name: '',
  email: '',
  disc_profile: '',
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
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="add-client-title" className="text-base font-semibold text-slate-900">Add Client</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="add-phone" className="block text-xs font-medium text-slate-500 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="add-phone"
              type="tel"
              value={form.phone_number}
              onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              placeholder="+65 9123 4567"
              className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['first_name', 'last_name'] as const).map((field) => (
              <div key={field}>
                <label htmlFor={`add-${field}`} className="block text-xs font-medium text-slate-500 mb-1 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  id={`add-${field}`}
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-email" className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input
                id="add-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="add-disc" className="block text-xs font-medium text-slate-500 mb-1">DISC Profile</label>
              <input
                id="add-disc"
                type="text"
                value={form.disc_profile}
                onChange={(e) => setForm((f) => ({ ...f, disc_profile: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <p className="block text-xs font-medium text-slate-500 mb-1">Objectives</p>
            <div className="space-y-2">
              {(['objective_1', 'objective_2', 'objective_3', 'objective_4'] as const).map((field, i) => (
                <input
                  key={field}
                  type="text"
                  aria-label={`Objective ${i + 1}`}
                  placeholder={`Objective ${i + 1}`}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
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

type EditableField = 'first_name' | 'last_name' | 'email' | 'disc_profile' | 'phone_number' | 'objective_1' | 'objective_2' | 'objective_3' | 'objective_4'

export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Inline editing state
  const [activeCell, setActiveCell] = useState<{ clientId: string; field: EditableField } | null>(null)
  const [draft, setDraft] = useState('')
  const [savingCell, setSavingCell] = useState<{ clientId: string; field: EditableField } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null)

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
    setDraft(client[field] ?? '')
  }

  const cancelEdit = () => setActiveCell(null)

  const handleDelete = async (client: Client) => {
    setDeletingId(client.id)
    setConfirmDelete(null)
    try {
      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      setClients(cs => cs.filter(c => c.id !== client.id))
    } finally {
      setDeletingId(null)
    }
  }

  const commitEdit = async (clientId: string, field: EditableField, originalValue: string | null) => {
    setActiveCell(null)
    const trimmed = draft.trim()
    if (trimmed === (originalValue ?? '')) return // no change
    setSavingCell({ clientId, field })
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: trimmed }),
      })
      if (res.ok) {
        setClients((cs) => cs.map((c) => c.id === clientId ? { ...c, [field]: trimmed || null } : c))
      }
    } finally {
      setSavingCell(null)
    }
  }

  function InlineCell({ client, field, mono, maxW }: { client: Client; field: EditableField; mono?: boolean; maxW?: string }) {
    const isActive = activeCell?.clientId === client.id && activeCell.field === field
    const isSaving = savingCell?.clientId === client.id && savingCell.field === field
    const value = client[field] ?? ''

    if (isActive) {
      return (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commitEdit(client.id, field, client[field])}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit(client.id, field, client[field]) }
            if (e.key === 'Escape') cancelEdit()
          }}
          className={`w-full min-w-[100px] text-sm border border-blue-400 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${mono ? 'font-mono' : ''}`}
        />
      )
    }

    return (
      <button
        onClick={() => startEdit(client, field)}
        title="Click to edit"
        className={`group flex items-center gap-1 w-full text-left text-sm rounded px-1 py-0.5 hover:bg-blue-50 transition-colors ${maxW ?? ''}`}
      >
        {isSaving ? (
          <span className="w-3 h-3 border border-slate-300 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
        ) : null}
        <span className={`block truncate ${value ? 'text-slate-700' : 'text-slate-300'} ${mono ? 'font-mono' : ''}`}>
          {value || '—'}
        </span>
        <svg className="w-3 h-3 text-slate-300 group-hover:text-blue-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
        </svg>
      </button>
    )
  }

  return (
    <>
      {adding && (
        <AddClientModal
          onClose={() => setAdding(false)}
          onAdded={handleAdded}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete client?</h2>
            <p className="text-sm text-slate-500 mb-5">
              <span className="font-medium text-slate-700">{[confirmDelete.first_name, confirmDelete.last_name].filter(Boolean).join(' ') || confirmDelete.phone_number}</span> will be permanently removed from the database.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
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

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <span className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          Loading clients…
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {[
                  'Name', 'Phone', 'Email', 'DISC',
                  'Next Zoom', 'Objective 1', 'Obj 2', 'Obj 3', 'Obj 4', 'Since', '',
                ].map((col, i) => (
                  <th
                    key={i}
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
                  <td colSpan={11}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-slate-700 font-medium text-sm">No clients yet</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-xs">
                        {search ? 'No clients match your search.' : 'Clients are added automatically when a caller books through Eh-va, or add one manually above.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name — first + last inline editable */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {client.first_name?.[0] ?? '?'}
                        </div>
                        <div className="flex gap-1 min-w-0">
                          <InlineCell client={client} field="first_name" />
                          <InlineCell client={client} field="last_name" />
                        </div>
                      </div>
                    </td>
                    {/* Phone — editable, normalised on save */}
                    <td className="px-4 py-2 min-w-[140px]">
                      <InlineCell client={client} field="phone_number" mono />
                    </td>
                    <td className="px-4 py-2 min-w-[160px]">
                      <InlineCell client={client} field="email" />
                    </td>
                    <td className="px-4 py-2 min-w-[80px]">
                      <InlineCell client={client} field="disc_profile" />
                    </td>
                    {/* Zoom — read-only (managed by booking flow) */}
                    <td className="px-4 py-2 text-sm text-slate-500 whitespace-nowrap">
                      {client.zoom_meeting ? formatDateTime(client.zoom_meeting) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2 min-w-[160px] max-w-[200px]">
                      <InlineCell client={client} field="objective_1" />
                    </td>
                    <td className="px-4 py-2 min-w-[140px] max-w-[180px]">
                      <InlineCell client={client} field="objective_2" />
                    </td>
                    <td className="px-4 py-2 min-w-[140px] max-w-[180px]">
                      <InlineCell client={client} field="objective_3" />
                    </td>
                    <td className="px-4 py-2 min-w-[140px] max-w-[180px]">
                      <InlineCell client={client} field="objective_4" />
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(client.created_at)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => setConfirmDelete(client)}
                        disabled={deletingId === client.id}
                        className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        aria-label="Delete client"
                        title="Delete client"
                      >
                        {deletingId === client.id ? (
                          <span className="w-3.5 h-3.5 border border-slate-300 border-t-red-400 rounded-full animate-spin block" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
            Click any cell to edit · Enter to save · Esc to cancel
          </div>
        )}
      </div>
    </>
  )
}
