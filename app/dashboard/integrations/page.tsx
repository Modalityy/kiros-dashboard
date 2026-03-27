'use client'

import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type EnvStatus = {
  vapiSecretSet: boolean
  vapiSecret: string | null
  vapiPrivateKeySet: boolean
  vapiWebhookUrl: string | null
  supabaseUrl: string | null
  supabaseKeySet: boolean
  supabaseKey: string | null
  googleOAuthSet: boolean
  googleClientId: string | null
  googleClientSecret: string | null
  allowedEmail: string | null
  callbackUrl: string | null
  sheetsIdSet: boolean
  sheetsId: string | null
  serviceAccountSet: boolean
  serviceAccountEmail: string | null
}

type Settings = Record<string, string>

type BadgeVariant = 'connected' | 'not_configured' | 'via_vapi'

// ── Small components ───────────────────────────────────────────────────────

function StatusBadge({ variant }: { variant: BadgeVariant }) {
  if (variant === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Connected
      </span>
    )
  }
  if (variant === 'via_vapi') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        Via VAPI
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Not configured
    </span>
  )
}

function ReadOnlyRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  const display = value ?? <span className="text-slate-300 italic">not set</span>
  return (
    <div className="px-6 py-3 flex items-center justify-between gap-4 bg-slate-50/50">
      <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
      <span className={`text-xs text-right truncate max-w-xs ${mono ? 'font-mono text-slate-600' : 'text-slate-500'}`}>
        {display}
      </span>
    </div>
  )
}

