import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
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
  const resend = new Resend(process.env.RESEND_API_KEY ?? '')

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.error('notify-truck: SUPABASE_SERVICE_ROLE_KEY not set')
  if (!process.env.RESEND_API_KEY) console.error('notify-truck: RESEND_API_KEY not set')

  try {
    const { truck_number, new_status, location, changed_by } = await req.json()
    if (!truck_number || !new_status) {
      return NextResponse.json({ error: 'truck_number and new_status required' }, { status: 400 })
    }

    const normalized = truck_number.replace(/^TR/i, '')
    const base = normalized.split('-')[0]
    const isSemi = normalized.includes('-')

    console.log(`notify-truck: truck=${normalized}, base=${base}, isSemi=${isSemi}, status=${new_status}`)

    const { data: allSubs, error: subError } = await supabase
      .from('truck_subscriptions')
      .select('user_id, truck_number, notify_sms, profiles(phone, carrier, sms_enabled, display_name)')
      .eq('notify_app', true)

    if (subError) console.error('notify-truck: subscription query error', subError)
    console.log(`notify-truck: total subscriptions fetched: ${allSubs?.length ?? 0}`)

    if (!allSubs || allSubs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscribers' })
    }

    // Match: base-only sub (e.g. "223") matches all trailers; specific sub (e.g. "223-2") matches exact
    const subs = allSubs.filter(s => {
      const sub = s.truck_number.replace(/^TR/i, '')
      const subBase = sub.split('-')[0]
      const subSpecific = sub.includes('-')
      if (subSpecific) {
        return sub === normalized
      } else {
        return subBase === base
      }
    })

    // Deduplicate by user_id
    const seen = new Set<string>()
    const uniqueSubs = subs.filter(s => {
      if (seen.has(s.user_id)) return false
      seen.add(s.user_id)
      return true
    })

    console.log(`notify-truck: matched ${subs.length} subs, ${uniqueSubs.length} unique`)

    if (uniqueSubs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No matching subscribers' })
    }

    const truckLabel = `TR${normalized}`
    const trailerLabel = isSemi ? ` (trailer ${normalized.split('-')[1]})` : ''
    const msg = `🚚 ${truckLabel}${trailerLabel}: ${new_status}${location ? ` @ ${location}` : ''}${changed_by ? ` · ${changed_by}` : ''}`

    // Insert in-app notifications
    const { error: notifError } = await supabase.from('notifications').insert(
      uniqueSubs.map(s => ({
        user_id: s.user_id,
        truck_number: normalized,
        message: msg,
        type: 'status_change',
      }))
    )
    if (notifError) console.error('notify-truck: notification insert error', notifError)

    // Send SMS
    const smsResults: string[] = []
    for (const sub of uniqueSubs) {
      const p = (sub as { profiles?: { phone?: string; carrier?: string; sms_enabled?: boolean } }).profiles
      if (!sub.notify_sms || !p?.phone || !p?.carrier || !p?.sms_enabled) continue
      const gateway = GATEWAYS[p.carrier]
      if (!gateway) continue
      const to = `${p.phone}@${gateway}`
      console.log(`notify-truck: SMS attempt to ${to}`)
      try {
        const result = await resend.emails.send({
          from: 'Badger <onboarding@resend.dev>',
          to,
          subject: msg,
          text: msg,
        })
        console.log(`notify-truck: SMS result`, result)
        smsResults.push(to)
      } catch (e) {
        console.error('notify-truck: SMS send failed:', to, e)
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
