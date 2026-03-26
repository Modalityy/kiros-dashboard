import { ClientsTable } from '@/components/ClientsTable'

export const dynamic = 'force-dynamic'

export default function ClientsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-500 text-sm mt-1">Manage and edit client profiles</p>
      </div>
      <ClientsTable />
    </div>
  )
}
