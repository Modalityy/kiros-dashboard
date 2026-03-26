import { createClient } from '@supabase/supabase-js'
import { ClientsTable } from '@/components/ClientsTable'

export const dynamic = 'force-dynamic'

async function getClients() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getClients error:', error)
    return []
  }
  return data ?? []
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-500 text-sm mt-1">{clients.length} clients in the database</p>
      </div>
      <ClientsTable clients={clients} />
    </div>
  )
}
