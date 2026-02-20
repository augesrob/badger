'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useState, useRef, useEffect } from 'react'

const links = [
  { href: '/printroom', label: '🖨️ Print Room', children: [
    { href: '/printroom', label: '🖨️ Print Room' },
    { href: '/routesheet', label: '📄 Route Sheet' },
  ]},
  { href: '/preshift', label: '📋 PreShift' },
  { href: '/movement', label: '🚚 Live Movement' },
  { href: '/admin', label: '⚙️ Admin' },
]

export default function Nav() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (href: string, children?: { href: string }[]) => {
    if (pathname === href) return true
    if (children?.some(c => pathname === c.href)) return true
    return false
  }

  return (
    <nav className="sticky top-0 z-50 bg-nav border-b-2 border-amber-500">
      <div className="max-w-[1400px] mx-auto flex items-center flex-wrap">
        <Link href="/" className="px-4 py-3 text-lg font-bold text-amber-500 hover:text-amber-400">
          🦡 <span className="text-foreground">Badger</span>
        </Link>
        <div className="flex flex-1 overflow-x-auto" ref={dropdownRef}>
          {links.map(l => {
            const active = isActive(l.href, l.children)

            if (l.children) {
              return (
                <div key={l.href} className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === l.href ? null : l.href)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors flex items-center gap-1 ${
                      active
                        ? 'text-amber-500 border-amber-500 bg-amber-500/5'
                        : 'text-muted border-transparent hover:text-amber-500'
                    }`}>
                    {l.label} <span className="text-[9px] ml-0.5">▾</span>
                  </button>
                  {openDropdown === l.href && (
                    <div className="absolute top-full left-0 bg-nav border border-amber-500/30 rounded-b-lg shadow-xl min-w-[180px] z-50 overflow-hidden">
                      {l.children.map(c => (
                        <Link key={c.href} href={c.href}
                          onClick={() => setOpenDropdown(null)}
                          className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                            pathname === c.href
                              ? 'text-amber-500 bg-amber-500/10'
                              : 'text-muted hover:text-amber-500 hover:bg-amber-500/5'
                          }`}>
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link key={l.href} href={l.href}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors ${
                  active
                    ? 'text-amber-500 border-amber-500 bg-amber-500/5'
                    : 'text-muted border-transparent hover:text-amber-500'
                }`}>
                {l.label}
              </Link>
            )
          })}
        </div>
        <button onClick={toggle} className="px-3 py-2 text-lg transition-transform hover:scale-110" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}
