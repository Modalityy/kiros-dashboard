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

const COLLAPSED_KEY = 'sidebar_collapsed'

export function Sidebar({ userName, userEmail, userInitial }: Props) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true') } catch {}
  }, [])

  const toggleCollapsed = () => {
    setCollapsed(v => {
      const next = !v
      try { localStorage.setItem(COLLAPSED_KEY, String(next)) } catch {}
      return next
    })
  }

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const sidebarContent = (isCollapsible: boolean) => (
    <>
      {/* Logo + collapse toggle */}
      {isCollapsible && collapsed ? (
        /* Collapsed header: just the expand button, centered */
        <div className="flex items-center justify-center py-4 border-b border-slate-800">
          <button
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        /* Expanded header: M logo + name + collapse toggle */
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm leading-tight">Meridian</div>
            <div className="text-slate-400 text-xs">Console</div>
          </div>
          {isCollapsible && (
            <button
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Mobile close */}
          {!isCollapsible && (
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="ml-auto text-slate-400 hover:text-white transition-colors lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ⌘K trigger */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          title={collapsed && isCollapsible ? 'Quick nav (⌘K)' : undefined}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors text-xs overflow-hidden"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className={`flex-1 text-left whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed && isCollapsible ? 'max-w-0 opacity-0' : 'max-w-[120px] opacity-100'}`}>
            Quick nav…
          </span>
          <kbd className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed && isCollapsible ? 'max-w-0 opacity-0' : 'max-w-[40px] opacity-100'} text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono flex-shrink-0`}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <NavLinks collapsed={collapsed && isCollapsible} />

      {/* User / sign out */}
      <div className="border-t border-slate-800 px-3 py-4 space-y-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
            title={collapsed && isCollapsible ? `${userName} · ${userEmail}` : undefined}
          >
            {userInitial}
          </div>
          <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${collapsed && isCollapsible ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
            <div className="text-white text-xs font-medium truncate whitespace-nowrap">{userName}</div>
            <div className="text-slate-500 text-xs truncate whitespace-nowrap">{userEmail}</div>
          </div>
        </div>
        <SignOutButton collapsed={collapsed && isCollapsible} />
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-slate-900 transition-[width] duration-300 ease-in-out overflow-hidden ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent(true)}
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

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navigation"
      >
        {sidebarContent(false)}
      </aside>
    </>
  )
}
