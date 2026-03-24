import { createClient } from '@supabase/supabase-js'
import { CallsTable } from '@/components/CallsTable'

async function getCalls() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
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
    .limit(200)

  if (error) {
    console.error('getCalls error:', error)
    return []
  }

  return data ?? []
}

export default async function CallsPage() {
  const calls = await getCalls()

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call Logs</h1>
          <p className="text-slate-500 text-sm mt-1">{calls.length} calls recorded</p>
        </div>
      </div>
      <CallsTable calls={calls} />
    </div>
  )
}
