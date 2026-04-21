import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SHEET_ID = '12UkIURFq8AF3nDrP6iAv4muOEpGN6_p09tb8zIZotWQ'
const MOVEMENT_GID = '1914606706'
const TRUCKORDER_GID = '2074288884'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchSheetCSV(gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)
  const text = await res.text()
  return text.split('\n').map(line => {
    const cells: string[] = []
    let cur = '', inQ = false
    for (const c of line) {
      if (c === '"') { inQ = !inQ }
      else if (c === ',' && !inQ) { cells.push(cur.trim()); cur = '' }
      else { cur += c }
    }
    cells.push(cur.trim())
    return cells
  })
}

// Exact column offsets confirmed from CSV inspection:
// Row layout: col0=Batch, then per door: DoorLoc, (icon), Route#, Truck#, Status, Pods, Pallets
const DOOR_GROUPS = [
  { doorName: '13A', truckCol: 4,  podsCol: 6,  palletsCol: 7  },
  { doorName: '13B', truckCol: 11, podsCol: 13, palletsCol: 14 },
  { doorName: '14A', truckCol: 18, podsCol: 20, palletsCol: 21 },
  { doorName: '14B', truckCol: 25, podsCol: 27, palletsCol: 28 },
  { doorName: '15A', truckCol: 32, podsCol: 34, palletsCol: 35 },
  { doorName: '15B', truckCol: 39, podsCol: 41, palletsCol: 42 },
]

const BAD_VALUES = new Set(['MIA', '#REF!', '#N/A', 'N/A', 'CPU', 'IGNORE', 'IGNORE', 'MT', ''])

export async function DELETE() {
  // Clean up bad data from previous broken sync run:
  // Route numbers (1-2 digit) were incorrectly written into truck_number fields
  const { data, error } = await adminSupabase
    .from('printroom_entries')
    .update({ truck_number: null })
    .or('truck_number.eq.1,truck_number.eq.2,truck_number.eq.3,truck_number.eq.4,truck_number.eq.5,truck_number.eq.6,truck_number.eq.7,truck_number.eq.8')
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, cleaned: data })
}

export async function POST(req: NextRequest) {
  try {
    const { target } = await req.json()
    const results: Record<string, unknown> = {}

    // ── PRESHIFT (TruckOrder tab) ─────────────────────────────────────────────
    if (target === 'preshift' || target === 'both') {
      const rows = await fetchSheetCSV(TRUCKORDER_GID)
      const { data: doors } = await adminSupabase
        .from('staging_doors')
        .select('id, door_label, in_front, in_back')
      if (!doors) throw new Error('Could not load staging doors')

      const doorMap = new Map(doors.map(d => [
        (d.door_label ?? '').replace(/\s+/g, '').toUpperCase(), d
      ]))

      let updated = 0
      // Header row 0 = "Door #, In Front, In Back", data from row 1
      for (const row of rows.slice(1)) {
        const label = (row[0] ?? '').replace(/\s+/g, '').toUpperCase()
        if (!label.match(/^\d+[AB]$/i)) continue
        const door = doorMap.get(label)
        if (!door) continue

        const sheetFront = row[1]?.trim() || null
        const sheetBack  = row[2]?.trim() || null
        const upd: Record<string, string | null> = {}
        if (!door.in_front && sheetFront) upd.in_front = sheetFront
        if (!door.in_back  && sheetBack)  upd.in_back  = sheetBack
        if (Object.keys(upd).length > 0) {
          await adminSupabase.from('staging_doors').update(upd).eq('id', door.id)
          updated++
        }
      }
      results.preshiftUpdated = updated
    }

    // ── PRINTROOM (Movement tab) ──────────────────────────────────────────────
    if (target === 'printroom' || target === 'both') {
      const rows = await fetchSheetCSV(MOVEMENT_GID)

      const { data: entries } = await adminSupabase
        .from('printroom_entries')
        .select('id, truck_number, pods, pallets_trays, loading_door_id, batch_number, row_order')
      const { data: doors } = await adminSupabase
        .from('loading_doors').select('id, door_name')
      if (!entries || !doors) throw new Error('Could not load printroom data')

      const doorNameToId = new Map(doors.map(d => [d.door_name?.trim(), d.id]))

      type E = {
        id: number
        truck_number: string | null
        pods: number | null
        pallets_trays: number | null
        loading_door_id: number
        batch_number: number
        row_order: number
      }

      // Build lookup: doorId:batch:rowOrder → entry
      const entryMap = new Map<string, E>()
      for (const e of entries as E[]) {
        entryMap.set(`${e.loading_door_id}:${e.batch_number}:${e.row_order}`, e)
      }

      let printroomUpdated = 0
      let currentBatch = 1
      // Track how many data rows we've seen per door+batch
      const doorRowIdx = new Map<string, number>()

      // Data starts at row index 4 (rows 0-3 are title/header rows)
      // Row 0: blank, Row 1: door names (13A etc), Row 2: Loading, Row 3: column headers
      for (let r = 4; r < rows.length; r++) {
        const row = rows[r]

        // Skip completely empty rows
        if (row.every(c => !c?.trim())) continue

        // Skip notes rows at the bottom (col 0 contains text like "Shift Notes")
        const col0 = row[0]?.trim()
        if (col0 && !/^[1-4]$/.test(col0) && col0.length > 1) continue

        // Detect batch number change
        if (col0 && /^[1-4]$/.test(col0)) {
          const newBatch = parseInt(col0)
          if (newBatch !== currentBatch) {
            currentBatch = newBatch
            doorRowIdx.clear()
          }
        }

        // Process each door group
        let anyData = false
        for (const g of DOOR_GROUPS) {
          const doorId = doorNameToId.get(g.doorName)
          if (!doorId) continue

          const rawTruck   = row[g.truckCol]?.trim() || ''
          const rawPods    = row[g.podsCol]?.trim() || ''
          const rawPallets = row[g.palletsCol]?.trim() || ''

          // Skip if no useful data in this door's columns for this row
          if (!rawTruck && !rawPods && !rawPallets) continue

          anyData = true
          const key = `${g.doorName}:${currentBatch}`
          const rowOrd = (doorRowIdx.get(key) ?? 0) + 1
          doorRowIdx.set(key, rowOrd)

          const entry = entryMap.get(`${doorId}:${currentBatch}:${rowOrd}`)
          if (!entry) continue

          const upd: Record<string, string | number> = {}
          if (!entry.truck_number && rawTruck && !BAD_VALUES.has(rawTruck.toUpperCase())) {
            upd.truck_number = rawTruck
          }
          if ((!entry.pods || entry.pods === 0) && rawPods && !isNaN(parseInt(rawPods))) {
            upd.pods = parseInt(rawPods)
          }
          if ((!entry.pallets_trays || entry.pallets_trays === 0) && rawPallets && !isNaN(parseInt(rawPallets))) {
            upd.pallets_trays = parseInt(rawPallets)
          }

          if (Object.keys(upd).length > 0) {
            await adminSupabase.from('printroom_entries').update(upd).eq('id', entry.id)
            printroomUpdated++
          }
        }

        // If this row had no data in any door column at all, don't count it as a row
        // (blank rows between batches shouldn't advance the row counter)
        if (!anyData) {
          // Rolled back above — doorRowIdx already not incremented
        }
      }

      results.printroomUpdated = printroomUpdated
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[sync-gsheet]', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
