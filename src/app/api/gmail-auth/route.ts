import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GMAIL_CLIENT_ID     = process.env.GMAIL_CLIENT_ID     || ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || ''
const APP_URL             = process.env.NEXT_PUBLIC_APP_URL || 'https://badger.augesrob.net'
const REDIRECT_URI        = `${APP_URL}/api/gmail-auth/callback`

// GET /api/gmail-auth — returns the OAuth URL to kick off the flow
export async function GET(_req: NextRequest) {
  if (!GMAIL_CLIENT_ID) {
    return NextResponse.json({ error: 'GMAIL_CLIENT_ID not configured' }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id:     GMAIL_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'https://mail.google.com/',
    access_type:   'offline',
    prompt:        'consent',  // always prompt to get a fresh refresh_token
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  return NextResponse.json({ url: authUrl })
}

// POST /api/gmail-auth — save a refresh token directly (for manual paste)
export async function POST(req: NextRequest) {
  const { refresh_token, authorized_by } = await req.json()

  if (!refresh_token) {
    return NextResponse.json({ error: 'refresh_token required' }, { status: 400 })
  }

  // Verify the token works before saving
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    return NextResponse.json({ error: 'GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET not set' }, { status: 500 })
  }

  const testRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token,
      grant_type:    'refresh_token',
    }),
  })
  const testData = await testRes.json()

  if (!testData.access_token) {
    return NextResponse.json({
      error: `Token test failed: ${testData.error_description || testData.error || 'invalid token'}`,
    }, { status: 400 })
  }

  // Save to DB
  const expiry = new Date(Date.now() + (testData.expires_in - 60) * 1000).toISOString()
  await supabase.from('gmail_tokens').upsert({
    id: 1,
    refresh_token,
    access_token:  testData.access_token,
    token_expiry:  expiry,
    authorized_at: new Date().toISOString(),
    authorized_by: authorized_by || 'admin',
    updated_at:    new Date().toISOString(),
  })

  return NextResponse.json({ success: true, message: 'Gmail token saved and verified.' })
}
