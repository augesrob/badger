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
  if (action === 'debug') return handleDebug(body.text)
  if (action === 'list') return handleList()
  if (action === 'clear') return handleClear()

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function handleDebug(text: string) {
  if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 })
  const lines = text.split('\n').slice(0, 50) // first 50 lines
  const records = parseDriverReport(text)
  const sample = records.slice(0, 10).map(r => ({
    route: r.route_number, name: r.route_name, driver: r.driver_name,
    truck: r.truck_number, cases: r.cases_expected, stops: r.stops,
    transfer: r.transfer_driver, ttruck: r.transfer_truck, start: r.start_time
  }))
  return NextResponse.json({ lineCount: text.split('\n').length, lines, recordCount: records.length, sample })
}

async function handleUpload(text: string) {
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  try {
    const records = parseDriverReport(text)
    if (records.length === 0) {
      return NextResponse.json({ error: 'No routes found in PDF' }, { status: 400 })
    }

    await supabase.from('route_drivers').delete().gte('id', 0)

    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50)
      const { error } = await supabase.from('route_drivers').insert(batch)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

/*
  ACTUAL pdfjs output format (lines reconstructed from Y-position):
  
  Route line:
    "2501 GREEN BAY WEST Craig Cameron (414)750-4152 GREENBAY Billy Langrud +1 (920) 238-2291"
  
  Data lines (order varies, sometimes merged):
    "Stops: 26 Helper: FDL Cs: 495"
    "Cases: 494.33 Truck: 147 Truck: 224 Virtual Transfer - 2"
    "Weight: 13048 Start Time: 6:00 AM"
    
  Or sometimes split differently:
    "Stops: Helper: Trey Beau FDL Cs: 398"
    "397.11 161"
    "Cases: Truck: Truck: 224 Virtual Transfer - 2"
*/

function parseDriverReport(text: string): Record<string, unknown>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const records: Record<string, unknown>[] = []
  const today = new Date().toISOString().split('T')[0]

  let currentRegion = 'FDL'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect region
    if (line === 'FDL' || line === 'GREENBAY' || line === 'WAUSAU' || line === 'MKE' || line === 'EC') {
      currentRegion = line
      continue
    }

    // Route line: "2501 GREEN BAY WEST Craig Cameron (414)750-4152 GREENBAY Billy Langrud +1 (920) 238-2291"
    const routeMatch = line.match(/^(\d{4})\s+(.+)/)
    if (!routeMatch) continue

    // Skip stat lines and weight/time lines
    if (routeMatch[2].match(/^\d[\d.\s,]+$/)) continue
    if (routeMatch[2].match(/^Start Time/)) continue

    const routeNumber = routeMatch[1]
    const rest = routeMatch[2]

    let routeName = ''
    let driverName = ''
    let driverPhone = ''
    let transferDriver = ''

    // Parse: "ROUTE_NAME DriverName (phone) REGION TransferDriver +1 (phone)"
    // The region code (FDL/GREENBAY/WAUSAU/MKE/EC) separates route driver from transfer driver
    const regionSplit = rest.match(/^(.+?)\s+(FDL|GREENBAY|WAUSAU|MKE|EC)\s+(.+)$/)
    if (regionSplit) {
      const beforeRegion = regionSplit[1] // "ROUTE_NAME DriverName (phone)"
      const afterRegion = regionSplit[3]  // "TransferDriver +1 (phone)"

      // Extract transfer driver: "Billy Langrud +1 (920) 238-2291"
      const tdMatch = afterRegion.match(/^([\w\s]+?)\s+\+1/)
      if (tdMatch) transferDriver = tdMatch[1].trim()

      // Extract route driver phone from beforeRegion
      // Normal: "WEST ALLIS Michael Schlampp (920)579-0637"
      // Malformed: "WEST ALLIS Michael Schlampp ((26)2) -440-"
      const phoneMatch = beforeRegion.match(/^(.+?)\s*\((\d{3})\)[)\s-]*(\d{3})[)\s-]*(\d{4})$/)
      if (phoneMatch) {
        const namesPart = phoneMatch[1].trim()
        driverPhone = `(${phoneMatch[2]})${phoneMatch[3]}-${phoneMatch[4]}`

        // Split namesPart into route name (UPPERCASE) and driver name (mixed case)
        const words = namesPart.split(/\s+/)
        const rWords: string[] = []
        const dWords: string[] = []
        let inDriver = false
        for (const w of words) {
          if (!inDriver && w === w.toUpperCase() && w.length > 1 && !w.match(/^\(/)) {
            rWords.push(w)
          } else {
            inDriver = true
            dWords.push(w)
          }
        }
        routeName = rWords.join(' ')
        driverName = dWords.join(' ')
      } else {
        // Phone regex failed — try to parse without phone
        // Could be malformed phone like "((26)2) -440-" or CPU route
        const cpuCheck = beforeRegion.replace(/\(\s*\)\s*-?\s*$/, '').trim()
        if (cpuCheck.startsWith('CPU')) {
          routeName = cpuCheck
        } else {
          // Try to split on the first opening paren (start of phone)
          const parenIdx = beforeRegion.indexOf('(')
          if (parenIdx > 0) {
            const namesPart = beforeRegion.substring(0, parenIdx).trim()
            const phonePart = beforeRegion.substring(parenIdx).trim()
            driverPhone = phonePart
            // Split names
            const words = namesPart.split(/\s+/)
            const rWords: string[] = []
            const dWords: string[] = []
            let inDriver = false
            for (const w of words) {
              if (!inDriver && w === w.toUpperCase() && w.length > 1) rWords.push(w)
              else { inDriver = true; dWords.push(w) }
            }
            routeName = rWords.join(' ')
            driverName = dWords.join(' ')
          } else {
            routeName = beforeRegion
          }
        }
      }
    } else {
      // No region split found - just grab route name
      routeName = rest.split(/\s{2,}/)[0]?.trim() || rest.trim()
    }

    // Now scan the next few lines for data fields
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

    // Scan ahead 1-8 lines for data fields
    for (let j = i + 1; j <= Math.min(i + 8, lines.length - 1); j++) {
      const dl = lines[j]

      // Stop if we hit another route line
      if (dl.match(/^\d{4}\s+[A-Z]/) && !dl.match(/^\d{4}\s+Start/)) break
      // Stop at "Route Driver" header
      if (dl === 'Route Driver' || dl === 'Route Driver Transfer') break

      // Extract all fields from each data line

      // Stops: "Stops: 26" or "Stops: 36 Helper: ..."
      const stopsMatch = dl.match(/Stops:\s*(\d+)/)
      if (stopsMatch) record.stops = parseInt(stopsMatch[1])

      // Standalone number line after "Stops: Helper:" (stops value on its own line)
      // e.g. line "Stops: Helper: FDL Cs: 626" then next line "16"
      // or line "Stops: Helper: FDL Cs: 256" then next line "30"
      if (dl.match(/^\d{1,3}$/) && !record.stops) {
        // Only treat as stops if previous line had Stops: without a number after it
        const prevLine = lines[j - 1] || ''
        if (prevLine.includes('Stops:') && !prevLine.match(/Stops:\s*\d/)) {
          record.stops = parseInt(dl)
        }
      }

      // FDL Cs: "FDL Cs: 495" - actual case count
      const fdlCsMatch = dl.match(/FDL Cs:\s*(\d+)/)
      if (fdlCsMatch) record.cases_expected = parseInt(fdlCsMatch[1])

      // Weight: "Weight: 13048"
      const weightMatch = dl.match(/Weight:\s*(\d+)/)
      if (weightMatch) record.weight = parseInt(weightMatch[1])

      // Truck parsing - complex because of split lines
      // Normal: "Cases: 494.33 Truck: 147 Truck: 224 Virtual Transfer - 2"
      // Split: line has "Cases: Truck: Truck: 224 Virtual Transfer - 2" and truck# is on PREVIOUS line
      
      // First find all "Truck: VALUE" patterns
      const truckPattern = /Truck:\s*(\S*)/g
      let truckMatch
      const truckValues: { value: string; hasVirtualAfter: boolean }[] = []
      while ((truckMatch = truckPattern.exec(dl)) !== null) {
        const val = truckMatch[1]
        const afterPos = truckMatch.index + truckMatch[0].length
        const afterText = dl.substring(afterPos)
        truckValues.push({
          value: val,
          hasVirtualAfter: afterText.trimStart().startsWith('Virtual Transfer') || 
                           (afterText.includes('Virtual Transfer'))
        })
      }
      
      for (const tv of truckValues) {
        if (tv.hasVirtualAfter && tv.value) {
          record.transfer_truck = tv.value
        } else if (tv.value && tv.value !== '' && !record.truck_number) {
          record.truck_number = tv.value
        }
      }

      // Handle split line patterns where truck number is on a separate line:
      // "532.00 160 160" → decimal(cases), truck, truck(dup)
      // "397.11 161" → decimal(cases), truck
      // "254.00 172 222" → decimal(cases), truck, transfer_truck
      // Must have a DECIMAL number first (cases value) to distinguish from standalone stops
      const splitNums = dl.match(/^(\d+\.\d+)\s+(\d{2,4})(?:\s+(\d{2,4}))?$/)
      if (splitNums && !record.truck_number) {
        record.truck_number = splitNums[2]
        if (splitNums[3] && splitNums[3] !== splitNums[2] && !record.transfer_truck) {
          record.transfer_truck = splitNums[3]
        }
      }

      // Helper: "Helper: Trey Beau FDL Cs:" or "Helper:" (empty)
      const helperMatch = dl.match(/Helper:\s*([A-Za-z][\w\s]*?)(?=\s+FDL|\s+Truck|\s+\d|\s*$)/)
      if (helperMatch && helperMatch[1].trim().length > 1) {
        record.helper_name = helperMatch[1].trim()
      }

      // Start Time: "Start Time: 6:00 AM"
      const startMatch = dl.match(/Start Time:\s*([\d:]+\s*[AP]M)/)
      if (startMatch) record.start_time = startMatch[1]

      // Notes: look for note content before "Notes" label
      if (dl === 'Notes' || dl.match(/^Notes\s/)) {
        const prevLine = lines[j - 1]
        if (prevLine && !prevLine.match(/^(Route|Driver|Stops|Cases|Weight|FDL|Truck|Start|Helper|\d{4}\s)/) && prevLine.length > 2) {
          record.notes = prevLine
        }
      }
    }

    records.push(record)
  }

  return records
}
