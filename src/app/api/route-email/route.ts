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

// Gmail REST API check (fully compatible with Vercel serverless)
async function checkViaGmailAPI() {
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
      return NextResponse.json({ error: 'Failed to get Gmail access token' }, { status: 500 })
    }

    const accessToken = tokenData.access_token

    // Search for unread messages with attachments from today
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

    // Check each message for CSV attachment
    for (const msgRef of searchData.messages) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const msg = await msgRes.json()

      // Find CSV attachment
      const parts = msg.payload?.parts || []
      for (const part of parts) {
        const filename = part.filename || ''
        if (filename.toLowerCase().endsWith('.csv') && part.body?.attachmentId) {
          // Download attachment
          const attachRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/attachments/${part.body.attachmentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          const attachData = await attachRes.json()

          if (attachData.data) {
            // Decode base64url to string
            const csvContent = Buffer.from(attachData.data, 'base64url').toString('utf-8')

            // Verify it looks like our Routes CSV
            if (csvContent.includes('TruckNumber') && csvContent.includes('CasesExpected')) {
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
              await supabase.from('route_imports').upsert({
                id: 1,
                status: 'received',
                received_at: timestamp,
                csv_data: csvContent,
                updated_at: timestamp,
              })

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

// Get current import status
async function handleStatus() {
  const { data } = await supabase.from('route_imports').select('*').eq('id', 1).maybeSingle()
  return NextResponse.json({ data })
}
