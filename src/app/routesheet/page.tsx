'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PrintroomEntry } from '@/lib/types'

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

export default function RouteSheet() {
  const [blocks, setBlocks] = useState<DoorBlock[]>([])
  const [topRight, setTopRight] = useState('')
  const [loading, setLoading] = useState(true)

  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

  const loadData = useCallback(async () => {
    const [doorsRes, entriesRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('printroom_entries').select('*').order('batch_number').order('row_order'),
    ])

    const d = doorsRes.data || []
    const grouped: Record<number, PrintroomEntry[]> = {}
    ;(entriesRes.data || []).forEach(e => {
      if (!grouped[e.loading_door_id]) grouped[e.loading_door_id] = []
      grouped[e.loading_door_id].push(e)
    })

    const newBlocks: DoorBlock[] = d.map(door => {
      const doorEntries = grouped[door.id] || []
      const rows: RowData[] = doorEntries
        .filter(e => !e.is_end_marker)
        .map(() => ({
          route: '',
          signature: '',
          truckNumber: '',
          caseQty: '',
          notes: '',
        }))
      while (rows.length < 4) {
        rows.push({ route: '', signature: '', truckNumber: '', caseQty: '', notes: '' })
      }
      return { doorName: door.door_name, loaderName: '', rows }
    })

    setBlocks(newBlocks)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

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
      <div className="no-print mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">📄 Routes at the Door</h1>
          <p className="text-xs text-muted">Fill in loader names &amp; notes, then print or save as PDF</p>
        </div>
        <button onClick={() => window.print()}
          className="bg-amber-500 text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-amber-400 flex items-center gap-2 flex-shrink-0">
          🖨️ Print / Download PDF
        </button>
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

        {/* Column headers - single row */}
        <div className="rs-col-headers">
          <div className="rs-col rs-col-door">DOOR</div>
          <div className="rs-col rs-col-route">ROUTE</div>
          <div className="rs-col rs-col-sig">SIGNATURE</div>
          <div className="rs-col rs-col-truck">TRUCK #</div>
          <div className="rs-col rs-col-qty">CASE QTY</div>
          <div className="rs-col rs-col-notes">NOTES</div>
        </div>

        {/* Door blocks */}
        {blocks.map((block, doorIdx) => (
          <div key={doorIdx} className="rs-door-block">
            <div className="rs-door-rows">
              {/* Door label cell spanning all rows */}
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
                    <input value={row.truckNumber} onChange={e => updateRow(doorIdx, rowIdx, 'truckNumber', e.target.value)}
                      className="rs-input rs-input-center rs-input-bold" />
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
        ))}

        {/* Footer */}
        <div className="rs-footer">
          <div>SHIRAZ REPORTS DESIGNED BY DMW&H</div>
          <div>PAGE 1</div>
        </div>
      </div>
    </div>
  )
}
