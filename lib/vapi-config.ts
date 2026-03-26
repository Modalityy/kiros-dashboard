import { Client, getAllSettings } from './supabase'
import { DEFAULT_RETURNING_PROMPT, DEFAULT_NEW_PROMPT } from './default-prompts'

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

const TOOLS_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/tools`

const TRANSCRIBER = {
  model: 'nova-3',
  language: 'en',
  provider: 'deepgram',
}



const ANALYSIS_PLAN = {
  summaryPlan: {
    messages: [
      { role: 'system', content: 'You are an expert note taker. Summarize the call in 2-3 sentences.' },
      { role: 'user', content: 'Transcript:\n\n{{transcript}}\n\nEnded reason: {{endedReason}}' },
    ],
  },
  successEvaluationPlan: {
    rubric: 'AutomaticRubric',
    messages: [
      {
        role: 'system',
        content: 'You are an expert call evaluator. Determine if the call was successful based on the objectives.\n\nRubric:\n\n{{rubric}}\n\nOnly respond with the evaluation result.',
      },
      { role: 'user', content: 'Transcript:\n\n{{transcript}}\n\nEnded reason: {{endedReason}}' },
      { role: 'user', content: 'System prompt:\n\n{{systemPrompt}}' },
    ],
  },
}

function buildTools() {
  return [
    { type: 'endCall' },
    {
      type: 'function',
      function: {
        name: 'book_appointment',
        description: 'Books a new appointment. Only call after first name, last name, and email are explicitly confirmed by the caller.',
        parameters: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'dateTime', 'bookingType', 'appointmentType'],
          properties: {
            firstName:       { type: 'string', description: 'First name — must be spoken by the caller. Do not pass empty.' },
            lastName:        { type: 'string', description: 'Last name — must be spoken by the caller. Do not pass empty.' },
            email:           { type: 'string', description: 'Email — must be spoken by the caller. Do not pass empty.' },
            dateTime:        { type: 'string', description: 'Format: YYYY-MM-DDThh:mm:ss+08:00 (Singapore time)' },
            bookingType:     { type: 'string', enum: ['schedule'] },
            appointmentType: { type: 'string', enum: ['Zoom Meeting'] },
            clientObjective: { type: 'string', description: "Caller's financial goal or objective." },
          },
        },
      },
      server: { url: TOOLS_URL, headers: {} },
    },
    {
      type: 'function',
      function: {
        name: 'reschedule_appointment',
        description: 'Reschedules an existing appointment.',
        parameters: {
          type: 'object',
          required: ['email', 'newDateTime', 'bookingType', 'appointmentType'],
          properties: {
            email:           { type: 'string' },
            newDateTime:     { type: 'string', description: 'Format: YYYY-MM-DDThh:mm:ss+08:00 (Singapore time)' },
            prevDateTime:    { type: 'string', description: 'Format: YYYY-MM-DDThh:mm:ss+08:00' },
            bookingType:     { type: 'string', enum: ['reschedule'] },
            appointmentType: { type: 'string', enum: ['Zoom Meeting'] },
          },
        },
      },
      server: { url: TOOLS_URL, headers: {} },
    },
    {
      type: 'function',
      function: {
        name: 'cancel_appointment',
        description: 'Cancels an existing appointment.',
        parameters: {
          type: 'object',
          required: ['email', 'bookingType', 'appointmentType'],
          properties: {
            email:           { type: 'string' },
            prevDateTime:    { type: 'string', description: 'Format: YYYY-MM-DDThh:mm:ss+08:00' },
            bookingType:     { type: 'string', enum: ['cancel'] },
            appointmentType: { type: 'string', enum: ['Zoom Meeting'] },
          },
        },
      },
      server: { url: TOOLS_URL, headers: {} },
    },
    {
      type: 'function',
      function: {
        name: 'update_client_details',
        description: 'Updates the financial goals/objectives of a returning client.',
        parameters: {
          type: 'object',
          required: ['phoneNumber'],
          properties: {
            phoneNumber:  { type: 'string' },
            objective1:   { type: 'string' },
            objective2:   { type: 'string' },
            objective3:   { type: 'string' },
            objective4:   { type: 'string' },
          },
        },
      },
      server: { url: TOOLS_URL, headers: {} },
    },
  ]
}

// ── Default prompt templates — imported from lib/default-prompts.ts ──────────
export { DEFAULT_RETURNING_PROMPT, DEFAULT_NEW_PROMPT }

// ── RETURNING CALLER assistant config ──────────────────────────────────────

export async function returningCallerConfig(client: Client, systemPromptDates: string) {
  const settings = await getAllSettings()

  const voice = {
    model: 'eleven_multilingual_v2',
    speed: parseFloat(settings['voice_speed'] ?? '1.1'),
    voiceId: settings['voice_id'] ?? 'ckdz71REaQKVx2gnOQjQ',
    provider: '11labs',
    stability: parseFloat(settings['voice_stability'] ?? '0.5'),
    useSpeakerBoost: false,
  }

  const zoomDisplay = client.zoom_meeting
    ? `${client.zoom_meeting} (YYYY/MM/DD h:mm A)`
    : 'None scheduled'

  const templateVars = {
    firstName: client.first_name ?? '',
    lastName: client.last_name ?? '',
    email: client.email ?? '',
    zoomDisplay,
    objective_1: client.objective_1 ?? '',
    objective_2: client.objective_2 ?? '',
    objective_3: client.objective_3 ?? '',
    objective_4: client.objective_4 ?? '',
  }

  const rawTemplate = settings['prompt_returning'] ?? DEFAULT_RETURNING_PROMPT
  const systemPrompt = fillTemplate(rawTemplate, templateVars)
  const firstMessage = settings['first_message_returning']
    ? fillTemplate(settings['first_message_returning'], templateVars)
    : `Hi ${client.first_name}!`

  const knowledgeBase = settings['knowledge_base']?.trim()
  const kbMessage = knowledgeBase
    ? [{ role: 'system', content: `Knowledge Base:\n\n${knowledgeBase}` }]
    : []

  return {
    assistant: {
      name: 'Kiros AI',
      voice: voice,
      model: {
        model: settings['llm_model'] || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant at a fintech company. If the user is being mean, end the call using the endCall function. If the user speaks about irrelevant stuff unrelated to financial advice two or more times or when you deem that the call has reached its conclusion, use the endCall function. Once the third irrelevant detail is asked, immediately end the call using the endCall function.',
          },
          { role: 'system', content: systemPromptDates },
          ...kbMessage,
          { role: 'system', content: systemPrompt },
        ],
        provider: 'openai',
        tools: buildTools(),
        temperature: 0.2,
      },
      firstMessage,
      voicemailMessage: 'Please call back when you can.',
      endCallFunctionEnabled: true,
      endCallMessage: 'Goodbye.',
      transcriber: TRANSCRIBER,
      clientMessages: [],
      serverMessages: ['end-of-call-report', 'transcript'],
      maxDurationSeconds: 640,
      backgroundSound: 'off',
      analysisPlan: ANALYSIS_PLAN,
      backgroundDenoisingEnabled: true,
      recordingEnabled: true,
      startSpeakingPlan: { waitSeconds: 0.1 },
      stopSpeakingPlan: { numWords: 1, voiceSeconds: 0.1 },
    },
  }
}

// ── NEW CALLER assistant config ────────────────────────────────────────────

export async function newCallerConfig(systemPromptDates: string) {
  const settings = await getAllSettings()

  const voice = {
    model: 'eleven_multilingual_v2',
    speed: parseFloat(settings['voice_speed'] ?? '1.1'),
    voiceId: settings['voice_id'] ?? 'ckdz71REaQKVx2gnOQjQ',
    provider: '11labs',
    stability: parseFloat(settings['voice_stability'] ?? '0.5'),
    useSpeakerBoost: false,
  }

  const systemPrompt = settings['prompt_new'] ?? DEFAULT_NEW_PROMPT
  const firstMessage = settings['first_message_new']
    ?? "Hi there! You've reached Daniel Wong's financial advisory service. I'm Eh-va — how can I help you today?"

  const knowledgeBase = settings['knowledge_base']?.trim()
  const kbMessage = knowledgeBase
    ? [{ role: 'system', content: `Knowledge Base:\n\n${knowledgeBase}` }]
    : []

  return {
    assistant: {
      name: 'Kiros AI',
      voice: voice,
      model: {
        model: settings['llm_model'] || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: "You are an assistant at a fintech company. This caller is new and has NO profile on file — their name and email are completely unknown. RULE: You must NEVER call book_appointment unless you have already collected and confirmed the caller's first name, last name, and email address in the conversation. If any of these are missing, ask for them before proceeding. If the user is being mean, end the call using the endCall function. If the user speaks about irrelevant stuff unrelated to financial advice two or more times or when you deem that the call has reached its conclusion, use the endCall function. Once the third irrelevant detail is asked, immediately end the call using the endCall function.",
          },
          { role: 'system', content: systemPromptDates },
          ...kbMessage,
          { role: 'system', content: systemPrompt },
        ],
        provider: 'openai',
        tools: buildTools(),
        temperature: 0.2,
      },
      firstMessage,
      voicemailMessage: 'Please call back when you can.',
      endCallFunctionEnabled: true,
      endCallMessage: 'Goodbye.',
      transcriber: TRANSCRIBER,
      clientMessages: [],
      serverMessages: ['end-of-call-report', 'transcript'],
      maxDurationSeconds: 640,
      backgroundSound: 'off',
      analysisPlan: ANALYSIS_PLAN,
      backgroundDenoisingEnabled: true,
      recordingEnabled: true,
      startSpeakingPlan: { waitSeconds: 0.1 },
      stopSpeakingPlan: { numWords: 1, voiceSeconds: 0.1 },
    },
  }
}
