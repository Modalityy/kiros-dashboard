import { NextResponse } from 'next/server'
import { format, addDays, startOfDay } from 'date-fns'

// Replaces the existing Vercel endpoint at kiros-vapi-functions.vercel.app/api/system-prompt
// Returns a dynamically generated PRE-CALCULATED DATES block for the next 60 days

export async function GET() {
  const today = startOfDay(new Date())

  const lines: string[] = [
    'PRE-CALCULATED DATES (Singapore Time — use these exact dates when a caller references a day):',
    '',
    `Today: ${format(today, 'EEEE, MMMM d, yyyy')}`,
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
