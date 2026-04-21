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

      const { data: doors } = await adminSupabase
        .from('loading_doors').select('id, door_name')
      if (!doors) throw new Error('Could not load loading doors')
      const doorNameToId = new Map(doors.map(d => [d.door_name?.trim(), d.id]))

      // ── Step 1: Parse sheet into per-door-per-batch rows ──────────────────
      type SheetRow = { truck: string; pods: number|null; pallets: number|null }
      const sheetData = new Map<string, SheetRow[]>() // "doorName:batch" → rows

      let currentBatch = 1
      for (let r = 4; r < rows.length; r++) {
        const row = rows[r]
        if (row.every(c => !c?.trim())) continue
        const col0 = row[0]?.trim()
        // Stop at notes section
        if (col0 && !/^[1-4]$/.test(col0) && col0.length > 1) continue
        if (col0 && /^[1-4]$/.test(col0)) currentBatch = parseInt(col0)

        for (const g of DOOR_GROUPS) {
          const truck   = row[g.truckCol]?.trim() || ''
          const rawPods = row[g.podsCol]?.trim() || ''
          const rawPal  = row[g.palletsCol]?.trim() || ''
          if (!truck && !rawPods && !rawPal) continue
          if (BAD_VALUES.has(truck.toUpperCase())) continue
          const key = `${g.doorName}:${currentBatch}`
          if (!sheetData.has(key)) sheetData.set(key, [])
          sheetData.get(key)!.push({
            truck,
            pods:    rawPods && !isNaN(parseInt(rawPods)) ? parseInt(rawPods) : null,
            pallets: rawPal  && !isNaN(parseInt(rawPal))  ? parseInt(rawPal)  : null,
          })
        }
      }

      // ── Step 2: Load existing entries grouped by door+batch ───────────────
      const { data: entries } = await adminSupabase
        .from('printroom_entries')
        .select('id, truck_number, pods, pallets_trays, loading_door_id, batch_number, row_order')
        .order('batch_number').order('row_order')
      if (!entries) throw new Error('Could not load printroom entries')

      type E = { id: number; truck_number: string|null; pods: number|null; pallets_trays: number|null; loading_door_id: number; batch_number: number; row_order: number }

      // Group: doorId:batch → sorted entries
      const entryGroups = new Map<string, E[]>()
      for (const e of entries as E[]) {
        const k = `${e.loading_door_id}:${e.batch_number}`
        if (!entryGroups.has(k)) entryGroups.set(k, [])
        entryGroups.get(k)!.push(e)
      }

      let printroomUpdated = 0
      let printroomCreated = 0

      // ── Step 3: For each door+batch, match sheet rows to DB rows ──────────
      for (const g of DOOR_GROUPS) {
        const doorId = doorNameToId.get(g.doorName)
        if (!doorId) continue

        for (let batch = 1; batch <= 4; batch++) {
          const sheetRows = sheetData.get(`${g.doorName}:${batch}`) ?? []
          if (sheetRows.length === 0) continue

          const dbKey = `${doorId}:${batch}`
          const dbRows = entryGroups.get(dbKey) ?? []

          // Find the max row_order already in DB for this door+batch
          const maxRowOrder = dbRows.length > 0
            ? Math.max(...dbRows.map(e => e.row_order))
            : 0

          for (let i = 0; i < sheetRows.length; i++) {
            const sh = sheetRows[i]
            const dbRow = dbRows[i] // may be undefined if sheet has more rows

            if (dbRow) {
              // Row exists — fill blanks only
              const upd: Record<string, string|number> = {}
              if (!dbRow.truck_number && sh.truck) upd.truck_number = sh.truck
              if ((!dbRow.pods || dbRow.pods === 0) && sh.pods !== null) upd.pods = sh.pods
              if ((!dbRow.pallets_trays || dbRow.pallets_trays === 0) && sh.pallets !== null) upd.pallets_trays = sh.pallets
              if (Object.keys(upd).length > 0) {
                await adminSupabase.from('printroom_entries').update(upd).eq('id', dbRow.id)
                printroomUpdated++
              }
            } else {
              // Row doesn't exist — create it
              const newRowOrder = maxRowOrder + (i - dbRows.length + 1)
              const insert: Record<string, string|number|boolean|null> = {
                loading_door_id: doorId,
                batch_number: batch,
                row_order: newRowOrder,
                is_end_marker: false,
                truck_number: sh.truck || null,
                pods: sh.pods ?? 0,
                pallets_trays: sh.pallets ?? 0,
              }
              await adminSupabase.from('printroom_entries').insert(insert)
              printroomCreated++
            }
          }
        }
      }

      results.printroomUpdated = printroomUpdated
      results.printroomCreated = printroomCreated
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[sync-gsheet]', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
