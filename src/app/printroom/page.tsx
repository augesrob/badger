'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { LoadingDoor, PrintroomEntry, StagingDoor, DOOR_STATUSES, doorStatusColor } from '@/lib/types'

export default function PrintRoom() {
  const toast = useToast()
  const [doors, setDoors] = useState<LoadingDoor[]>([])
  const [entries, setEntries] = useState<Record<number, PrintroomEntry[]>>({})
  const [preshiftLookup, setPreshiftLookup] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    // Load doors
    const { data: doorsData } = await supabase.from('loading_doors').select('*').order('sort_order')
    if (doorsData) setDoors(doorsData)

    // Load entries
    const { data: entriesData } = await supabase.from('printroom_entries').select('*').order('batch_number').order('row_order')
    if (entriesData) {
      const grouped: Record<number, PrintroomEntry[]> = {}
      entriesData.forEach((e: PrintroomEntry) => {
        if (!grouped[e.loading_door_id]) grouped[e.loading_door_id] = []
        grouped[e.loading_door_id].push(e)
      })
      setEntries(grouped)
    }

    // Build preshift lookup
    const { data: staging } = await supabase.from('staging_doors').select('*')
    if (staging) {
      const lookup: Record<string, string> = {}
      const labels = { 1: 'FL', 2: 'BL', 3: 'FR', 4: 'BR' } as Record<number, string>
      staging.forEach((sd: StagingDoor) => {
        for (let p = 1; p <= 4; p++) {
          const val = sd[`position${p}_truck` as keyof StagingDoor] as string
          if (val) lookup[val] = `Dr${sd.door_number}-${labels[p]}`
        }
      })
      setPreshiftLookup(lookup)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    // Real-time subscription
    const channel = supabase.channel('printroom-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printroom_entries' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loading_doors' }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const saveField = useCallback(async (id: number, field: string, value: string | number) => {
    const { error } = await supabase.from('printroom_entries').update({ [field]: value || null }).eq('id', id)
    if (error) toast('Save failed', 'error')

    // If truck_number changed, sync to movement
    if (field === 'truck_number' && value) {
      const { data: existing } = await supabase.from('live_movement').select('id').eq('truck_number', value).single()
      if (!existing) {
        const { data: defaultStatus } = await supabase.from('status_values').select('id').eq('status_name', 'On Route').single()
        await supabase.from('live_movement').insert({
          truck_number: value,
          status_id: defaultStatus?.id || null,
          current_location: preshiftLookup[value as string] || null,
        })
      }
    }
  }, [toast, preshiftLookup])

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
  }

  const deleteEntry = async (id: number, truckNumber: string | null) => {
    if (!confirm('Delete this entry?')) return
    await supabase.from('printroom_entries').delete().eq('id', id)
    // Clean up movement if truck no longer in printroom
    if (truckNumber && truckNumber !== 'end') {
      const { count } = await supabase.from('printroom_entries').select('id', { count: 'exact' }).eq('truck_number', truckNumber)
      if (count === 0) await supabase.from('live_movement').delete().eq('truck_number', truckNumber)
    }
  }

  const setDoorStatus = async (doorId: number, status: string) => {
    await supabase.from('loading_doors').update({ door_status: status }).eq('id', doorId)
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">🖨️ Print Room</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">Enter trucks per loading door. Location auto-fills from PreShift. Trucks auto-appear in Live Movement.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
              {/* Door Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#111] border-b border-[#333]">
                <span className="text-lg font-extrabold text-amber-500">{door.door_name}</span>
                <select
                  value={door.door_status || 'Loading'}
                  onChange={e => setDoorStatus(door.id, e.target.value)}
                  className="status-select text-xs"
                  style={{ background: doorStatusColor(door.door_status || 'Loading') }}>
                  {DOOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="p-2">
                {/* Column headers */}
                <div className="grid grid-cols-[55px_35px_60px_35px_30px_1fr_24px] gap-1 px-1 text-[10px] text-gray-500 font-bold uppercase mb-1">
                  <span>Loc</span><span>Rt</span><span>Truck#</span><span>Pods</span><span>Pal</span><span>Notes</span><span></span>
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
                      <div key={entry.id} className="grid grid-cols-[55px_35px_60px_35px_30px_1fr_24px] gap-1 items-center px-1 py-[2px] border-b border-white/5 hover:bg-white/[0.02]">
                        <div className="text-[11px] text-blue-400 font-semibold truncate" title={preshiftLookup[entry.truck_number || ''] || ''}>
                          {preshiftLookup[entry.truck_number || ''] || '—'}
                        </div>
                        <input defaultValue={entry.route_info || ''} placeholder="Rt"
                          onBlur={e => saveField(entry.id, 'route_info', e.target.value)}
                          className="bg-[#222] border border-[#333] rounded px-1 py-1 text-xs w-full focus:border-amber-500 outline-none" />
                        <input defaultValue={entry.truck_number || ''} placeholder="Trk#"
                          onBlur={e => saveField(entry.id, 'truck_number', e.target.value)}
                          className="bg-[#222] border border-[#333] rounded px-1 py-1 text-xs w-full font-bold text-amber-500 focus:border-amber-500 outline-none" />
                        <input type="number" defaultValue={entry.pods || ''} placeholder="0" min={0}
                          onBlur={e => saveField(entry.id, 'pods', parseInt(e.target.value) || 0)}
                          className="bg-[#222] border border-[#333] rounded px-1 py-1 text-xs w-full focus:border-amber-500 outline-none" />
                        <input type="number" defaultValue={entry.pallets_trays || ''} placeholder="0" min={0}
                          onBlur={e => saveField(entry.id, 'pallets_trays', parseInt(e.target.value) || 0)}
                          className="bg-[#222] border border-[#333] rounded px-1 py-1 text-xs w-full focus:border-amber-500 outline-none" />
                        <input defaultValue={entry.notes || ''} placeholder="Notes..."
                          onBlur={e => saveField(entry.id, 'notes', e.target.value)}
                          className="bg-[#222] border border-[#333] rounded px-1 py-1 text-[11px] text-gray-400 w-full focus:border-amber-500 outline-none" />
                        <button onClick={() => deleteEntry(entry.id, entry.truck_number)}
                          className="text-red-500/40 hover:text-red-500 text-sm">✕</button>
                      </div>
                    ))}

                    <div className="flex gap-1 my-1">
                      <button onClick={() => addRow(door.id, Number(batchNum))}
                        className="flex-1 bg-[#222] border border-[#333] rounded py-1 text-xs text-gray-400 hover:text-white hover:border-amber-500 transition-colors">
                        + Row
                      </button>
                      <button onClick={() => addEndMarker(door.id, Number(batchNum))}
                        className="bg-red-900/30 border border-red-900 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/50 transition-colors">
                        🛑
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={() => addRow(door.id, maxBatch + 1)}
                  className="w-full bg-amber-500/10 border border-amber-500/30 rounded py-2 mt-2 text-xs text-amber-500 font-bold hover:bg-amber-500/20 transition-colors">
                  + Batch {maxBatch + 1}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