function SecretRow({ label, value }: { label: string; value: string | null }) {
  const [visible, setVisible] = useState(false)
  if (!value) return <ReadOnlyRow label={label} value={null} />
  return (
    <div className="px-6 py-3 flex items-center justify-between gap-4 bg-slate-50/50">
      <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-mono text-slate-600 truncate max-w-xs">
          {visible ? value : '••••••••••••••••'}
        </span>
        <button
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide value' : 'Show value'}
          className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-200"
        >
          {visible ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

function EditableKeyRow({
  label,
  settingKey,
  placeholder,
  value,
  onChange,
  onSave,
  saving,
}: {
  label: string
  settingKey: string
  placeholder?: string
  value: string
  onChange: (key: string, val: string) => void
  onSave: (key: string) => Promise<boolean>
  saving: boolean
  saved: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const isDirty = value.trim().length > 0

  const handleSave = async () => {
    setStatus('idle')
    setErrorMsg(null)
    const ok = await onSave(settingKey)
    if (ok) {
      onChange(settingKey, '')
      setStatus('saved')
    } else {
      setStatus('error')
      setErrorMsg('Save failed — check Supabase settings table exists')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== 'idle') setStatus('idle')
    onChange(settingKey, e.target.value)
  }

  const isSaved = status === 'saved'
  const isError = status === 'error'

  return (
    <div className="px-6 py-3 border-t border-slate-100 space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 flex-shrink-0 w-32">{label}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={value}
          placeholder={isSaved ? 'Key saved — paste to update' : (placeholder ?? 'Paste API key…')}
          onChange={handleChange}
          className={`flex-1 min-w-0 text-xs font-mono border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 bg-white transition-colors ${
            isSaved ? 'border-green-300 focus:ring-green-400 bg-green-50/40 placeholder:text-green-600'
            : isError ? 'border-red-300 focus:ring-red-400'
            : 'border-slate-200 focus:ring-blue-500'
          }`}
        />
        <button
          onClick={handleSave}
          disabled={saving || isSaved || !isDirty}
          className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            isSaved ? 'bg-green-100 text-green-700 cursor-default'
            : isError ? 'bg-red-100 text-red-700'
            : isDirty && !saving ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : isSaved ? '✓ Saved' : isError ? 'Retry' : 'Save'}
        </button>
      </div>
      {isError && errorMsg && (
        <p className="text-xs text-red-600 pl-36">{errorMsg}</p>
      )}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────

function IntegrationCard({
  icon,
  name,
  description,
  badge,
  accentColor,
  docsUrl,
  readOnlyRows,
  editableRows,
  settings,
  storedKeys,
  onSettingChange,
  onSettingSave,
  savingKey,
  savedKey,
}: {
  icon: React.ReactNode
  name: string
  description: string
  badge: BadgeVariant
  accentColor: string
  docsUrl?: string
  readOnlyRows: { label: string; value: string | null | undefined; mono?: boolean; secret?: boolean }[]
  editableRows: { label: string; settingKey: string; placeholder?: string }[]
  settings: Settings
  storedKeys: Settings
  onSettingChange: (key: string, val: string) => void
  onSettingSave: (key: string) => Promise<boolean>
  savingKey: string | null
  savedKey: string | null
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accentColor}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-slate-900">{name}</h2>
              <StatusBadge variant={badge} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            Docs
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <div className="border-t border-slate-100 divide-y divide-slate-50">
        {readOnlyRows.map((row) =>
          row.secret
            ? <SecretRow key={row.label} label={row.label} value={row.value ?? null} />
            : <ReadOnlyRow key={row.label} label={row.label} value={row.value} mono={row.mono} />
        )}
      </div>

      {editableRows.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/30">
          <div className="px-6 pt-3 pb-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">API Keys</p>
          </div>
          {editableRows.map((row) => {
            const stored = storedKeys[row.settingKey] ?? null
            return (
              <div key={row.settingKey}>
                {stored && <SecretRow label="Current key" value={stored} />}
                <EditableKeyRow
                  label={stored ? 'Replace key' : row.label}
                  settingKey={row.settingKey}
                  placeholder={stored ? 'Paste new key to replace' : row.placeholder}
                  value={settings[row.settingKey] ?? ''}
                  onChange={onSettingChange}
                  onSave={onSettingSave}
                  saving={savingKey === row.settingKey}
                  saved={savedKey === row.settingKey}
                />
              </div>
            )
          })}
          <div className="h-3" />
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [env, setEnv] = useState<EnvStatus | null>(null)
  const [storedKeys, setStoredKeys] = useState<Settings>({})  // what's in Supabase
  const [draftKeys, setDraftKeys] = useState<Settings>({})    // what's being typed
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const refreshSettings = () =>
    fetch('/api/settings').then(r => r.json()).then(setStoredKeys)

  useEffect(() => {
    Promise.all([
      fetch('/api/env-check').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([envData, settingsData]) => {
      setEnv(envData)
      setStoredKeys(settingsData)
      setLoading(false)
    })
  }, [])

  // settings passed to cards = draft input values (not stored values)
  const settings = draftKeys

  const handleChange = (key: string, val: string) => {
    setDraftKeys((s) => ({ ...s, [key]: val }))
  }

  const handleSave = async (key: string): Promise<boolean> => {
    setSavingKey(key)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: draftKeys[key] ?? '' }),
      })
      if (!res.ok) return false
      await refreshSettings()
      return true
    } catch {
      return false
    } finally {
      setSavingKey(null)
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

  const e = env!

  const hasSetting = (key: string) => !!storedKeys[key]

  const cardProps = { settings, storedKeys, onSettingChange: handleChange, onSettingSave: handleSave, savingKey, savedKey: null }

  return (
    <div className="p-8 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-500 text-sm mt-1">
          API keys entered here are stored in your Supabase settings table.
          Environment variables (Vercel) are read-only and shown for reference.
        </p>
      </div>

      <div className="space-y-4">

        {/* VAPI */}
        <IntegrationCard
          {...cardProps}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
          name="VAPI"
          description="AI voice infrastructure — handles inbound calls, assistant routing, transcription, and tool execution."
          badge={e.vapiPrivateKeySet ? 'connected' : 'not_configured'}
          accentColor="bg-violet-600"
          docsUrl="https://docs.vapi.ai"
          readOnlyRows={[
            { label: 'Private Key', value: e.vapiPrivateKeySet ? '✓ Set via Vercel env (VAPI_PRIVATE_KEY)' : '✗ Not set — add to Vercel environment variables' },
            { label: 'Webhook URL', value: e.vapiWebhookUrl, mono: true },
            { label: 'Webhook Secret', value: e.vapiSecret, secret: true },
            { label: 'Phone Number', value: '+65 3138 2621' },
            { label: 'Assistant', value: 'Eh-va · dynamic config via assistant-request webhook' },
            { label: 'Voice', value: 'ElevenLabs · eleven_multilingual_v2' },
            { label: 'Transcriber', value: 'Deepgram · nova-3' },
            { label: 'LLM', value: 'OpenAI · gpt-4o-mini (VAPI native)' },
            { label: 'Knowledge Base', value: '3 files · provider: google' },
            { label: 'Tools', value: 'book_appointment · reschedule · cancel · update_client_details' },
            { label: 'Max Duration', value: '640 s · background denoising on · recording on' },
          ]}
          editableRows={[
            { label: 'Public Key', settingKey: 'vapi_public_key', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (client-side SDK)' },
          ]}
        />

        {/* Supabase */}
        <IntegrationCard
          {...cardProps}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 5h16" />
            </svg>
          }
          name="Supabase"
          description="Primary database — stores clients, calls, bookings, and assistant settings."
          badge={e.supabaseUrl && e.supabaseKeySet ? 'connected' : 'not_configured'}
          accentColor="bg-emerald-600"
          docsUrl="https://supabase.com/dashboard"
          readOnlyRows={[
            { label: 'Project URL', value: e.supabaseUrl, mono: true },
            { label: 'Service Role Key', value: e.supabaseKey, secret: true },
            { label: 'Tables', value: 'clients · calls · bookings · settings' },
          ]}
          editableRows={[]}
        />

        {/* Google Sheets */}
        <IntegrationCard
          {...cardProps}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          }
          name="Google Sheets"
          description="Customer data mirror — call records and client updates are synced to the Customer Database sheet."
          badge={e.sheetsIdSet && e.serviceAccountSet ? 'connected' : 'not_configured'}
          accentColor="bg-green-600"
          docsUrl="https://docs.google.com/spreadsheets"
          readOnlyRows={[
            { label: 'Sheets ID', value: e.sheetsId, secret: true },
            { label: 'Service Account', value: e.serviceAccountEmail, mono: true },
            { label: 'Columns', value: 'A–L: Name, Phone, DISC, Zoom, Email, Objectives, Transcript, Report' },
          ]}
          editableRows={[]}
        />

        {/* Twilio */}
        <IntegrationCard
          {...cardProps}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          name="Twilio"
          description="Phone number carrier — routes +65 3138 2621 inbound calls to VAPI. WhatsApp messaging planned."
          badge={hasSetting('twilio_account_sid') && hasSetting('twilio_auth_token') ? 'connected' : 'not_configured'}
          accentColor="bg-red-500"
          docsUrl="https://console.twilio.com"
          readOnlyRows={[
            { label: 'Phone Number', value: '+65 3138 2621', mono: true },
            { label: 'Routing', value: 'Inbound → VAPI SIP' },
            { label: 'WhatsApp', value: 'Planned — not yet active' },
          ]}
          editableRows={[
            { label: 'Account SID', settingKey: 'twilio_account_sid', placeholder: 'ACxxxxxxxxxxxxxxxx' },
            { label: 'Auth Token', settingKey: 'twilio_auth_token', placeholder: 'Auth token…' },
          ]}
        />

        {/* ElevenLabs */}
        <IntegrationCard
          {...cardProps}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          }
          name="ElevenLabs"
          description="AI voice synthesis — provides Eh-va's voice during calls. Managed through VAPI."
          badge={hasSetting('elevenlabs_api_key') ? 'connected' : 'via_vapi'}
          accentColor="bg-yellow-500"
          docsUrl="https://elevenlabs.io/app"
          readOnlyRows={[
            { label: 'Voice ID', value: 'ckdz71REaQKVx2gnOQjQ', mono: true },
            { label: 'Model', value: 'eleven_multilingual_v2' },
            { label: 'Speed', value: '1.1x · Stability 0.5' },
          ]}
          editableRows={[
            { label: 'API Key', settingKey: 'elevenlabs_api_key', placeholder: 'sk_••••••••' },
          ]}
        />

        {/* Deepgram */}
        <IntegrationCard
          {...cardProps}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          }
          name="Deepgram"
          description="Speech-to-text transcription — converts caller audio to text in real time. Managed through VAPI."
          badge={hasSetting('deepgram_api_key') ? 'connected' : 'via_vapi'}
          accentColor="bg-teal-600"
          docsUrl="https://console.deepgram.com"
          readOnlyRows={[
            { label: 'Model', value: 'nova-3' },
            { label: 'Language', value: 'English' },
          ]}
          editableRows={[
            { label: 'API Key', settingKey: 'deepgram_api_key', placeholder: 'Token ••••••••' },
          ]}
        />

        {/* OpenAI */}
        <IntegrationCard
          {...cardProps}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          name="OpenAI"
          description="Language model — used by VAPI's native LLM provider. Your API key is stored here for model selection."
          badge={hasSetting('openai_api_key') ? 'connected' : 'not_configured'}
          accentColor="bg-slate-700"
          docsUrl="https://platform.openai.com"
          readOnlyRows={[
            { label: 'Routing', value: 'Via VAPI native LLM' },
            { label: 'Temperature', value: '0.2' },
          ]}
          editableRows={[
            { label: 'API Key', settingKey: 'openai_api_key', placeholder: 'sk-••••••••' },
          ]}
        />

        {/* Google OAuth */}
        <IntegrationCard
          {...cardProps}
          icon={
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
            </svg>
          }
          name="Google OAuth"
          description="Dashboard authentication — restricts login to a single whitelisted Google account."
          badge={e.googleOAuthSet ? 'connected' : 'not_configured'}
          accentColor="bg-blue-500"
          docsUrl="https://console.cloud.google.com"
          readOnlyRows={[
            { label: 'Client ID', value: e.googleClientId, secret: true },
            { label: 'Client Secret', value: e.googleClientSecret, secret: true },
            { label: 'Allowed Email', value: e.allowedEmail },
            { label: 'Callback URL', value: e.callbackUrl, mono: true },
          ]}
          editableRows={[]}
        />

      </div>

      <p className="mt-6 text-xs text-slate-400">
        Environment variable fields are read-only — update them in your Vercel project under{' '}
        <span className="font-medium text-slate-500">Settings → Environment Variables</span>.
      </p>
    </div>
  )
}
