import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { phone_number, first_name, last_name, email, disc_profile, objective_1, objective_2, objective_3, objective_4 } = body

  if (!phone_number?.trim()) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('clients')
    .insert({
      phone_number: phone_number.trim(),
      first_name: first_name?.trim() || null,
      last_name: last_name?.trim() || null,
      email: email?.trim() || null,
      disc_profile: disc_profile?.trim() || null,
      objective_1: objective_1?.trim() || null,
      objective_2: objective_2?.trim() || null,
      objective_3: objective_3?.trim() || null,
      objective_4: objective_4?.trim() || null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A client with this phone number already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
