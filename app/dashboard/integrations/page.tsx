function mask(value: string | undefined, visibleChars = 6): string {
  if (!value) return '—'
  if (value.length <= visibleChars) return '••••••••'
  return value.slice(0, visibleChars) + '••••••••'
}

function isConfigured(value: string | undefined, placeholder?: string): boolean {
  if (!value) return false
  if (placeholder && value.startsWith(placeholder)) return false
  return true
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
      ok ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-slate-400'}`} />
      {ok ? 'Connected' : 'Not configured'}
    </span>
  )
}

function IntegrationCard({
  icon,
  name,
  description,
  status,
  fields,
  docsUrl,
  accentColor,
}: {
  icon: React.ReactNode
  name: string
  description: string
  status: boolean
  fields: { label: string; value: string | undefined; masked?: boolean; mono?: boolean }[]
  docsUrl?: string
  accentColor: string
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
              <StatusBadge ok={status} />
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
        {fields.map((field) => (
          <div key={field.label} className="px-6 py-3 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 flex-shrink-0">{field.label}</span>
            <span className={`text-xs text-right truncate max-w-xs ${field.mono ? 'font-mono text-slate-700' : 'text-slate-600'}`}>
              {field.value
                ? field.masked
                  ? mask(field.value)
                  : field.value
                : <span className="text-slate-300 italic">not set</span>
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  const vapiSecret = process.env.VAPI_WEBHOOK_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const allowedEmail = process.env.ALLOWED_EMAIL

  return (
    <div className="p-8 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-500 text-sm mt-1">
          External services connected to your Kiros system. Edit values in your <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">.env.local</code> file or Vercel environment variables.
        </p>
      </div>

      <div className="space-y-4">

        {/* VAPI */}
        <IntegrationCard
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
          name="VAPI"
          description="AI voice infrastructure — handles inbound calls, assistant routing, and tool execution."
          status={isConfigured(vapiSecret)}
          accentColor="bg-violet-600"
          docsUrl="https://docs.vapi.ai"
          fields={[
            { label: 'Webhook URL', value: baseUrl ? `${baseUrl}/api/vapi/webhook` : undefined, mono: true },
            { label: 'Webhook Secret', value: vapiSecret, masked: true, mono: true },
            { label: 'Phone Number', value: '+65 3138 2621' },
            { label: 'Voice', value: 'ElevenLabs · eleven_multilingual_v2' },
            { label: 'Transcriber', value: 'Deepgram · nova-3' },
            { label: 'LLM', value: 'OpenAI · gpt-4o-mini' },
          ]}
        />

        {/* Supabase */}
        <IntegrationCard
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 5h16" />
            </svg>
          }
          name="Supabase"
          description="Primary database — stores clients, calls, bookings, and assistant settings."
          status={isConfigured(supabaseUrl) && isConfigured(supabaseKey)}
          accentColor="bg-emerald-600"
          docsUrl="https://supabase.com/dashboard"
          fields={[
            { label: 'Project URL', value: supabaseUrl, mono: true },
            { label: 'Service Role Key', value: supabaseKey, masked: true, mono: true },
            { label: 'Tables', value: 'clients · calls · bookings · settings' },
          ]}
        />

        {/* Twilio */}
        <IntegrationCard
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          name="Twilio"
          description="Phone number carrier — routes +65 3138 2621 inbound calls to VAPI."
          status={true}
          accentColor="bg-red-500"
          docsUrl="https://console.twilio.com"
          fields={[
            { label: 'Phone Number', value: '+65 3138 2621', mono: true },
            { label: 'Routing', value: 'Inbound → VAPI SIP' },
            { label: 'WhatsApp', value: 'Planned — not yet configured' },
          ]}
        />

        {/* ElevenLabs */}
        <IntegrationCard
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          }
          name="ElevenLabs"
          description="AI voice synthesis — provides Eh-va's voice during calls via VAPI."
          status={true}
          accentColor="bg-yellow-500"
          docsUrl="https://elevenlabs.io/app"
          fields={[
            { label: 'Voice ID', value: 'ckdz71REaQKVx2gnOQjQ', mono: true },
            { label: 'Model', value: 'eleven_multilingual_v2' },
            { label: 'Speed', value: '1.1x' },
            { label: 'Stability', value: '0.5' },
            { label: 'Managed by', value: 'VAPI (no direct API key needed)' },
          ]}
        />

        {/* Deepgram */}
        <IntegrationCard
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          }
          name="Deepgram"
          description="Speech-to-text transcription — converts caller audio to text in real time via VAPI."
          status={true}
          accentColor="bg-teal-600"
          docsUrl="https://console.deepgram.com"
          fields={[
            { label: 'Model', value: 'nova-3' },
            { label: 'Language', value: 'English' },
            { label: 'Managed by', value: 'VAPI (no direct API key needed)' },
          ]}
        />

        {/* OpenAI */}
        <IntegrationCard
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          name="OpenAI"
          description="Large language model — powers Eh-va's conversation intelligence via VAPI."
          status={true}
          accentColor="bg-slate-700"
          docsUrl="https://platform.openai.com"
          fields={[
            { label: 'Model', value: 'gpt-4o-mini' },
            { label: 'Temperature', value: '0.2' },
            { label: 'Managed by', value: 'VAPI (no direct API key needed)' },
          ]}
        />

        {/* Google OAuth */}
        <IntegrationCard
          icon={
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
            </svg>
          }
          name="Google OAuth"
          description="Dashboard authentication — restricts login to a single whitelisted Google account."
          status={isConfigured(googleClientId) && isConfigured(googleClientSecret)}
          accentColor="bg-blue-500"
          docsUrl="https://console.cloud.google.com"
          fields={[
            { label: 'Client ID', value: googleClientId, masked: true, mono: true },
            { label: 'Client Secret', value: googleClientSecret, masked: true, mono: true },
            { label: 'Allowed Email', value: allowedEmail },
            { label: 'Callback URL', value: baseUrl ? `${baseUrl}/api/auth/callback/google` : undefined, mono: true },
          ]}
        />

      </div>

      <p className="mt-6 text-xs text-slate-400">
        Key values are masked for security. To update them, edit <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env.local</code> locally or go to your Vercel project → Settings → Environment Variables.
      </p>
    </div>
  )
}
