import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: cfg, error: cfgErr } = await supabaseAdmin
      .from('auto_reset_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (cfgErr || !cfg) {
      return NextResponse.json({ skipped: true, reason: 'No auto_reset_config row found' })
    }

    if (!cfg.enabled) {
      return NextResponse.json({ skipped: true, reason: 'Auto-reset disabled' })
    }

    // Check day of week in America/Chicago timezone
    const now = new Date()
    const chicagoDow = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/Chicago' })
    ).getDay()

    const days: number[] = cfg.days ?? [0, 1, 2, 3, 4, 5, 6]
    if (!days.includes(chicagoDow)) {
      return NextResponse.json({
        skipped: true,
        reason: `Not a reset day (Chicago day=${chicagoDow}, configured=${days})`,
      })
    }

    // Run the configured resets
    const types: string[] = cfg.reset_types ?? ['printroom', 'preshift', 'movement']
    const results: string[] = []

    if (types.includes('printroom')) {
      await supabaseAdmin.from('printroom_entries').delete().neq('id', 0)
      await supabaseAdmin.from('loading_doors').update({ is_done_for_night: false, door_status: 'Loading' }).neq('id', 0)
      results.push('printroom')
    }
    if (types.includes('preshift')) {
      await supabaseAdmin.from('staging_doors').update({ in_front: null, in_back: null }).neq('id', 0)
      results.push('preshift')
    }
    if (types.includes('movement')) {
      await supabaseAdmin.from('live_movement').delete().neq('id', 0)
      results.push('movement')
    }

    await supabaseAdmin.from('reset_log').insert({
      reset_type: results.join('+') || 'none',
      reset_by: 'auto_cron',
    })

    return NextResponse.json({ ok: true, reset_types: results, reset_at: now.toISOString() })

  } catch (err) {
    console.error('Cron reset error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
