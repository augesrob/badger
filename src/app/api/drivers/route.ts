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

  const body = await req.json()
  if (body.action === 'list') return handleList()
  if (body.action === 'clear') return handleClear()

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function handleUpload(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const uint8 = new Uint8Array(buffer)

    // Extract text using unpdf (serverless-compatible, no DOM needed)
    const { extractText } = await import('unpdf')
    const result = await extractText(uint8)
    const pages: string[] = Array.isArray(result.text) ? result.text : [String(result.text)]
    const fullText = pages.join('\n')

    const records = parseDriverReport(fullText)
    if (records.length === 0) {
      return NextResponse.json({ error: 'No routes found in PDF' }, { status: 400 })
    }

    // Clear old data and insert new
    await supabase.from('route_drivers').delete().gte('id', 0)

    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50)
      const { error } = await supabase.from('route_drivers').insert(batch)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: records.length })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: `Failed: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 500 })
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
  UNPDF output format — each route block follows this exact pattern:
  
  Route Driver Transfer          ← header (skip)
  13048                           ← weight (standalone number)
  Stops:                          ← label
  Cases:                          ← label  
  Weight:                         ← label
  495                             ← cases count (standalone number before transfer/route line)
  224 Virtual Transfer - 2        ← transfer truck + label (optional, only transfer routes)
  2501 GREEN BAY WEST Craig Cameron (414)750-4152 GREENBAY Billy Langrud +1 (920) 238-2291
  FDL Cs:                         ← label
  Truck:494.33                    ← cases decimal merged with Truck label (ignore)
  26 Helper:                      ← stops number merged with Helper label
  Truck: 147                      ← ACTUAL TRUCK NUMBER
  Start Time: 6:00 AM
  
  When there's a helper:
  Truck:                          ← empty
  Trey Beau                       ← helper name
  161                             ← truck number
  Start Time: 6:00 AM

  Notes appear as:
  Joe to take stores              ← note content
  Notes Transfer                  ← "Notes" label (note is on PREVIOUS line)
*/

function parseDriverReport(text: string): Record<string, unknown>[] {
  const lines = text.split('\n')
  const records: Record<string, unknown>[] = []
  const today = new Date().toISOString().split('T')[0]

  let currentRegion = 'FDL'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detect region headers
    if (line.match(/^(FDL|GREENBAY|WAUSAU|MKE|EC)\s+Cases/)) {
      currentRegion = line.split(/\s/)[0]
      continue
    }

    // Route line: "2501 GREEN BAY WEST Craig Cameron (414)750-4152 GREENBAY Billy Langrud +1 (920) 238-2291"
    const routeMatch = line.match(/^(\d{4})\s+([A-Z].+)/)
    if (!routeMatch) continue

    // Skip false matches: stats lines, Start Time lines
    if (routeMatch[2].match(/^[\d.\s,]+$/)) continue
    if (routeMatch[2].match(/^Start Time/)) continue

    const routeNumber = routeMatch[1]
    const rest = routeMatch[2]

    // === Parse route line for names and phones ===
    let routeName = '', driverName = '', driverPhone = '', transferDriver = ''

    // Helper to split "GREEN BAY WEST Craig Cameron" into route (UPPERCASE) + driver (mixed)
    const splitWords = (namesPart: string) => {
      const words = namesPart.split(/\s+/)
      const rW: string[] = [], dW: string[] = []
      let inD = false
      for (const w of words) {
        if (!inD && w === w.toUpperCase() && w.length > 1) rW.push(w)
        else { inD = true; dW.push(w) }
      }
      routeName = rW.join(' ')
      driverName = dW.join(' ')
    }

    // Split on region code: "...beforeRegion REGION afterRegion..."
    const regionSplit = rest.match(/^(.+?)\s+(FDL|GREENBAY|WAUSAU|MKE|EC)\s+(.+)$/)
    if (regionSplit) {
      const beforeRegion = regionSplit[1]
      const afterRegion = regionSplit[3]

      // Transfer driver from afterRegion: "Billy Langrud +1 (920) 238-2291"
      const tdMatch = afterRegion.match(/^([\w\s]+?)\s+\+1/)
      if (tdMatch) transferDriver = tdMatch[1].trim()

      // Route driver from beforeRegion: "GREEN BAY WEST Craig Cameron (414)750-4152"
      // Try standard phone pattern first
      const phoneMatch = beforeRegion.match(/^(.+?)\s*\((\d{3})\)[)\s-]*(\d{3})[)\s-]*(\d{4})$/)
      if (phoneMatch) {
        driverPhone = `(${phoneMatch[2]})${phoneMatch[3]}-${phoneMatch[4]}`
        splitWords(phoneMatch[1].trim())
      } else {
        // Malformed phone — split on first "("
        const parenIdx = beforeRegion.indexOf('(')
        if (parenIdx > 0) {
          driverPhone = beforeRegion.substring(parenIdx).trim()
          splitWords(beforeRegion.substring(0, parenIdx).trim())
        } else {
          routeName = beforeRegion.replace(/\(\s*\)\s*-?\s*$/, '').trim()
        }
      }
    } else {
      routeName = rest.trim()
    }

    // === Scan BACKWARDS for pre-route data ===
    // Numbers appear in order (bottom to top): transferTruck, cases, weight
    // "224 Virtual Transfer - 2" is explicit transfer truck
    // Without Virtual Transfer label, standalone numbers are: closest=transferTruck, next=cases
    let casesExpected = 0, transferTruck = '', weight = 0, stops = 0
    let notes = ''
    const backNumbers: number[] = [] // collect standalone numbers going backwards

    for (let b = i - 1; b >= Math.max(0, i - 12); b--) {
      const bl = lines[b].trim()

      // "224 Virtual Transfer - 2" or "231- Virtual Transfer - 1"
      if (bl.match(/^\d+[-]?\s+Virtual Transfer/)) {
        const vtm = bl.match(/^(\d+)/)
        if (vtm) transferTruck = vtm[1]
        continue
      }

      // Standalone number
      if (bl.match(/^\d{1,5}$/) && bl.length <= 5) {
        backNumbers.push(parseInt(bl))
        continue
      }

      // Labels — skip
      if (bl === 'Weight:' || bl === 'Cases:' || bl === 'Stops:') continue

      // Header — stop
      if (bl.startsWith('Route Driver')) break

      // Notes
      if (bl === 'Notes' || bl.startsWith('Notes ')) {
        const noteLine = lines[b - 1]?.trim()
        if (noteLine && !noteLine.match(/^(Route|Driver|Transfer|Stops|Cases|Weight|\d+$)/) && noteLine.length > 2) {
          notes = noteLine
        }
      }
    }

    // Assign backwards numbers:
    // If we got a Virtual Transfer, backNumbers are: [cases, weight] (closest first)
    // If no Virtual Transfer, backNumbers are: [transferTruck, cases, weight] (closest first)
    if (transferTruck) {
      // Virtual Transfer already set, numbers are: cases, weight
      if (backNumbers.length >= 1) casesExpected = backNumbers[0]
      if (backNumbers.length >= 2) weight = backNumbers[1]
    } else {
      // No Virtual Transfer — first number could be transfer truck OR cases
      // Transfer truck is typically 100-300 range, cases can be higher
      // But the pattern is: closest number = transfer truck (or cases if FDL local)
      // For transfer routes (non-FDL), first number = truck, second = cases
      if (currentRegion !== 'FDL' && backNumbers.length >= 2) {
        transferTruck = String(backNumbers[0])
        casesExpected = backNumbers[1]
        if (backNumbers.length >= 3) weight = backNumbers[2]
      } else if (backNumbers.length >= 1) {
        casesExpected = backNumbers[0]
        if (backNumbers.length >= 2) weight = backNumbers[1]
      }
    }

    // === Scan FORWARDS for post-route data ===
    let truckNumber = '', helperName = '', startTime = ''

    for (let j = i + 1; j <= Math.min(i + 10, lines.length - 1); j++) {
      const fl = lines[j].trim()

      // Hit next route or header — stop
      if (fl.match(/^\d{4}\s+[A-Z]/) && !fl.match(/^\d{4}\s+Start/)) break
      if (fl.startsWith('Route Driver')) break

      // "Truck:494.33" — cases decimal merged, ignore (we got cases from backwards scan)
      // "Truck: 147" — actual truck number
      // "Truck:" — empty, helper name follows on next line
      if (fl.startsWith('Truck:')) {
        const truckVal = fl.replace(/^Truck:\s*/, '').trim()
        if (!truckVal) {
          // Empty Truck: — next line might be helper name, then truck number
          const nextLine = lines[j + 1]?.trim() || ''
          const lineAfter = lines[j + 2]?.trim() || ''
          if (nextLine.match(/^[A-Za-z]/) && lineAfter.match(/^\d{2,4}$/)) {
            // Helper name + truck number
            helperName = nextLine
            truckNumber = lineAfter
            j += 2
          } else if (nextLine.match(/^\d{2,4}$/)) {
            truckNumber = nextLine
            j++
          }
        } else if (truckVal.match(/^\d{2,4}$/)) {
          // Clean truck number like "Truck: 147"
          if (!truckNumber) truckNumber = truckVal
        } else if (truckVal === 'CPU') {
          truckNumber = 'CPU'
        }
        // else it's "Truck:494.33" (decimal = ignore, it's cases)
        continue
      }

      // "30 Helper:" or "26 Helper:" — stops count
      const stopsHelper = fl.match(/^(\d+)\s+Helper:/)
      if (stopsHelper) {
        stops = parseInt(stopsHelper[1])
        // Check if helper name follows after "Helper:"
        const afterHelper = fl.replace(/^\d+\s+Helper:\s*/, '').trim()
        if (afterHelper && afterHelper.match(/^[A-Za-z]/) && !afterHelper.match(/^FDL|^Truck/)) {
          // "36 Helper: Trey Beau FDL Cs: 398" — extract helper before FDL
          const hMatch = afterHelper.match(/^([A-Za-z][\w\s]*?)(?:\s+FDL|\s+Truck|$)/)
          if (hMatch && hMatch[1].trim().length > 1) helperName = hMatch[1].trim()
        }
        continue
      }

      // "Stops: 16 Yasin Akan FDL Cs:" — stops + helper name in same line
      const stopsNameMatch = fl.match(/^Stops:\s*(\d+)\s+([A-Za-z][\w\s]*?)(?:\s+FDL|$)/)
      if (stopsNameMatch) {
        stops = parseInt(stopsNameMatch[1])
        if (stopsNameMatch[2].trim().length > 1) helperName = stopsNameMatch[2].trim()
        continue
      }

      // "Stops: 20 FDL Cs:" — stops with FDL Cs
      const stopsMatch = fl.match(/^Stops:\s*(\d+)/)
      if (stopsMatch && !stops) {
        stops = parseInt(stopsMatch[1])
        continue
      }

      // "Start Time: 6:00 AM"
      const startMatch = fl.match(/Start Time:\s*([\d:]+\s*[AP]M)/)
      if (startMatch) {
        startTime = startMatch[1]
        break // start time is always last
      }
    }

    records.push({
      region: currentRegion,
      route_number: routeNumber,
      route_name: routeName,
      driver_name: driverName,
      driver_phone: driverPhone,
      truck_number: truckNumber,
      helper_name: helperName,
      cases_expected: casesExpected,
      stops: stops,
      weight: weight,
      start_time: startTime,
      transfer_driver: transferDriver,
      transfer_truck: transferTruck,
      notes: notes,
      upload_date: today,
    })
  }

  return records
}
