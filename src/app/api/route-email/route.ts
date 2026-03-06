import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Email config
const EMAIL_USER = process.env.BADGER_EMAIL_USER || ''
const EMAIL_PASS = process.env.BADGER_EMAIL_PASS || ''
const TARGET_EMAIL = 'fdlwhsestatus@badgerliquor.com'

// Gmail OAuth config
const GMAIL_CLIENT_ID     = process.env.GMAIL_CLIENT_ID     || ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || ''
// GMAIL_REFRESH_TOKEN env var is the fallback if no DB token exists yet
const GMAIL_REFRESH_TOKEN_FALLBACK = process.env.GMAIL_REFRESH_TOKEN || ''

// ── Token helpers ─────────────────────────────────────────────────────────────

/** Read the refresh token from Supabase gmail_tokens table (falls back to env var) */
async function getStoredRefreshToken(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('gmail_tokens')
      .select('refresh_token')
      .eq('id', 1)
      .maybeSingle()
    return data?.refresh_token || GMAIL_REFRESH_TOKEN_FALLBACK || null
  } catch {
    return GMAIL_REFRESH_TOKEN_FALLBACK || null
  }
}

/** Exchange refresh token for a fresh access token, cache it in DB */
async function getFreshAccessToken(): Promise<{ token: string; error?: never } | { token?: never; error: string }> {
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) return { error: 'No refresh token stored. Re-authorize Gmail in Admin → Route Sheet.' }
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) return { error: 'GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET not set in Vercel env.' }

  // Check if cached access token is still valid (>2 min left)
  try {
    const { data: row } = await supabase
      .from('gmail_tokens')
      .select('access_token, token_expiry')
      .eq('id', 1)
      .maybeSingle()

    if (row?.access_token && row?.token_expiry) {
      const expiryMs = new Date(row.token_expiry).getTime()
      if (expiryMs - Date.now() > 2 * 60 * 1000) {
        return { token: row.access_token }
      }
    }
  } catch { /* fall through to refresh */ }

  // Refresh
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })

  const data = await res.json()

  if (!data.access_token) {
    // Refresh token may be revoked — clear it so the UI shows "needs auth"
    if (data.error === 'invalid_grant') {
      try {
        await supabase.from('gmail_tokens').update({ access_token: null, token_expiry: null }).eq('id', 1)
      } catch { /* gmail_tokens table may not exist yet, ignore */ }
      return { error: 'Gmail refresh token expired or revoked. Re-authorize in Admin → Route Sheet.' }
    }
    return { error: `Token refresh failed: ${data.error_description || data.error || 'unknown'}` }
  }

  // Cache the new access token
  const expiry = new Date(Date.now() + (data.expires_in - 60) * 1000).toISOString()
  try {
    await supabase.from('gmail_tokens').upsert({
      id: 1,
      refresh_token: refreshToken,
      access_token: data.access_token,
      token_expiry: expiry,
      updated_at: new Date().toISOString(),
    })
  } catch { /* non-fatal */ }

  return { token: data.access_token }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { action } = await req.json()

  if (action === 'send')   return handleSend()
  if (action === 'check')  return handleCheck()
  if (action === 'status') return handleStatus()
  if (action === 'auth_status') return handleAuthStatus()

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// Send the ping email via SMTP
async function handleSend() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    return NextResponse.json({ error: 'Email not configured. Set BADGER_EMAIL_USER and BADGER_EMAIL_PASS in Vercel env vars.' }, { status: 500 })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    })

    const timestamp = new Date().toISOString()

    await transporter.sendMail({
      from: EMAIL_USER,
      to: TARGET_EMAIL,
      subject: `Route Status Request - ${new Date().toLocaleDateString()}`,
      text: `Automated route status request from Badger Truck Management.\nTimestamp: ${timestamp}`,
    })

    await supabase.from('route_imports').upsert({
      id: 1,
      status: 'sent',
      sent_at: timestamp,
      received_at: null,
      csv_data: null,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message: 'Email sent' })
  } catch (err) {
    console.error('Send error:', err)
    return NextResponse.json({ error: `Send failed: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 500 })
  }
}

// Check Gmail inbox via REST API
async function handleCheck() {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    return NextResponse.json({
      success: true,
      found: false,
      message: 'Gmail API not configured.',
    })
  }
  return checkViaGmailAPI()
}

// Return auth status — is the token configured and valid?
async function handleAuthStatus() {
  try {
    const { data: row } = await supabase
      .from('gmail_tokens')
      .select('refresh_token, token_expiry, authorized_at, authorized_by')
      .eq('id', 1)
      .maybeSingle()

    const hasRefreshToken = !!(row?.refresh_token || GMAIL_REFRESH_TOKEN_FALLBACK)
    const lastAuth = row?.authorized_at || null
    const authorizedBy = row?.authorized_by || null

    // Quick token test to confirm refresh token is still valid
    let tokenValid = false
    if (hasRefreshToken) {
      const result = await getFreshAccessToken()
      tokenValid = !!result.token
    }

    return NextResponse.json({
      configured: hasRefreshToken,
      valid: tokenValid,
      authorized_at: lastAuth,
      authorized_by: authorizedBy,
    })
  } catch (err) {
    return NextResponse.json({ configured: false, valid: false, error: String(err) })
  }
}

async function checkViaGmailAPI() {
  const tokenResult = await getFreshAccessToken()
  if (tokenResult.error) {
    return NextResponse.json({ error: tokenResult.error, needsReauth: true }, { status: 401 })
  }

  const accessToken = tokenResult.token!

  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/')
    const query = `is:unread has:attachment after:${today}`

    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const searchData = await searchRes.json()

    if (!searchData.messages || searchData.messages.length === 0) {
      return NextResponse.json({ success: true, found: false })
    }

    for (const msgRef of searchData.messages) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const msg = await msgRes.json()

      const parts = msg.payload?.parts || []
      for (const part of parts) {
        const filename = part.filename || ''
        if (filename.toLowerCase().endsWith('.csv') && part.body?.attachmentId) {
          const attachRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/attachments/${part.body.attachmentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          const attachData = await attachRes.json()

          if (attachData.data) {
            const csvContent = Buffer.from(attachData.data, 'base64url').toString('utf-8')

            if (csvContent.includes('TruckNumber') && csvContent.includes('CasesExpected')) {
              await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/modify`,
                {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
                }
              )

              const timestamp = new Date().toISOString()
              await supabase.from('route_imports').upsert({
                id: 1,
                status: 'received',
                received_at: timestamp,
                csv_data: csvContent,
                updated_at: timestamp,
              })

              return NextResponse.json({ success: true, found: true, routes: csvContent.trim().split('\n').length - 1 })
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, found: false })
  } catch (err) {
    console.error('Gmail API error:', err)
    return NextResponse.json({ error: `Gmail check failed: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 500 })
  }
}

// Get current import status
async function handleStatus() {
  const { data } = await supabase.from('route_imports').select('*').eq('id', 1).maybeSingle()
  return NextResponse.json({ data })
}
