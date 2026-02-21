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
  try {
    const { truck_number, new_status, location, changed_by } = await req.json()
    if (!truck_number || !new_status) {
      return NextResponse.json({ error: 'truck_number and new_status required' }, { status: 400 })
    }

    // Normalize: strip TR prefix, e.g. "TR170-1" -> "170-1"
    const normalized = truck_number.replace(/^TR/i, '')
    // Base number: "170-1" -> "170", "170" -> "170"
    const base = normalized.split('-')[0]
    const isSemi = normalized.includes('-')

    // Fetch ALL subscriptions — we'll filter in JS to support both match modes:
    //   subscriber "170"    → matches TR170, TR170-1, TR170-2 (all trailers)
    //   subscriber "170-1"  → matches only TR170-1 (specific trailer)
    const { data: allSubs } = await supabase
      .from('truck_subscriptions')
      .select('user_id, truck_number, notify_sms, profiles(phone, carrier, sms_enabled, display_name)')
      .eq('notify_app', true)

    if (!allSubs) return NextResponse.json({ sent: 0, message: 'No subscribers' })

    // Match logic
    const subs = allSubs.filter(s => {
      const sub = s.truck_number.replace(/^TR/i, '')
      const subBase = sub.split('-')[0]
      const subIsSemi = sub.includes('-')

      if (subIsSemi) {
        // Specific trailer sub (e.g. "170-1") — only matches exact truck
        return sub === normalized
      } else {
        // Base number sub (e.g. "170") — matches the base truck and ALL its trailers
        return subBase === base
      }
    })

    // Deduplicate by user_id (in case someone somehow subscribed to both "170" and "170-1")
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
    const msg = `🚚 ${truckLabel}${trailerLabel}: ${new_status}${location ? ` @ ${location}` : ''}${changed_by ? ` · ${changed_by}` : ''}`

    // Insert in-app notifications
    await supabase.from('notifications').insert(
      uniqueSubs.map(s => ({
        user_id: s.user_id,
        truck_number: normalized,
        message: msg,
        type: 'status_change',
      }))
    )

    // Send SMS
    const smsResults: string[] = []
    for (const sub of uniqueSubs) {
      const p = (sub as { profiles?: { phone?: string; carrier?: string; sms_enabled?: boolean } }).profiles
      if (!sub.notify_sms || !p?.phone || !p?.carrier || !p?.sms_enabled) continue
      const gateway = GATEWAYS[p.carrier]
      if (!gateway) continue
      const to = `${p.phone}@${gateway}`
      try {
        await resend.emails.send({
          from: 'Badger <notifications@badger.augesrob.net>',
          to,
          subject: msg,
          text: msg,
        })
        smsResults.push(to)
      } catch (e) {
        console.error('SMS send failed:', to, e)
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
