'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type Item = {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  shortcut?: string
}

const navIcon = (path: string) => {
  const icons: Record<string, React.ReactNode> = {
    overview: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    calls: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    clients: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    bookings: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    assistant: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    integrations: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  }
  return icons[path] ?? null
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const close = useCallback(() => { setOpen(false); setQuery('') }, [])

  const navigate = useCallback((href: string) => {
    router.push(href)
    close()
  }, [router, close])

  const pages: Item[] = [
    { id: 'overview', label: 'Overview', description: 'Dashboard home', icon: navIcon('overview'), action: () => navigate('/dashboard'), shortcut: 'G O' },
    { id: 'calls', label: 'Call Logs', description: 'Inbound call history and recordings', icon: navIcon('calls'), action: () => navigate('/dashboard/calls'), shortcut: 'G C' },
    { id: 'clients', label: 'Clients', description: 'Manage client profiles', icon: navIcon('clients'), action: () => navigate('/dashboard/clients'), shortcut: 'G L' },
    { id: 'bookings', label: 'Bookings', description: 'Upcoming and past sessions', icon: navIcon('bookings'), action: () => navigate('/dashboard/bookings'), shortcut: 'G B' },
    { id: 'assistant', label: 'Assistant', description: 'Edit prompts and voice settings', icon: navIcon('assistant'), action: () => navigate('/dashboard/settings'), shortcut: 'G A' },
    { id: 'integrations', label: 'Integrations', description: 'API keys and connection status', icon: navIcon('integrations'), action: () => navigate('/dashboard/integrations'), shortcut: 'G I' },
  ]

  const filtered = query.trim()
    ? pages.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : pages

  // Reset active index when filtered list changes
  useEffect(() => { setActiveIndex(0) }, [query])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  // Close palette on route change
  useEffect(() => { close() }, [pathname, close])

  // Global keyboard handler
  useEffect(() => {
    let gPressed = false
    let gTimer: ReturnType<typeof setTimeout>

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable

      // ⌘K / Ctrl+K — open palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        return
      }

      // Escape — close
      if (e.key === 'Escape') {
        close()
        return
      }

      // Inside palette: arrow + enter navigation
      if (open) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
        if (e.key === 'Enter' && filtered[activeIndex]) { filtered[activeIndex].action() }
        return
      }

      // G+X shortcuts — only outside inputs
      if (!isInput && !open) {
        if (e.key === 'g' || e.key === 'G') {
          gPressed = true
          clearTimeout(gTimer)
          gTimer = setTimeout(() => { gPressed = false }, 1000)
          return
        }
        if (gPressed) {
          gPressed = false
          clearTimeout(gTimer)
          const map: Record<string, string> = {
            o: '/dashboard', O: '/dashboard',
            c: '/dashboard/calls', C: '/dashboard/calls',
            l: '/dashboard/clients', L: '/dashboard/clients',
            b: '/dashboard/bookings', B: '/dashboard/bookings',
            a: '/dashboard/settings', A: '/dashboard/settings',
            i: '/dashboard/integrations', I: '/dashboard/integrations',
          }
          if (map[e.key]) { e.preventDefault(); router.push(map[e.key]) }
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(gTimer) }
  }, [open, filtered, activeIndex, close, router])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Go to page…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-sm text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-400"
          />
          <kbd className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Esc</kbd>
        </div>

        {/* Results */}
        <div className="py-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No results</div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`flex-shrink-0 ${i === activeIndex ? 'text-blue-500' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${i === activeIndex ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.label}
                  </div>
                  {item.description && (
                    <div className="text-xs text-slate-400 truncate">{item.description}</div>
                  )}
                </div>
                {item.shortcut && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.shortcut.split(' ').map((k, ki) => (
                      <kbd key={ki} className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">{k}</kbd>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">↵</kbd> open
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">G</kbd>+<kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">C/B/L…</kbd> jump
          </span>
        </div>
      </div>
    </div>
  )
}
