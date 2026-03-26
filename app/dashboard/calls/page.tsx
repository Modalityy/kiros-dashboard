import { CallsTable } from '@/components/CallsTable'

export const dynamic = 'force-dynamic'

export default function CallsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Call Logs</h1>
        <p className="text-slate-500 text-sm mt-1">Inbound call history and recordings</p>
      </div>
      <CallsTable />
    </div>
  )
}
