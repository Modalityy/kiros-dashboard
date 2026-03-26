import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllSettings } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await getAllSettings()
  const apiKey = settings['openai_api_key']
  if (!apiKey) return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 400 })

  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: res.status })
  }

  const data = await res.json()

  // Filter to chat-capable models, newest first
  const models: string[] = data.data
    .map((m: any) => m.id as string)
    .filter((id: string) =>
      id.startsWith('gpt-') ||
      /^o\d/.test(id) // o1, o3, o4, o4-mini, etc.
    )
    .sort()
    .reverse()

  return NextResponse.json(models)
}
