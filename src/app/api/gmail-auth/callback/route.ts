import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GMAIL_CLIENT_ID     = process.env.GMAIL_CLIENT_ID     || ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || ''
const APP_URL             = process.env.NEXT_PUBLIC_APP_URL || 'https://badger.augesrob.net'
const REDIRECT_URI        = `${APP_URL}/api/gmail-auth/callback`

// Google redirects here with ?code=... after the user authorizes
export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/admin?gmail_auth=error&reason=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/admin?gmail_auth=error&reason=no_code`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    }),
  })
  const tokenData = await tokenRes.json()

  if (!tokenData.refresh_token) {
    // Should not happen with prompt=consent, but handle gracefully
    return NextResponse.redirect(`${APP_URL}/admin?gmail_auth=error&reason=no_refresh_token`)
  }

  const expiry = new Date(Date.now() + (tokenData.expires_in - 60) * 1000).toISOString()
  await supabase.from('gmail_tokens').upsert({
    id: 1,
    refresh_token: tokenData.refresh_token,
    access_token:  tokenData.access_token,
    token_expiry:  expiry,
    authorized_at: new Date().toISOString(),
    updated_at:    new Date().toISOString(),
  })

  // Redirect back to admin with success
  return NextResponse.redirect(`${APP_URL}/admin?gmail_auth=success`)
}
