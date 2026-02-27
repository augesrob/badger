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
      .select('user_id, truck_number, notify_sms, notify_email, profiles(phone, carrier, sms_enabled, notify_email, notify_email_address)')
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

    // Load notification preferences for all matched users
    const userIds = uniqueSubs.map(s => s.user_id)
    const { data: prefRows } = await supabase
      .from('notification_preferences')
      .select('user_id, notify_truck_status, channel_app, channel_sms')
      .in('user_id', userIds)

    const prefMap: Record<string, { notify_truck_status: boolean; channel_app: boolean; channel_sms: boolean }> = {}
    ;(prefRows || []).forEach(p => { prefMap[p.user_id] = p })

    // Filter to users who have truck_status notifications enabled
    const notifiableSubs = uniqueSubs.filter(s => {
      const p = prefMap[s.user_id]
      // Default to true if no prefs row yet
      return p ? p.notify_truck_status : true
    })

    const truckLabel = `TR${normalized}`
    const trailerLabel = isSemi ? ` (trailer ${normalized.split('-')[1]})` : ''
    const msg = `Badger: ${truckLabel}${trailerLabel}: ${new_status}${location ? ` @ ${location}` : ''}${changed_by ? ` · ${changed_by}` : ''}`

    // In-app notifications — only for users with channel_app enabled
    const appSubs = notifiableSubs.filter(s => {
      const p = prefMap[s.user_id]
      return p ? p.channel_app : true
    })
    if (appSubs.length > 0) {
      await supabase.from('notifications').insert(
        appSubs.map(s => ({
          user_id: s.user_id,
          truck_number: normalized,
          message: `🚚 ${msg}`,
          type: 'status_change',
        }))
      )
    }

    // SMS — only for users with channel_sms enabled + SMS configured
    const smsSubs = notifiableSubs.filter(s => {
      const p = prefMap[s.user_id]
      return p ? p.channel_sms : true
    })

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
    for (const sub of smsSubs) {
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


    // Email notifications — for users with email enabled
    const emailResults: string[] = []
    for (const sub of notifiableSubs) {
      if (!sub.notify_email) continue
      const p = (sub as { profiles?: { notify_email?: boolean; notify_email_address?: string } }).profiles
      if (!p?.notify_email || !p?.notify_email_address?.trim()) continue
      const to = p.notify_email_address.trim()
      try {
        await transporter.sendMail({
          from: `"Badger Alerts" <${process.env.BADGER_EMAIL_USER}>`,
          to,
          subject: `🚚 ${truckLabel} Status Update`,
          text: msg,
          html: `<div style="font-family:sans-serif;padding:16px;background:#1a1a1a;color:#fff;border-radius:8px;max-width:400px">
            <h2 style="color:#f59e0b;margin:0 0 8px">🚚 Badger Alert</h2>
            <p style="margin:0;font-size:16px">${truckLabel}${trailerLabel}</p>
            <p style="margin:8px 0;font-size:20px;font-weight:bold;color:#fff">${new_status}</p>
            ${location ? `<p style="margin:4px 0;color:#9ca3af">📍 ${location}</p>` : ''}
            ${changed_by ? `<p style="margin:4px 0;color:#6b7280;font-size:12px">Changed by ${changed_by}</p>` : ''}
          </div>`,
        })
        console.log(`notify-truck: email sent to ${to}`)
        emailResults.push(to)
      } catch (e) {
        console.error(`notify-truck: email failed to ${to}`, e)
      }
    }

    return NextResponse.json({
      sent_notifications: appSubs.length,
      sent_sms: smsResults.length,
      sms_recipients: smsResults,
      sent_email: emailResults.length,
      email_recipients: emailResults,
    })
  } catch (err) {
    console.error('notify-truck error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
