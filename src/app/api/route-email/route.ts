import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Email config
const EMAIL_USER = process.env.BADGER_EMAIL_USER || ''
const EMAIL_PASS = process.env.BADGER_EMAIL_PASS || ''
const TARGET_EMAIL = 'fdlwhsestatus@badgerliquor.com'

// Gmail API config (OAuth2)
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || ''
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || ''

export async function POST(req: NextRequest) {
  const { action } = await req.json()

  if (action === 'send') return handleSend()
  if (action === 'check') return handleCheck()
  if (action === 'status') return handleStatus()
  if (action === 'test') return handleTest()
  if (action === 'debug') return handleDebug()

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// Send the ping email via SMTP (works fine on Vercel)
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

    // Store request record
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

// Check Gmail inbox via REST API for reply with CSV
async function handleCheck() {
  // Try Gmail REST API first, fall back to basic check
  if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
    return checkViaGmailAPI()
  }

  // Fallback: If no OAuth configured, try simple SMTP check (limited)
  return NextResponse.json({
    success: true,
    found: false,
    message: 'Gmail API not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN in Vercel. Or use manual CSV upload.',
  })
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

// Gmail REST API check (fully compatible with Vercel serverless)
async function checkViaGmailAPI() {
  // Log which env vars are configured (not their values)
  console.log('Gmail OAuth check — env vars present:', {
    client_id: !!GMAIL_CLIENT_ID,
    client_secret: !!GMAIL_CLIENT_SECRET,
    refresh_token: !!GMAIL_REFRESH_TOKEN,
    client_id_len: GMAIL_CLIENT_ID.length,
    refresh_token_len: GMAIL_REFRESH_TOKEN.length,
  })
  try {
    // Get access token from refresh token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        refresh_token: GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      const reason = tokenData.error_description || tokenData.error || 'unknown'
      console.error('Gmail token error:', JSON.stringify(tokenData))
      return NextResponse.json({ 
        error: `Failed to get Gmail access token: ${reason}`,
        detail: tokenData,
      }, { status: 500 })
    }

    const accessToken = tokenData.access_token

    // Search for messages with attachments from FDL (last 2 days, read or unread)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const dateStr = `${twoDaysAgo.getFullYear()}/${String(twoDaysAgo.getMonth()+1).padStart(2,'0')}/${String(twoDaysAgo.getDate()).padStart(2,'0')}`
    const query = `has:attachment after:${dateStr} from:fdlwhsestatus@badgerliquor.com`

    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const searchData = await searchRes.json()

    if (!searchData.messages || searchData.messages.length === 0) {
      return NextResponse.json({ success: true, found: false })
    }

    // Check each message for CSV attachment
    for (const msgRef of searchData.messages) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const msg = await msgRes.json()

      // Find CSV attachment in all parts
      const allParts = [msg.payload, ...getAllParts(msg.payload)]
      for (const part of allParts) {
        const filename = (part?.filename as string) || ''
        const body = part?.body as Record<string, unknown>
        if (filename.toLowerCase().endsWith('.csv') && body?.attachmentId) {
          // Download attachment
          const attachRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/attachments/${body.attachmentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          const attachData = await attachRes.json()

          if (attachData.data) {
            // Decode base64url to string
            const csvContent = Buffer.from(attachData.data, 'base64url').toString('utf-8')

            // Verify it looks like our Routes CSV (loose check)
            if (csvContent.length > 10) {
              // Mark message as read
              await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/modify`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
                }
              )

              // Store in database
              const timestamp = new Date().toISOString()
              const { error: upsertError } = await supabase.from('route_imports').upsert({
                id: 1,
                status: 'received',
                received_at: timestamp,
                csv_data: csvContent,
                updated_at: timestamp,
              })

              if (upsertError) {
                console.error('DB upsert error:', upsertError)
                return NextResponse.json({ error: `DB save failed: ${upsertError.message}` }, { status: 500 })
              }

              const routeCount = csvContent.trim().split('\n').length - 1

              return NextResponse.json({ success: true, found: true, routes: routeCount })
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

// Test Gmail OAuth credentials
async function handleTest() {
  const configured = {
    smtp: !!(EMAIL_USER && EMAIL_PASS),
    oauth: !!(GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN),
    email_user: EMAIL_USER ? EMAIL_USER.substring(0, 5) + '...' : '(not set)',
    gmail_client_id_prefix: GMAIL_CLIENT_ID ? GMAIL_CLIENT_ID.substring(0, 20) + '...' : '(not set)',
  }

  if (!configured.oauth) {
    return NextResponse.json({ 
      configured,
      error: 'Gmail OAuth not configured. Need GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN in Vercel env vars.' 
    })
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        refresh_token: GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    })
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

// Get current import status
async function handleStatus() {
  const { data } = await supabase.from('route_imports').select('*').eq('id', 1).maybeSingle()
  return NextResponse.json({ data })
}

// Debug: show raw Gmail search results
async function handleDebug() {
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        refresh_token: GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return NextResponse.json({ error: 'No access token', detail: tokenData })

    const accessToken = tokenData.access_token

    // Search broadly - last 7 days, any attachment
    const query = `has:attachment from:fdlwhsestatus@badgerliquor.com`
    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const searchData = await searchRes.json()

    // Also try without from filter
    const query2 = `has:attachment subject:WH Status`
    const searchRes2 = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query2)}&maxResults=5`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const searchData2 = await searchRes2.json()

    return NextResponse.json({ 
      query1_results: searchData,
      query2_results: searchData2,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) })
  }
}
