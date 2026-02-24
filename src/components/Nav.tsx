'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import { NotificationBell } from './NotificationBell'
import { useState, useRef, useEffect } from 'react'

export default function Nav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { theme, toggle } = useTheme()
  const { profile, signOut, can, loading } = useAuth()
  const [printOpen,   setPrintOpen]   = useState(false)
  const [driversOpen, setDriversOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const printRef   = useRef<HTMLDivElement>(null)
  const driversRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (printRef.current   && !printRef.current.contains(e.target as Node))   setPrintOpen(false)
      if (driversRef.current && !driversRef.current.contains(e.target as Node)) setDriversOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLink = (href: string, label: string, active?: boolean) => {
    const isActive = active ?? pathname === href
    return (
      <Link key={href} href={href}
        className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors ${
          isActive ? 'text-amber-500 border-amber-500 bg-amber-500/5' : 'text-muted border-transparent hover:text-amber-500'
        }`}>
        {label}
      </Link>
    )
  }

  const printActive   = ['/printroom','/routesheet','/cheatsheet'].includes(pathname)
  const driversActive = pathname.startsWith('/drivers')
  const avatarInitials = (profile?.display_name || profile?.username || '?').slice(0, 2).toUpperCase()

  return (
    <nav className="sticky top-0 z-50 bg-nav border-b-2 border-amber-500">
      <div className="max-w-[1400px] mx-auto flex items-center flex-wrap">

        {/* Logo */}
        <Link href="/" className="px-4 py-3 text-lg font-bold text-amber-500 hover:text-amber-400">
          🦡 <span className="text-foreground">Badger</span>
        </Link>

        <div className="flex flex-1 items-center">

          {/* Print Room dropdown — only show items the user has permission for */}
          {(can('printroom') || can('routesheet') || can('cheatsheet')) && (
            <div className="relative" ref={printRef}>
              <button onClick={() => setPrintOpen(o => !o)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors flex items-center gap-1 ${
                  printActive ? 'text-amber-500 border-amber-500 bg-amber-500/5' : 'text-muted border-transparent hover:text-amber-500'
                }`}>
                🖨️ Print Room <span className="text-[9px] opacity-60">▾</span>
              </button>
              {printOpen && (
                <div className="absolute left-0 top-full bg-nav border border-amber-500/30 rounded-b-lg shadow-2xl min-w-[180px] z-[100]" style={{ marginTop: '-2px' }}>
                  {can('printroom') && (
                    <Link href="/printroom" onClick={() => setPrintOpen(false)}
                      className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                        pathname === '/printroom' ? 'text-amber-500 bg-amber-500/10' : 'text-muted hover:text-amber-500 hover:bg-amber-500/5'
                      }`}>
                      🖨️ Print Room
                    </Link>
                  )}
                  {can('routesheet') && (
                    <Link href="/routesheet" onClick={() => setPrintOpen(false)}
                      className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                        pathname === '/routesheet' ? 'text-amber-500 bg-amber-500/10' : 'text-muted hover:text-amber-500 hover:bg-amber-500/5'
                      }`}>
                      📄 Route Sheet
                    </Link>
                  )}
                  {can('cheatsheet') && (
                    <Link href="/cheatsheet" onClick={() => setPrintOpen(false)}
                      className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                        pathname === '/cheatsheet' ? 'text-amber-500 bg-amber-500/10' : 'text-muted hover:text-amber-500 hover:bg-amber-500/5'
                      }`}>
                      📋 Cheat Sheet
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {can('preshift')  && navLink('/preshift',  '📋 PreShift')}
          {can('movement')  && navLink('/movement',  '🚚 Live Movement')}

          {/* Drivers dropdown */}
          {can('drivers') && (
            <div className="relative" ref={driversRef}>
              <button onClick={() => setDriversOpen(o => !o)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors flex items-center gap-1 ${
                  driversActive ? 'text-amber-500 border-amber-500 bg-amber-500/5' : 'text-muted border-transparent hover:text-amber-500'
                }`}>
                🚚 Drivers <span className="text-[9px] opacity-60">▾</span>
              </button>
              {driversOpen && (
                <div className="absolute left-0 top-full bg-nav border border-amber-500/30 rounded-b-lg shadow-2xl min-w-[190px] z-[100]" style={{ marginTop: '-2px' }}>
                  {[
                    { href: '/drivers/live',  label: '📍 Live View' },
                    { href: '/drivers/semis', label: '🚛 Semi / Trailer List' },
                  ].map(c => (
                    <Link key={c.href} href={c.href} onClick={() => setDriversOpen(false)}
                      className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                        pathname === c.href ? 'text-amber-500 bg-amber-500/10' : 'text-muted hover:text-amber-500 hover:bg-amber-500/5'
                      }`}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {can('fleet')     && navLink('/fleet',     '🚛 Fleet')}
          {can('chat')      && navLink('/chat',      '💬 Chat')}
          {can('admin')     && navLink('/admin',     '⚙️ Admin')}
        </div>

        {/* Right side: theme + profile */}
        <div className="flex items-center gap-1 pr-2">
          <button onClick={toggle} className="px-3 py-2 text-lg transition-transform hover:scale-110" title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {profile && <NotificationBell />}

          {loading ? null : !profile ? (
            <Link href="/login"
              className="px-4 py-2 text-sm font-bold bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors">
              Sign In
            </Link>
          ) : (
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar"
                    className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: profile.avatar_color || '#f59e0b' }}>
                    {avatarInitials}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium leading-none">{profile.display_name || profile.username}</div>
                  <div className="text-[10px] text-muted leading-none mt-0.5">{profile.role.replace('_',' ')}</div>
                </div>
                <span className="text-[9px] text-muted">▾</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 bg-nav border border-amber-500/30 rounded-xl shadow-2xl min-w-[180px] z-[100] overflow-hidden">
                  <Link href="/profile" onClick={() => setProfileOpen(false)}
                    className="block px-4 py-3 text-sm text-muted hover:text-amber-500 hover:bg-amber-500/5 transition-colors border-b border-white/5">
                    👤 My Profile
                  </Link>
                  {can('admin') && (
                    <Link href="/admin/users" onClick={() => setProfileOpen(false)}
                      className="block px-4 py-3 text-sm text-muted hover:text-amber-500 hover:bg-amber-500/5 transition-colors border-b border-white/5">
                      👑 Manage Users
                    </Link>
                  )}
                  <button onClick={async () => { setProfileOpen(false); await signOut(); router.push('/login') }}
                    className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
