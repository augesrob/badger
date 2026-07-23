import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// ── LOCKDOWN ─────────────────────────────────────────────────────────────────
// Site is closed pending IT approval. Only these accounts may access anything.
// To reopen: set LOCKDOWN to false (and redeploy).
const LOCKDOWN = true
const LOCKDOWN_ALLOWED_EMAILS = new Set([
  'rfa1991@gmail.com',
  'sam@badgerliquor.com',
  'felipe@badgerliquor.com',
  'millerjo1986@gmail.com',
])

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Skip auth check for public paths.
  // NOTE: while LOCKDOWN is on, /drivers, /weather and /download are NOT public —
  // they fall through to the auth + allowed-email check below.
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/closed') ||
    (!LOCKDOWN && pathname.startsWith('/download')) ||
    (!LOCKDOWN && pathname === '/drivers') ||
    (!LOCKDOWN && pathname === '/weather') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')  // static files (.ico, .png, .woff, etc)
  ) {
    return NextResponse.next()
  }

  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // LOCKDOWN: any authenticated user not on the allowlist is shown the
  // closed page — no data pages are reachable
  if (LOCKDOWN && !LOCKDOWN_ALLOWED_EMAILS.has((user.email ?? '').trim().toLowerCase())) {
    return NextResponse.redirect(new URL('/closed', req.url))
  }

  return res
}

export const config = {
  // Only run on actual page routes, not static assets or api routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)' ,
  ],
}
