import { createClient } from '@supabase/supabase-js'
import { CallsTable } from '@/components/CallsTable'
import Link from 'next/link'

const PAGE_SIZE = 50

async function getCalls(page: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from('calls')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          phone_number,
          email,
          disc_profile,
          zoom_meeting,
          objective_1,
          objective_2,
          objective_3,
          objective_4
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.from('calls').select('*', { count: 'exact', head: true }),
  ])

  if (error) console.error('getCalls error:', error)

  return { calls: data ?? [], total: count ?? 0 }
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const { calls, total } = await getCalls(page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call Logs</h1>
          <p className="text-slate-500 text-sm mt-1">{total} calls total</p>
        </div>
      </div>
      <CallsTable calls={calls} />
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/calls?page=${page - 1}`}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/calls?page=${page + 1}`}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
