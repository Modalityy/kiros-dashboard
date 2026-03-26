import { NextRequest, NextResponse } from 'next/server'
import {
  getClientByPhone,
  createCall,
  updateCall,
  getCallByVapiId,
} from '@/lib/supabase'
import { returningCallerConfig, newCallerConfig } from '@/lib/vapi-config'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

// Verify the request is genuinely from VAPI
function isValidVapiRequest(_req: NextRequest): boolean {
  return true
}

// Fetch pre-calculated dates from our own system-prompt endpoint
async function getSystemPromptDates(): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/api/vapi/system-prompt`)
    return await res.json()
  } catch {
    return 'PRE-CALCULATED DATES: Unable to load. Ask caller to confirm exact date.'
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(req: NextRequest) {
  if (!isValidVapiRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { message } = body

  // ── 1. ASSISTANT REQUEST ─────────────────────────────────────────────────
  // VAPI asks: "which assistant should handle this call?"
  if (message?.type === 'assistant-request') {
    const phone: string = message?.call?.customer?.number ?? ''
    const vapiCallId: string = message?.call?.id ?? ''

    const systemPromptDates = await getSystemPromptDates()
    const client = await getClientByPhone(phone)

    // Create a call record immediately
    await createCall({
      vapi_call_id: vapiCallId,
      client_id: client?.id,
      phone_number: phone,
      caller_type: client ? 'returning' : 'new',
      started_at: new Date().toISOString(),
    })

    if (client) {
      return NextResponse.json(await returningCallerConfig(client, systemPromptDates))
    } else {
      return NextResponse.json(await newCallerConfig(systemPromptDates))
    }
  }

  // ── 2. END OF CALL REPORT ────────────────────────────────────────────────
  // VAPI sends transcript, summary, success eval after call ends
  if (message?.type === 'end-of-call-report') {
    const vapiCallId: string = message?.call?.id ?? ''
    const transcript: string = message?.transcript ?? ''
    const summary: string = message?.summary ?? ''
    const successEval: string = message?.analysis?.successEvaluation ?? ''
    const endedReason: string = message?.endedReason ?? ''
    const recordingUrl: string | null = message?.artifact?.recordingUrl ?? null
    const costDollars: number | null = message?.call?.cost ?? null
    const costCents: number | null = costDollars !== null ? Math.round(costDollars * 100) : null

    // Use VAPI's actual timestamps, fall back to our own stored started_at
    const vapiStartedAt: string | undefined = message?.call?.startedAt
    const endedAt: string = message?.call?.endedAt ?? new Date().toISOString()
    let durationSeconds: number | null = null
    if (vapiStartedAt) {
      durationSeconds = Math.round((new Date(endedAt).getTime() - new Date(vapiStartedAt).getTime()) / 1000)
    } else {
      // VAPI didn't send startedAt — look up our own record
      try {
        const existing = await getCallByVapiId(vapiCallId)
        if (existing?.started_at) {
          durationSeconds = Math.round((new Date(endedAt).getTime() - new Date(existing.started_at).getTime()) / 1000)
        }
      } catch { /* non-fatal */ }
    }

    // Update the call record in Supabase
    try {
      await updateCall(vapiCallId, {
        ended_at: endedAt,
        duration_seconds: durationSeconds ?? undefined,
        ended_reason: endedReason,
        transcript,
        summary,
        success_eval: successEval,
        recording_url: recordingUrl,
        cost_cents: costCents,
      })
    } catch (err) {
      console.error('updateCall failed:', err)
      // Still return 200 so VAPI doesn't retry endlessly
    }

    return NextResponse.json({ received: true })
  }

  // ── 3. TRANSCRIPT (real-time, optional) ──────────────────────────────────
  if (message?.type === 'transcript') {
    // Could store real-time transcript chunks if needed — skip for now
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
