type EmptyStateProps = {
  title: string
  description: string
  illustration: 'calls' | 'clients' | 'bookings'
}

function CallsIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Phone base */}
      <rect x="32" y="12" width="56" height="72" rx="10" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      {/* Screen */}
      <rect x="40" y="24" width="40" height="44" rx="4" fill="#e8f0fe" />
      {/* Waveform bars */}
      <rect x="46" y="38" width="4" height="16" rx="2" fill="#93c5fd" />
      <rect x="54" y="32" width="4" height="28" rx="2" fill="#3b82f6" />
      <rect x="62" y="36" width="4" height="20" rx="2" fill="#60a5fa" />
      <rect x="70" y="34" width="4" height="24" rx="2" fill="#93c5fd" />
      {/* Home button */}
      <circle cx="60" cy="76" r="5" fill="#e2e8f0" />
      {/* Signal arcs */}
      <path d="M88 28 Q98 40 88 52" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M93 23 Q107 40 93 57" stroke="#dbeafe" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function ClientsIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back person */}
      <circle cx="72" cy="34" r="14" fill="#e2e8f0" />
      <path d="M50 78 Q50 60 72 60 Q94 60 94 78" fill="#e2e8f0" />
      {/* Front person */}
      <circle cx="48" cy="38" r="16" fill="#dbeafe" stroke="#bfdbfe" strokeWidth="1.5" />
      <path d="M22 82 Q22 62 48 62 Q74 62 74 82" fill="#dbeafe" stroke="#bfdbfe" strokeWidth="1.5" />
      {/* Face details */}
      <circle cx="44" cy="36" r="2" fill="#93c5fd" />
      <circle cx="52" cy="36" r="2" fill="#93c5fd" />
      <path d="M44 43 Q48 47 52 43" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Plus badge */}
      <circle cx="80" cy="22" r="10" fill="#3b82f6" />
      <path d="M80 17 L80 27 M75 22 L85 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function BookingsIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Calendar body */}
      <rect x="18" y="20" width="72" height="62" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      {/* Header strip */}
      <rect x="18" y="20" width="72" height="22" rx="8" fill="#dbeafe" />
      <rect x="18" y="34" width="72" height="8" fill="#dbeafe" />
      {/* Ring mounts */}
      <rect x="34" y="14" width="6" height="14" rx="3" fill="#94a3b8" />
      <rect x="68" y="14" width="6" height="14" rx="3" fill="#94a3b8" />
      {/* Grid dots */}
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        return <circle key={i} cx={30 + col * 16} cy={56 + row * 14} r="3" fill={i === 5 ? '#3b82f6' : '#cbd5e1'} />
      })}
      {/* Checkmark on highlighted day */}
      <circle cx="62" cy="56" r="7" fill="#3b82f6" />
      <path d="M59 56 L61 58 L65 53" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EmptyState({ title, description, illustration }: EmptyStateProps) {
  const Illustration = {
    calls: CallsIllustration,
    clients: ClientsIllustration,
    bookings: BookingsIllustration,
  }[illustration]

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="mb-4 opacity-90">
        <Illustration />
      </div>
      <p className="text-slate-700 font-medium text-sm">{title}</p>
      <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">{description}</p>
    </div>
  )
}
