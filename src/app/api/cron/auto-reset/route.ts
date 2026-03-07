import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CST = UTC-6 (standard) / UTC-5 (daylight)
// We check both offsets so it fires correctly year-round
const CST_OFFSET = -6
const CDT_OFFSET = -5

function getCSTHourAndDay(): { hour: number; minute: number; day: number }[] {
  const now = new Date()
  return [CST_OFFSET, CDT_OFFSET].map(offset => {
    const local = new Date(now.getTime() + offset * 60 * 60 * 1000)
    return {
      hour:   local.getUTCHours(),
      minute: local.getUTCMinutes(),
      day:    local.getUTCDay(), // 0=Sun … 6=Sat
    }
  })
}

export async function GET(req: NextRequest) {
  // Auth — only Vercel cron or admin manual trigger
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load config
  const { data: config, error: configErr } = await supabaseAdmin
    .from('auto_reset_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (configErr || !config) {
    return NextResponse.json({ skipped: true, reason: 'No config found' })
  }

  if (!config.enabled) {
    return NextResponse.json({ skipped: true, reason: 'Auto-reset disabled' })
  }

  // Check if current CST time matches scheduled time (within the current hour)
  const candidates = getCSTHourAndDay()
  const matched = candidates.some(({ hour, minute, day }) =>
    hour === config.hour &&
    minute < 60 && // cron fires every hour, we just check hour match
    (config.days as number[]).includes(day)
  )

  if (!matched) {
    return NextResponse.json({ skipped: true, reason: 'Not scheduled for this hour/day' })
  }

  // Check we haven't already reset today (prevent duplicate fires within same hour)
  const { data: lastReset } = await supabaseAdmin
    .from('reset_log')
    .select('reset_at')
    .eq('reset_type', 'auto_all')
    .order('reset_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastReset) {
    const lastAt = new Date(lastReset.reset_at)
    const nowUtc = new Date()
    const diffHours = (nowUtc.getTime() - lastAt.getTime()) / (1000 * 60 * 60)
    if (diffHours < 1) {
      return NextResponse.json({ skipped: true, reason: 'Already ran within the last hour' })
    }
  }

  // ── Run the full reset ──────────────────────────────────────────────────────
  try {
    // 1. Print room — clear entries, reset door statuses
    await supabaseAdmin.from('printroom_entries').delete().neq('id', 0)
    await supabaseAdmin.from('loading_doors')
      .update({ is_done_for_night: false, door_status: 'Loading' })
      .neq('id', 0)

    // 2. Seed preset rows: Batch 1 → 2 rows, Batch 2 → 6 rows per door
    const { data: allDoors } = await supabaseAdmin
      .from('loading_doors').select('id').order('sort_order')
    if (allDoors && allDoors.length > 0) {
      const seedRows = allDoors.flatMap((d: { id: number }) => [
        { loading_door_id: d.id, batch_number: 1, row_order: 1 },
        { loading_door_id: d.id, batch_number: 1, row_order: 2 },
        { loading_door_id: d.id, batch_number: 2, row_order: 1 },
        { loading_door_id: d.id, batch_number: 2, row_order: 2 },
        { loading_door_id: d.id, batch_number: 2, row_order: 3 },
        { loading_door_id: d.id, batch_number: 2, row_order: 4 },
        { loading_door_id: d.id, batch_number: 2, row_order: 5 },
        { loading_door_id: d.id, batch_number: 2, row_order: 6 },
      ])
      await supabaseAdmin.from('printroom_entries').insert(seedRows)
    }

    // 3. PreShift
    await supabaseAdmin.from('staging_doors')
      .update({ in_front: null, in_back: null }).neq('id', 0)

    // 4. Live Movement
    await supabaseAdmin.from('live_movement').delete().neq('id', 0)

    // 5. Log it
    await supabaseAdmin.from('reset_log').insert({
      reset_type: 'auto_all',
      reset_by:   'auto',
    })

    return NextResponse.json({ ok: true, reset_at: new Date().toISOString() })
  } catch (err) {
    console.error('Auto-reset error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
