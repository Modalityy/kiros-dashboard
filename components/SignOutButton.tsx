'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      title={collapsed ? 'Sign out' : undefined}
      className={`w-full flex items-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium ${
        collapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'
      }`}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {!collapsed && 'Sign out'}
    </button>
  )
}
