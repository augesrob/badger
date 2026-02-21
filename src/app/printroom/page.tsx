'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { LoadingDoor, PrintroomEntry, StagingDoor } from '@/lib/types'
import { runAutomation, runPreshiftAutomation } from '@/lib/automation'

export default function PrintRoom() {
  const toast = useToast()
  const [doors, setDoors] = useState<LoadingDoor[]>([])
  const [entries, setEntries] = useState<Record<number, PrintroomEntry[]>>({})
  const [stagingDoors, setStagingDoors] = useState<StagingDoor[]>([])
  const [loading, setLoading] = useState(true)
  // Duplicate detection
  const [dupeWarning, setDupeWarning] = useState<{
    entryId: number
    truckNumber: string
    existingDoor: string
    existingBatch: number
    existingEntryId: number
    inputEl: HTMLInputElement | null
  } | null>(null)
  const [highlightIds, setHighlightIds] = useState<Set<number>>(new Set())

  const loadData = useCallback(async () => {
    const [doorsRes, entriesRes, stagingRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('printroom_entries').select('*').order('batch_number').order('row_order'),
      supabase.from('staging_doors').select('*').order('door_number').order('door_side'),
    ])

    if (doorsRes.data) setDoors(doorsRes.data)
    if (entriesRes.data) {
      const grouped: Record<number, PrintroomEntry[]> = {}
      entriesRes.data.forEach((e: PrintroomEntry) => {
        if (!grouped[e.loading_door_id]) grouped[e.loading_door_id] = []
        grouped[e.loading_door_id].push(e)
      })
      setEntries(grouped)
    }
    if (stagingRes.data) setStagingDoors(stagingRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const channel = supabase.channel('printroom-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printroom_entries' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loading_doors' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staging_doors' }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const saveField = useCallback(async (id: number, field: string, value: string | number, forceSave = false) => {
    // If truck_number is changing, get old value first for cleanup
    let oldTruckNumber: string | null = null
    if (field === 'truck_number') {
      const { data: oldEntry } = await supabase.from('printroom_entries').select('truck_number').eq('id', id).maybeSingle()
      oldTruckNumber = oldEntry?.truck_number || null

      // Check for duplicates (skip special values and empty)
      const truckStr = String(value).trim()
      if (truckStr && truckStr !== 'end' && !forceSave) {
        // Look through all entries for a matching truck number (excluding this entry)
        const { data: dupes } = await supabase
          .from('printroom_entries')
          .select('*, loading_doors(door_name)')
          .eq('truck_number', truckStr)
          .neq('id', id)
          .limit(1)

        if (dupes && dupes.length > 0) {
          const dupe = dupes[0]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const doorName = (dupe as any).loading_doors?.door_name || '?'
          setDupeWarning({
            entryId: id,
            truckNumber: truckStr,
            existingDoor: doorName,
            existingBatch: dupe.batch_number,
            existingEntryId: dupe.id,
            inputEl: document.activeElement as HTMLInputElement || null,
          })
          setHighlightIds(new Set([id, dupe.id]))
          return // Don't save yet
        }
      }
    }

    const { error } = await supabase.from('printroom_entries').update({ [field]: value || null }).eq('id', id)
    if (error) { toast('Save failed', 'error'); return }

    if (field === 'truck_number') {
      // Clean up old truck from movement if no longer in any printroom entry
      if (oldTruckNumber && oldTruckNumber !== 'end' && oldTruckNumber !== String(value)) {
        const { count } = await supabase.from('printroom_entries').select('id', { count: 'exact' }).eq('truck_number', oldTruckNumber)
        if (count === 0) {
          await supabase.from('live_movement').delete().eq('truck_number', oldTruckNumber)
        }
      }
      // Add new truck to movement with preshift location
      if (value && value !== 'end') {
        const { data: existing } = await supabase.from('live_movement').select('id').eq('truck_number', String(value)).maybeSingle()
        if (!existing) {
          // Check if this is a semi tractor (matches pattern like 170-1, or is in tractors table)
          const truckStr = String(value)
          const isSemi = /^\d+-\d+$/.test(truckStr)
          let isTractorNumber = false
          if (!isSemi) {
            const num = parseInt(truckStr)
            if (!isNaN(num)) {
              const { data: tractor } = await supabase.from('tractors').select('id').eq('truck_number', num).maybeSingle()
              if (tractor) isTractorNumber = true
            }
          }
          const defaultStatusName = (isSemi || isTractorNumber) ? 'Transfer' : 'On Route'
          const { data: defaultStatus } = await supabase.from('status_values').select('id').eq('status_name', defaultStatusName).maybeSingle()
          // Look up preshift location
          let preshiftLoc: string | null = null
          for (const sd of stagingDoors) {
            if (sd.in_front === String(value)) { preshiftLoc = sd.door_label; break }
            if (sd.in_back === String(value)) { preshiftLoc = sd.door_label; break }
          }
          await supabase.from('live_movement').insert({
            truck_number: String(value),
            status_id: defaultStatus?.id || null,
            current_location: preshiftLoc,
          })
        }

        // Run automation rules on this truck
        const { data: entry } = await supabase.from('printroom_entries').select('*').eq('id', id).maybeSingle()
        if (entry) {
          await runAutomation({
            truck_number: String(value),
            loading_door_id: entry.loading_door_id,
            is_end_marker: entry.is_end_marker || false,
            batch_number: entry.batch_number,
            row_order: entry.row_order,
          })
        }
        // Also run preshift rules (in case truck is already on preshift board)
        await runPreshiftAutomation()
      }
    }
  }, [toast, stagingDoors])

  const addRow = async (doorId: number, batch: number) => {
    const doorEntries = entries[doorId]?.filter(e => e.batch_number === batch) || []
    const nextOrder = doorEntries.length > 0 ? Math.max(...doorEntries.map(e => e.row_order)) + 1 : 1
    await supabase.from('printroom_entries').insert({
      loading_door_id: doorId, batch_number: batch, row_order: nextOrder,
    })
  }

  const addEndMarker = async (doorId: number, batch: number) => {
    const doorEntries = entries[doorId]?.filter(e => e.batch_number === batch) || []
    const nextOrder = doorEntries.length > 0 ? Math.max(...doorEntries.map(e => e.row_order)) + 1 : 1
    await supabase.from('printroom_entries').insert({
      loading_door_id: doorId, batch_number: batch, row_order: nextOrder,
      truck_number: 'end', is_end_marker: true,
    })
    // Run automation - this triggers "last END → Done for Night"
    await runAutomation({
      truck_number: 'end',
      loading_door_id: doorId,
      is_end_marker: true,
      batch_number: batch,
      row_order: nextOrder,
    })
  }

  const deleteEntry = async (id: number, truckNumber: string | null) => {
    if (!confirm('Delete this entry?')) return
    await supabase.from('printroom_entries').delete().eq('id', id)
    if (truckNumber && truckNumber !== 'end') {
      const { count } = await supabase.from('printroom_entries').select('id', { count: 'exact' }).eq('truck_number', truckNumber)
      if (count === 0) await supabase.from('live_movement').delete().eq('truck_number', truckNumber)
    }
  }

  const dismissDupe = (revert = true) => {
    if (revert && dupeWarning?.inputEl) {
      // Revert the input value
      dupeWarning.inputEl.value = ''
    }
    setDupeWarning(null)
    setHighlightIds(new Set())
  }

  const confirmDupe = async () => {
    if (!dupeWarning) return
    // Force save — skip duplicate check
    await saveField(dupeWarning.entryId, 'truck_number', dupeWarning.truckNumber, true)
    setDupeWarning(null)
    // Keep highlights for a moment then clear
    setTimeout(() => setHighlightIds(new Set()), 2000)
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">🖨️ Print Room</h1>
      <p className="text-sm text-gray-500 mb-4">Enter trucks per door. Trucks auto-appear in Live Movement.</p>

      <div className="flex gap-4 items-start">
        {/* LEFT: Loading Doors */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {doors.map(door => {
              const doorEntries = entries[door.id] || []
              const batches: Record<number, PrintroomEntry[]> = {}
              doorEntries.forEach(e => {
                if (!batches[e.batch_number]) batches[e.batch_number] = []
                batches[e.batch_number].push(e)
              })
              if (Object.keys(batches).length === 0) batches[1] = []
              const maxBatch = Math.max(...Object.keys(batches).map(Number), 0)

              return (
                <div key={door.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                  {/* Door Header - just the name, no status dropdown */}
                  <div className="px-3 py-2 bg-[#111] border-b border-[#333]">
                    <span className="text-lg font-extrabold text-amber-500">{door.door_name}</span>
                  </div>

                  <div className="p-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-[40px_70px_40px_40px_1fr_24px] gap-1 px-1 text-[10px] text-gray-500 font-bold uppercase mb-1">
                      <span>Rt</span><span>Truck#</span><span>Pods</span><span>Pallets</span><span>Notes</span><span></span>
                    </div>

                    {Object.entries(batches).map(([batchNum, batchEntries]) => (
                      <div key={batchNum}>
                        <div className="bg-[#111] px-2 py-1 text-xs font-bold text-amber-500 uppercase tracking-wider rounded my-1">
                          Batch {batchNum}
                        </div>

                        {batchEntries.map(entry => entry.is_end_marker ? (
                          <div key={entry.id} className="bg-red-900/20 border-l-[3px] border-red-500 px-3 py-1 my-1 rounded text-red-400 font-bold text-sm flex justify-between items-center">
                            🛑 END
                            <button onClick={() => deleteEntry(entry.id, entry.truck_number)} className="text-red-500 hover:text-red-300">✕</button>
                          </div>
                        ) : (
                          <div key={entry.id} className={`grid grid-cols-[40px_70px_40px_40px_1fr_24px] gap-1 items-center px-1 py-[3px] border-b border-white/5 hover:bg-white/[0.02] transition-colors ${highlightIds.has(entry.id) ? 'bg-red-500/20 ring-1 ring-red-500/50 rounded' : ''}`}>
                            <input defaultValue={entry.route_info || ''} placeholder="Rt"
                              onBlur={e => saveField(entry.id, 'route_info', e.target.value)}
                              className="bg-[#222] border border-[#333] rounded px-1 py-1.5 text-xs w-full focus:border-amber-500 outline-none text-center" />
                            <input defaultValue={entry.truck_number || ''} placeholder="Trk#"
                              onBlur={e => saveField(entry.id, 'truck_number', e.target.value)}
                              className="bg-[#222] border border-[#333] rounded px-1 py-1.5 text-sm w-full font-bold text-amber-500 focus:border-amber-500 outline-none text-center" />
                            <input defaultValue={entry.pods || ''} placeholder="0"
                              onBlur={e => saveField(entry.id, 'pods', parseInt(e.target.value) || 0)}
                              className="bg-[#222] border border-[#333] rounded px-1 py-1.5 text-xs w-full focus:border-amber-500 outline-none text-center" />
                            <input defaultValue={entry.pallets_trays || ''} placeholder="0"
                              onBlur={e => saveField(entry.id, 'pallets_trays', parseInt(e.target.value) || 0)}
                              className="bg-[#222] border border-[#333] rounded px-1 py-1.5 text-xs w-full focus:border-amber-500 outline-none text-center" />
                            <input defaultValue={entry.notes || ''} placeholder="Notes..."
                              onBlur={e => saveField(entry.id, 'notes', e.target.value)}
                              className="bg-[#222] border border-[#333] rounded px-1 py-1.5 text-xs text-gray-400 w-full focus:border-amber-500 outline-none" />
                            <button onClick={() => deleteEntry(entry.id, entry.truck_number)}
                              className="text-red-500/30 hover:text-red-500 text-sm">✕</button>
                          </div>
                        ))}

                        <div className="flex gap-1 my-1">
                          <button onClick={() => addRow(door.id, Number(batchNum))}
                            className="flex-1 bg-[#222] border border-[#333] rounded py-1.5 text-xs text-gray-400 hover:text-white hover:border-amber-500 transition-colors">
                            + Row
                          </button>
                          <button onClick={() => addEndMarker(door.id, Number(batchNum))}
                            className="bg-red-900/30 border border-red-900 rounded px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/50 transition-colors">
                            🛑
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Only show + New Batch if there are actual entries */}
                    {doorEntries.length > 0 && (
                      <button onClick={() => addRow(door.id, maxBatch + 1)}
                        className="w-full bg-amber-500/10 border border-amber-500/30 rounded py-2 mt-1 text-xs text-amber-500 font-bold hover:bg-amber-500/20 transition-colors">
                        + Batch {maxBatch + 1}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: PreShift Sidebar - just truck numbers, 28→18 */}
        <div className="hidden lg:block w-[200px] flex-shrink-0 sticky top-16">
          <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">📋 Door Placement</h3>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 gap-0 bg-[#111] border-b-2 border-amber-500">
              <div className="px-3 py-2 text-xs font-bold text-amber-500 uppercase">In Front</div>
              <div className="px-3 py-2 text-xs font-bold text-amber-500 uppercase border-l border-[#333]">In Back</div>
            </div>
            {[...stagingDoors].reverse().map(sd => (
              <div key={sd.id} className={`grid grid-cols-2 gap-0 border-b border-white/5 ${sd.door_side === 'A' ? 'bg-white/[0.02]' : ''}`}>
                <div className="px-2 py-0.5 text-center text-sm font-semibold text-green-400">{sd.in_front || ''}</div>
                <div className="px-2 py-0.5 text-center text-sm font-semibold text-blue-400 border-l border-[#333]">{sd.in_back || ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: PreShift below - just truck numbers */}
      <div className="lg:hidden mt-6">
        <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">📋 Door Placement</h3>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 gap-0 bg-[#111] border-b-2 border-amber-500">
            <div className="px-3 py-2 text-xs font-bold text-amber-500 uppercase">In Front</div>
            <div className="px-3 py-2 text-xs font-bold text-amber-500 uppercase border-l border-[#333]">In Back</div>
          </div>
          {[...stagingDoors].reverse().map(sd => (
            <div key={sd.id} className={`grid grid-cols-2 gap-0 border-b border-white/5 ${sd.door_side === 'A' ? 'bg-white/[0.02]' : ''}`}>
              <div className="px-2 py-0.5 text-center text-sm font-semibold text-green-400">{sd.in_front || ''}</div>
              <div className="px-2 py-0.5 text-center text-sm font-semibold text-blue-400 border-l border-[#333]">{sd.in_back || ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {dupeWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => dismissDupe()}>
          <div className="bg-[#1a1a1a] border border-red-500 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-bold text-red-400">Duplicate Truck</h3>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-300 text-center">
                Truck <span className="font-extrabold text-amber-500 text-lg">{dupeWarning.truckNumber}</span> already exists on
              </p>
              <p className="text-center mt-1">
                <span className="font-bold text-white text-lg">{dupeWarning.existingDoor}</span>
                <span className="text-gray-500 text-sm ml-1">Batch {dupeWarning.existingBatch}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => dismissDupe()}
                className="flex-1 bg-[#333] text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-[#444] transition-colors">
                Cancel
              </button>
              <button onClick={confirmDupe}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-red-500 transition-colors">
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
