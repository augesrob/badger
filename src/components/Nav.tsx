'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useState, useRef, useEffect } from 'react'

const links = [
  { href: '/printroom', label: '🖨️ Print Room', children: [
    { href: '/printroom', label: '🖨️ Print Room' },
    { href: '/routesheet', label: '📄 Route Sheet' },
    { href: '/cheatsheet', label: '📋 Cheat Sheet' },
  ]},
  { href: '/preshift', label: '📋 PreShift' },
  { href: '/movement', label: '🚚 Live Movement' },
  { href: '/admin', label: '⚙️ Admin' },
]

export default function Nav() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const printRoomActive = pathname === '/printroom' || pathname === '/routesheet' || pathname === '/cheatsheet'
  const printRoomChildren = links[0].children!

  return (
    <nav className="sticky top-0 z-50 bg-nav border-b-2 border-amber-500">
      <div className="max-w-[1400px] mx-auto flex items-center flex-wrap">
        <Link href="/" className="px-4 py-3 text-lg font-bold text-amber-500 hover:text-amber-400">
          🦡 <span className="text-foreground">Badger</span>
        </Link>
        <div className="flex flex-1">
          {/* Print Room with dropdown */}
          <div className="relative" ref={menuRef}>
            <button ref={btnRef}
              onClick={() => setOpen(!open)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors flex items-center gap-1 ${
                printRoomActive
                  ? 'text-amber-500 border-amber-500 bg-amber-500/5'
                  : 'text-muted border-transparent hover:text-amber-500'
              }`}>
              🖨️ Print Room <span className="text-[9px] opacity-60">▾</span>
            </button>

            {/* Dropdown inside relative parent so it positions correctly */}
            {open && (
              <div className="absolute left-0 top-full bg-nav border border-amber-500/30 rounded-b-lg shadow-2xl min-w-[180px] z-[100]"
                style={{ marginTop: '-2px' }}>
                {printRoomChildren.map(c => (
                  <Link key={c.href} href={c.href}
                    onClick={() => setOpen(false)}
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

          {/* Other links */}
          {links.slice(1).map(l => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors ${
                pathname === l.href
                  ? 'text-amber-500 border-amber-500 bg-amber-500/5'
                  : 'text-muted border-transparent hover:text-amber-500'
              }`}>
              {l.label}
            </Link>
          ))}
        </div>
        <button onClick={toggle} className="px-3 py-2 text-lg transition-transform hover:scale-110" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

    </nav>
  )
}
