'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PrintroomEntry } from '@/lib/types'
import { useToast } from '@/components/Toast'

async function downloadRouteSheetPDF(
  page1El: HTMLElement,
  page2El: HTMLElement,
  dateStr: string
) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  // A4 landscape in mm: 297 x 210. We use letter landscape: 279.4 x 215.9
  const pageW = 279.4
  const pageH = 215.9

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  const pages = [page1El, page2El]

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i]

    // Temporarily make the element visible and at full width for capture
    const prevStyle = el.getAttribute('style') || ''
    el.style.display = 'block'
    el.style.width = '1056px'  // ~11in at 96dpi
    el.style.background = '#fff'

    const canvas = await html2canvas(el, {
      scale: 2,             // 2x for crisp text
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 1056,
      windowWidth: 1056,
    })

    // Restore original style
    el.setAttribute('style', prevStyle)

    const imgData = canvas.toDataURL('image/jpeg', 0.95)

    // Fit canvas into PDF page with margins (5mm each side)
    const margin = 5
    const availW = pageW - margin * 2
    const availH = pageH - margin * 2
    const canvasAspect = canvas.width / canvas.height
    const pageAspect = availW / availH

    let drawW = availW
    let drawH = availW / canvasAspect
    if (drawH > availH) {
      drawH = availH
      drawW = availH * canvasAspect
    }

    const x = margin + (availW - drawW) / 2
    const y = margin + (availH - drawH) / 2

    if (i > 0) pdf.addPage('letter', 'landscape')
    pdf.addImage(imgData, 'JPEG', x, y, drawW, drawH)
  }

  pdf.save(`routes-at-the-door-${dateStr}.pdf`)
}

const STORAGE_KEY = 'badger-routesheet-v1'

function saveToStorage(blocks: DoorBlock[], topRight: string, syncStatus: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ blocks, topRight, syncStatus }))
  } catch { /* ignore */ }
}

