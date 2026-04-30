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
      return NextResponse.json({ error: 'No routes found in PDF text' }, { status: 400 })
    }

    // Clear old data
    await supabase.from('route_drivers').delete().gte('id', 0)

    // Insert in batches of 50
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
    .order('region')
    .order('route_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

async function handleClear() {
  await supabase.from('route_drivers').delete().gte('id', 0)
  return NextResponse.json({ success: true })
}

function parseDriverReport(text: string): Record<string, unknown>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const records: Record<string, unknown>[] = []

  let currentRegion = 'FDL'
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    const regionMatch = line.match(/^(FDL|GREENBAY|WAUSAU|MKE|EC)\s+Cases/)
    if (regionMatch) {
      currentRegion = regionMatch[1]
      i++
      continue
    }

    const routeMatch = line.match(/^(\d{4})\s+(.+)/)
    if (routeMatch) {
      const routeNumber = routeMatch[1]
      const rest = routeMatch[2]

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

      const phoneMatch = rest.match(/^(.+?)\s+([\w\s]+?)\s*\((\d{3})\)[)\s-]*(\d{3})[)\s-]*(\d{4})/)
      if (phoneMatch) {
        record.route_name = phoneMatch[1].trim()
        record.driver_name = phoneMatch[2].trim()
        record.driver_phone = `(${phoneMatch[3]})${phoneMatch[4]}-${phoneMatch[5]}`
      } else {
        const cpuMatch = rest.match(/^(.+?)\s*\(\s*\)\s*-\s*(\w+)/)
        if (cpuMatch) {
          record.route_name = cpuMatch[1].trim()
        } else {
          record.route_name = rest.split(/\s{2,}/)[0]?.trim() || rest.trim()
        }
      }

      let j = i + 1
      const scanLimit = Math.min(i + 20, lines.length)
      while (j < scanLimit) {
        const sl = lines[j]

        const casesMatch = sl.match(/FDL Cs:\s*([\d,.]+)/)
        if (casesMatch) {
          record.cases_expected = Math.round(parseFloat(casesMatch[1].replace(',', '')))
        }

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

        const truckMatch = sl.match(/^Truck:\s*(.+)/)
        if (truckMatch) {
          const tv = truckMatch[1].trim()
          if (tv === 'CPU') {
            record.truck_number = 'CPU'
          } else {
            const truckNum = tv.match(/(\d+)\s*$/)
            if (truckNum) {
              record.truck_number = truckNum[1]
              const helperPart = tv.replace(truckNum[0], '').trim()
              if (helperPart && helperPart.length > 1 && !helperPart.match(/^\d+$/)) {
                record.helper_name = helperPart
              }
            } else if (tv.length > 0 && !tv.match(/^\d/)) {
              record.helper_name = tv
              const nextLine = lines[j + 1]
              if (nextLine?.match(/^\d+$/)) {
                record.truck_number = nextLine
                j++
              }
            } else {
              record.truck_number = tv
            }
          }
        }

        const timeMatch = sl.match(/Start Time:\s*(.+)/)
        if (timeMatch) {
          record.start_time = timeMatch[1].trim()
          break
        }

        const transferMatch2 = sl.match(/^(\d+)-?\s+Virtual Transfer/)
        if (transferMatch2) {
          record.transfer_truck = transferMatch2[1]
        }

        const tdMatch = sl.match(/(?:FDL|GREENBAY|WAUSAU|MKE|EC)\s+([\w\s]+?)\s+\+1\s+\((\d{3})\)\s+(\d{3})[- ](\d{4})/)
        if (tdMatch) {
          record.transfer_driver = tdMatch[1].trim()
        }

        if (sl === 'Notes' || sl.match(/^Notes\s/)) {
          const noteLines: string[] = []
          let k = j - 1
          while (k > i && k >= j - 4) {
            const nl = lines[k]
            if (nl.match(/^(Route|Driver|Transfer|Stops|Cases|Weight|FDL|Truck|Start|Helper|Virtual|\d+$|^\d+\s+Virtual)/)) break
            if (nl.length > 2 && !nl.match(/^\d+$/) && nl !== 'Notes') noteLines.unshift(nl)
            k--
          }
          if (noteLines.length > 0) record.notes = noteLines.join('; ')
        }

        j++
      }

      if (record.route_number) {
        records.push(record)
      }

      i = j + 1
      continue
    }

    i++
  }

  return records
}
