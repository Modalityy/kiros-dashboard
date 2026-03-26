'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { NavLinks } from '@/components/NavLinks'
import { SignOutButton } from '@/components/SignOutButton'

type Props = {
  userName: string | null | undefined
  userEmail: string | null | undefined
  userInitial: string
}

export function Sidebar({ userName, userEmail, userInitial }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          M
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-tight">Meridian</div>
          <div className="text-slate-400 text-xs">Console</div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
          className="ml-auto text-slate-400 hover:text-white transition-colors lg:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <NavLinks />

      {/* User / sign out */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{userName}</div>
            <div className="text-slate-500 text-xs truncate">{userEmail}</div>
          </div>
        </div>
        <SignOutButton />
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800 flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">M</div>
        <span className="text-white font-semibold text-sm">Meridian</span>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-50 transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
