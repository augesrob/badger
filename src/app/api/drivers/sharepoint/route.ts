import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Microsoft's well-known client ID for Office desktop apps — works for ROPC with no app registration
const CLIENT_ID = 'd3590ed6-52b3-4102-aeff-aad2292ab01c'
const SHAREPOINT_SITE = 'badgerliquor.sharepoint.com'
const ROUTING_PATH = '/sites/operation/Routing'

export async function POST(req: NextRequest) {
  try {
    // Use env vars if configured, otherwise fall back to request body
    const body = await req.json().catch(() => ({}))
    const username = process.env.MS_USERNAME || body.username
    const password = process.env.MS_PASSWORD || body.password

    if (!username || !password) {
      return NextResponse.json({
        error: 'Microsoft credentials not configured. Add MS_USERNAME and MS_PASSWORD to Vercel environment variables, or enter them manually.',
        needsCredentials: true,
      }, { status: 400 })
    }


    // Step 1: Get token via ROPC — use 'organizations' endpoint which works for all work/school accounts
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/organizations/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'password',
          client_id:     CLIENT_ID,
          username,
          password,
          scope:         'https://graph.microsoft.com/Files.Read.All offline_access',
        }),
      }
    )

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      const msg = tokenData.error_description || tokenData.error || 'Login failed'
      return NextResponse.json({ error: msg }, { status: 401 })
    }

    const token = tokenData.access_token

    // Step 2: Build today's filename — "Route Driver Report MM-DD-YYYY.pdf"
    const today = new Date()
    const mm    = String(today.getMonth() + 1).padStart(2, '0')
    const dd    = String(today.getDate()).padStart(2, '0')
    const yyyy  = today.getFullYear()
    const fileName = `Route Driver Report ${mm}-${dd}-${yyyy}.pdf`

    // Step 3: Search for the file in the Routing library
    const searchRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE}:${ROUTING_PATH}:/drive/root/search(q='${encodeURIComponent(fileName)}')`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const searchData = await searchRes.json()
    const items: { name: string; ['@microsoft.graph.downloadUrl']: string }[] = searchData.value || []

    // Find exact match for today's file
    const match = items.find(item =>
      item.name.toLowerCase() === fileName.toLowerCase()
    )

    if (!match) {
      return NextResponse.json({
        error: `"${fileName}" not found in SharePoint. Routing may not be complete yet.`,
        searched: fileName,
      }, { status: 404 })
    }

    // Step 4: Download the PDF
    const downloadUrl = match['@microsoft.graph.downloadUrl']
    const pdfRes = await fetch(downloadUrl)
    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 })
    }

    const pdfBuffer = await pdfRes.arrayBuffer()
    const uint8     = new Uint8Array(pdfBuffer)

    // Step 5: Parse PDF using same logic as manual upload
    const { extractText } = await import('unpdf')
    const result = await extractText(uint8)
    const pages: string[] = Array.isArray(result.text) ? result.text : [String(result.text)]
    const fullText = pages.join('\n')

    const records = parseDriverReport(fullText)
    if (records.length === 0) {
      return NextResponse.json({ error: 'PDF found but no routes could be parsed' }, { status: 400 })
    }

    // Step 6: Clear old and insert new
    await supabase.from('route_drivers').delete().gte('id', 0)
    for (let i = 0; i < records.length; i += 50) {
      const { error } = await supabase.from('route_drivers').insert(records.slice(i, i + 50))
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success:  true,
      count:    records.length,
      fileName,
      syncedAt: new Date().toISOString(),
    })

  } catch (err) {
    console.error('SharePoint sync error:', err)
    return NextResponse.json(
      { error: `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// ─── PDF Parser (same as /api/drivers/route.ts) ───────────────────────────────

