'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

const links = [
  { href: '/printroom', label: '🖨️ Print Room' },
  { href: '/preshift', label: '📋 PreShift' },
  { href: '/movement', label: '🚚 Live Movement' },
  { href: '/fleet', label: '🚛 Fleet' },
  { href: '/admin', label: '⚙️ Admin' },
]

export default function Nav() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <nav className="sticky top-0 z-50 bg-nav border-b-2 border-amber-500">
      <div className="max-w-[1400px] mx-auto flex items-center flex-wrap">
        <Link href="/" className="px-4 py-3 text-lg font-bold text-amber-500 hover:text-amber-400">
          🦡 <span className="text-foreground">Badger</span>
        </Link>
        <div className="flex flex-1 overflow-x-auto">
          {links.map(l => (
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
