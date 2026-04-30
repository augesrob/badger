import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'upload') return handleUpload(body.text)
  if (action === 'list') return handleList()
  if (action === 'clear') return handleClear()

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function handleUpload(text: string) {
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  try {
    const records = parseDriverReport(text)
    if (records.length === 0) {
      return NextResponse.json({ error: 'No routes found in PDF text. Check format.' }, { status: 400 })
    }

    await supabase.from('route_drivers').delete().gte('id', 0)

    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50)
      const { error } = await supabase.from('route_drivers').insert(batch)
      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, count: records.length })
  } catch (err) {
    console.error('Parse error:', err)
    return NextResponse.json({ error: `Parse failed: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 500 })
  }
}

async function handleList() {
  const { data, error } = await supabase
    .from('route_drivers')
    .select('*')
    .order('transfer_driver')
    .order('region')
    .order('route_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

async function handleClear() {
  await supabase.from('route_drivers').delete().gte('id', 0)
  return NextResponse.json({ success: true })
}

// ============================================================
// PARSER — works on text extracted by pdfjs from the Route/Driver Report
// ============================================================
function parseDriverReport(text: string): Record<string, unknown>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const records: Record<string, unknown>[] = []
  const today = new Date().toISOString().split('T')[0]

  let currentRegion = 'FDL'
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Detect region: "FDL Cases", "GREENBAY Cases", "WAUSAU Cases", "MKE Cases", "EC Cases"
    const regionMatch = line.match(/^(FDL|GREENBAY|WAUSAU|MKE|EC)\s+Cases/)
    if (regionMatch) {
      currentRegion = regionMatch[1]
      i++
      continue
    }

    // Route line: starts with 4-digit number followed by route name + driver info
    // e.g. "1501 KIEL Max Martin (920)960-7290 FDL Max Martin +1 (920) 960-7290"
    const routeMatch = line.match(/^(\d{4})\s+(.+)/)
    if (routeMatch) {
      const routeNumber = routeMatch[1]
      const rest = routeMatch[2]

      // Parse route name, driver name, driver phone from the route line
      // The line contains: ROUTE_NAME DRIVER_NAME (PHONE) REGION TRANSFER_DRIVER +1 (PHONE)
      let routeName = ''
      let driverName = ''
      let driverPhone = ''
      let transferDriver = ''

      // Try to find the first phone number — everything before it is route name + driver
      const firstPhone = rest.match(/^(.+?)\s*\((\d{3})\)[\s)]*(\d{3})[\s-]*(\d{4})(.*)/)
      if (firstPhone) {
        const beforePhone = firstPhone[1].trim()
        driverPhone = `(${firstPhone[2]})${firstPhone[3]}-${firstPhone[4]}`
        const afterPhone = firstPhone[5]

        // Split beforePhone into route name + driver name
        // Route name is typically ALL CAPS words, driver name is mixed case
        const words = beforePhone.split(/\s+/)
        const routeWords: string[] = []
        const driverWords: string[] = []
        let hitDriver = false

        for (const w of words) {
          if (!hitDriver && (w === w.toUpperCase() || w === 'CPU' || w.includes('-'))) {
            routeWords.push(w)
          } else {
            hitDriver = true
            driverWords.push(w)
          }
        }
        routeName = routeWords.join(' ')
        driverName = driverWords.join(' ')

        // Transfer driver from after the region code
        // Pattern: "FDL Max Martin +1 (920) 960-7290"
        const tdMatch = afterPhone.match(/(?:FDL|GREENBAY|WAUSAU|MKE|EC)\s+([\w\s]+?)\s+\+1/)
        if (tdMatch) {
          transferDriver = tdMatch[1].trim()
        }
      } else {
        // CPU route: "CPU FOND DU LAC ( ) - FDL"
        const cpuMatch = rest.match(/^(.+?)\s*\(\s*\)\s*-\s*(\w+)/)
        if (cpuMatch) {
          routeName = cpuMatch[1].trim()
        } else {
          routeName = rest.trim()
        }
      }

      // Now scan ahead for the data block
      const record: Record<string, unknown> = {
        region: currentRegion,
        route_number: routeNumber,
        route_name: routeName,
        driver_name: driverName,
        driver_phone: driverPhone,
        truck_number: '',
        helper_name: '',
        cases_expected: 0,
        stops: 0,
        weight: 0,
        start_time: '',
        transfer_driver: transferDriver,
        transfer_truck: '',
        notes: '',
        upload_date: today,
      }

      // Look backwards for transfer truck number
      // It appears BEFORE the route line as "195" (just a number) or "231 Virtual Transfer - 1"
      for (let b = i - 1; b >= Math.max(0, i - 5); b--) {
        const bl = lines[b]
        const vtMatch = bl.match(/^(\d+)-?\s+Virtual Transfer/)
        if (vtMatch) {
          record.transfer_truck = vtMatch[1]
          break
        }
        // Plain number that's a transfer truck (like "195" before route 1501)
        if (bl.match(/^\d+$/) && parseInt(bl) > 100 && parseInt(bl) < 999) {
          // Check if this is a transfer truck by seeing if next line is a route
          const nextIdx = b + 1
          if (nextIdx <= i && lines[nextIdx]?.match(/^\d{4}\s/)) {
            // This could be the transfer truck OR weight/stops value
            // Check if there's a "Stops:" or "Weight:" nearby
            const contextLine = lines[b - 1]
            if (contextLine && !contextLine.match(/^(Stops|Cases|Weight):/)) {
              record.transfer_truck = bl
            }
          }
          break
        }
      }

      // Scan forward for metadata
      let j = i + 1
      const scanLimit = Math.min(i + 15, lines.length)
      const noteLines: string[] = []

      while (j < scanLimit) {
        const sl = lines[j]

        // Hit next route = stop
        if (sl.match(/^\d{4}\s/) && j > i + 1) break
        // Hit next "Route Driver" header = stop
        if (sl === 'Route Driver Transfer' || sl === 'Route Driver') break

        // FDL Cs: value is on the SAME line or NEXT line
        if (sl.startsWith('FDL Cs:')) {
          const valOnLine = sl.match(/FDL Cs:\s*([\d,.]+)/)
          if (valOnLine) {
            record.cases_expected = Math.round(parseFloat(valOnLine[1].replace(',', '')))
          }
        }

        // "300.44 Truck:" — cases value merged with Truck label
        const caseTruckMerge = sl.match(/^([\d,.]+)\s+Truck:/)
        if (caseTruckMerge) {
          record.cases_expected = Math.round(parseFloat(caseTruckMerge[1].replace(',', '')))
        }

        // Stops value — number before "Stops:" label
        if (sl === 'Stops:' || sl === 'Cases:' || sl === 'Weight:') {
          const prevLine = lines[j - 1]
          if (prevLine?.match(/^\d+$/)) {
            const val = parseInt(prevLine)
            if (sl === 'Stops:') record.stops = val
            else if (sl === 'Cases:') record.cases_expected = val
            else if (sl === 'Weight:') record.weight = val
          }
        }

        // "30 Helper:" — stops value merged with Helper label
        const stopsHelper = sl.match(/^(\d+)\s+Helper:/)
        if (stopsHelper) {
          record.stops = parseInt(stopsHelper[1])
        }

        // Truck line
        const truckMatch = sl.match(/^Truck:\s*(.+)/)
        if (truckMatch) {
          const tv = truckMatch[1].trim()
          if (tv === 'CPU') {
            record.truck_number = 'CPU'
          } else {
            // Could be "195" or "Luke Frame\n245" (helper name then number on next line)
            const numMatch = tv.match(/^(\d+)$/)
            if (numMatch) {
              record.truck_number = numMatch[1]
            } else {
              // Helper name on this line, truck number possibly on next
              record.helper_name = tv
              if (j + 1 < scanLimit && lines[j + 1]?.match(/^\d+$/)) {
                j++
                record.truck_number = lines[j]
              }
            }
          }
        }

        // Start Time
        const timeMatch = sl.match(/Start Time:\s*(.+)/)
        if (timeMatch) {
          record.start_time = timeMatch[1].trim()
          j++
          break
        }

        // Transfer driver from standalone line in scan
        // "FDL Max Martin +1 (920) 960-7290" — only if we didn't get it from route line
        if (!record.transfer_driver) {
          const tdMatch = sl.match(/^(?:FDL|GREENBAY|WAUSAU|MKE|EC)\s+([\w\s]+?)\s+\+1\s+\(\d{3}\)/)
          if (tdMatch) {
            record.transfer_driver = tdMatch[1].trim()
          }
        }

        // Notes line — "Notes Transfer" or "Notes" header
        if (sl === 'Notes' || sl.startsWith('Notes ')) {
          // Look backwards for note content between this and previous known label
          for (let k = j - 1; k >= Math.max(i + 1, j - 4); k--) {
            const nl = lines[k]
            if (nl.match(/^(Route|Driver|Transfer|Stops|Cases|Weight|FDL|Truck|Start|Helper|Virtual|\d+$)/)) break
            if (nl.length > 2 && nl !== 'Notes' && !nl.match(/^\d+$/)) {
              noteLines.unshift(nl)
            }
          }
        }

        j++
      }

      if (noteLines.length > 0) record.notes = noteLines.join('; ')

      records.push(record)
      i = j
      continue
    }

    i++
  }

  return records
}
