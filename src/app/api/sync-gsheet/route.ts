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
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQ = !inQ }
      else if (c === ',' && !inQ) { cells.push(cur.trim()); cur = '' }
      else { cur += c }
    }
    cells.push(cur.trim())
    return cells
  })
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

      // Find header row (contains "Truck")
      let headerRowIdx = -1
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (rows[i].some(c => c.toLowerCase().includes('truck'))) { headerRowIdx = i; break }
      }
      if (headerRowIdx < 0) {
        results.printroomUpdated = 0
        results.printroomError = 'Header row not found'
      } else {
        const headerRow = rows[headerRowIdx]
        // Door name row is 2 rows above the column header row
        const doorNameRow = rows[Math.max(0, headerRowIdx - 2)]

        // Find door groups: scan for "Door" in header row
        // Each group: DoorLoc(+0) Route(+1) Truck(+2) Status(+3) Pods(+4) Pallets(+5)
        interface DoorGroup { doorName: string; truckCol: number; podsCol: number; palletsCol: number }
        const doorGroups: DoorGroup[] = []
        for (let col = 1; col < headerRow.length; col++) {
          if (headerRow[col]?.toLowerCase().includes('door')) {
            // Find door name from the merged header row above
            let doorName = ''
            for (let c = col + 2; c >= Math.max(0, col - 1); c--) {
              const v = doorNameRow[c]?.trim()
              if (v && /^\d+[AB]$/i.test(v)) { doorName = v.toUpperCase(); break }
            }
            // Also check the cell directly above this column group
            if (!doorName) {
              const above = doorNameRow[col]?.trim()
              if (above && /\d+[AB]/i.test(above)) doorName = above.replace(/[^0-9AB]/gi, '').toUpperCase()
            }
            doorGroups.push({ doorName, truckCol: col+2, podsCol: col+4, palletsCol: col+5 })
          }
        }

        // Build entry lookup: doorId:batch:rowOrder → entry
        type E = { id: number; truck_number: string|null; pods: number|null; pallets_trays: number|null; loading_door_id: number; batch_number: number; row_order: number }
        const entryMap = new Map<string, E>()
        for (const e of entries as E[]) {
          entryMap.set(`${e.loading_door_id}:${e.batch_number}:${e.row_order}`, e)
        }

        let printroomUpdated = 0
        let currentBatch = 1
        const doorRowIdx = new Map<string, number>()

        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r]
          const batchCell = row[0]?.trim()
          if (batchCell && /^[1-4]$/.test(batchCell)) {
            currentBatch = parseInt(batchCell)
            doorRowIdx.clear()
          }
          if (row.every(c => !c?.trim())) continue

          for (const g of doorGroups) {
            if (!g.doorName) continue
            const doorId = doorNameToId.get(g.doorName)
            if (!doorId) continue

            const sheetTruck   = row[g.truckCol]?.trim() || null
            const sheetPods    = row[g.podsCol]?.trim() || null
            const sheetPallets = row[g.palletsCol]?.trim() || null
            if (!sheetTruck && !sheetPods && !sheetPallets) continue

            const key = `${g.doorName}:${currentBatch}`
            const rowOrd = (doorRowIdx.get(key) ?? 0) + 1
            doorRowIdx.set(key, rowOrd)

            const entry = entryMap.get(`${doorId}:${currentBatch}:${rowOrd}`)
            if (!entry) continue

            const BAD = new Set(['MIA', '#REF!', '#N/A', 'N/A', 'CPU', 'IGNORE', ''])
            const upd: Record<string, string|number|null> = {}
            if (!entry.truck_number && sheetTruck && !BAD.has(sheetTruck.toUpperCase()))
              upd.truck_number = sheetTruck
            if ((!entry.pods || entry.pods === 0) && sheetPods && !isNaN(parseInt(sheetPods)))
              upd.pods = parseInt(sheetPods)
            if ((!entry.pallets_trays || entry.pallets_trays === 0) && sheetPallets && !isNaN(parseInt(sheetPallets)))
              upd.pallets_trays = parseInt(sheetPallets)

            if (Object.keys(upd).length > 0) {
              await adminSupabase.from('printroom_entries').update(upd).eq('id', entry.id)
              printroomUpdated++
            }
          }
        }
        results.printroomUpdated = printroomUpdated
      }
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[sync-gsheet]', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
