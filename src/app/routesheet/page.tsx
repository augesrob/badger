'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PrintroomEntry } from '@/lib/types'
import { useToast } from '@/components/Toast'

interface DoorBlock {
  doorName: string
  loaderName: string
  rows: RowData[]
}

interface RowData {
  route: string
  signature: string
  truckNumber: string
  caseQty: string
  notes: string
}

interface CSVRoute {
  truckNumber: string     // TR222, TR231-1
  truckKey: string        // 222, 231-1 (stripped TR prefix)
  route: string           // 1405, 5425
  casesExpected: number
}

type SyncStatus = 'idle' | 'waiting' | 'synced'

export default function RouteSheet() {
  const toast = useToast()
  const [blocks, setBlocks] = useState<DoorBlock[]>([])
  const [topRight, setTopRight] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [csvData, setCsvData] = useState<CSVRoute[]>([])

  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

  const loadData = useCallback(async () => {
    const [doorsRes, entriesRes, tractorsRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('printroom_entries').select('*, loading_doors(door_name)').order('batch_number').order('row_order'),
      supabase.from('tractors').select('truck_number'),
    ])

    const doors = doorsRes.data || []
    const allEntries = (entriesRes.data || []) as (PrintroomEntry & { loading_doors: { door_name: string } | null })[]
    
    // Build set of tractor numbers for semi detection
    const tNums = new Set<string>()
    ;(tractorsRes.data || []).forEach((t: { truck_number: number }) => tNums.add(String(t.truck_number)))

    // Group entries by door
    const grouped: Record<string, (PrintroomEntry & { loading_doors: { door_name: string } | null })[]> = {}
    doors.forEach(d => { grouped[d.door_name] = [] })
    allEntries.forEach(e => {
      const doorName = e.loading_doors?.door_name
      if (doorName && grouped[doorName]) grouped[doorName].push(e)
    })

    // Build blocks from printroom data
    const newBlocks: DoorBlock[] = doors.map(door => {
      const doorEntries = grouped[door.door_name] || []
      const rows: RowData[] = doorEntries
        .filter(e => !e.is_end_marker && e.truck_number && e.truck_number !== 'end')
        .map(e => ({
          route: '',
          signature: '',
          truckNumber: e.truck_number || '',
          caseQty: '',
          notes: e.notes || '',
        }))
      // Min 1 empty row if no trucks
      if (rows.length === 0) {
        rows.push({ route: '', signature: '', truckNumber: '', caseQty: '', notes: '' })
      }
      return { doorName: door.door_name, loaderName: '', rows }
    })

    setBlocks(newBlocks)
    setLoading(false)
    return { blocks: newBlocks, tNums }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Parse CSV data and merge with blocks
  const parseAndMergeCSV = useCallback((csvText: string, currentBlocks: DoorBlock[], tractorNumbers: Set<string>) => {
    const lines = csvText.trim().replace(/\r/g, '').split('\n')
    if (lines.length < 2) return currentBlocks

    // Parse CSV rows (skip header)
    const routes: CSVRoute[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < 7) continue
      const truckNumber = cols[0].trim()
      const route = cols[1].trim()
      const casesExpected = parseInt(cols[6]) || 0
      // Strip TR prefix to match printroom format
      const truckKey = truckNumber.replace(/^TR/i, '')
      routes.push({ truckNumber, truckKey, route, casesExpected })
    }

    setCsvData(routes)

    // Group CSV routes by truckKey (for semis with multiple routes)
    const routesByTruck: Record<string, CSVRoute[]> = {}
    routes.forEach(r => {
      if (!routesByTruck[r.truckKey]) routesByTruck[r.truckKey] = []
      routesByTruck[r.truckKey].push(r)
    })

    // Check if a printroom truck is a semi:
    // 1. Has a dash (e.g. 231-1)
    // 2. Is in the tractors table (e.g. bare 222)
    const isSemi = (truckKey: string): boolean => {
      if (/^\d+-\d+$/.test(truckKey)) return true
      if (tractorNumbers.has(truckKey)) return true
      return false
    }

    // For a semi entered without a dash (e.g. "222"), find all CSV routes
    // that belong to it. CSV may have TR222 directly, or we already have the exact key.
    const getSemiRoutes = (truckKey: string): CSVRoute[] => {
      // Direct match first (handles both "222" and "231-1")
      const direct = routesByTruck[truckKey]
      if (direct && direct.length > 0) return direct
      return []
    }

    // Merge into blocks
    const merged = currentBlocks.map(block => {
      const newRows: RowData[] = []

      block.rows.forEach(row => {
        if (!row.truckNumber) {
          newRows.push(row)
          return
        }

        const truckKey = row.truckNumber

        // CPU/TR999 special handling
        if (truckKey === '999' || truckKey.toLowerCase() === 'cpu') {
          const cpuRoutes = routesByTruck['999'] || routesByTruck['cpu'] || []
          newRows.push({ ...row, route: 'CPU', caseQty: cpuRoutes.length > 0 ? String(cpuRoutes[0].casesExpected) : '' })
          return
        }

        const semi = isSemi(truckKey)
        const truckRoutes = getSemiRoutes(truckKey)

        if (!truckRoutes || truckRoutes.length === 0) {
          // No CSV data for this truck
          newRows.push(row)
          return
        }

        if (!semi) {
          // Box truck — single route
          newRows.push({
            ...row,
            route: truckRoutes[0].route,
            caseQty: String(truckRoutes[0].casesExpected),
          })
          return
        }

        // Semi — multiple routes, sorted DESCENDING (highest route first)
        const sorted = [...truckRoutes].sort((a, b) => parseInt(b.route) - parseInt(a.route))
        sorted.forEach((r, idx) => {
          newRows.push({
            route: r.route,
            signature: '',
            truckNumber: row.truckNumber,
            caseQty: String(r.casesExpected),
            notes: idx === 0 ? row.notes : '',
          })
        })
      })

      return { ...block, rows: newRows }
    })

    return merged
  }, [])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSyncStatus('waiting')
    const text = await file.text()

    // Load fresh printroom data then merge
    const result = await loadData()
    if (result) {
      const merged = parseAndMergeCSV(text, result.blocks, result.tNums)
      setBlocks(merged)
      setSyncStatus('synced')
      toast('Route data synced!')
    }

    // Reset file input
    e.target.value = ''
  }

  const updateBlock = (doorIdx: number, field: 'loaderName', value: string) => {
    setBlocks(prev => prev.map((b, i) => i === doorIdx ? { ...b, [field]: value } : b))
  }

  const updateRow = (doorIdx: number, rowIdx: number, field: keyof RowData, value: string) => {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== doorIdx) return b
      const newRows = b.rows.map((r, j) => j === rowIdx ? { ...r, [field]: value } : r)
      return { ...b, rows: newRows }
    }))
  }

  const addRow = (doorIdx: number) => {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== doorIdx) return b
      return { ...b, rows: [...b.rows, { route: '', signature: '', truckNumber: '', caseQty: '', notes: '' }] }
    }))
  }

  const removeRow = (doorIdx: number, rowIdx: number) => {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== doorIdx) return b
      if (b.rows.length <= 1) return b
      return { ...b, rows: b.rows.filter((_, j) => j !== rowIdx) }
    }))
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      {/* Screen-only toolbar */}
      <div className="no-print mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h1 className="text-xl font-bold">📄 Routes at the Door</h1>
            <p className="text-xs text-muted">Truck # pulled from Print Room • Upload route data CSV to fill routes &amp; case counts</p>
          </div>
          <button onClick={() => window.print()}
            className="bg-amber-500 text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-amber-400 flex items-center gap-2 flex-shrink-0">
            🖨️ Print / Download PDF
          </button>
        </div>

        {/* Sync status bar */}
        <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 flex-1">
            {syncStatus === 'idle' && (
              <>
                <span className="text-yellow-500 text-lg">📡</span>
                <span className="text-sm text-gray-400">No route data loaded — upload CSV from email</span>
              </>
            )}
            {syncStatus === 'waiting' && (
              <>
                <span className="text-blue-500 text-lg animate-pulse">⏳</span>
                <span className="text-sm text-blue-400">Processing route data...</span>
              </>
            )}
            {syncStatus === 'synced' && (
              <>
                <span className="text-green-500 text-lg">✅</span>
                <span className="text-sm text-green-400">Route data synced — {csvData.length} routes loaded</span>
              </>
            )}
          </div>

          <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5 flex-shrink-0">
            📎 Upload CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* ===== PRINTABLE SHEET ===== */}
      <div className="route-sheet">

        {/* Header row */}
        <div className="rs-header">
          <div className="rs-date">{today}</div>
          <div className="rs-center">
            <div className="rs-subtitle">FOND DU LAC, WI // BADGER LIQUOR // DMW&H</div>
            <div className="rs-title">ROUTES AT THE DOOR</div>
          </div>
          <div className="rs-topright">
            <input value={topRight} onChange={e => setTopRight(e.target.value)}
              placeholder="Names..."
              className="rs-input rs-input-right" />
          </div>
        </div>

        {/* Column headers */}
        <div className="rs-col-headers">
          <div className="rs-col rs-col-door">DOOR</div>
          <div className="rs-col rs-col-route">ROUTE</div>
          <div className="rs-col rs-col-sig">SIGNATURE</div>
          <div className="rs-col rs-col-truck">TRUCK #</div>
          <div className="rs-col rs-col-qty">CASE QTY</div>
          <div className="rs-col rs-col-notes">NOTES</div>
        </div>

        {/* Door blocks */}
        {blocks.map((block, doorIdx) => {
          return (
            <div key={doorIdx} className="rs-door-block">
              <div className="rs-door-rows">
                {/* Door label cell */}
                <div className="rs-door-label" style={{ gridRow: `1 / ${block.rows.length + 1}` }}>
                  <div className="rs-door-name">{block.doorName}</div>
                  <input value={block.loaderName} onChange={e => updateBlock(doorIdx, 'loaderName', e.target.value)}
                    placeholder="Name" className="rs-input rs-input-center rs-loader-input" />
                </div>

                {/* Data rows */}
                {block.rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="rs-row">
                    <div className="rs-cell rs-col-route">
                      <input value={row.route} onChange={e => updateRow(doorIdx, rowIdx, 'route', e.target.value)}
                        className="rs-input rs-input-center" />
                    </div>
                    <div className="rs-cell rs-col-sig">
                      <input value={row.signature} onChange={e => updateRow(doorIdx, rowIdx, 'signature', e.target.value)}
                        className="rs-input" />
                    </div>
                    <div className="rs-cell rs-col-truck">
                      {row.truckNumber ? (
                        <div className="rs-truck-value">TR{row.truckNumber}</div>
                      ) : (
                        <input value="" onChange={e => updateRow(doorIdx, rowIdx, 'truckNumber', e.target.value)}
                          className="rs-input rs-input-center rs-input-bold" />
                      )}
                    </div>
                    <div className="rs-cell rs-col-qty">
                      <input value={row.caseQty} onChange={e => updateRow(doorIdx, rowIdx, 'caseQty', e.target.value)}
                        className="rs-input rs-input-center" />
                    </div>
                    <div className="rs-cell rs-col-notes">
                      <input value={row.notes} onChange={e => updateRow(doorIdx, rowIdx, 'notes', e.target.value)}
                        className="rs-input" />
                      <button onClick={() => removeRow(doorIdx, rowIdx)}
                        className="no-print rs-remove-btn">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => addRow(doorIdx)}
                className="no-print rs-add-row">+ Add Row</button>
            </div>
          )
        })}

        {/* Footer */}
        <div className="rs-footer">
          <div>SHIRAZ REPORTS DESIGNED BY DMW&H</div>
        </div>
      </div>
    </div>
  )
}
