'use client'

import { useState, useEffect } from 'react'
import { BookingsTabs } from '@/components/BookingsTabs'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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
    <div className="p-8 animate-fade-in-up">
      <BookingsTabs bookings={bookings} />
    </div>
  )
}
