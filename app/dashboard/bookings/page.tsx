'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BookingsTabs } from '@/components/BookingsTabs'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(true)

  const fetchBookings = useCallback((silent = false) => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(data => {
        setBookings(Array.isArray(data) ? data : [])
        if (!silent) { setLoading(false); loadingRef.current = false }
      })
      .catch(() => { if (!silent) setLoading(false) })
  }, [])

  useEffect(() => {
    fetchBookings()
    const interval = setInterval(() => fetchBookings(true), 60_000)
    return () => clearInterval(interval)
  }, [fetchBookings])

  if (loading) {
    return (
      <div className="p-8 animate-fade-in-up">
        {/* Tab bar skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-skeleton" />
            <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700 animate-skeleton" />
          </div>
          <div className="h-8 w-28 rounded-lg bg-slate-100 dark:bg-slate-800 animate-skeleton" />
        </div>

        {/* Section label */}
        <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-skeleton mb-3" />

        {/* Booking rows */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 animate-skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
                <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
                <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-700 animate-skeleton ml-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* Past section label */}
        <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-skeleton mt-8 mb-3" />
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 animate-skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
                <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-700 animate-skeleton ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in-up">
      <BookingsTabs bookings={bookings} onRefresh={() => fetchBookings(true)} />
    </div>
  )
}
