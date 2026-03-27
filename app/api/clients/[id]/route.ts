import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = [
    'first_name', 'last_name', 'email', 'disc_profile',
    'phone_number', 'zoom_meeting', 'objective_1', 'objective_2', 'objective_3', 'objective_4',
  ]
  const update: Record<string, string | null> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) {
      const val = typeof body[key] === 'string' ? body[key].trim() : body[key]
      update[key] = key === 'phone_number' ? normalizePhone(val) : (val || null)
    }
  }

  const { data, error } = await getSupabase()
    .from('clients')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await getSupabase()
    .from('clients')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
