import { NextRequest, NextResponse } from 'next/server'
import {
  getClientByPhone,
  upsertClient,
  updateClientObjectives,
  createBooking,
} from '@/lib/supabase'

const VAPI_SECRET = process.env.VAPI_WEBHOOK_SECRET

// All VAPI tool calls land here
// VAPI sends: { message: { type: 'function-call', call: {...}, toolCalls: [...] } }

export async function POST(req: NextRequest) {
  if (VAPI_SECRET) {
    const token = req.headers.get('x-vapi-secret')
    if (token !== VAPI_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const body = await req.json()
  const { message } = body

  if (message?.type !== 'function-call') {
    return NextResponse.json({ results: [] })
  }

  const toolCalls = message?.toolCalls ?? []
  const vapiCallId: string = message?.call?.id ?? ''
  const phone: string = message?.call?.customer?.number ?? ''

  const results = await Promise.all(
    toolCalls.map(async (toolCall: any) => {
      const { id: toolCallId, function: fn } = toolCall
      const args = typeof fn.arguments === 'string'
        ? JSON.parse(fn.arguments)
        : fn.arguments

      try {
        const result = await handleTool(fn.name, args, vapiCallId, phone)
        return { toolCallId, result }
      } catch (err: any) {
        console.error(`Tool ${fn.name} error:`, err)
        return { toolCallId, result: `Error: ${err.message}` }
      }
    })
  )

  return NextResponse.json({ results })
}

async function handleTool(
  name: string,
  args: Record<string, any>,
  vapiCallId: string,
  phone: string
): Promise<string> {

  // ── book_appointment ────────────────────────────────────────────────────
  if (name === 'book_appointment') {
    const { firstName, lastName, email, dateTime, clientObjective } = args

    // Upsert client in Supabase (creates if new, updates if returning)
    const client = await upsertClient({
      phone_number: phone,
      first_name: firstName,
      last_name: lastName,
      email,
      zoom_meeting: dateTime,
      ...(clientObjective ? { objective_1: clientObjective } : {}),
    })

    // Create booking record
    await createBooking({
      client_id: client.id,
      booking_type: 'schedule',
      scheduled_at: dateTime,
      email,
    })

    return 'Your zoom meeting has been successfully scheduled.'
  }

  // ── reschedule_appointment ──────────────────────────────────────────────
  if (name === 'reschedule_appointment') {
    const { email, newDateTime } = args

    const client = await getClientByPhone(phone)
    if (client) {
      await upsertClient({ phone_number: client.phone_number, zoom_meeting: newDateTime })
      await createBooking({
        client_id: client.id,
        booking_type: 'reschedule',
        scheduled_at: newDateTime,
        email,
      })
    }

    return 'Your appointment has been successfully rescheduled.'
  }

  // ── cancel_appointment ──────────────────────────────────────────────────
  if (name === 'cancel_appointment') {
    const { email, prevDateTime } = args

    const client = await getClientByPhone(phone)
    if (client) {
      await upsertClient({ phone_number: client.phone_number, zoom_meeting: '' })
      await createBooking({
        client_id: client.id,
        booking_type: 'cancel',
        scheduled_at: prevDateTime,
        email,
      })
    }

    return 'Your appointment has been successfully cancelled.'
  }

  // ── update_client_details ───────────────────────────────────────────────
  if (name === 'update_client_details') {
    const { phoneNumber, objective1, objective2, objective3, objective4 } = args
    const targetPhone = phoneNumber || phone

    await updateClientObjectives(targetPhone, {
      ...(objective1 !== undefined && { objective_1: objective1 }),
      ...(objective2 !== undefined && { objective_2: objective2 }),
      ...(objective3 !== undefined && { objective_3: objective3 }),
      ...(objective4 !== undefined && { objective_4: objective4 }),
    })

    return 'Client objectives updated successfully.'
  }

  return `Unknown tool: ${name}`
}
