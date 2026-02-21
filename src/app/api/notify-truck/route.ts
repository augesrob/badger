import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const GATEWAYS: Record<string, string> = {
  verizon:    'vtext.com',
  att:        'txt.att.net',
  tmobile:    'tmomail.net',
  sprint:     'messaging.sprintpcs.com',
  cricket:    'sms.cricketwireless.net',
  boost:      'sms.myboostmobile.com',
  metro:      'mymetropcs.com',
  uscellular: 'email.uscc.net',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
)

export async function POST(req: NextRequest) {
  try {
    const { truck_number, new_status, location, changed_by } = await req.json()
    if (!truck_number || !new_status) {
      return NextResponse.json({ error: 'truck_number and new_status required' }, { status: 400 })
    }

    const normalized = truck_number.replace(/^TR/i, '')
    const base = normalized.split('-')[0]
    const isSemi = normalized.includes('-')

    const { data: allSubs, error: subError } = await supabase
      .from('truck_subscriptions')
      .select('user_id, truck_number, notify_sms, profiles(phone, carrier, sms_enabled)')
      .eq('notify_app', true)

    if (subError) console.error('notify-truck: sub query error', subError)

    if (!allSubs || allSubs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscribers' })
    }

    // Match: base sub matches all trailers, specific sub matches exact
    const subs = allSubs.filter(s => {
      const sub = s.truck_number.replace(/^TR/i, '')
      const subBase = sub.split('-')[0]
      return sub.includes('-') ? sub === normalized : subBase === base
    })

    // Deduplicate by user_id
    const seen = new Set<string>()
    const uniqueSubs = subs.filter(s => {
      if (seen.has(s.user_id)) return false
      seen.add(s.user_id)
      return true
    })

    if (uniqueSubs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No matching subscribers' })
    }

    const truckLabel = `TR${normalized}`
    const trailerLabel = isSemi ? ` (trailer ${normalized.split('-')[1]})` : ''
    const msg = `Badger: ${truckLabel}${trailerLabel}: ${new_status}${location ? ` @ ${location}` : ''}${changed_by ? ` · ${changed_by}` : ''}`

    // Insert in-app notifications
    await supabase.from('notifications').insert(
      uniqueSubs.map(s => ({
        user_id: s.user_id,
        truck_number: normalized,
        message: `🚚 ${msg}`,
        type: 'status_change',
      }))
    )

    // Send SMS via Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.BADGER_SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BADGER_EMAIL_USER,
        pass: process.env.BADGER_EMAIL_PASS,
      },
    })

    const smsResults: string[] = []
    for (const sub of uniqueSubs) {
      const p = (sub as { profiles?: { phone?: string; carrier?: string; sms_enabled?: boolean } }).profiles
      if (!sub.notify_sms || !p?.phone || !p?.carrier || !p?.sms_enabled) continue
      const gateway = GATEWAYS[p.carrier]
      if (!gateway) continue
      const to = `${p.phone}@${gateway}`
      try {
        await transporter.sendMail({
          from: process.env.BADGER_EMAIL_USER,
          to,
          subject: msg,
          text: msg,
        })
        console.log(`notify-truck: SMS sent to ${to}`)
        smsResults.push(to)
      } catch (e) {
        console.error(`notify-truck: SMS failed to ${to}`, e)
      }
    }

    return NextResponse.json({
      sent_notifications: uniqueSubs.length,
      sent_sms: smsResults.length,
      sms_recipients: smsResults,
    })
  } catch (err) {
    console.error('notify-truck error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
