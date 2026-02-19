import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Email config from environment
const EMAIL_USER = process.env.BADGER_EMAIL_USER || ''
const EMAIL_PASS = process.env.BADGER_EMAIL_PASS || ''
const EMAIL_HOST_SMTP = process.env.BADGER_SMTP_HOST || 'smtp.gmail.com'
const EMAIL_HOST_IMAP = process.env.BADGER_IMAP_HOST || 'imap.gmail.com'
const TARGET_EMAIL = 'fdlwhsestatus@badgerliquor.com'

export async function POST(req: NextRequest) {
  const { action } = await req.json()

  if (action === 'send') {
    return handleSend()
  } else if (action === 'check') {
    return handleCheck()
  } else if (action === 'status') {
    return handleStatus()
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// Send the ping email
async function handleSend() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST_SMTP,
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
    })

    return NextResponse.json({ success: true, message: 'Email sent' })
  } catch (err) {
    console.error('Send error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

// Check inbox for reply with CSV attachment
async function handleCheck() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  try {
    const client = new ImapFlow({
      host: EMAIL_HOST_IMAP,
      port: 993,
      secure: true,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      logger: false,
    })

    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      // Search for recent unread messages from the target or containing Routes CSV
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const messages = client.fetch(
        { since: today, seen: false },
        { envelope: true, bodyStructure: true, uid: true }
      )

      let csvContent: string | null = null
      let foundUid: number | null = null

      for await (const msg of messages) {
        // Look for CSV attachment in body structure
        const parts = flattenParts(msg.bodyStructure)
        for (const part of parts) {
          if (
            part.type === 'text/csv' ||
            part.disposition === 'attachment' ||
            (part.parameters?.name && part.parameters.name.toLowerCase().endsWith('.csv'))
          ) {
            // Found a CSV attachment - download it
            const { content } = await client.download(String(msg.uid), part.part, { uid: true })
            const chunks: Buffer[] = []
            for await (const chunk of content) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            }
            csvContent = Buffer.concat(chunks).toString('utf-8')
            foundUid = msg.uid
            break
          }
        }
        if (csvContent) break
      }

      if (csvContent && foundUid) {
        // Mark as read
        await client.messageFlagsAdd(String(foundUid), ['\\Seen'], { uid: true })

        // Store in database
        const timestamp = new Date().toISOString()
        await supabase.from('route_imports').upsert({
          id: 1,
          status: 'received',
          received_at: timestamp,
          csv_data: csvContent,
        })

        return NextResponse.json({ success: true, found: true, routes: csvContent.split('\n').length - 1 })
      }

      return NextResponse.json({ success: true, found: false })
    } finally {
      lock.release()
      await client.logout()
    }
  } catch (err) {
    console.error('Check error:', err)
    return NextResponse.json({ error: 'Failed to check inbox' }, { status: 500 })
  }
}

// Get current status
async function handleStatus() {
  const { data } = await supabase.from('route_imports').select('*').eq('id', 1).maybeSingle()
  return NextResponse.json({ data })
}

// Helper: flatten IMAP body structure into parts list
interface BodyPart {
  part: string
  type: string
  disposition?: string
  parameters?: Record<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenParts(structure: any, prefix = ''): BodyPart[] {
  const parts: BodyPart[] = []
  if (!structure) return parts

  if (structure.childNodes) {
    structure.childNodes.forEach((child: Record<string, unknown>, idx: number) => {
      const partNum = prefix ? `${prefix}.${idx + 1}` : String(idx + 1)
      parts.push(...flattenParts(child, partNum))
    })
  } else {
    const partId = prefix || '1'
    parts.push({
      part: partId,
      type: `${structure.type || 'application'}/${structure.subtype || 'octet-stream'}`.toLowerCase(),
      disposition: structure.disposition,
      parameters: structure.parameters || structure.dispositionParameters,
    })
  }

  return parts
}
