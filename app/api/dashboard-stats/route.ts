import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUpcomingBookings } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [session, supabaseStats] = await Promise.all([
    getServerSession(authOptions),
    getStats(),
  ])

  return NextResponse.json({
    stats: supabaseStats,
    userName: session?.user?.name?.split(' ')[0] ?? null,
  })
}

async function getStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = Date.now()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalCalls },
    { count: totalClients },
    { count: callsThisWeek },
    { count: callsThisMonth },
    upcomingBookings,
    { data: recentCalls },
    { data: costData },
    { data: monthCostData },
    { data: creditsSetting },
  ] = await Promise.all([
    supabase.from('calls').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('calls').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('calls').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
    getUpcomingBookings(5),
    supabase.from('calls').select('caller_type').order('created_at', { ascending: false }).limit(50),
    supabase.from('calls').select('cost_cents'),
    supabase.from('calls').select('cost_cents').gte('created_at', monthAgo),
    supabase.from('settings').select('value').eq('key', 'vapi_credits_purchased').maybeSingle(),
  ])

  const returningCount = recentCalls?.filter(c => c.caller_type === 'returning').length ?? 0
  const newCount = recentCalls?.filter(c => c.caller_type === 'new').length ?? 0

  const totalSpendCents = costData?.reduce((sum, r) => sum + (r.cost_cents ?? 0), 0) ?? 0
  const monthSpendCents = monthCostData?.reduce((sum, r) => sum + (r.cost_cents ?? 0), 0) ?? 0
  const creditsPurchasedCents = Math.round(parseFloat((creditsSetting as any)?.value ?? '0') * 100)
  const creditsRemainingCents = creditsPurchasedCents - totalSpendCents

  return {
    totalCalls: totalCalls ?? 0,
    totalClients: totalClients ?? 0,
    callsThisWeek: callsThisWeek ?? 0,
    callsThisMonth: callsThisMonth ?? 0,
    returningCount,
    newCount,
    totalSpendCents,
    monthSpendCents,
    creditsPurchasedCents,
    creditsRemainingCents,
    upcomingBookings,
  }
}
