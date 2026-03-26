import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client (service role — never expose to browser)
export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Types ──────────────────────────────────────────────────────────────────

export type Client = {
  id: string
  first_name: string | null
  last_name: string | null
  phone_number: string
  email: string | null
  disc_profile: string | null
  zoom_meeting: string | null
  objective_1: string | null
  objective_2: string | null
  objective_3: string | null
  objective_4: string | null
  sheets_row: number | null
  created_at: string
  updated_at: string
}

export type Call = {
  id: string
  vapi_call_id: string | null
  client_id: string | null
  phone_number: string
  caller_type: 'new' | 'returning'
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  ended_reason: string | null
  transcript: string | null
  summary: string | null
  success_eval: string | null
  recording_url: string | null
  cost_cents: number | null
  created_at: string
  clients?: Client
}

export type Booking = {
  id: string
  call_id: string | null
  client_id: string | null
  booking_type: 'schedule' | 'reschedule' | 'cancel'
  appointment_type: string
  scheduled_at: string | null
  email: string | null
  status: 'active' | 'cancelled' | 'completed'
  created_at: string
  clients?: Client
}

// ── Client helpers ─────────────────────────────────────────────────────────

export async function getClientByPhone(phone: string): Promise<Client | null> {
  const normalized = phone.replace(/\s+/g, '')
  const { data } = await supabase
    .from('clients')
    .select('*')
    .ilike('phone_number', `%${normalized.slice(-8)}%`) // match last 8 digits
    .maybeSingle()
  return data
}

export async function upsertClient(data: Partial<Client> & { phone_number: string }): Promise<Client> {
  const { data: client, error } = await supabase
    .from('clients')
    .upsert(data, { onConflict: 'phone_number' })
    .select()
    .single()
  if (error) throw error
  return client
}

export async function updateClientObjectives(
  phone: string,
  objectives: { objective_1?: string; objective_2?: string; objective_3?: string; objective_4?: string }
): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update(objectives)
    .ilike('phone_number', `%${phone.slice(-8)}%`)
  if (error) throw error
}

// ── Call helpers ───────────────────────────────────────────────────────────

export async function createCall(data: {
  vapi_call_id?: string
  client_id?: string
  phone_number: string
  caller_type: 'new' | 'returning'
  started_at?: string
}): Promise<Call> {
  const { data: call, error } = await supabase
    .from('calls')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return call
}

export async function updateCall(vapiCallId: string, data: Partial<Call>): Promise<void> {
  const { error } = await supabase.from('calls').update(data).eq('vapi_call_id', vapiCallId)
  if (error) throw error
}

export async function getCallByVapiId(vapiCallId: string): Promise<Call | null> {
  const { data } = await supabase.from('calls').select('*').eq('vapi_call_id', vapiCallId).single()
  return data ?? null
}

export async function getCalls(limit = 50): Promise<Call[]> {
  const { data } = await supabase
    .from('calls')
    .select('*, clients(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Booking helpers ────────────────────────────────────────────────────────

export async function createBooking(data: {
  call_id?: string
  client_id?: string
  booking_type: 'schedule' | 'reschedule' | 'cancel'
  scheduled_at?: string
  email?: string
}): Promise<Booking> {
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return booking
}

// ── Settings helpers ───────────────────────────────────────────────────────

export async function getAllSettings(): Promise<Record<string, string>> {
  const { data } = await supabase.from('settings').select('key, value')
  return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]))
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

// ── Booking helpers ────────────────────────────────────────────────────────

export async function getUpcomingBookings(limit = 20): Promise<Booking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('*, clients(first_name, last_name, email, phone_number)')
    .eq('status', 'active')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit)
  return data ?? []
}
