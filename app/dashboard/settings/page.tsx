'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_RETURNING_PROMPT, DEFAULT_NEW_PROMPT } from '@/lib/default-prompts'

type SettingKey = 'prompt_returning' | 'prompt_new' | 'first_message_new' | 'first_message_returning'

const SECTIONS: { key: SettingKey; label: string; description: string; rows: number; defaultValue: string }[] = [
  {
    key: 'prompt_returning',
    label: 'Returning Caller Prompt',
    description: 'System prompt for callers already in your database. Use {firstName}, {lastName}, {email}, {zoomDisplay}, {objective_1}–{objective_4} as placeholders.',
    rows: 24,
    defaultValue: DEFAULT_RETURNING_PROMPT,
  },
  {
    key: 'prompt_new',
    label: 'New Caller Prompt',
    description: 'System prompt for first-time callers with no profile on file.',
    rows: 24,
    defaultValue: DEFAULT_NEW_PROMPT,
  },
  {
    key: 'first_message_new',
    label: 'First Message — New Caller',
    description: 'What Eh-va says when answering a new caller.',
    rows: 3,
    defaultValue: "Hi there! You've reached Daniel Wong's financial advisory service. I'm Eh-va — how can I help you today?",
  },
  {
    key: 'first_message_returning',
    label: 'First Message — Returning Caller',
    description: 'What Eh-va says when answering a returning caller. Use {firstName} as a placeholder.',
    rows: 3,
    defaultValue: 'Hi {firstName}!',
  },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setValues(data)
        setLoading(false)
      })
  }, [])

  const getValue = (key: SettingKey, defaultValue: string) =>
    values[key] !== undefined ? values[key] : defaultValue

  const handleSaveAll = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const results = await Promise.all(
        SECTIONS.map(({ key, defaultValue }) =>
          fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: getValue(key, defaultValue) }),
          }).then(r => r.json())
        )
      )
      const failed = results.find((r: any) => r.error)
      if (failed) {
        setSaveError(failed.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setSaveError('Network error — changes not saved.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Assistant</h1>
        <p className="text-slate-500 text-sm mt-1">
          Edit Eh-va's system prompts and messages. Changes take effect on the next call.
        </p>
      </div>

      {/* Placeholder reference */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-8">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Available Placeholders</p>
        <div className="flex flex-wrap gap-2">
          {['{firstName}', '{lastName}', '{email}', '{zoomDisplay}', '{objective_1}', '{objective_2}', '{objective_3}', '{objective_4}'].map(p => (
            <code key={p} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded font-mono">{p}</code>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {SECTIONS.map(({ key, label, description, rows, defaultValue }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
              </div>
              <button
                onClick={() => setValues(v => ({ ...v, [key]: defaultValue }))}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"
              >
                Reset
              </button>
            </div>
            <div className="p-4">
              <textarea
                rows={rows}
                value={getValue(key, defaultValue)}
                onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                className="w-full text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Single save button */}
      <div className="mt-8 flex items-center justify-end gap-4">
        {saveError && (
          <span className="text-sm text-red-600 font-medium">
            {saveError}
          </span>
        )}
        {saved && (
          <span className="text-sm text-green-600 font-medium animate-fade-in-up">
            Changes saved successfully ✓
          </span>
        )}
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
