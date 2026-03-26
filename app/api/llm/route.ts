import { NextRequest } from 'next/server'
import { getAllSettings } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Custom LLM proxy — VAPI sends conversation here in OpenAI format,
// we forward it straight to OpenAI and stream the response back.
// This bypasses VAPI's LLM markup; you pay OpenAI directly.
export async function POST(req: NextRequest) {
  const body = await req.json()

  const settings = await getAllSettings()
  const apiKey = settings['openai_api_key']

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured. Add it in Dashboard → Integrations → OpenAI.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    // Force streaming — VAPI requires SSE responses from custom LLM endpoints
    body: JSON.stringify({ ...body, stream: true }),
  })

  if (!upstream.ok) {
    const text = await upstream.text()
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Pipe OpenAI's SSE stream directly back to VAPI — format is identical
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