function loadFromStorage(): { blocks: DoorBlock[]; topRight: string; syncStatus: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

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
  const [topRight, _setTopRight] = useState('')
  const topRightRef = useRef('')
  const setTopRight = (val: string) => { topRightRef.current = val; _setTopRight(val) }
  const [loading, setLoading] = useState(true)
  const [syncStatus, _setSyncStatus] = useState<SyncStatus>('idle')
  const syncStatusRef = useRef<SyncStatus>('idle')
  const setSyncStatus = (val: SyncStatus) => { syncStatusRef.current = val; _setSyncStatus(val) }
  const [csvData, setCsvData] = useState<CSVRoute[]>([])
  const restoredFromStorage = useRef(false)
  const tractorNumsRef = useRef<Set<string>>(new Set())

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
    tractorNumsRef.current = tNums

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

    // On first load, restore saved data
    if (!restoredFromStorage.current) {
      restoredFromStorage.current = true
      const saved = loadFromStorage()
      if (saved && saved.blocks && saved.blocks.length > 0) {

        // If already synced with CSV, use saved blocks exactly as-is — no re-merge
        // Re-merging with fresh printroom rows would overwrite normalized route/caseQty data
        if (saved.syncStatus === 'synced') {
          setBlocks(saved.blocks)
          setTopRight(saved.topRight || '')
          setSyncStatus('synced')
          setLoading(false)
          saveToStorage(saved.blocks, saved.topRight || '', 'synced')
          return { blocks: saved.blocks, tNums }
        }

        // Not yet synced — merge saved typed data (signatures, loader names) with fresh printroom truck list
        const mergedBlocks = newBlocks.map(freshBlock => {
          const savedBlock = saved.blocks.find(b => b.doorName === freshBlock.doorName)
          if (!savedBlock) return freshBlock
          const mergedRows = freshBlock.rows.map(freshRow => {
            if (!freshRow.truckNumber) return freshRow
            const savedRow = savedBlock.rows.find(r => r.truckNumber === freshRow.truckNumber)
            return savedRow ? savedRow : freshRow
          })
          const freshTrucks = new Set(freshBlock.rows.map(r => r.truckNumber))
          const extraRows = savedBlock.rows.filter(r => !r.truckNumber || !freshTrucks.has(r.truckNumber))
          return { ...savedBlock, rows: [...mergedRows, ...extraRows] }
        })
        setBlocks(mergedBlocks)
        setTopRight(saved.topRight || '')
        setSyncStatus((saved.syncStatus as SyncStatus) || 'idle')
        setLoading(false)
        // Re-save immediately to keep storage fresh (do NOT let useEffect handle it — timing is unreliable)
        saveToStorage(mergedBlocks, saved.topRight || '', saved.syncStatus || 'idle')
        return { blocks: mergedBlocks, tNums }
      }
    }

    setBlocks(newBlocks)
    setLoading(false)
    return { blocks: newBlocks, tNums }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // NOTE: Do NOT use useEffect to auto-save — React batching makes it fire with stale state.
  // Instead, every mutation calls saveToStorage() explicitly with the new value.

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

    // For a semi, match CSV routes by:
    // 1. Direct key match (e.g. "231-1" → TR231-1)
    // 2. Base number match — strip the "-N" suffix (e.g. "222-1" → look up "222" in CSV)
    const getSemiRoutes = (truckKey: string): CSVRoute[] => {
      // Direct match first
      const direct = routesByTruck[truckKey]
      if (direct && direct.length > 0) return direct
      // Strip trailer suffix: "222-1" → "222", "189-1" → "189"
      const base = truckKey.replace(/-\d+$/, '')
      if (base !== truckKey) {
        const baseMatch = routesByTruck[base]
        if (baseMatch && baseMatch.length > 0) return baseMatch
      }
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
        // Normalize: strip TR prefix for comparison
        const truckKeyNorm = truckKey.replace(/^TR/i, '').toLowerCase()

        // Gap marker — display as route label only, no truck number; deduplicate (keep only first)
        if (truckKeyNorm === 'gap') {
          if (!newRows.some(r => r.route === 'gap')) {
            newRows.push({ ...row, truckNumber: '', route: 'gap', caseQty: '', signature: '' })
          }
          return
        }

        // CPU/TR999 special handling — deduplicate to one row
        if (truckKeyNorm === '999' || truckKeyNorm === 'cpu') {
          // Only add CPU once per block
          if (newRows.some(r => r.route === 'CPU')) return
          const cpuRoutes = routesByTruck['999'] || routesByTruck['cpu'] || []
          newRows.push({ ...row, truckNumber: 'TR999', route: 'CPU', caseQty: cpuRoutes.length > 0 ? String(cpuRoutes[0].casesExpected) : '' })
          return
        }

        // Strip TR prefix for semi detection and CSV lookup
        const lookupKey = truckKey.replace(/^TR/i, '')
        const semi = isSemi(lookupKey)
        const truckRoutes = getSemiRoutes(lookupKey)

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
    setBlocks(prev => {
      const merged = parseAndMergeCSV(text, prev, tractorNumsRef.current)
      // Save immediately — don't rely on useEffect which may fire before state commits
      saveToStorage(merged, topRightRef.current, 'synced')
      return merged
    })
    setSyncStatus('synced')
    toast('Route data synced!')
    e.target.value = ''
  }

  const clearData = async () => {
    if (!confirm('Clear all route data and reload from Print Room?')) return
    localStorage.removeItem(STORAGE_KEY)
    restoredFromStorage.current = false
    setCsvData([])
    setSyncStatus('idle')
    setEmailStatus('idle')
    setTopRight('')
    await loadData()
    toast('Data cleared')
  }

  // Wrapper: mutate blocks AND immediately persist to localStorage
  const mutateBlocks = (fn: (prev: DoorBlock[]) => DoorBlock[]) => {
    setBlocks(prev => {
      const next = fn(prev)
      saveToStorage(next, topRightRef.current, syncStatusRef.current)
      return next
    })
  }

  const updateBlock = (doorIdx: number, field: 'loaderName', value: string) => {
    mutateBlocks(prev => prev.map((b, i) => i === doorIdx ? { ...b, [field]: value } : b))
  }

  const updateRow = (doorIdx: number, rowIdx: number, field: keyof RowData, value: string) => {
    mutateBlocks(prev => prev.map((b, i) => {
      if (i !== doorIdx) return b
      const newRows = b.rows.map((r, j) => j === rowIdx ? { ...r, [field]: value } : r)
      return { ...b, rows: newRows }
    }))
  }

  const addRow = (doorIdx: number) => {
    mutateBlocks(prev => prev.map((b, i) => {
      if (i !== doorIdx) return b
      return { ...b, rows: [...b.rows, { route: '', signature: '', truckNumber: '', caseQty: '', notes: '' }] }
    }))
  }

  const removeRow = (doorIdx: number, rowIdx: number) => {
    mutateBlocks(prev => prev.map((b, i) => {
      if (i !== doorIdx) return b
      if (b.rows.length <= 1) return b
      return { ...b, rows: b.rows.filter((_, j) => j !== rowIdx) }
    }))
  }

  // Email ping system
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'waiting' | 'checking' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const page1Ref = useRef<HTMLDivElement>(null)
  const page2Ref = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    if (!page1Ref.current || !page2Ref.current) return
    setDownloading(true)
    try {
      const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')
      await downloadRouteSheetPDF(page1Ref.current, page2Ref.current, dateStr)
    } catch (e) {
      toast('PDF generation failed: ' + String(e))
    }
    setDownloading(false)
  }

  // Auto-scale: measure each page's natural height and compute a scale so it fits
  // in one landscape page (8in usable = ~768px at 96dpi with 0.25in margins).
  // We inject a CSS custom property on the element so the print stylesheet can use it.
  const PRINT_PAGE_H = 740 // px at 96dpi for landscape + 0.25in margins (conservative)

  const autoScalePages = useCallback(() => {
    ;[page1Ref, page2Ref].forEach(ref => {
      const el = ref.current
      if (!el) return
      const content = el.querySelector('.rs-page-content') as HTMLElement | null
      if (!content) return
      // Reset first to measure natural height
      content.style.transform = ''
      content.style.width = ''
      const natural = content.scrollHeight
      if (natural > PRINT_PAGE_H) {
        const scale = PRINT_PAGE_H / natural
        content.style.transform = `scale(${scale})`
        content.style.transformOrigin = 'top left'
        // Widen the content to compensate so it still fills the page width
        content.style.width = `${100 / scale}%`
      }
    })
  }, [])

  useEffect(() => {
    const beforePrint = () => autoScalePages()
    const afterPrint = () => {
      ;[page1Ref, page2Ref].forEach(ref => {
        const content = ref.current?.querySelector('.rs-page-content') as HTMLElement | null
        if (content) { content.style.transform = ''; content.style.width = '' }
      })
    }
    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)
    return () => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
    }
  }, [autoScalePages])

  // Send ping email
  const sendPing = async () => {
    setEmailStatus('sending')
    setEmailError('')
    try {
      const res = await fetch('/api/route-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      })
      const data = await res.json()
      if (data.error) {
        setEmailStatus('error')
        setEmailError(data.error)
        return
      }
      setEmailStatus('waiting')
      // Start polling for reply every 15 seconds
      startPolling()
    } catch {
      setEmailStatus('error')
      setEmailError('Network error')
    }
  }

  // Poll for reply
  const checkReply = async () => {
    setEmailStatus('checking')
    try {
      const res = await fetch('/api/route-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      })
      const data = await res.json()

      if (data.error) {
        setEmailStatus('error')
        setEmailError(data.error)
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        return
      }

      if (data.found) {
        // Stop polling
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        // Fetch the stored CSV data
        const statusRes = await fetch('/api/route-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status' }),
        })
        const statusData = await statusRes.json()
        if (statusData.data?.csv_data) {
          setBlocks(prev => {
            const merged = parseAndMergeCSV(statusData.data.csv_data, prev, tractorNumsRef.current)
            saveToStorage(merged, topRightRef.current, 'synced')
            return merged
          })
          setSyncStatus('synced')
          setEmailStatus('idle')
          toast('Route data received and synced!')
        }
      } else {
        // Not found yet, keep waiting
        setEmailStatus('waiting')
        if (data.message) toast(data.message, 'error')
      }
    } catch {
      setEmailStatus('waiting') // Keep polling on network errors
    }
  }

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(checkReply, 15000) // Check every 15 seconds
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // Check for existing import data on page load
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res = await fetch('/api/route-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status' }),
        })
        const data = await res.json()
        if (data.data?.status === 'sent' && !data.data?.csv_data) {
          setEmailStatus('waiting')
          startPolling()
        } else if (data.data?.csv_data && syncStatus === 'idle') {
          setBlocks(prev => {
            const merged = parseAndMergeCSV(data.data.csv_data, prev, tractorNumsRef.current)
            saveToStorage(merged, topRightRef.current, 'synced')
            return merged
          })
          setSyncStatus('synced')
        }
      } catch {
        // API not configured yet, that's fine
      }
    }
    if (!loading) checkExisting()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const renderDoorBlock = (block: DoorBlock, doorIdx: number) => (
    <div key={doorIdx} className="rs-door-block">
      <div className="rs-door-rows">
        <div className="rs-door-label" style={{ gridRow: `1 / ${block.rows.length + 1}` }}>
          <div className="rs-door-name">{block.doorName}</div>
          <input value={block.loaderName} onChange={e => updateBlock(doorIdx, 'loaderName', e.target.value)}
            placeholder="Name" className="rs-input rs-input-center rs-loader-input" />
        </div>
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
                <div className="rs-truck-value">{row.truckNumber.toUpperCase().startsWith('TR') ? row.truckNumber : `TR${row.truckNumber}`}</div>
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

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      {/* Screen-only toolbar */}
      <div className="no-print mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h1 className="text-xl font-bold">📄 Routes at the Door</h1>
            <p className="text-xs text-muted">Truck # pulled from Print Room • Sync route data via email or CSV upload</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDownloadPDF} disabled={downloading}
              className="bg-green-700 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 flex-shrink-0 disabled:opacity-50">
              {downloading ? '⏳ Generating...' : '⬇️ Download PDF'}
            </button>
            <button onClick={() => window.print()}
              className="bg-amber-500 text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-amber-400 flex items-center gap-2 flex-shrink-0">
              🖨️ Print
            </button>
          </div>
        </div>

        {/* Sync status bar */}
        <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {syncStatus === 'idle' && emailStatus === 'idle' && (
              <>
                <span className="text-yellow-500 text-lg">📡</span>
                <span className="text-sm text-gray-400">No route data — send request or upload CSV</span>
              </>
            )}
            {emailStatus === 'sending' && (
              <>
                <span className="text-blue-500 text-lg animate-spin">📨</span>
                <span className="text-sm text-blue-400">Sending request to fdlwhsestatus...</span>
              </>
            )}
            {emailStatus === 'waiting' && syncStatus !== 'synced' && (
              <>
                <span className="text-amber-500 text-lg animate-pulse">⏳</span>
                <span className="text-sm text-amber-400">Waiting for reply... checking every 15s</span>
                <button onClick={checkReply} className="text-xs text-blue-400 hover:text-blue-300 underline ml-2">Check Now</button>
              </>
            )}
            {emailStatus === 'checking' && (
              <>
                <span className="text-blue-500 text-lg animate-spin">🔍</span>
                <span className="text-sm text-blue-400">Checking inbox...</span>
              </>
            )}
            {emailStatus === 'error' && (
              <>
                <span className="text-red-500 text-lg">❌</span>
                <span className="text-sm text-red-400">{emailError || 'Email error'}</span>
              </>
            )}
            {syncStatus === 'synced' && (
              <>
                <span className="text-green-500 text-lg">✅</span>
                <span className="text-sm text-green-400">Route data synced — {csvData.length} routes loaded</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={sendPing}
              disabled={emailStatus === 'sending' || emailStatus === 'waiting'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
              📨 Request Data
            </button>
            <button onClick={clearData}
              className="bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-900 flex items-center gap-1.5">
              🗑️ Clear
            </button>
            <label className="cursor-pointer bg-[#333] text-gray-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#444] flex items-center gap-1.5">
              📎 CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* ===== PRINTABLE SHEET ===== */}
      <div className="route-sheet">

        {/* PAGE 1: first 3 doors */}
        <div className="rs-page" ref={page1Ref}>
          <div className="rs-page-content">
            <div className="rs-header">
              <div className="rs-date">{today}</div>
              <div className="rs-center">
                <div className="rs-subtitle">FOND DU LAC, WI // BADGER LIQUOR</div>
                <div className="rs-title">ROUTES AT THE DOOR</div>
              </div>
              <div className="rs-topright">
                <input value={topRight} onChange={e => setTopRight(e.target.value)}
                  placeholder="Names..."
                  className="rs-input rs-input-right" />
              </div>
            </div>
            <div className="rs-col-headers">
              <div className="rs-col rs-col-door">DOOR</div>
              <div className="rs-col rs-col-route">ROUTE</div>
              <div className="rs-col rs-col-sig">SIGNATURE</div>
              <div className="rs-col rs-col-truck">TRUCK #</div>
              <div className="rs-col rs-col-qty">CASE QTY</div>
              <div className="rs-col rs-col-notes">NOTES</div>
            </div>
            {blocks.slice(0, 3).map((block, doorIdx) => renderDoorBlock(block, doorIdx))}
          </div>
        </div>

        {/* PAGE 2: last 3 doors */}
        <div className="rs-page rs-page-2" ref={page2Ref}>
          <div className="rs-page-content">
            <div className="rs-header">
              <div className="rs-date">{today}</div>
              <div className="rs-center">
                <div className="rs-subtitle">FOND DU LAC, WI // BADGER LIQUOR</div>
                <div className="rs-title">ROUTES AT THE DOOR</div>
              </div>
              <div className="rs-topright">
                <div className="rs-static-text">{topRight}</div>
              </div>
            </div>
            <div className="rs-col-headers">
              <div className="rs-col rs-col-door">DOOR</div>
              <div className="rs-col rs-col-route">ROUTE</div>
              <div className="rs-col rs-col-sig">SIGNATURE</div>
              <div className="rs-col rs-col-truck">TRUCK #</div>
              <div className="rs-col rs-col-qty">CASE QTY</div>
              <div className="rs-col rs-col-notes">NOTES</div>
            </div>
            {blocks.slice(3).map((block, doorIdx) => renderDoorBlock(block, doorIdx + 3))}
          </div>
        </div>

      </div>
    </div>
  )
}
