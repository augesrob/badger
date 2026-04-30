import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    return handleUpload(req)
  }

  const { action } = await req.json()
  if (action === 'list') return handleList()
  if (action === 'clear') return handleClear()

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function handleUpload(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamic import pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const pdf = await pdfParse(buffer)
    const text = pdf.text

    // Parse the PDF text into route records
    const records = parseDriverReport(text)

    if (records.length === 0) {
      return NextResponse.json({ error: 'No routes found in PDF' }, { status: 400 })
    }

    // Clear old data
    await supabase.from('route_drivers').delete().gte('id', 0)

    // Insert new records
    const { error } = await supabase.from('route_drivers').insert(records)
    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: records.length })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: `Parse failed: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 500 })
  }
}

async function handleList() {
  const { data, error } = await supabase
    .from('route_drivers')
    .select('*')
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
// PDF PARSER - extracts route data from Route/Driver Report
// ============================================================
function parseDriverReport(text: string): Record<string, unknown>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const records: Record<string, unknown>[] = []

  let currentRegion = 'FDL'
  let i = 0

  // Detect region headers
  const regionMap: Record<string, string> = {
    'FDL': 'FDL',
    'GREENBAY': 'GREENBAY',
    'WAUSAU': 'WAUSAU',
    'MKE': 'MKE',
    'EC': 'EC',
  }

  while (i < lines.length) {
    const line = lines[i]

    // Detect region change - lines like "FDL Cases" or "GREENBAY Cases" or "MKE Cases"
    for (const [key, val] of Object.entries(regionMap)) {
      if (line.startsWith(key + ' ') && line.includes('Cases')) {
        currentRegion = val
        break
      }
    }

    // Look for route lines - they start with a 4-digit route number followed by route name
    const routeMatch = line.match(/^(\d{4})\s+(.+)/)
    if (routeMatch) {
      const routeNumber = routeMatch[1]
      const rest = routeMatch[2]

      // Extract route name and driver info
      // Pattern: "ROUTE_NAME DriverName (phone) Region"
      // or "CPU FOND DU LAC ( ) - FDL"
      const record: Record<string, unknown> = {
        region: currentRegion,
        route_number: routeNumber,
        route_name: '',
        driver_name: '',
        driver_phone: '',
        truck_number: '',
        helper_name: '',
        cases_expected: 0,
        stops: 0,
        weight: 0,
        start_time: '',
        transfer_driver: '',
        transfer_truck: '',
        notes: '',
        upload_date: new Date().toISOString().split('T')[0],
      }

      // Parse route name and driver from the rest line
      // Typical: "KIEL Max Martin (920)960-7290 FDL Max Martin +1 (920) 960-7290"
      // or: "CPU FOND DU LAC ( ) - FDL"
      const phoneMatch = rest.match(/^(.+?)\s+([\w\s]+?)\s*\((\d{3})\)[\s-]*(\d{3})[\s-]*(\d{4})/)
      if (phoneMatch) {
        record.route_name = phoneMatch[1].trim()
        record.driver_name = phoneMatch[2].trim()
        record.driver_phone = `(${phoneMatch[3]})${phoneMatch[4]}-${phoneMatch[5]}`
      } else {
        // Try simpler pattern for CPU routes
        const cpuMatch = rest.match(/^(.+?)\s*\(\s*\)\s*-\s*(\w+)/)
        if (cpuMatch) {
          record.route_name = cpuMatch[1].trim()
          record.driver_name = ''
        } else {
          record.route_name = rest.trim()
        }
      }

      // Scan ahead for metadata lines
      let j = i + 1
      const scanLimit = Math.min(i + 15, lines.length)
      while (j < scanLimit) {
        const sl = lines[j]

        // "FDL Cs:" line contains the cases count
        const casesMatch = sl.match(/FDL Cs:\s*([\d,.]+)/)
        if (casesMatch) {
          record.cases_expected = Math.round(parseFloat(casesMatch[1].replace(',', '')))
        }

        // Cases/Stops/Weight on their own lines - value is on preceding line
        if (sl === 'Stops:') {
          const prevVal = lines[j - 1]?.match(/^(\d+)$/)
          if (prevVal) record.stops = parseInt(prevVal[1])
        }
        if (sl === 'Cases:') {
          const prevVal = lines[j - 1]?.match(/^(\d+)$/)
          if (prevVal) record.cases_expected = parseInt(prevVal[1])
        }
        if (sl === 'Weight:') {
          const prevVal = lines[j - 1]?.match(/^(\d+)$/)
          if (prevVal) record.weight = parseInt(prevVal[1])
        }

        // Truck number
        const truckMatch = sl.match(/^Truck:\s*(.+)/)
        if (truckMatch) {
          const tv = truckMatch[1].trim()
          if (tv === 'CPU') {
            record.truck_number = 'CPU'
          } else {
            // Could be "195" or have a helper name before
            const truckNum = tv.match(/(\d+)\s*$/)
            if (truckNum) {
              record.truck_number = truckNum[1]
              // Check if there's a helper name before the number
              const helperPart = tv.replace(truckNum[0], '').trim()
              if (helperPart && helperPart.length > 1 && !helperPart.match(/^\d+$/)) {
                record.helper_name = helperPart
              }
            } else {
              record.truck_number = tv
            }
          }
        }

        // Start time
        const timeMatch = sl.match(/Start Time:\s*(.+)/)
        if (timeMatch) {
          record.start_time = timeMatch[1].trim()
          break // Start time is always last in a route block
        }

        // Transfer info - "Virtual Transfer - 1" pattern
        const transferMatch = sl.match(/(\d+)\s+Virtual Transfer/)
        if (transferMatch) {
          record.transfer_truck = transferMatch[1]
        }

        // Transfer driver - pattern after region name like "FDL Max Martin +1 (920) 960-7290"
        // or "WAUSAU Jennifer Wilcox +1 (414) 875-7371"
        // or "MKE Kevin Krueger +1 (920) 960-7238"
        // or "EC John Reinke +1 (920) 960-7271"
        const tdMatch = sl.match(/(?:FDL|GREENBAY|WAUSAU|MKE|EC)\s+([\w\s]+?)\s+\+1\s+\((\d{3})\)\s+(\d{3})[- ](\d{4})/)
        if (tdMatch) {
          record.transfer_driver = tdMatch[1].trim()
        }

        // Notes line
        const notesMatch = sl.match(/^Notes\s+Transfer$/)
        if (notesMatch) {
          // Notes are on lines between "Notes" and the route block data
        }

        // Check for notes between route header and data block
        if (sl === 'Notes' || sl.startsWith('Notes ')) {
          // Look backwards for note content
          const noteLines: string[] = []
          let k = j - 1
          while (k > i && k >= j - 3) {
            const nl = lines[k]
            if (nl.match(/^(Route|Driver|Transfer|Stops|Cases|Weight|FDL|Truck|Start|Helper|Virtual|\d+$)/)) break
            if (nl.length > 2 && !nl.match(/^\d+$/)) noteLines.unshift(nl)
            k--
          }
          if (noteLines.length > 0) record.notes = noteLines.join('; ')
        }

        j++
      }

      // Only add non-empty records
      if (record.route_number) {
        records.push(record)
      }

      i = j
      continue
    }

    i++
  }

  return records
}
