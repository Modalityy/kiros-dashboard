import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllSettings, upsertSetting } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await getAllSettings()
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, value } = await req.json()
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })
  }

  try {
    await upsertSetting(key, value)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('upsertSetting error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to save' }, { status: 500 })
  }
}