function parseDriverReport(text: string): Record<string, unknown>[] {
  const lines   = text.split('\n')
  const records: Record<string, unknown>[] = []
  const today   = new Date().toISOString().split('T')[0]
  let currentRegion = 'FDL'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.match(/^(FDL|GREENBAY|WAUSAU|MKE|EC)\s+Cases/)) {
      currentRegion = line.split(/\s/)[0]; continue
    }

    const routeMatch = line.match(/^(\d{4})\s+([A-Z].+)/)
    if (!routeMatch) continue
    if (routeMatch[2].match(/^[\d.\s,]+$/)) continue
    if (routeMatch[2].match(/^Start Time/)) continue

    const routeNumber = routeMatch[1]
    const rest        = routeMatch[2]
    let routeName = '', driverName = '', driverPhone = '', transferDriver = ''

    const splitWords = (namesPart: string) => {
      const words = namesPart.split(/\s+/)
      const rW: string[] = [], dW: string[] = []
      let inD = false
      for (const w of words) {
        if (!inD && w === w.toUpperCase() && w.length > 1) rW.push(w)
        else { inD = true; dW.push(w) }
      }
      routeName  = rW.join(' ')
      driverName = dW.join(' ')
    }

    const regionSplit = rest.match(/^(.+?)\s+(FDL|GREENBAY|WAUSAU|MKE|EC)\s+(.+)$/)
    if (regionSplit) {
      const beforeRegion = regionSplit[1], afterRegion = regionSplit[3]
      const tdMatch = afterRegion.match(/^([\w\s]+?)\s+\+1/)
      if (tdMatch) transferDriver = tdMatch[1].trim()
      const phoneMatch = beforeRegion.match(/^(.+?)\s*\((\d{3})\)[)\s-]*(\d{3})[)\s-]*(\d{4})$/)
      if (phoneMatch) {
        driverPhone = `(${phoneMatch[2]})${phoneMatch[3]}-${phoneMatch[4]}`
        splitWords(phoneMatch[1].trim())
      } else {
        const parenIdx = beforeRegion.indexOf('(')
        if (parenIdx > 0) { driverPhone = beforeRegion.substring(parenIdx).trim(); splitWords(beforeRegion.substring(0, parenIdx).trim()) }
        else routeName = beforeRegion.replace(/\(\s*\)\s*-?\s*$/, '').trim()
      }
    } else { routeName = rest.trim() }

    let casesExpected = 0, transferTruck = '', weight = 0, stops = 0, notes = ''
    const backNumbers: number[] = []

    for (let b = i - 1; b >= Math.max(0, i - 12); b--) {
      const bl = lines[b].trim()
      if (bl.match(/^\d+[-]?\s+Virtual Transfer/)) { const vtm = bl.match(/^(\d+)/); if (vtm) transferTruck = vtm[1]; continue }
      if (bl.match(/^\d{1,5}$/) && bl.length <= 5) { backNumbers.push(parseInt(bl)); continue }
      if (bl === 'Weight:' || bl === 'Cases:' || bl === 'Stops:') continue
      if (bl.startsWith('Route Driver')) break
      if (bl === 'Notes' || bl.startsWith('Notes ')) {
        const noteLine = lines[b - 1]?.trim()
        if (noteLine && !noteLine.match(/^(Route|Driver|Transfer|Stops|Cases|Weight|\d+$)/) && noteLine.length > 2) notes = noteLine
      }
    }

    if (transferTruck) {
      if (backNumbers.length >= 1) casesExpected = backNumbers[0]
      if (backNumbers.length >= 2) weight = backNumbers[1]
    } else {
      if (currentRegion !== 'FDL' && backNumbers.length >= 2) {
        transferTruck = String(backNumbers[0]); casesExpected = backNumbers[1]
        if (backNumbers.length >= 3) weight = backNumbers[2]
      } else if (backNumbers.length >= 1) {
        casesExpected = backNumbers[0]
        if (backNumbers.length >= 2) weight = backNumbers[1]
      }
    }

    let truckNumber = '', helperName = '', startTime = ''
    for (let j = i + 1; j <= Math.min(i + 10, lines.length - 1); j++) {
      const fl = lines[j].trim()
      if (fl.match(/^\d{4}\s+[A-Z]/) && !fl.match(/^\d{4}\s+Start/)) break
      if (fl.startsWith('Route Driver')) break
      if (fl.startsWith('Truck:')) {
        const truckVal = fl.replace(/^Truck:\s*/, '').trim()
        if (!truckVal) {
          const nextLine = lines[j + 1]?.trim() || '', lineAfter = lines[j + 2]?.trim() || ''
          if (nextLine.match(/^[A-Za-z]/) && lineAfter.match(/^\d{2,4}$/)) { helperName = nextLine; truckNumber = lineAfter; j += 2 }
          else if (nextLine.match(/^\d{2,4}$/)) { truckNumber = nextLine; j++ }
        } else if (truckVal.match(/^\d{2,4}$/)) { if (!truckNumber) truckNumber = truckVal }
        else if (truckVal === 'CPU') truckNumber = 'CPU'
        continue
      }
      const stopsHelper = fl.match(/^(\d+)\s+Helper:/)
      if (stopsHelper) {
        stops = parseInt(stopsHelper[1])
        const afterHelper = fl.replace(/^\d+\s+Helper:\s*/, '').trim()
        if (afterHelper.match(/^[A-Za-z]/) && !afterHelper.match(/^FDL|^Truck/)) {
          const hMatch = afterHelper.match(/^([A-Za-z][\w\s]*?)(?:\s+FDL|\s+Truck|$)/)
          if (hMatch && hMatch[1].trim().length > 1) helperName = hMatch[1].trim()
        }
        continue
      }
      const stopsNameMatch = fl.match(/^Stops:\s*(\d+)\s+([A-Za-z][\w\s]*?)(?:\s+FDL|$)/)
      if (stopsNameMatch) { stops = parseInt(stopsNameMatch[1]); if (stopsNameMatch[2].trim().length > 1) helperName = stopsNameMatch[2].trim(); continue }
      const stopsMatch = fl.match(/^Stops:\s*(\d+)/)
      if (stopsMatch && !stops) { stops = parseInt(stopsMatch[1]); continue }
      const startMatch = fl.match(/Start Time:\s*([\d:]+\s*[AP]M)/)
      if (startMatch) { startTime = startMatch[1]; break }
    }

    records.push({ region: currentRegion, route_number: routeNumber, route_name: routeName, driver_name: driverName, driver_phone: driverPhone, truck_number: truckNumber, helper_name: helperName, cases_expected: casesExpected, stops, weight, start_time: startTime, transfer_driver: transferDriver, transfer_truck: transferTruck, notes, upload_date: today })
  }

  return records
}
