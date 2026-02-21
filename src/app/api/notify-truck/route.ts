import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Carrier email-to-SMS gateways (completely free)
const GATEWAYS: Record<string, string> = {
  verizon:   'vtext.com',
  att:       'txt.att.net',
  tmobile:   'tmomail.net',
  sprint:    'messaging.sprintpcs.com',
  cricket:   'sms.cricketwireless.net',
  boost:     'sms.myboostmobile.com',
  metro:     'mymetropcs.com',
  uscellular:'email.uscc.net',
}

// Use service role key for server-side queries (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
)

export async function POST(req: NextRequest) {
  // Lazy-init Resend so missing key only fails at runtime, not build time
  const resend = new Resend(process.env.RESEND_API_KEY ?? '')
  try {
    const { truck_number, new_status, location, changed_by } = await req.json()
    if (!truck_number || !new_status) {
      return NextResponse.json({ error: 'truck_number and new_status required' }, { status: 400 })
    }

    // Find all subscribers for this truck with SMS enabled
    const { data: subs } = await supabase
      .from('truck_subscriptions')
      .select('user_id, notify_sms, profiles(phone, carrier, sms_enabled, display_name)')
      .eq('truck_number', truck_number.replace(/^TR/i, ''))
      .eq('notify_app', true)

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscribers' })
    }

    // Insert in-app notifications for all subscribers
    const notifRows = subs.map((s: { user_id: string }) => ({
      user_id: s.user_id,
      truck_number,
      message: `🚚 TR${truck_number.replace(/^TR/i,'')}: ${new_status}${location ? ` @ ${location}` : ''}${changed_by ? ` (by ${changed_by})` : ''}`,
      type: 'status_change',
    }))
    await supabase.from('notifications').insert(notifRows)

    // Send SMS to subscribers who have phone + carrier + sms_enabled
    const smsResults: string[] = []
    for (const sub of subs) {
      const p = (sub as { profiles?: { phone?: string; carrier?: string; sms_enabled?: boolean; display_name?: string } }).profiles
      if (!sub.notify_sms || !p?.phone || !p?.carrier || !p?.sms_enabled) continue
      const gateway = GATEWAYS[p.carrier]
      if (!gateway) continue

      const to = `${p.phone}@${gateway}`
      const body = `Badger: TR${truck_number.replace(/^TR/i,'')} → ${new_status}${location ? ` @ ${location}` : ''}`

      try {
        await resend.emails.send({
          from: 'Badger <notifications@badger.augesrob.net>',
          to,
          subject: body,  // SMS shows subject as message body on most carriers
          text: body,
        })
        smsResults.push(to)
      } catch (e) {
        console.error('SMS send failed:', to, e)
      }
    }

    return NextResponse.json({
      sent_notifications: notifRows.length,
      sent_sms: smsResults.length,
      sms_recipients: smsResults,
    })
  } catch (err) {
    console.error('notify-truck error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
