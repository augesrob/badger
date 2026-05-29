import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Android "Sync Route Sheet" button:
// 1. Checks Gmail for fresh route CSV (same flow as the website Route Sheet page)
// 2. If a new email is found, stores it and uses that data
// 3. If no new email, falls back to the most recently stored CSV
// 4. Parses truck → route mappings and writes route_info to printroom_entries
export async function POST(): Promise<NextResponse> {
  try {
    // ── Step 1: Try to fetch a fresh CSV from Gmail ───────────────────────
    let fetchMsg = 'used stored data'
    try {
      const gmailResult = await checkGmailForCSV()
      if (gmailResult === 'found') fetchMsg = 'fetched fresh email'
      else if (gmailResult === 'no_email') fetchMsg = 'no new email, used stored data'
      else fetchMsg = `gmail: ${gmailResult}`
    } catch (e) {
      fetchMsg = `gmail check skipped: ${e instanceof Error ? e.message : String(e)}`
    }

    // ── Step 2: Read the CSV (freshly stored or previously stored) ────────
    const { data: routeImport, error: importErr } = await adminSupabase
      .from('route_imports')
      .select('csv_data, received_at')
      .eq('id', 1)
      .maybeSingle()

    if (importErr) {
      return NextResponse.json({ ok: false, error: importErr.message }, { status: 500 })
    }
    if (!routeImport?.csv_data) {
      return NextResponse.json(
        { ok: false, error: 'No route data available. Use the Route Sheet page to request the route email first.' },
        { status: 404 }
      )
    }

    // ── Step 3: Parse CSV — format: truckNumber, route, ...(col6 = cases) ─
    const lines = (routeImport.csv_data as string)
      .trim()
      .replace(/\r/g, '')
      .split('\n')

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

    // ── Step 4: Update route_info in printroom_entries ────────────────────
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
      if (!routes) {
        const base = key.replace(/-\d+$/, '') // "222-1" → "222"
        routes = routeMap[base]
      }
      if (!routes || routes.length === 0) continue

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
      source: fetchMsg,
      csvAge: routeImport.received_at,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

// ── Gmail check (mirrors route-email/checkViaGmailAPI) ────────────────────────

async function getAccessToken(): Promise<string | null> {
  const clientId     = process.env.GMAIL_CLIENT_ID     || ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || ''
  const refreshToken = await (async () => {
    try {
      const { data } = await adminSupabase.from('gmail_tokens').select('refresh_token').eq('id', 1).maybeSingle()
      return data?.refresh_token || process.env.GMAIL_REFRESH_TOKEN || null
    } catch { return process.env.GMAIL_REFRESH_TOKEN || null }
  })()

  if (!clientId || !clientSecret || !refreshToken) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  })
  const data = await res.json()
  return data.access_token || null
}

async function checkGmailForCSV(): Promise<'found' | 'no_email' | 'not_configured'> {
  const accessToken = await getAccessToken()
  if (!accessToken) return 'not_configured'

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const d = twoDaysAgo
  const dateStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
  const query = `has:attachment after:${dateStr} from:fdlwhsestatus@badgerliquor.com`

  const searchRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const searchData = await searchRes.json()
  if (!searchData.messages?.length) return 'no_email'

  for (const msgRef of searchData.messages) {
    const msg = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).then(r => r.json())

    const allParts = getAllParts(msg.payload)
    for (const part of allParts) {
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
            const timestamp = new Date().toISOString()
            await adminSupabase.from('route_imports').upsert({
              id: 1, status: 'received', received_at: timestamp,
              csv_data: csvContent, updated_at: timestamp,
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
