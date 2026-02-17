'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/printroom', label: '🖨️ Print Room' },
  { href: '/preshift', label: '📋 PreShift' },
  { href: '/movement', label: '🚚 Live Movement' },
  { href: '/admin', label: '⚙️ Admin' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-[#1a1a1a] border-b-2 border-amber-500">
      <div className="max-w-[1400px] mx-auto flex items-center flex-wrap">
        <Link href="/" className="px-4 py-3 text-lg font-bold text-amber-500 hover:text-amber-400">
          🦡 <span className="text-white">Badger</span>
        </Link>
        <div className="flex flex-1 overflow-x-auto">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors ${
                pathname === l.href
                  ? 'text-amber-500 border-amber-500 bg-amber-500/5'
                  : 'text-gray-400 border-transparent hover:text-amber-500'
              }`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
