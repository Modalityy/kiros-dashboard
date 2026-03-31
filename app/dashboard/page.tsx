'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

type Stats = {
  totalCalls: number
  totalClients: number
  callsThisWeek: number
  callsThisMonth: number
  returningCount: number
  newCount: number
  totalSpendCents: number
  monthSpendCents: number
  creditsPurchasedCents: number
  creditsRemainingCents: number
  upcomingBookings: any[]
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [topUpInput, setTopUpInput] = useState('')
  const [savingTopUp, setSavingTopUp] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(r => r.json())
      .then(data => {
        setStats(data.stats)
        setUserName(data.userName)
      })
  }, [])

  const handleSyncCosts = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/vapi/sync-costs', { method: 'POST' })
      const data = await res.json()
      toast(data.updated > 0 ? `Updated ${data.updated} call${data.updated !== 1 ? 's' : ''}` : 'All costs up to date', 'success')
      const r2 = await fetch('/api/dashboard-stats')
      const d2 = await r2.json()
      setStats(d2.stats)
    } catch {
      toast('Sync failed', 'error')
    } finally {
      setSyncing(false)
    }
  }

  if (!stats) {
    return (
      <div className="p-8 animate-fade-in-up">
        <div className="mb-8">
          <div className="h-7 w-28 rounded-lg bg-slate-100 dark:bg-slate-700 animate-skeleton mb-2" />
          <div className="h-4 w-64 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-slate-900">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 animate-skeleton mb-4" />
              <div className="h-8 w-16 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton mb-2" />
              <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton mb-1" />
              <div className="h-3 w-36 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-5 w-44 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 animate-skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
                  <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton" />
                  <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-700 animate-skeleton ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const totalSpend = (stats.totalSpendCents / 100).toFixed(2)
  const monthSpend = (stats.monthSpendCents / 100).toFixed(2)
  const creditsRemaining = (stats.creditsRemainingCents / 100).toFixed(2)
  const creditsPurchased = (stats.creditsPurchasedCents / 100).toFixed(2)
  const creditsLow = stats.creditsPurchasedCents > 0 && stats.creditsRemainingCents / stats.creditsPurchasedCents < 0.2

  async function handleTopUp() {
    const amount = parseFloat(topUpInput)
    if (isNaN(amount) || amount <= 0) return
    setSavingTopUp(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'vapi_credits_purchased', value: String(amount) }),
      })
      const r = await fetch('/api/dashboard-stats')
      const d = await r.json()
      setStats(d.stats)
      setTopUpInput('')
      toast('Credits updated', 'success')
    } catch {
      toast('Failed to update credits', 'error')
    } finally {
      setSavingTopUp(false)
    }
  }

  return (
    <div className="p-8 animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {userName ?? 'back'}. Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncCosts}
            disabled={syncing}
            title="Sync call costs from VAPI"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing…' : 'Sync costs'}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-slate-900">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalCalls}</div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Total Calls</div>
          <div className="text-xs text-slate-400 mt-0.5">{stats.callsThisWeek} this week · {stats.callsThisMonth} this month</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-slate-900">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-green-50 dark:bg-green-900/20 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalClients}</div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Total Clients</div>
          <div className="text-xs text-slate-400 mt-0.5">{stats.returningCount} returning · {stats.newCount} new callers</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-slate-900">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.callsThisMonth}</div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Calls This Month</div>
          <div className="text-xs text-slate-400 mt-0.5">{stats.callsThisWeek} in the last 7 days</div>
        </div>

        <div className={`bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm dark:shadow-slate-900 ${creditsLow ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'}`}>
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${creditsLow ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {stats.creditsPurchasedCents === 0 ? (
            <>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Credits Remaining</div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter total purchased ($)"
                  value={topUpInput}
                  onChange={e => setTopUpInput(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  onClick={handleTopUp}
                  disabled={savingTopUp}
                  className="text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={`text-3xl font-bold ${creditsLow ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>${creditsRemaining}</div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Credits Remaining{creditsLow ? ' — running low' : ''}</div>
              <div className="text-xs text-slate-400 mt-0.5">${totalSpend} spent of ${creditsPurchased} · ${monthSpend} this month</div>
              <div className="flex gap-1.5 mt-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Update total ($)"
                  value={topUpInput}
                  onChange={e => setTopUpInput(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  onClick={handleTopUp}
                  disabled={savingTopUp}
                  className="text-xs px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  {savingTopUp ? '…' : 'Update'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming Zoom Sessions</h2>
          <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:underline font-medium">View all →</Link>
        </div>
        {stats.upcomingBookings.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">No upcoming bookings.</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {stats.upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {booking.clients?.first_name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    {booking.clients?.first_name} {booking.clients?.last_name}
                  </div>
                  <div className="text-xs text-slate-400">{booking.clients?.phone_number}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDateTime(booking.scheduled_at)}</div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                    booking.booking_type === 'schedule' ? 'bg-green-100 text-green-700'
                    : booking.booking_type === 'reschedule' ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                  }`}>
                    {booking.booking_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
