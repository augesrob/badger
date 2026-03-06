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
const GMAIL_CLIENT_ID         = process.env.GMAIL_CLIENT_ID     || ''
const GMAIL_CLIENT_SECRET     = process.env.GMAIL_CLIENT_SECRET || ''
const GMAIL_REFRESH_TOKEN_ENV = process.env.GMAIL_REFRESH_TOKEN || ''  // env var fallback

// ── DB token helpers ──────────────────────────────────────────────────────────

/** DB token takes priority over env var fallback */
async function getRefreshToken(): Promise<string | null> {
  try {
    const { data } = await supabase.from('gmail_tokens').select('refresh_token').eq('id', 1).maybeSingle()
    return data?.refresh_token || GMAIL_REFRESH_TOKEN_ENV || null
  } catch {
    return GMAIL_REFRESH_TOKEN_ENV || null
  }
}

/** Exchange refresh token for access token, with DB caching */
async function getFreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken || !GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) return null

  // Check cached access token (>2 min left)
  try {
    const { data: row } = await supabase.from('gmail_tokens').select('access_token, token_expiry').eq('id', 1).maybeSingle()
    if (row?.access_token && row?.token_expiry && new Date(row.token_expiry).getTime() - Date.now() > 2 * 60 * 1000) {
      return row.access_token
    }
  } catch { /* gmail_tokens table may not exist yet */ }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: GMAIL_CLIENT_ID, client_secret: GMAIL_CLIENT_SECRET, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  })
  const data = await res.json()
  if (!data.access_token) return null

  try {
    const expiry = new Date(Date.now() + (data.expires_in - 60) * 1000).toISOString()
    await supabase.from('gmail_tokens').upsert({ id: 1, refresh_token: refreshToken, access_token: data.access_token, token_expiry: expiry, updated_at: new Date().toISOString() })
  } catch { /* non-fatal */ }

  return data.access_token
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { action } = await req.json()

  if (action === 'send')        return handleSend()
  if (action === 'check')       return handleCheck()
  if (action === 'status')      return handleStatus()
  if (action === 'test')        return handleTest()
  if (action === 'debug')       return handleDebug()
  if (action === 'auth_status') return handleAuthStatus()

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// Send the ping email via SMTP
async function handleSend() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    return NextResponse.json({ error: 'Email not configured. Set BADGER_EMAIL_USER and BADGER_EMAIL_PASS in Vercel env vars.' }, { status: 500 })
  }
  try {
    const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 587, secure: false, auth: { user: EMAIL_USER, pass: EMAIL_PASS } })
    const timestamp = new Date().toISOString()
    await transporter.sendMail({ from: EMAIL_USER, to: TARGET_EMAIL, subject: `Route Status Request - ${new Date().toLocaleDateString()}`, text: `Automated route status request from Badger Truck Management.\nTimestamp: ${timestamp}` })
    await supabase.from('route_imports').upsert({ id: 1, status: 'sent', sent_at: timestamp, received_at: null, csv_data: null, updated_at: new Date().toISOString() })
    return NextResponse.json({ success: true, message: 'Email sent' })
  } catch (err) {
    return NextResponse.json({ error: `Send failed: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 500 })
  }
}

// Check Gmail inbox via REST API
async function handleCheck() {
  if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET) return checkViaGmailAPI()
  return NextResponse.json({ success: true, found: false, message: 'Gmail API not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN in Vercel. Or use manual CSV upload.' })
}

// Recursively find all parts (handles nested multipart emails)
function getAllParts(payload: Record<string, unknown>): Record<string, unknown>[] {
  if (!payload) return []
  const parts: Record<string, unknown>[] = []
  if (Array.isArray(payload.parts)) {
    for (const p of payload.parts as Record<string, unknown>[]) {
      parts.push(p)
      parts.push(...getAllParts(p))
    }
  }
  return parts
}

// Gmail REST API check
async function checkViaGmailAPI() {
  try {
    const accessToken = await getFreshAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get Gmail access token. Check GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN in Vercel env vars.' }, { status: 500 })
    }

    // Search last 2 days from FDL with attachment
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const dateStr = `${twoDaysAgo.getFullYear()}/${String(twoDaysAgo.getMonth()+1).padStart(2,'0')}/${String(twoDaysAgo.getDate()).padStart(2,'0')}`
    const query = `has:attachment after:${dateStr} from:fdlwhsestatus@badgerliquor.com`

    const searchRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`, { headers: { Authorization: `Bearer ${accessToken}` } })
    const searchData = await searchRes.json()

    if (!searchData.messages || searchData.messages.length === 0) return NextResponse.json({ success: true, found: false })

    for (const msgRef of searchData.messages) {
      const msg = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json())
      const allParts = [msg.payload, ...getAllParts(msg.payload)]
      for (const part of allParts) {
        const filename = (part?.filename as string) || ''
        const body = part?.body as Record<string, unknown>
        if (filename.toLowerCase().endsWith('.csv') && body?.attachmentId) {
          const attachData = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/attachments/${body.attachmentId}`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json())
          if (attachData.data) {
            const csvContent = Buffer.from(attachData.data, 'base64url').toString('utf-8')
            if (csvContent.length > 10) {
              await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/modify`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ removeLabelIds: ['UNREAD'] }) })
              const timestamp = new Date().toISOString()
              const { error: upsertError } = await supabase.from('route_imports').upsert({ id: 1, status: 'received', received_at: timestamp, csv_data: csvContent, updated_at: timestamp })
              if (upsertError) return NextResponse.json({ error: `DB save failed: ${upsertError.message}` }, { status: 500 })
              return NextResponse.json({ success: true, found: true, routes: csvContent.trim().split('\n').length - 1 })
            }
          }
        }
      }
    }
    return NextResponse.json({ success: true, found: false })
  } catch (err) {
    return NextResponse.json({ error: `Gmail check failed: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 500 })
  }
}

// Test OAuth credentials (🔧 button in UI)
async function handleTest() {
  const configured = {
    smtp: !!(EMAIL_USER && EMAIL_PASS),
    oauth: !!(GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN_ENV),
    email_user: EMAIL_USER ? EMAIL_USER.substring(0, 5) + '...' : '(not set)',
    gmail_client_id_prefix: GMAIL_CLIENT_ID ? GMAIL_CLIENT_ID.substring(0, 20) + '...' : '(not set)',
  }
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    return NextResponse.json({ configured, error: 'Gmail OAuth not configured. Need GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN in Vercel env vars.' })
  }
  try {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) return NextResponse.json({ configured, error: 'No refresh token found in DB or env vars.' })
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: GMAIL_CLIENT_ID, client_secret: GMAIL_CLIENT_SECRET, refresh_token: refreshToken, grant_type: 'refresh_token' }) })
    const tokenData = await tokenRes.json()
    if (tokenData.access_token) {
      return NextResponse.json({ configured, success: true, message: 'Gmail OAuth working ✅', token_type: tokenData.token_type, expires_in: tokenData.expires_in })
    } else {
      return NextResponse.json({ configured, success: false, error: tokenData.error, error_description: tokenData.error_description, detail: tokenData })
    }
  } catch (err) {
    return NextResponse.json({ configured, success: false, error: String(err) })
  }
}

// Auth status for re-authorize banner in UI
async function handleAuthStatus() {
  try {
    let authorizedAt: string | null = null, authorizedBy: string | null = null
    try {
      const { data: row } = await supabase.from('gmail_tokens').select('authorized_at, authorized_by').eq('id', 1).maybeSingle()
      authorizedAt = row?.authorized_at || null
      authorizedBy = row?.authorized_by || null
    } catch { /* table may not exist yet */ }
    const hasToken = !!(await getRefreshToken())
    let tokenValid = false
    if (hasToken && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET) tokenValid = !!(await getFreshAccessToken())
    return NextResponse.json({ configured: hasToken, valid: tokenValid, authorized_at: authorizedAt, authorized_by: authorizedBy })
  } catch (err) {
    return NextResponse.json({ configured: false, valid: false, error: String(err) })
  }
}

// Import status
async function handleStatus() {
  const { data } = await supabase.from('route_imports').select('*').eq('id', 1).maybeSingle()
  return NextResponse.json({ data })
}

// Debug: raw Gmail search results
async function handleDebug() {
  try {
    const accessToken = await getFreshAccessToken()
    if (!accessToken) return NextResponse.json({ error: 'No access token' })
    const [r1, r2] = await Promise.all([
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('has:attachment from:fdlwhsestatus@badgerliquor.com')}&maxResults=5`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('has:attachment subject:WH Status')}&maxResults=5`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
    ])
    return NextResponse.json({ query1_results: r1, query2_results: r2 })
  } catch (err) {
    return NextResponse.json({ error: String(err) })
  }
}
