'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PrintroomEntry } from '@/lib/types'
import { useToast } from '@/components/Toast'

const STORAGE_KEY = 'badger-cheatsheet-v1'

// Doors displayed left→right: 15B, 15A, 14B, 14A, 13B, 13A
const DOOR_ORDER = ['15B', '15A', '14B', '14A', '13B', '13A']

interface CheatCell {
  route: string
  notes: string
}

interface BatchGrid {
  batchNum: number
  cells: Record<string, CheatCell[]>
}

interface CheatSheetState {
  batches: BatchGrid[]
  namesDate: string
  pageNote: string
  customNotes: string
}

function emptyCell(): CheatCell { return { route: '', notes: '' } }

function saveStorage(state: CheatSheetState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { }
}
function loadStorage(): CheatSheetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function buildEmptyBatch(num: number): BatchGrid {
  const cells: Record<string, CheatCell[]> = {}
  DOOR_ORDER.forEach(d => {
    cells[d] = Array.from({ length: 8 }, emptyCell)
  })
  return { batchNum: num, cells }
}

export default function CheatSheet() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<BatchGrid[]>([
    buildEmptyBatch(1), buildEmptyBatch(2), buildEmptyBatch(3), buildEmptyBatch(4),
  ])
  const [namesDate, setNamesDate] = useState('')
  const [pageNote, setPageNote] = useState('')
  const [customNotes, setCustomNotes] = useState('')
  const page1Ref = useRef<HTMLDivElement>(null)
  const page2Ref = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    const [, entriesRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('printroom_entries')
        .select('*, loading_doors(door_name)')
        .order('batch_number').order('row_order'),
    ])

    const allEntries = (entriesRes.data || []) as (PrintroomEntry & { loading_doors: { door_name: string } | null })[]

    // Group by batch → door → rows
    const grouped: Record<number, Record<string, CheatCell[]>> = {}
    allEntries.forEach(e => {
      if (e.is_end_marker || !e.truck_number || e.truck_number === 'end') return
      const doorName = e.loading_doors?.door_name
      if (!doorName || !DOOR_ORDER.includes(doorName)) return
      const bNum = e.batch_number || 1
      if (!grouped[bNum]) grouped[bNum] = {}
      if (!grouped[bNum][doorName]) grouped[bNum][doorName] = []
      grouped[bNum][doorName].push({ route: e.route_info || '', notes: e.notes || '' })
    })

    // Build fresh batches from printroom
    const freshBatches: BatchGrid[] = [1, 2, 3, 4].map(bNum => {
      const cells: Record<string, CheatCell[]> = {}
      DOOR_ORDER.forEach(door => {
        const rows = [...(grouped[bNum]?.[door] || [])]
        while (rows.length < 8) rows.push(emptyCell())
        cells[door] = rows
      })
      return { batchNum: bNum, cells }
    })

    // Restore saved overrides
    const saved = loadStorage()
    if (saved?.batches) {
      const merged = freshBatches.map((freshBatch, idx) => {
        const savedBatch = saved.batches[idx]
        if (!savedBatch) return freshBatch
        const mergedCells: Record<string, CheatCell[]> = {}
        DOOR_ORDER.forEach(door => {
          const freshRows = freshBatch.cells[door] || []
          const savedRows = savedBatch.cells?.[door] || []
          const result = freshRows.map((fr, ri) => {
            const sr = savedRows[ri]
            if (!sr) return fr
            return {
              route: sr.route !== '' ? sr.route : fr.route,
              notes: sr.notes !== '' ? sr.notes : fr.notes,
            }
          })
          for (let i = result.length; i < savedRows.length; i++) result.push(savedRows[i])
          while (result.length < 8) result.push(emptyCell())
          mergedCells[door] = result
        })
        return { ...freshBatch, cells: mergedCells }
      })
      setBatches(merged)
      setNamesDate(saved.namesDate || '')
      setPageNote(saved.pageNote || '')
      setCustomNotes(saved.customNotes || '')
    } else {
      setBatches(freshBatches)
    }

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Auto-save
  useEffect(() => {
    if (!loading) saveStorage({ batches, namesDate, pageNote, customNotes })
  }, [batches, namesDate, pageNote, customNotes, loading])

  // Print scaling: only at print time
  const scalePage = (ref: React.RefObject<HTMLDivElement | null>) => {
    const el = ref.current
    if (!el) return
    const content = el.querySelector('.cs-page-inner') as HTMLElement
    if (!content) return
    content.style.transform = 'none'
    content.style.width = ''
    const PAGE_W = 1008
    const PAGE_H = 768
    content.style.width = `${PAGE_W}px`
    const nat = content.scrollHeight
    if (nat > 0) {
      const scale = Math.min((PAGE_H * 0.97) / nat, 1.2)
      content.style.transform = `scale(${scale})`
      content.style.transformOrigin = 'top left'
      content.style.width = `${PAGE_W / scale}px`
    }
  }

  useEffect(() => {
    const before = () => { scalePage(page1Ref); scalePage(page2Ref) }
    const after = () => {
      [page1Ref, page2Ref].forEach(r => {
        const c = r.current?.querySelector('.cs-page-inner') as HTMLElement | null
        if (c) { c.style.transform = ''; c.style.width = '' }
      })
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after) }
  }, [])

  const updateCell = (batchIdx: number, door: string, rowIdx: number, field: keyof CheatCell, value: string) => {
    setBatches(prev => prev.map((b, bi) => {
      if (bi !== batchIdx) return b
      const newCells = { ...b.cells }
      const rows = [...(newCells[door] || [])]
      while (rows.length <= rowIdx) rows.push(emptyCell())
      rows[rowIdx] = { ...rows[rowIdx], [field]: value }
      newCells[door] = rows
      return { ...b, cells: newCells }
    }))
  }

  const addRow = (batchIdx: number) => {
    setBatches(prev => prev.map((b, bi) => {
      if (bi !== batchIdx) return b
      const newCells: Record<string, CheatCell[]> = {}
      DOOR_ORDER.forEach(door => {
        newCells[door] = [...(b.cells[door] || []), emptyCell()]
      })
      return { ...b, cells: newCells }
    }))
  }

  const removeRow = (batchIdx: number, rowIdx: number) => {
    setBatches(prev => prev.map((b, bi) => {
      if (bi !== batchIdx) return b
      const maxRows = Math.max(...DOOR_ORDER.map(d => (b.cells[d] || []).length))
      if (maxRows <= 1) return b
      const newCells: Record<string, CheatCell[]> = {}
      DOOR_ORDER.forEach(door => {
        const rows = [...(b.cells[door] || [])]
        rows.splice(rowIdx, 1)
        newCells[door] = rows
      })
      return { ...b, cells: newCells }
    }))
  }

  const clearAll = () => {
    if (!confirm('Clear all cheat sheet data?')) return
    localStorage.removeItem(STORAGE_KEY)
    setBatches([buildEmptyBatch(1), buildEmptyBatch(2), buildEmptyBatch(3), buildEmptyBatch(4)])
    setNamesDate(''); setPageNote(''); setCustomNotes('')
    toast('Cheat sheet cleared')
  }

  const renderBatch = (batchIdx: number) => {
    const batch = batches[batchIdx]
    const maxRows = Math.max(...DOOR_ORDER.map(d => (batch.cells[d] || []).length))

    return (
      <div className="cs-batch">
        <div className="cs-batch-title">Batch {batch.batchNum}</div>
        <div className="cs-grid">
          {/* Column headers */}
          {DOOR_ORDER.map(door => (
            <div key={door} className="cs-col-header">{door}</div>
          ))}
          {/* Rows */}
          {Array.from({ length: maxRows }, (_, rowIdx) => (
            DOOR_ORDER.map(door => {
              const cell = (batch.cells[door] || [])[rowIdx] || emptyCell()
              return (
                <div key={`${door}-${rowIdx}`} className="cs-cell">
                  <input
                    value={cell.route}
                    onChange={e => updateCell(batchIdx, door, rowIdx, 'route', e.target.value)}
                    className="cs-input cs-route"
                  />
                  <input
                    value={cell.notes}
                    onChange={e => updateCell(batchIdx, door, rowIdx, 'notes', e.target.value)}
                    className="cs-input cs-notes"
                  />
                  {door === DOOR_ORDER[DOOR_ORDER.length - 1] && (
                    <button onClick={() => removeRow(batchIdx, rowIdx)} className="no-print cs-remove-row" tabIndex={-1}>×</button>
                  )}
                </div>
              )
            })
          ))}
        </div>
        <button onClick={() => addRow(batchIdx)} className="no-print cs-add-row">+ Add Row</button>
      </div>
    )
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      {/* Screen toolbar */}
      <div className="no-print mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div>
            <h1 className="text-xl font-bold">📋 Cheat Sheet</h1>
            <p className="text-xs text-muted">Route grid per batch &amp; door • auto-saves • type to override</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={loadData} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500">🔄 Sync</button>
            <button onClick={clearAll} className="bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-900">🗑️ Clear</button>
            <button onClick={() => window.print()} className="bg-amber-500 text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-amber-400">🖨️ Print</button>
          </div>
        </div>
      </div>

      {/* ===== PRINTABLE SHEET ===== */}
      <div className="cs-sheet">

        {/* PAGE 1: Batch 1 + 2 */}
        <div className="cs-page" ref={page1Ref}>
          <div className="cs-page-inner">
            <div className="cs-header">
              <div className="cs-header-left">
                <input value={pageNote} onChange={e => setPageNote(e.target.value)}
                  className="cs-input cs-header-input" placeholder="Notes..." />
              </div>
              <div className="cs-header-center">
                <input value={namesDate} onChange={e => setNamesDate(e.target.value)}
                  className="cs-input cs-names-input" placeholder="Names &amp; Date..." />
              </div>
              <div className="cs-header-right" />
            </div>
            <div className="cs-batches-row">
              {renderBatch(0)}
              <div className="cs-batch-divider" />
              {renderBatch(1)}
            </div>
            <div className="cs-bottom-note">
              <textarea value={customNotes} onChange={e => setCustomNotes(e.target.value)}
                className="cs-input cs-note-area" placeholder="* Large note area (e.g. Pallets to Caledonia)..." rows={3} />
            </div>
          </div>
        </div>

        {/* PAGE 2: Batch 3 + 4 */}
        <div className="cs-page cs-page-2" ref={page2Ref}>
          <div className="cs-page-inner">
            <div className="cs-header">
              <div className="cs-header-left"><div className="cs-static-text">{pageNote}</div></div>
              <div className="cs-header-center"><div className="cs-static-text cs-names-static">{namesDate}</div></div>
              <div className="cs-header-right" />
            </div>
            <div className="cs-batches-row">
              {renderBatch(2)}
              <div className="cs-batch-divider" />
              {renderBatch(3)}
            </div>
            <div className="cs-bottom-note">
              <div className="cs-static-text cs-note-static">{customNotes}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
