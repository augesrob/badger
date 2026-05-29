import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Reads the latest route CSV (stored by route-email after Gmail check),
// parses truck → route mappings, and writes route_info into printroom_entries.
// Called by the Android app's "Sync Route Data" button in Shift Setup.
export async function POST(): Promise<NextResponse> {
  try {
    // 1. Load the most recent CSV from the route_imports table
    const { data: routeImport, error: importErr } = await adminSupabase
      .from('route_imports')
      .select('csv_data, received_at')
      .eq('id', 1)
      .maybeSingle()

    if (importErr) {
      return NextResponse.json({ ok: false, error: importErr.message }, { status: 500 })
    }
    if (!routeImport?.csv_data) {
      return NextResponse.json(
        { ok: false, error: 'No route data available. Use the Route Sheet page to request the route email first.' },
        { status: 404 }
      )
    }

    // 2. Parse CSV — format: truckNumber,route,...(col 6 = cases)
    const lines = (routeImport.csv_data as string)
      .trim()
      .replace(/\r/g, '')
      .split('\n')

    // routeMap: truckKey (lower) → comma-joined routes
    const routeMap: Record<string, string[]> = {}
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < 2) continue
      const rawTruck = cols[0].trim()
      const route    = cols[1].trim()
      if (!rawTruck || !route) continue
      const key = rawTruck.replace(/^TR/i, '').toLowerCase()
      if (!routeMap[key]) routeMap[key] = []
      if (!routeMap[key].includes(route)) routeMap[key].push(route)
    }

    // 3. Load all printroom entries that have a truck number
    const { data: entries, error: entriesErr } = await adminSupabase
      .from('printroom_entries')
      .select('id, truck_number')

    if (entriesErr) {
      return NextResponse.json({ ok: false, error: entriesErr.message }, { status: 500 })
    }

    // 4. Update route_info for each matching entry
    let updated = 0
    for (const entry of (entries ?? [])) {
      if (!entry.truck_number) continue
      const key = (entry.truck_number as string).replace(/^TR/i, '').toLowerCase()

      // Try exact key, then strip trailer suffix (e.g. "222-1" → "222")
      let routes = routeMap[key]
      if (!routes) {
        const base = key.replace(/-\d+$/, '')
        routes = routeMap[base]
      }
      if (!routes || routes.length === 0) continue

      const routeInfo = routes.join(', ')
      await adminSupabase
        .from('printroom_entries')
        .update({ route_info: routeInfo })
        .eq('id', entry.id as number)
      updated++
    }

    return NextResponse.json({
      ok: true,
      updated,
      total: (entries ?? []).length,
      csvAge: routeImport.received_at,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
