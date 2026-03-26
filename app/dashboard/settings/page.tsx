'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_RETURNING_PROMPT, DEFAULT_NEW_PROMPT } from '@/lib/default-prompts'

type SettingKey = 'prompt_returning' | 'prompt_new' | 'first_message_new' | 'first_message_returning'
type VoiceKey = 'voice_id' | 'voice_speed' | 'voice_stability'

const VOICE_DEFAULTS: Record<VoiceKey, string> = {
  voice_id: 'ckdz71REaQKVx2gnOQjQ',
  voice_speed: '1.1',
  voice_stability: '0.5',
}

const LLM_DEFAULT = 'gpt-4o-mini'

const LLM_MODELS = [
  { id: 'gpt-4.1-nano',  label: 'GPT-4.1 Nano',  description: 'Fastest · lowest cost' },
  { id: 'gpt-4.1-mini',  label: 'GPT-4.1 Mini',  description: 'Best value upgrade from 4o-mini' },
  { id: 'gpt-4.1',       label: 'GPT-4.1',        description: 'High capability · moderate cost' },
  { id: 'gpt-4o-mini',   label: 'GPT-4o Mini',    description: 'Current default' },
  { id: 'gpt-4o',        label: 'GPT-4o',         description: 'Most capable GPT-4o' },
  { id: '__custom__',    label: 'Custom…',         description: 'Enter any model ID manually' },
]

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
  const [savedValues, setSavedValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setValues(data)
        setSavedValues(data)
        setLoading(false)
      })
  }, [])

  const getVoice = (key: VoiceKey) => values[key] ?? VOICE_DEFAULTS[key]

  // llm_model helpers
  const storedModel = values['llm_model'] ?? LLM_DEFAULT
  const isKnownModel = LLM_MODELS.some(m => m.id === storedModel && m.id !== '__custom__')
  const selectedPreset = isKnownModel ? storedModel : '__custom__'
  const customModelValue = isKnownModel ? '' : storedModel

  const getLLMModel = () => values['llm_model'] ?? LLM_DEFAULT

  // Warn on navigation away with unsaved changes
  const isPromptDirty = SECTIONS.some(({ key, defaultValue }) => {
    const current = values[key] !== undefined ? values[key] : defaultValue
    const persisted = savedValues[key] !== undefined ? savedValues[key] : defaultValue
    return current !== persisted
  })
  const isVoiceDirty = (Object.keys(VOICE_DEFAULTS) as VoiceKey[]).some(
    (k) => (values[k] ?? VOICE_DEFAULTS[k]) !== (savedValues[k] ?? VOICE_DEFAULTS[k])
  )
  const isLLMDirty = getLLMModel() !== (savedValues['llm_model'] ?? LLM_DEFAULT)
  const isDirty = isPromptDirty || isVoiceDirty || isLLMDirty

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault() }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const getValue = (key: SettingKey, defaultValue: string) =>
    values[key] !== undefined ? values[key] : defaultValue

  const handleSaveAll = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const promptEntries = SECTIONS.map(({ key, defaultValue }) => ({ key, value: getValue(key, defaultValue) }))
      const voiceEntries = (Object.keys(VOICE_DEFAULTS) as VoiceKey[]).map((k) => ({ key: k, value: getVoice(k) }))
      const llmEntry = { key: 'llm_model', value: getLLMModel() }
      const results = await Promise.all(
        [...promptEntries, ...voiceEntries, llmEntry].map(({ key, value }) =>
          fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
          }).then(r => r.json())
        )
      )
      const failed = results.find((r: any) => r.error)
      if (failed) {
        setSaveError(failed.error)
      } else {
        const snapshot: Record<string, string> = {}
        SECTIONS.forEach(({ key, defaultValue }) => {
          snapshot[key] = values[key] !== undefined ? values[key] : defaultValue
        })
        ;(Object.keys(VOICE_DEFAULTS) as VoiceKey[]).forEach((k) => {
          snapshot[k] = getVoice(k)
        })
        snapshot['llm_model'] = getLLMModel()
        setSavedValues(snapshot)
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

      {/* LLM model selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Language Model</h2>
          <p className="text-xs text-slate-400 mt-0.5">The LLM that powers Eh-va's conversation. Changes take effect on the next call.</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Preset cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LLM_MODELS.map((m) => {
              const active = selectedPreset === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.id === '__custom__') {
                      setValues(v => ({ ...v, llm_model: '' }))
                    } else {
                      setValues(v => ({ ...v, llm_model: m.id }))
                    }
                  }}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    active
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-slate-800'}`}>
                    {m.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${active ? 'text-blue-500' : 'text-slate-400'}`}>
                    {m.description}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Custom model input — shown when custom is selected or stored value is unknown */}
          {selectedPreset === '__custom__' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Custom Model ID</label>
              <input
                type="text"
                value={customModelValue}
                onChange={e => setValues(v => ({ ...v, llm_model: e.target.value }))}
                placeholder="e.g. gpt-5, gpt-5-mini, o4-mini…"
                className="w-full max-w-sm text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">
                Must match a model ID supported by your VAPI + OpenAI provider.
                Check <span className="font-medium text-slate-500">docs.vapi.ai</span> for the latest list.
              </p>
            </div>
          )}

          {/* Active model pill */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Active model:</span>
            <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {getLLMModel() || <span className="text-slate-400 italic">not set</span>}
            </code>
            {isLLMDirty && <span className="text-xs text-amber-600 font-medium">· unsaved</span>}
          </div>
        </div>
      </div>

      {/* Voice settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Voice Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Controls ElevenLabs voice output. Changes take effect on the next call.</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Voice ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Voice ID</label>
            <input
              type="text"
              value={getVoice('voice_id')}
              onChange={e => setValues(v => ({ ...v, voice_id: e.target.value }))}
              className="w-full max-w-sm text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ElevenLabs voice ID"
            />
            <p className="text-xs text-slate-400 mt-1">Find this in your ElevenLabs voice library.</p>
          </div>

          {/* Speed */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600">Speed</label>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {parseFloat(getVoice('voice_speed')).toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              min="0.25"
              max="4.0"
              step="0.05"
              value={getVoice('voice_speed')}
              onChange={e => setValues(v => ({ ...v, voice_speed: e.target.value }))}
              className="w-full max-w-sm accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 max-w-sm mt-0.5">
              <span>0.25×</span>
              <span>4.0×</span>
            </div>
          </div>

          {/* Stability */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600">Stability</label>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {parseFloat(getVoice('voice_stability')).toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={getVoice('voice_stability')}
              onChange={e => setValues(v => ({ ...v, voice_stability: e.target.value }))}
              className="w-full max-w-sm accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 max-w-sm mt-0.5">
              <span>More variable</span>
              <span>More stable</span>
            </div>
          </div>
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
                Reset to Default
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
      <div className="mt-8 flex items-center justify-between gap-4">
        {isDirty && !saving && (
          <span className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            Unsaved changes
          </span>
        )}
        {!isDirty && <span />}
        <div className="flex items-center gap-4">
          <div role="status" aria-live="polite" className="text-sm font-medium">
            {saveError && <span className="text-red-600">{saveError}</span>}
            {saved && <span className="text-green-600 animate-fade-in-up">Changes saved successfully ✓</span>}
          </div>
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
    </div>
  )
}
