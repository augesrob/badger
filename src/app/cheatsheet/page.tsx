'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PrintroomEntry } from '@/lib/types'
import { useToast } from '@/components/Toast'
import RequirePage from '@/components/RequirePage'

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

// ── Draw one cheat sheet page (2 batches side by side) into jsPDF ──
function drawCheatPage(
  pdf: InstanceType<typeof import('jspdf').jsPDF>,
  batch1: BatchData,
  batch2: BatchData,
  namesDate: string,
  leftNote: string,
  bottomNote: string,
  pageNum: number,
  totalPages: number,
) {
  const PW = 215.9  // letter portrait width mm
  const PH = 279.4  // letter portrait height mm
  const ML = 6
  const MR = 6
  const MT = 6
  const tableW = PW - ML - MR

  // Header
  const HDR_H = 10
  pdf.setFillColor(240, 240, 240)
  pdf.rect(ML, MT, tableW, HDR_H, 'F')
  pdf.setDrawColor(0)
  pdf.setLineWidth(0.5)
  pdf.rect(ML, MT, tableW, HDR_H, 'S')

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(0)
  if (leftNote) pdf.text(leftNote, ML + 2, MT + HDR_H / 2, { baseline: 'middle' })
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(namesDate || 'BADGER LIQUOR — CHEAT SHEET', PW / 2, MT + HDR_H / 2, { align: 'center', baseline: 'middle' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(150)
  pdf.text(`PAGE ${pageNum} OF ${totalPages}`, PW - MR - 1, MT + HDR_H / 2, { align: 'right', baseline: 'middle' })
  pdf.setTextColor(0)

  const y = MT + HDR_H

  // Bottom note area height
  const BTM_H = bottomNote ? 10 : 0
  const availH = PH - y - MT - BTM_H

  // Each batch gets half the width minus a divider
  const DIVIDER = 2
  const batchW = (tableW - DIVIDER) / 2

  const batches = [batch1, batch2]

  batches.forEach((batch, bi) => {
    const bx = ML + bi * (batchW + DIVIDER)

    // Batch title
    const BTITLE_H = 7
    pdf.setFillColor(30, 30, 30)
    pdf.rect(bx, y, batchW, BTITLE_H, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(255)
    pdf.text(`BATCH ${batch.batchNum}`, bx + batchW / 2, y + BTITLE_H / 2, { align: 'center', baseline: 'middle' })
    pdf.setTextColor(0)

    const contentY = y + BTITLE_H
    const contentH = availH - BTITLE_H

    // Door column header row
    const DOOR_HDR_H = 5
    const doorW = batchW / DOOR_ORDER.length

    DOOR_ORDER.forEach((door, di) => {
      const dx = bx + di * doorW
      pdf.setFillColor(200, 200, 200)
      pdf.rect(dx, contentY, doorW, DOOR_HDR_H, 'F')
      pdf.setDrawColor(0)
      pdf.setLineWidth(0.3)
      pdf.rect(dx, contentY, doorW, DOOR_HDR_H, 'S')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.setTextColor(0)
      pdf.text(door, dx + doorW / 2, contentY + DOOR_HDR_H / 2, { align: 'center', baseline: 'middle' })
    })

    const entryAreaY = contentY + DOOR_HDR_H
    const entryAreaH = contentH - DOOR_HDR_H

    // Calculate max entries across all doors for this batch
    const maxEntries = Math.max(...DOOR_ORDER.map(d => (batch.doors[d] || []).length))
    const entryH = Math.min(18, entryAreaH / Math.max(maxEntries, 1))
    const routeFontSize = Math.max(5, Math.min(8, entryH * 0.45))
    const truckFontSize = Math.max(4.5, Math.min(7, entryH * 0.38))
    const notesFontSize = Math.max(4, Math.min(6, entryH * 0.3))

    DOOR_ORDER.forEach((door, di) => {
      const dx = bx + di * doorW
      const entries = batch.doors[door] || [emptyEntry()]

      entries.forEach((ent, ei) => {
        const ey = entryAreaY + ei * entryH
        if (ey + entryH > entryAreaY + entryAreaH) return // clip overflow

        // Row bg
        pdf.setFillColor(ei % 2 === 0 ? 255 : 248, ei % 2 === 0 ? 255 : 248, ei % 2 === 0 ? 255 : 248)
        pdf.rect(dx, ey, doorW, entryH, 'F')
        pdf.setDrawColor(180)
        pdf.setLineWidth(0.1)
        pdf.rect(dx, ey, doorW, entryH, 'S')

        const cx = dx + 1
        const maxW = doorW - 2

        if (ent.route) {
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(routeFontSize)
          pdf.setTextColor(0)
          pdf.text(ent.route, cx + maxW / 2, ey + entryH * 0.28, { align: 'center', baseline: 'middle', maxWidth: maxW })
        }
        if (ent.truck) {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(truckFontSize)
          pdf.setTextColor(60)
          pdf.text(ent.truck.toUpperCase().startsWith('TR') ? ent.truck : `TR${ent.truck}`,
            cx + maxW / 2, ey + entryH * 0.58, { align: 'center', baseline: 'middle', maxWidth: maxW })
        }
        if (ent.notes) {
          pdf.setFont('helvetica', 'italic')
          pdf.setFontSize(notesFontSize)
          pdf.setTextColor(80)
          pdf.text(ent.notes, cx + maxW / 2, ey + entryH * 0.85, { align: 'center', baseline: 'middle', maxWidth: maxW })
        }
        pdf.setTextColor(0)
      })

      // Outer door column border
      pdf.setDrawColor(0)
      pdf.setLineWidth(0.3)
      pdf.rect(dx, entryAreaY, doorW, entryAreaH, 'S')
    })

    // Batch outer border
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.6)
    pdf.rect(bx, y, batchW, availH, 'S')
  })

  // Center divider
  pdf.setFillColor(0, 0, 0)
  pdf.rect(ML + batchW, y, DIVIDER, availH, 'F')

  // Bottom note
  if (bottomNote) {
    const by = PH - MT - BTM_H
    pdf.setFillColor(250, 250, 240)
    pdf.rect(ML, by, tableW, BTM_H, 'F')
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.4)
    pdf.rect(ML, by, tableW, BTM_H, 'S')
    pdf.setFont('helvetica', 'bolditalic')
    pdf.setFontSize(8)
    pdf.setTextColor(0)
    pdf.text(bottomNote, ML + 3, by + BTM_H / 2, { baseline: 'middle', maxWidth: tableW - 6 })
  }

  // Page outer border
  pdf.setDrawColor(0)
  pdf.setLineWidth(0.8)
  pdf.rect(ML, MT, tableW, PH - MT * 2, 'S')
}

async function generateCheatPDF(
  batches: BatchData[],
  namesDate: string,
  leftNote: string,
  bottomNote: string,
  download: boolean,
) {
  const { default: jsPDF } = await import('jspdf')

  const isBatchEmpty = (b: BatchData) =>
    DOOR_ORDER.every(d => (b.doors[d] || []).every(e => e.route === '' && e.truck === '' && e.notes === ''))

  const hasPage2 = !isBatchEmpty(batches[2]) || !isBatchEmpty(batches[3])
  const totalPages = hasPage2 ? 2 : 1

  // Portrait letter
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  drawCheatPage(pdf, batches[0], batches[1], namesDate, leftNote, bottomNote, 1, totalPages)

  if (hasPage2) {
    pdf.addPage('letter', 'portrait')
    drawCheatPage(pdf, batches[2], batches[3], namesDate, leftNote, bottomNote, 2, totalPages)
  }

  if (download) {
    const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    pdf.save(`cheat-sheet-${date}.pdf`)
  } else {
    const blob = pdf.output('blob')
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) win.onload = () => { win.focus(); win.print() }
  }
}

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
    <RequirePage pageKey="cheatsheet">
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
            <button onClick={() => generateCheatPDF(batches, namesDate, leftNote, bottomNote, true)}
              className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-bold">⬇️ Download PDF</button>
            <button onClick={() => generateCheatPDF(batches, namesDate, leftNote, bottomNote, false)}
              className="bg-amber-500 text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-amber-400">🖨️ Print</button>
          </div>
        </div>
      </div>

      {/* Helper: is a batch empty (all doors have only placeholder/blank entries)? */}
      {(() => {
        const isBatchEmpty = (bi: number) => {
          const b = batches[bi]
          return DOOR_ORDER.every(door =>
            (b.doors[door] || []).every(e => e.route === '' && e.truck === '' && e.notes === '')
          )
        }
        const page2Empty = isBatchEmpty(2) && isBatchEmpty(3)

        return (
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
            <div className={`cs2-page cs2-page-2${page2Empty ? ' cs2-page-hidden' : ''}`} ref={page2Ref}>
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
        )
      })()}
    </div>
    </RequirePage>
  )
}
