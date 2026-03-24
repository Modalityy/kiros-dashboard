'use client'

import { useState } from 'react'

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

function EditModal({ client, onClose, onSaved }: { client: Client; onClose: () => void; onSaved: (updated: Client) => void }) {
  const [form, setForm] = useState({
    first_name: client.first_name ?? '',
    last_name: client.last_name ?? '',
    email: client.email ?? '',
    disc_profile: client.disc_profile ?? '',
    objective_1: client.objective_1 ?? '',
    objective_2: client.objective_2 ?? '',
    objective_3: client.objective_3 ?? '',
    objective_4: client.objective_4 ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      onSaved({ ...client, ...form })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Edit Client</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['first_name', 'last_name'] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-500 mb-1 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
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
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">DISC Profile</label>
              <input
                type="text"
                value={form.disc_profile}
                onChange={(e) => setForm((f) => ({ ...f, disc_profile: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Objectives</label>
            <div className="space-y-2">
              {(['objective_1', 'objective_2', 'objective_3', 'objective_4'] as const).map((field, i) => (
                <input
                  key={field}
                  type="text"
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
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ClientsTable({ clients: initial }: { clients: Client[] }) {
  const [clients, setClients] = useState(initial)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Client | null>(null)

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase()
    const phone = (c.phone_number ?? '').toLowerCase()
    const email = (c.email ?? '').toLowerCase()
    return !q || name.includes(q) || phone.includes(q) || email.includes(q)
  })

  const handleSaved = (updated: Client) => {
    setClients((cs) => cs.map((c) => (c.id === updated.id ? updated : c)))
    setEditing(null)
  }

  return (
    <>
      {editing && (
        <EditModal
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
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
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No clients found.
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {client.first_name?.[0] ?? '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {client.first_name} {client.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap font-mono">
                      {client.phone_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {client.email ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {client.disc_profile ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {client.zoom_meeting
                        ? formatDateTime(client.zoom_meeting)
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px]">
                      <span className="block truncate" title={client.objective_1 ?? ''}>
                        {client.objective_1 ?? <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={client.objective_2 ?? ''}>
                        {client.objective_2 ?? <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={client.objective_3 ?? ''}>
                        {client.objective_3 ?? <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                      <span className="block truncate" title={client.objective_4 ?? ''}>
                        {client.objective_4 ?? <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(client.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setEditing(client)}
                        className="text-xs text-slate-400 hover:text-blue-600 font-medium transition-colors"
                      >
                        Edit
                      </button>
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
