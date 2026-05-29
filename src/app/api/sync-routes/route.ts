import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EMAIL_USER    = process.env.BADGER_EMAIL_USER || ''
const EMAIL_PASS    = process.env.BADGER_EMAIL_PASS || ''
const TARGET_EMAIL  = 'fdlwhsestatus@badgerliquor.com'
const GMAIL_CLIENT_ID     = process.env.GMAIL_CLIENT_ID     || ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || ''

// ── Two-action endpoint ────────────────────────────────────────────────────────
// POST { action: "request" } → sends the same ping email the website sends
// POST { action: "import"  } → checks Gmail for reply, imports routes if found
//
// Android polls "import" every 8s after sending "request", same as the website.

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}))
    const action = (body as Record<string, string>).action ?? 'import'

    if (action === 'request') return handleRequest()
    if (action === 'import')  return handleImport()
    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

// ── action: "request" ─────────────────────────────────────────────────────────
// Sends the route request email (same as the website's "Request Data" button)

async function handleRequest(): Promise<NextResponse> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    return NextResponse.json({ ok: false, error: 'Email not configured on server' }, { status: 500 })
  }
  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS } })
    await transporter.sendMail({
      from: EMAIL_USER,
      to: TARGET_EMAIL,
      subject: 'Route Request',
      text: 'Please send current route data.',
    })
    // Mark as sent in route_imports so the website status bar also reflects this
    const now = new Date().toISOString()
    await adminSupabase.from('route_imports').upsert({
      id: 1, status: 'sent', sent_at: now, received_at: null, csv_data: null, updated_at: now,
    })
    return NextResponse.json({ ok: true, message: 'Route request email sent' })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

// ── action: "import" ──────────────────────────────────────────────────────────
// Checks Gmail for the CSV reply. If found: stores it and writes route_info.
// If not yet arrived: returns { ok: false, waiting: true } — Android polls again.

async function handleImport(): Promise<NextResponse> {
  // 1. Try to fetch a fresh CSV from Gmail
  const gmailResult = await checkGmailForCSV()

  // 2. If still waiting for the reply email, tell the app to keep polling
  if (gmailResult === 'no_email') {
    return NextResponse.json({ ok: false, waiting: true, message: 'Waiting for route email reply…' })
  }
  if (gmailResult === 'not_configured') {
    // Gmail OAuth not set up — fall through to stored data
  }

  // 3. Read CSV from route_imports (either just stored or previously stored)
  const { data: routeImport, error: importErr } = await adminSupabase
    .from('route_imports')
    .select('csv_data, received_at')
    .eq('id', 1)
    .maybeSingle()

  if (importErr) {
    return NextResponse.json({ ok: false, error: importErr.message }, { status: 500 })
  }
  if (!routeImport?.csv_data) {
    return NextResponse.json({ ok: false, waiting: true, message: 'Still waiting for route data…' })
  }

  // 4. Parse CSV (col 0 = truck, col 1 = route)
  const lines = (routeImport.csv_data as string).trim().replace(/\r/g, '').split('\n')
  const routeMap: Record<string, string[]> = {}
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < 2) continue
    const rawTruck = cols[0].trim()
    const route    = cols[1].trim()
    if (!rawTruck || !route) continue
    const key = rawTruck.replace(/^TR/i, '').toLowerCase()
    if (!routeMap[key]) routeMap[key] = []
    if (!routeMap[key].includes(route)) routeMap[key].push(route)
  }

  // 5. Update route_info for each printroom entry
  const { data: entries, error: entriesErr } = await adminSupabase
    .from('printroom_entries')
    .select('id, truck_number')
  if (entriesErr) {
    return NextResponse.json({ ok: false, error: entriesErr.message }, { status: 500 })
  }

  let updated = 0
  for (const entry of (entries ?? [])) {
    if (!entry.truck_number) continue
    const key = (entry.truck_number as string).replace(/^TR/i, '').toLowerCase()
    let routes = routeMap[key]
    if (!routes) routes = routeMap[key.replace(/-\d+$/, '')] // semi: "222-1" → "222"
    if (!routes?.length) continue
    await adminSupabase
      .from('printroom_entries')
      .update({ route_info: routes.join(', ') })
      .eq('id', entry.id as number)
    updated++
  }

  return NextResponse.json({
    ok: true,
    updated,
    total: (entries ?? []).length,
    fresh: gmailResult === 'found',
    csvAge: routeImport.received_at,
  })
}

// ── Gmail helpers (shared with route-email) ───────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  const refreshToken = await (async () => {
    try {
      const { data } = await adminSupabase.from('gmail_tokens').select('refresh_token').eq('id', 1).maybeSingle()
      return (data?.refresh_token || process.env.GMAIL_REFRESH_TOKEN || null) as string | null
    } catch { return (process.env.GMAIL_REFRESH_TOKEN || null) as string | null }
  })()
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !refreshToken) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: GMAIL_CLIENT_ID, client_secret: GMAIL_CLIENT_SECRET, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  })
  return (await res.json()).access_token || null
}

async function checkGmailForCSV(): Promise<'found' | 'no_email' | 'not_configured'> {
  const accessToken = await getAccessToken()
  if (!accessToken) return 'not_configured'

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const d = twoDaysAgo
  const dateStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
  const query = `has:attachment after:${dateStr} from:${TARGET_EMAIL}`

  const searchData = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  ).then(r => r.json())

  if (!searchData.messages?.length) return 'no_email'

  for (const msgRef of searchData.messages) {
    const msg = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).then(r => r.json())

    for (const part of getAllParts(msg.payload)) {
      const filename = (part?.filename as string) || ''
      const body = part?.body as Record<string, unknown>
      if (filename.toLowerCase().endsWith('.csv') && body?.attachmentId) {
        const attachData = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/attachments/${body.attachmentId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ).then(r => r.json())
        if (attachData.data) {
          const csvContent = Buffer.from(attachData.data, 'base64url').toString('utf-8')
          if (csvContent.length > 10) {
            const now = new Date().toISOString()
            await adminSupabase.from('route_imports').upsert({
              id: 1, status: 'received', received_at: now, csv_data: csvContent, updated_at: now,
            })
            return 'found'
          }
        }
      }
    }
  }
  return 'no_email'
}

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
