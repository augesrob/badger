'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PrintroomEntry } from '@/lib/types'
import { useToast } from '@/components/Toast'

const STORAGE_KEY = 'badger-cheatsheet-v2'
const RS_STORAGE_KEY = 'badger-routesheet-v1'
const DOOR_ORDER = ['15B', '15A', '14B', '14A', '13B', '13A']

interface CheatEntry { route: string; truck: string; notes: string }
interface BatchData { batchNum: number; doors: Record<string, CheatEntry[]> }
interface SavedState { batches: BatchData[]; namesDate: string; leftNote: string; bottomNote: string }

// Mirror of routesheet storage types
interface RSRow { route: string; truckNumber: string; notes: string; signature: string; caseQty: string }
interface RSBlock { doorName: string; loaderName: string; rows: RSRow[] }
interface RSStorage { blocks: RSBlock[]; topRight: string; syncStatus: string }

function emptyEntry(): CheatEntry { return { route: '', truck: '', notes: '' } }
function buildEmptyBatch(n: number): BatchData {
  const doors: Record<string, CheatEntry[]> = {}
  DOOR_ORDER.forEach(d => { doors[d] = [emptyEntry()] })
  return { batchNum: n, doors }
}
function saveCS(s: SavedState) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { } }
function loadCS(): SavedState | null { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function loadRS(): RSStorage | null { try { const r = localStorage.getItem(RS_STORAGE_KEY); return r ? JSON.parse(r) : null } catch { return null } }

export default function CheatSheet() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<BatchData[]>([1,2,3,4].map(buildEmptyBatch))
  const [namesDate, setNamesDate] = useState('')
  const [leftNote, setLeftNote] = useState('')
  const [bottomNote, setBottomNote] = useState('')
  const page1Ref = useRef<HTMLDivElement>(null)
  const page2Ref = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    // ── Step 1: Get routesheet saved data (has synced route#, truck#, notes) ──
    const rsData = loadRS()
    const rsSynced = rsData?.syncStatus === 'synced'

    // Build per-door lookup: doorName → rows indexed by truckNumber (both raw and stripped)
    const rsRowsByDoor: Record<string, RSRow[]> = {}
    if (rsData?.blocks) {
      rsData.blocks.forEach(block => {
        if (DOOR_ORDER.includes(block.doorName)) {
          rsRowsByDoor[block.doorName] = block.rows.filter(r => r.truckNumber)
        }
      })
    }

    // ── Step 2: Get printroom entries for batch numbers and truck order ──
    const { data: entries } = await supabase
      .from('printroom_entries')
      .select('*, loading_doors(door_name)')
      .order('batch_number').order('row_order')

    const allEntries = (entries || []) as (PrintroomEntry & { loading_doors: { door_name: string } | null })[]

    // ── Step 3: Build batch→door→entries using printroom order, routesheet data for content ──
    const grouped: Record<number, Record<string, CheatEntry[]>> = {}
    const seenKey: Set<string> = new Set()

    allEntries.forEach(e => {
      if (e.is_end_marker || !e.truck_number || e.truck_number === 'end') return
      const door = e.loading_doors?.door_name
      if (!door || !DOOR_ORDER.includes(door)) return
      const bNum = e.batch_number || 1
      const truckRaw = e.truck_number
      const truckNorm = truckRaw.replace(/^TR/i, '').toLowerCase()

      // Skip gap/cpu in cheat sheet
      if (truckNorm === 'gap' || truckNorm === 'cpu') return

      // Deduplicate: same truck in same batch+door only once from printroom pass
      const dk = `${bNum}-${door}-${truckRaw}`
      if (seenKey.has(dk)) return
      seenKey.add(dk)

      if (!grouped[bNum]) grouped[bNum] = {}
      if (!grouped[bNum][door]) grouped[bNum][door] = []

      if (rsSynced && rsRowsByDoor[door]) {
        // Find all routesheet rows for this truck in this door (semis expand to multiple rows)
        const matchingRows = rsRowsByDoor[door].filter(r => {
          const rNorm = r.truckNumber.replace(/^TR/i, '').toLowerCase()
          return r.truckNumber === truckRaw || rNorm === truckNorm
        })
        if (matchingRows.length > 0) {
          matchingRows.forEach(r => {
            grouped[bNum][door].push({
              route: r.route || '',
              truck: r.truckNumber || truckRaw,
              notes: r.notes || '',
            })
          })
          return
        }
      }

      // Fallback: use raw printroom data (not yet synced)
      grouped[bNum][door].push({
        route: '',
        truck: truckRaw,
        notes: e.notes || '',
      })
    })

    // ── Step 4: Build fresh batches ──
    const freshBatches: BatchData[] = [1,2,3,4].map(bNum => {
      const doors: Record<string, CheatEntry[]> = {}
      DOOR_ORDER.forEach(door => {
        doors[door] = grouped[bNum]?.[door] || [emptyEntry()]
      })
      return { batchNum: bNum, doors }
    })

    // ── Step 5: Merge with saved cheat sheet user edits ──
    const saved = loadCS()
    if (saved?.batches) {
      const merged = freshBatches.map((fb, i) => {
        const sb = saved.batches[i]
        if (!sb) return fb
        const doors: Record<string, CheatEntry[]> = {}
        DOOR_ORDER.forEach(door => {
          const fr = fb.doors[door] || []
          const sr = sb.doors?.[door] || []
          const len = Math.max(fr.length, sr.length, 1)
          doors[door] = Array.from({ length: len }, (_, ri) => {
            const f = fr[ri] || emptyEntry()
            const s = sr[ri] || emptyEntry()
            // Fresh (routesheet) wins for route/truck; saved wins for notes (user may have added *Keg etc)
            return {
              route: f.route !== '' ? f.route : s.route,
              truck: f.truck !== '' ? f.truck : s.truck,
              notes: s.notes !== '' ? s.notes : f.notes,
            }
          })
        })
        return { ...fb, doors }
      })
      setBatches(merged)
      setNamesDate(saved.namesDate || '')
      setLeftNote(saved.leftNote || '')
      setBottomNote(saved.bottomNote || '')
      saveCS({ batches: merged, namesDate: saved.namesDate || '', leftNote: saved.leftNote || '', bottomNote: saved.bottomNote || '' })
    } else {
      setBatches(freshBatches)
      saveCS({ batches: freshBatches, namesDate: '', leftNote: '', bottomNote: '' })
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Save on every change
  useEffect(() => {
    if (!loading) saveCS({ batches, namesDate, leftNote, bottomNote })
  }, [batches, namesDate, leftNote, bottomNote, loading])

  // Print scaling
  const scalePage = (ref: React.RefObject<HTMLDivElement | null>) => {
    const el = ref.current
    if (!el) return
    const inner = el.querySelector('.cs2-inner') as HTMLElement
    if (!inner) return
    inner.style.transform = 'none'
    inner.style.width = ''
    const W = 1008, H = 768
    inner.style.width = `${W}px`
    const nat = inner.scrollHeight
    if (nat > 0) {
      const scale = Math.min((H * 0.97) / nat, 1.3)
      inner.style.transform = `scale(${scale})`
      inner.style.transformOrigin = 'top left'
      inner.style.width = `${W / scale}px`
    }
  }
  useEffect(() => {
    const before = () => { scalePage(page1Ref); scalePage(page2Ref) }
    const after = () => {
      [page1Ref, page2Ref].forEach(r => {
        const c = r.current?.querySelector('.cs2-inner') as HTMLElement | null
        if (c) { c.style.transform = ''; c.style.width = '' }
      })
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after) }
  }, [])

  // Mutations
  const updateEntry = (bi: number, door: string, ri: number, field: keyof CheatEntry, val: string) => {
    setBatches(prev => prev.map((b, i) => {
      if (i !== bi) return b
      const d = { ...b.doors }
      const rows = [...(d[door] || [])]
      while (rows.length <= ri) rows.push(emptyEntry())
      rows[ri] = { ...rows[ri], [field]: val }
      d[door] = rows
      return { ...b, doors: d }
    }))
  }
  const addEntry = (bi: number, door: string) => {
    setBatches(prev => prev.map((b, i) => {
      if (i !== bi) return b
      const d = { ...b.doors }
      d[door] = [...(d[door] || []), emptyEntry()]
      return { ...b, doors: d }
    }))
  }
  const removeEntry = (bi: number, door: string, ri: number) => {
    setBatches(prev => prev.map((b, i) => {
      if (i !== bi) return b
      const d = { ...b.doors }
      const rows = [...(d[door] || [])]
      if (rows.length <= 1) { d[door] = [emptyEntry()]; return { ...b, doors: d } }
      rows.splice(ri, 1)
      d[door] = rows
      return { ...b, doors: d }
    }))
  }
  const clearAll = () => {
    if (!confirm('Clear all cheat sheet data?')) return
    localStorage.removeItem(STORAGE_KEY)
    setBatches([1,2,3,4].map(buildEmptyBatch))
    setNamesDate(''); setLeftNote(''); setBottomNote('')
    toast('Cheat sheet cleared')
  }

  // Render door column
  const renderDoorCol = (bi: number, door: string) => {
    const entries = batches[bi].doors[door] || [emptyEntry()]
    return (
      <div key={door} className="cs2-door-col">
        <div className="cs2-door-header">{door}</div>
        <div className="cs2-door-entries">
          {entries.map((ent, ri) => (
            <div key={ri} className="cs2-entry">
              <div className="cs2-entry-row">
                <span className="cs2-label">Rt:</span>
                <input value={ent.route} onChange={e => updateEntry(bi, door, ri, 'route', e.target.value)}
                  className="cs2-input cs2-route-input" placeholder="—" />
                <button onClick={() => removeEntry(bi, door, ri)} className="no-print cs2-del">×</button>
              </div>
              <div className="cs2-entry-row">
                <span className="cs2-label">Tr:</span>
                <input value={ent.truck} onChange={e => updateEntry(bi, door, ri, 'truck', e.target.value)}
                  className="cs2-input cs2-truck-input" placeholder="—" />
              </div>
              <input value={ent.notes} onChange={e => updateEntry(bi, door, ri, 'notes', e.target.value)}
                className="cs2-input cs2-notes-input" placeholder="notes..." />
            </div>
          ))}
        </div>
        <button onClick={() => addEntry(bi, door)} className="no-print cs2-add-entry">+</button>
      </div>
    )
  }

  // Render batch
  const renderBatch = (bi: number) => (
    <div className="cs2-batch">
      <div className="cs2-batch-title">Batch {bi + 1}</div>
      <div className="cs2-doors-row">
        {DOOR_ORDER.map(door => renderDoorCol(bi, door))}
      </div>
    </div>
  )

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  const PageHeader = ({ editable }: { editable: boolean }) => (
    <div className="cs2-header">
      <div className="cs2-header-left">
        {editable
          ? <input value={leftNote} onChange={e => setLeftNote(e.target.value)} className="cs2-input cs2-header-input" placeholder="Notes..." />
          : <span className="cs2-static">{leftNote}</span>}
      </div>
      <div className="cs2-header-center">
        {editable
          ? <input value={namesDate} onChange={e => setNamesDate(e.target.value)} className="cs2-input cs2-names-input" placeholder="Names & Date..." />
          : <span className="cs2-names-static">{namesDate}</span>}
      </div>
      <div className="cs2-header-right" />
    </div>
  )

  const BottomNote = ({ editable }: { editable: boolean }) => (
    <div className="cs2-bottom">
      {editable
        ? <textarea value={bottomNote} onChange={e => setBottomNote(e.target.value)}
            className="cs2-input cs2-bottom-textarea" placeholder="* Large note area (e.g. Pallets to Caledonia)..." rows={2} />
        : <div className="cs2-bottom-static">{bottomNote}</div>}
    </div>
  )

  return (
    <div>
      <div className="no-print mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div>
            <h1 className="text-xl font-bold">📋 Cheat Sheet</h1>
            <p className="text-xs text-muted">Pulls route/truck/notes from Route Sheet • editable • auto-saves</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadData} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500">🔄 Sync from Route Sheet</button>
            <button onClick={clearAll} className="bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-900">🗑️ Clear</button>
            <button onClick={() => window.print()} className="bg-amber-500 text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-amber-400">🖨️ Print</button>
          </div>
        </div>
      </div>

      <div className="cs2-sheet">
        <div className="cs2-page" ref={page1Ref}>
          <div className="cs2-inner">
            <PageHeader editable={true} />
            <div className="cs2-two-batches">
              {renderBatch(0)}
              <div className="cs2-page-divider" />
              {renderBatch(1)}
            </div>
            <BottomNote editable={true} />
          </div>
        </div>
        <div className="cs2-page cs2-page-2" ref={page2Ref}>
          <div className="cs2-inner">
            <PageHeader editable={false} />
            <div className="cs2-two-batches">
              {renderBatch(2)}
              <div className="cs2-page-divider" />
              {renderBatch(3)}
            </div>
            <BottomNote editable={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
