import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// All queryable tables and their default ordering
const TABLES: Record<string, { order?: string; limit?: number; desc?: boolean }> = {
  trucks:                   { order: 'truck_number' },
  tractors:                 { order: 'truck_number' },
  trailer_list:             { order: 'trailer_number' },
  loading_doors:            { order: 'sort_order' },
  staging_doors:            { order: 'door_number' },
  live_movement:            { order: 'truck_number' },
  printroom_entries:        { order: 'loading_door_id' },
  status_values:            { order: 'sort_order' },
  door_status_values:       { order: 'sort_order' },
  dock_lock_status_values:  { order: 'sort_order' },
  automation_rules:         { order: 'sort_order' },
  routes:                   { order: 'sort_order' },
  role_permissions:         { order: 'role_name' },
  profiles:                 { order: 'display_name' },
  chat_rooms:               { order: 'sort_order' },
  messages:                 { order: 'created_at', desc: true, limit: 200 },
  notifications:            { order: 'created_at', desc: true, limit: 200 },
  notification_preferences: { order: 'id' },
  global_messages:          { order: 'created_at', desc: true, limit: 100 },
  truck_subscriptions:      { order: 'id' },
  reset_log:                { order: 'reset_at', desc: true, limit: 100 },
  route_imports:            { order: 'created_at', desc: true, limit: 50 },
  ptt_messages:             { order: 'created_at', desc: true, limit: 100 },
  debug_logs:               { order: 'created_at', desc: true, limit: 500 },
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  // Accept session token OR API key from env
  const apiKey = req.headers.get('x-badger-api-key')
  if (apiKey && apiKey === process.env.BADGER_API_KEY) return true

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return false

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return false

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const table    = searchParams.get('table')
  const limitStr = searchParams.get('limit')
  const filter   = searchParams.get('filter')   // e.g. "level=eq.ERROR"
  const select   = searchParams.get('select') || '*'
  const all      = searchParams.get('all') === 'true'

  // If no table specified, return schema overview
  if (!table) {
    const counts: Record<string, number | string> = {}
    await Promise.all(
      Object.keys(TABLES).map(async (t) => {
        const { count, error } = await supabaseAdmin
          .from(t)
          .select('*', { count: 'exact', head: true })
        counts[t] = error ? 'error' : (count ?? 0)
      })
    )
    return NextResponse.json({
      ok: true,
      tables: Object.keys(TABLES),
      counts,
      generated_at: new Date().toISOString(),
    })
  }

  if (!TABLES[table]) {
    return NextResponse.json(
      { ok: false, error: `Unknown table "${table}". Valid tables: ${Object.keys(TABLES).join(', ')}` },
      { status: 400 }
    )
  }

  if (!await verifyAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const cfg = TABLES[table]
  const limit = limitStr ? parseInt(limitStr) : (cfg.limit ?? 1000)

  let query = supabaseAdmin.from(table).select(select)

  if (filter) {
    // Support simple filters: column=eq.value, column=gte.value, etc.
    const parts = filter.split('&')
    for (const part of parts) {
      const eqIdx = part.indexOf('=')
      if (eqIdx === -1) continue
      const col = part.slice(0, eqIdx)
      const rest = part.slice(eqIdx + 1)
      const dotIdx = rest.indexOf('.')
      if (dotIdx === -1) continue
      const op  = rest.slice(0, dotIdx)
      const val = rest.slice(dotIdx + 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(query as any) = (query as any)[op]?.(col, val) ?? query
    }
  }

  if (cfg.order) {
    query = query.order(cfg.order, { ascending: !cfg.desc })
  }

  if (!all) {
    query = query.limit(limit)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    table,
    count: data?.length ?? 0,
    data,
    generated_at: new Date().toISOString(),
  })
}
