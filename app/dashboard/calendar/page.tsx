'use client'

import { useState, useEffect } from 'react'

type Booking = {
  id: string
  booking_type: 'schedule' | 'reschedule' | 'cancel'
  scheduled_at: string | null
  status: 'active' | 'cancelled' | 'completed'
  email: string | null
  clients: {
    first_name: string | null
    last_name: string | null
    phone_number: string
  } | null
}

const TYPE_STYLES = {
  schedule:   { bg: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700 border-blue-200',   dot: 'bg-blue-500',   label: 'Scheduled' },
  reschedule: { bg: 'bg-amber-500',  light: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',  label: 'Rescheduled' },
  cancel:     { bg: 'bg-red-400',    light: 'bg-red-50 text-red-700 border-red-200',        dot: 'bg-red-400',    label: 'Cancelled' },
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, shift so Mon=0
  return (new Date(year, month, 1).getDay() + 6) % 7
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function toSGT(iso: string): Date {
  return new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(data => { setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const monthName = new Date(viewYear, viewMonth).toLocaleString('en-SG', { month: 'long', year: 'numeric' })
  const todaySGT = toSGT(new Date().toISOString())

  // Map bookings to their SGT date — exclude cancelled records and cancel-type entries
  const bookingsByDay: Record<number, Booking[]> = {}
  for (const b of bookings) {
    if (!b.scheduled_at) continue
    if (b.booking_type === 'cancel' || b.status === 'cancelled') continue
    const d = toSGT(b.scheduled_at)
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate()
      if (!bookingsByDay[day]) bookingsByDay[day] = []
      bookingsByDay[day].push(b)
    }
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 text-sm mt-0.5">All bookings in Singapore time</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          {(Object.entries(TYPE_STYLES) as [keyof typeof TYPE_STYLES, typeof TYPE_STYLES[keyof typeof TYPE_STYLES]][]).map(([type, s]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-slate-900">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {weekDays.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Leading empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-slate-50 bg-slate-50/40" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const cellDate = new Date(viewYear, viewMonth, day)
            const isToday = isSameDay(cellDate, todaySGT)
            const dayBookings = bookingsByDay[day] ?? []
            const colIndex = (firstDay + i) % 7
            const isLastCol = colIndex === 6

            return (
              <div
                key={day}
                className={`min-h-[100px] p-2 border-b border-slate-100 ${!isLastCol ? 'border-r' : ''} ${isToday ? 'bg-blue-50/40' : ''}`}
              >
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-blue-600 text-white' : 'text-slate-500'
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map(b => {
                    const s = TYPE_STYLES[b.booking_type]
                    const name = [b.clients?.first_name, b.clients?.last_name].filter(Boolean).join(' ') || b.email || '—'
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        className={`w-full text-left text-xs px-1.5 py-0.5 rounded border truncate font-medium transition-opacity hover:opacity-80 ${s.light}`}
                        title={name}
                      >
                        {b.scheduled_at ? formatTime(b.scheduled_at) + ' · ' : ''}{name}
                      </button>
                    )
                  })}
                  {dayBookings.length > 3 && (
                    <p className="text-xs text-slate-400 px-1">+{dayBookings.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Booking Details</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Type badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${TYPE_STYLES[selected.booking_type].light}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${TYPE_STYLES[selected.booking_type].dot}`} />
                {TYPE_STYLES[selected.booking_type].label}
              </span>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client</span>
                  <span className="text-slate-800 font-medium">
                    {[selected.clients?.first_name, selected.clients?.last_name].filter(Boolean).join(' ') || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone</span>
                  <span className="text-slate-600 font-mono text-xs">{selected.clients?.phone_number ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-600 text-xs truncate max-w-[160px]">{selected.email ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time</span>
                  <span className="text-slate-700 text-xs text-right max-w-[180px]">
                    {selected.scheduled_at ? formatDate(selected.scheduled_at) : '—'}
                    {selected.scheduled_at ? <><br />{formatTime(selected.scheduled_at)}</> : null}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className={`text-xs font-medium capitalize ${
                    selected.status === 'active' ? 'text-green-600' :
                    selected.status === 'cancelled' ? 'text-red-500' : 'text-slate-400'
                  }`}>{selected.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
