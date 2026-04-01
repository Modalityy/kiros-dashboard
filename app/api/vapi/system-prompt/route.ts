import { NextResponse } from 'next/server'
import { format, addDays, startOfDay } from 'date-fns'

// Replaces the existing Vercel endpoint at kiros-vapi-functions.vercel.app/api/system-prompt
// Returns a dynamically generated PRE-CALCULATED DATES block for the next 60 days

export async function GET() {
  // Vercel runs in UTC — manually offset to SGT (UTC+8)
  const nowSGT = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const today = startOfDay(nowSGT)

  const currentTime = format(nowSGT, 'h:mm a')
  const currentHour = nowSGT.getUTCHours()
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'

  const lines: string[] = [
    'CURRENT DATE & TIME (Singapore Time — SGT, UTC+8):',
    '',
    `Today: ${format(today, 'EEEE, MMMM d, yyyy')}`,
    `Current time: ${currentTime} SGT (${timeOfDay})`,
    '',
    'PRE-CALCULATED DATES (use these exact dates when a caller references a day):',
    '',
  ]

  for (let i = 1; i <= 60; i++) {
    const date = addDays(today, i)
    const dayName = format(date, 'EEEE')
    const formatted = format(date, 'MMMM d, yyyy')
    const iso = format(date, 'yyyy-MM-dd')
    lines.push(`${dayName} (${formatted}) → ${iso}`)
  }

  lines.push('')
  lines.push('When a caller says "next [day]", find the first matching day in the list above.')
  lines.push('Always confirm the full date (e.g., "Tuesday, April 1st") before booking.')

  return NextResponse.json(lines.join('\n'), {
    headers: { 'Content-Type': 'application/json' },
  })
}
