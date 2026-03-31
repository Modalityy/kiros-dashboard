'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timer = useRef<NodeJS.Timeout | null>(null)
  const prev = useRef(pathname)

  useEffect(() => {
    if (pathname !== prev.current) {
      // Route changed — complete the bar
      setProgress(100)
      timer.current = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
      prev.current = pathname
    }
  }, [pathname])

  useEffect(() => {
    // Start the bar immediately on mount and simulate progress
    setVisible(true)
    setProgress(30)
    const t1 = setTimeout(() => setProgress(60), 100)
    const t2 = setTimeout(() => setProgress(80), 300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1, transition: progress === 100 ? 'opacity 0.3s, width 0.1s' : 'width 0.3s ease-out' }}
      />
    </div>
  )
}
