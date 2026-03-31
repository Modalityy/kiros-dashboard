'use client'

import { useState, useMemo } from 'react'

type Booking = {
  id: string
  booking_type: string
  scheduled_at: string
  status: string
  email: string | null
  clients: {
    first_name: string | null
    last_name: string | null
    phone_number: string | null
    email: string | null
  } | null
}

type View = 'month' | 'week' | 'day'
type Tab = 'list' | 'calendar'

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 8 * 60)
  return d.toISOString().slice(0, 16)
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    schedule: 'bg-green-100 text-green-700',
    reschedule: 'bg-amber-100 text-amber-700',
    cancel: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${styles[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  )
}

function ConfirmCancelModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-2">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-900 text-center">Cancel Appointment</h2>
          <p className="text-sm text-slate-500 text-center mt-1 mb-5">Are you sure you want to cancel this appointment? This cannot be undone.</p>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            Keep it
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function EditBookingModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: Booking
  onClose: () => void
  onSaved: (id: string, newIso: string) => void
}) {
  const [value, setValue] = useState(isoToDatetimeLocal(booking.scheduled_at))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    const iso = new Date(value + ':00+08:00').toISOString()
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_at: iso }),
    })
    setSaving(false)
    if (res.ok) {
      onSaved(booking.id, iso)
      onClose()
    } else {
      setError('Failed to save — please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Edit Appointment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {booking.clients?.first_name} {booking.clients?.last_name}
            </p>
            <p className="text-xs text-slate-400">{booking.clients?.phone_number}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">New date & time (SGT)</label>
            <input
              type="datetime-local"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── List Tab ──────────────────────────────────────────────────────────────────

function ListView({
  upcoming,
  past,
  cancellingId,
  onEdit,
  onCancel,
}: {
  upcoming: Booking[]
  past: Booking[]
  cancellingId: string | null
  onEdit: (b: Booking) => void
  onCancel: (id: string) => void
}) {
  const TableSection = ({
    title,
    rows,
    emptyText,
    showActions,
  }: {
    title: string
    rows: Booking[]
    emptyText: string
    showActions?: boolean
  }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-slate-400 font-medium">{rows.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/70">
            <tr>
              {['Client', 'Phone', 'Email', 'Scheduled', 'Type', ...(showActions ? ['Actions'] : [])].map(col => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 6 : 5} className="py-10 text-center text-sm text-slate-400">{emptyText}</td>
              </tr>
            ) : (
              rows.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                        {b.clients?.first_name?.[0] ?? '?'}
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {b.clients?.first_name} {b.clients?.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono whitespace-nowrap">{b.clients?.phone_number}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{b.email ?? b.clients?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">{formatDateTime(b.scheduled_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><TypeBadge type={b.booking_type} /></td>
                  {showActions && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(b)}
                          className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onCancel(b.id)}
                          disabled={cancellingId === b.id}
                          className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors font-medium"
                        >
                          {cancellingId === b.id ? '…' : 'Cancel'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <>
      <TableSection title="Upcoming Sessions" rows={upcoming} emptyText="No upcoming sessions." showActions />
      <TableSection title="Past & Cancelled" rows={past} emptyText="No past or cancelled sessions." />
    </>
  )
}

// ── Calendar Tab ──────────────────────────────────────────────────────────────

const BOOKING_COLORS: Record<string, string> = {
  schedule: 'bg-blue-100 text-blue-800 border-blue-200',
  reschedule: 'bg-amber-100 text-amber-800 border-amber-200',
  cancel: 'bg-red-100 text-red-700 border-red-200',
}

function getLocalSGTDate(iso: string) {
  const d = new Date(iso)
  const sgt = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  return sgt.toISOString().slice(0, 10)
}

function activeBookings(bookings: Booking[]) {
  return bookings.filter(b => b.booking_type !== 'cancel' && b.status !== 'cancelled')
}

function MonthView({ bookings, selected, onSelect }: {
  bookings: Booking[]
  selected: Booking | null
  onSelect: (b: Booking | null) => void
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const { year, month } = cursor
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7
  const monthLabel = firstDay.toLocaleString('en-SG', { month: 'long', year: 'numeric' })

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    activeBookings(bookings).forEach(b => {
      const key = getLocalSGTDate(b.scheduled_at)
      if (!map[key]) map[key] = []
      map[key].push(b)
    })
    return map
  }, [bookings])

  const todayKey = getLocalSGTDate(new Date().toISOString())
  const prev = () => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })
  const next = () => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h3 className="text-sm font-semibold text-slate-800">{monthLabel}</h3>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - startPad + 1
          const isValid = dayNum >= 1 && dayNum <= lastDay.getDate()
          const dateKey = isValid ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : ''
          const dayBookings = isValid ? (bookingsByDate[dateKey] ?? []) : []
          const isToday = dateKey === todayKey

          return (
            <div key={i} className={`min-h-[90px] p-1.5 ${!isValid ? 'bg-slate-50/60' : 'bg-white'}`}>
              {isValid && (
                <>
                  <div className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                    {dayNum}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map(b => (
                      <button
                        key={b.id}
                        onClick={() => onSelect(b)}
                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded border font-medium truncate ${BOOKING_COLORS[b.booking_type] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {formatTime(b.scheduled_at)} {b.clients?.first_name ?? 'Unknown'}
                      </button>
                    ))}
                    {dayBookings.length > 3 && <p className="text-[10px] text-slate-400 pl-1">+{dayBookings.length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ bookings, onSelect }: { bookings: Booking[]; onSelect: (b: Booking) => void }) {
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date()
    const sgt = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const day = sgt.getDay()
    const start = new Date(sgt)
    start.setDate(sgt.getDate() - day)
    start.setHours(0, 0, 0, 0)
    return start
  })

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const todayKey = getLocalSGTDate(new Date().toISOString())

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    activeBookings(bookings).forEach(b => {
      const key = getLocalSGTDate(b.scheduled_at)
      if (!map[key]) map[key] = []
      map[key].push(b)
    })
    return map
  }, [bookings])

  const rangeLabel = `${days[0].toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' })}`
  const prev = () => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() - 7); return d })
  const next = () => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() + 7); return d })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h3 className="text-sm font-semibold text-slate-800">{rangeLabel}</h3>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 divide-x border-b border-slate-100">
        {days.map(d => {
          const key = d.toISOString().slice(0, 10)
          const isToday = key === todayKey
          return (
            <div key={key} className={`p-2 text-center ${isToday ? 'bg-blue-50' : ''}`}>
              <div className="text-xs text-slate-400 uppercase mb-1">{d.toLocaleDateString('en-SG', { weekday: 'short' })}</div>
              <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-7 divide-x min-h-[200px]">
        {days.map(d => {
          const key = d.toISOString().slice(0, 10)
          const dayBookings = bookingsByDate[key] ?? []
          return (
            <div key={key} className="p-1.5 space-y-1">
              {dayBookings.map(b => (
                <button
                  key={b.id}
                  onClick={() => onSelect(b)}
                  className={`w-full text-left text-[11px] px-2 py-1 rounded border font-medium ${BOOKING_COLORS[b.booking_type] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                  <div>{formatTime(b.scheduled_at)}</div>
                  <div className="truncate">{b.clients?.first_name ?? 'Unknown'}</div>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({ bookings, onSelect }: { bookings: Booking[]; onSelect: (b: Booking) => void }) {
  const [cursor, setCursor] = useState(() => new Date(new Date().getTime() + 8 * 60 * 60 * 1000))

  const dateKey = cursor.toISOString().slice(0, 10)
  const todayKey = getLocalSGTDate(new Date().toISOString())

  const dayBookings = useMemo(() =>
    activeBookings(bookings)
      .filter(b => getLocalSGTDate(b.scheduled_at) === dateKey)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [bookings, dateKey]
  )

  const dayLabel = cursor.toLocaleDateString('en-SG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const isToday = dateKey === todayKey
  const prev = () => setCursor(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  const next = () => setCursor(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <h3 className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>{dayLabel}</h3>
          {isToday && <p className="text-xs text-blue-400">Today</p>}
        </div>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="p-4 min-h-[200px]">
        {dayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg className="w-10 h-10 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No bookings on this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayBookings.map(b => (
              <button
                key={b.id}
                onClick={() => onSelect(b)}
                className={`w-full text-left px-4 py-3 rounded-xl border ${BOOKING_COLORS[b.booking_type] ?? 'bg-slate-50 border-slate-200'} hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{b.clients?.first_name} {b.clients?.last_name}</span>
                  <span className="text-xs font-mono">{formatTime(b.scheduled_at)}</span>
                </div>
                <div className="text-xs mt-0.5 opacity-70">{b.clients?.phone_number} · {b.email ?? b.clients?.email ?? '—'}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BookingDetailModal({
  booking,
  onClose,
  onEdit,
  onCancel,
}: {
  booking: Booking
  onClose: () => void
  onEdit?: (b: Booking) => void
  onCancel?: (id: string) => void
}) {
  const isUpcoming = booking.status === 'active' && booking.booking_type !== 'cancel' && new Date(booking.scheduled_at) > new Date()

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Booking Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {booking.clients?.first_name?.[0] ?? '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{booking.clients?.first_name} {booking.clients?.last_name}</p>
              <p className="text-xs text-slate-400">{booking.clients?.phone_number ?? '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-slate-400 mb-0.5">Email</p>
              <p className="text-sm text-slate-700 break-all">{booking.email ?? booking.clients?.email ?? '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-slate-400 mb-0.5">Type</p>
              <TypeBadge type={booking.booking_type} />
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2.5 col-span-2">
              <p className="text-xs text-slate-400 mb-0.5">Scheduled</p>
              <p className="text-sm text-slate-700">{formatDateTime(booking.scheduled_at)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-slate-400 mb-0.5">Status</p>
              <p className={`text-sm font-medium capitalize ${booking.status === 'active' ? 'text-green-600' : booking.status === 'cancelled' ? 'text-red-500' : 'text-slate-400'}`}>
                {booking.status}
              </p>
            </div>
          </div>
          {isUpcoming && onEdit && onCancel && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { onClose(); onEdit(booking) }}
                className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => { onClose(); onCancel(booking.id) }}
                className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BookingsTabs({ bookings, onRefresh }: { bookings: Booking[]; onRefresh: () => void }) {
  const [tab, setTab] = useState<Tab>('list')
  const [view, setView] = useState<View>('month')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [localBookings, setLocalBookings] = useState(bookings)

  useMemo(() => setLocalBookings(bookings), [bookings])

  const now = new Date()
  const upcoming = localBookings.filter(b =>
    b.booking_type !== 'cancel' &&
    b.status !== 'cancelled' &&
    b.status !== 'completed' &&
    new Date(b.scheduled_at) > now
  )
  const past = localBookings.filter(b =>
    b.booking_type === 'cancel' ||
    b.status === 'cancelled' ||
    b.status === 'completed' ||
    new Date(b.scheduled_at) <= now
  )

  function handleSaved(id: string, newIso: string) {
    setLocalBookings(prev => prev.map(b => b.id === id ? { ...b, scheduled_at: newIso } : b))
    onRefresh()
  }

  async function confirmCancel() {
    if (!confirmCancelId) return
    setCancellingId(confirmCancelId)
    setConfirmCancelId(null)
    const res = await fetch(`/api/bookings/${confirmCancelId}`, { method: 'DELETE' })
    setCancellingId(null)
    if (res.ok) {
      setLocalBookings(prev => prev.map(b => b.id === confirmCancelId ? { ...b, status: 'cancelled' } : b))
      onRefresh()
    }
  }

  return (
    <>
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={b => { setSelectedBooking(null); setEditingBooking(b) }}
          onCancel={id => { setSelectedBooking(null); setConfirmCancelId(id) }}
        />
      )}
      {editingBooking && (
        <EditBookingModal booking={editingBooking} onClose={() => setEditingBooking(null)} onSaved={handleSaved} />
      )}
      {confirmCancelId && (
        <ConfirmCancelModal onConfirm={confirmCancel} onClose={() => setConfirmCancelId(null)} />
      )}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">{upcoming.length} upcoming · {past.length} past/cancelled</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {([['list', 'List'], ['calendar', 'Calendar']] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'calendar' && (
            <div className="flex bg-slate-100 rounded-lg p-1">
              {([['month', 'Month'], ['week', 'Week'], ['day', 'Day']] as [View, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {tab === 'list' && (
        <ListView
          upcoming={upcoming}
          past={past}
          cancellingId={cancellingId}
          onEdit={setEditingBooking}
          onCancel={setConfirmCancelId}
        />
      )}
      {tab === 'calendar' && view === 'month' && (
        <MonthView bookings={localBookings} selected={selectedBooking} onSelect={setSelectedBooking} />
      )}
      {tab === 'calendar' && view === 'week' && (
        <WeekView bookings={localBookings} onSelect={setSelectedBooking} />
      )}
      {tab === 'calendar' && view === 'day' && (
        <DayView bookings={localBookings} onSelect={setSelectedBooking} />
      )}
    </>
  )
}
