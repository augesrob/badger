'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { LoadingDoor, PrintroomEntry, StagingDoor } from '@/lib/types'
import { runAutomation, runPreshiftAutomation } from '@/lib/automation'
import RequirePage from '@/components/RequirePage'

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

  // Route sync state
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    updated: { truck: string; door: string; route: string }[]
    missing: { truck: string; door: string }[]   // in printroom but not in routesheet
  } | null>(null)
  const [tractorNums, setTractorNums] = useState<Set<string>>(new Set())
  const [activeSemiSlots, setActiveSemiSlots] = useState<Set<string>>(new Set())
  const [activeSemiSlots, setActiveSemiSlots] = useState<string[]>([])

  const loadData = useCallback(async () => {
    const [doorsRes, entriesRes, stagingRes, tractorsRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('printroom_entries').select('*').order('batch_number').order('row_order'),
      supabase.from('staging_doors').select('*').order('door_number').order('door_side'),
      supabase.from('tractors').select('truck_number, trailer_1:trailer_list!tractors_trailer_1_id_fkey(trailer_number), trailer_2:trailer_list!tractors_trailer_2_id_fkey(trailer_number), trailer_3:trailer_list!tractors_trailer_3_id_fkey(trailer_number), trailer_4:trailer_list!tractors_trailer_4_id_fkey(trailer_number)'),
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
    if (tractorsRes.data) {
      const nums = new Set<string>(tractorsRes.data.map((t: { truck_number: number }) => String(t.truck_number)))
      // Build set of active semi slots: "170-1", "170-2" etc — only where trailer is assigned
      const slots = new Set<string>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tractorsRes.data.forEach((t: any) => {
        const base = String(t.truck_number)
        if (t.trailer_1) slots.add(`${base}-1`)
        if (t.trailer_2) slots.add(`${base}-2`)
        if (t.trailer_3) slots.add(`${base}-3`)
        if (t.trailer_4) slots.add(`${base}-4`)
      })
      setActiveSemiSlots(slots)
      setTractorNums(nums)
      // Build list of only in-use semi slots e.g. ["170-1","170-2"] — skip empty slots
      const slots: string[] = []
      tractorsRes.data.forEach((t: { truck_number: number; trailer_1?: { trailer_number: string } | null; trailer_2?: { trailer_number: string } | null; trailer_3?: { trailer_number: string } | null; trailer_4?: { trailer_number: string } | null }) => {
        if (t.trailer_1) slots.push(`${t.truck_number}-1`)
        if (t.trailer_2) slots.push(`${t.truck_number}-2`)
        if (t.trailer_3) slots.push(`${t.truck_number}-3`)
        if (t.trailer_4) slots.push(`${t.truck_number}-4`)
      })
      setActiveSemiSlots(slots)
    }
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

    // Sync notes/route_info changes into routesheet localStorage so routesheet stays current
    if ((field === 'notes' || field === 'route_info') && value !== undefined) {
      try {
        const raw = localStorage.getItem('badger-routesheet-v1')
        if (raw) {
          const rsData = JSON.parse(raw)
          if (rsData?.blocks) {
            // Get truck number for this entry
            const { data: entry } = await supabase.from('printroom_entries').select('truck_number').eq('id', id).maybeSingle()
            const truckNum = entry?.truck_number
            if (truckNum) {
              rsData.blocks = rsData.blocks.map((block: { rows: { truckNumber: string; notes: string; route: string }[] }) => ({
                ...block,
                rows: block.rows.map((row: { truckNumber: string; notes: string; route: string }) => {
                  const rowKey = row.truckNumber?.replace(/^TR/i, '')
                  if (rowKey === truckNum || row.truckNumber === truckNum) {
                    return field === 'notes'
                      ? { ...row, notes: String(value) }
                      : { ...row, route: String(value) }
                  }
                  return row
                })
              }))
              localStorage.setItem('badger-routesheet-v1', JSON.stringify(rsData))
            }
          }
        }
      } catch { /* localStorage sync is best-effort */ }
    }

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


  // ── ROUTE SYNC ──────────────────────────────────────────────────────────────
  const syncRoutesFromRouteSheet = async () => {
    setSyncing(true)
    setSyncResult(null)

    // Read routesheet localStorage
    let rsData: { blocks: { doorName: string; rows: { truckNumber: string; route: string; caseQty: string }[] }[] } | null = null
    try {
      const raw = localStorage.getItem('badger-routesheet-v1')
      if (raw) rsData = JSON.parse(raw)
    } catch { /* ignore */ }

    if (!rsData || !rsData.blocks || rsData.blocks.length === 0) {
      toast('No route data found — sync routes on the Route Sheet page first', 'error')
      setSyncing(false)
      return
    }

    // Build lookup: truckKey (no TR prefix, lowercase) → first route found
    // Collect ALL routes per truck so semis get their highest route number
    const routeMap: Record<string, string> = {}
    const allRoutesMap: Record<string, string[]> = {}
    rsData.blocks.forEach(block => {
      block.rows.forEach(row => {
        if (!row.truckNumber || !row.route || row.route === 'gap' || row.route === 'CPU') return
        const key = row.truckNumber.replace(/^TR/i, '').trim().toLowerCase()
        if (!allRoutesMap[key]) allRoutesMap[key] = []
        if (!allRoutesMap[key].includes(row.route)) allRoutesMap[key].push(row.route)
        if (!routeMap[key]) routeMap[key] = row.route
      })
    })

    // For semis: use highest route number as the Rt value
    Object.keys(allRoutesMap).forEach(key => {
      const routes = allRoutesMap[key]
      if (routes.length > 1) {
        const sorted = [...routes].sort((a, b) => parseInt(b) - parseInt(a))
        routeMap[key] = sorted[0]
      }
    })

    if (Object.keys(routeMap).length === 0) {
      toast('Route sheet has no route data yet — request data first', 'error')
      setSyncing(false)
      return
    }

    // Collect ALL non-end, non-empty printroom entries (including semis — fill their Rt too)
    const allEntries: (PrintroomEntry & { door_name: string })[] = []
    doors.forEach(door => {
      const doorEntries = entries[door.id] || []
      doorEntries.forEach(e => {
        if (e.is_end_marker || !e.truck_number || e.truck_number === 'end') return
        allEntries.push({ ...e, door_name: door.door_name })
      })
    })

    const updated: { truck: string; door: string; route: string }[] = []
    const missing: { truck: string; door: string }[] = []

    // Build all DB updates
    const updates: Promise<unknown>[] = []
    allEntries.forEach(e => {
      const key = (e.truck_number || '').replace(/^TR/i, '').toLowerCase()
      const route = routeMap[key]
      if (route) {
        updated.push({ truck: e.truck_number!, door: e.door_name, route })
        updates.push(
          Promise.resolve(supabase.from('printroom_entries').update({ route_info: route }).eq('id', e.id))
        )
      } else {
        missing.push({ truck: e.truck_number!, door: e.door_name })
      }
    })

    await Promise.all(updates)
    await loadData()

    setSyncResult({ updated, missing })
    if (updated.length > 0) toast(`Synced ${updated.length} route${updated.length !== 1 ? 's' : ''}`)
    else toast('No routes to sync — check route sheet data', 'error')
    setSyncing(false)
  }

  // Listen for routesheet sync completion — both cross-tab (storage) and same-tab (custom event)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'badger-routesheet-v1' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          if (data.syncStatus === 'synced') syncRoutesFromRouteSheet()
        } catch { /* ignore */ }
      }
    }
    const onCustom = () => syncRoutesFromRouteSheet()
    window.addEventListener('storage', onStorage)
    window.addEventListener('badger-routes-synced', onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('badger-routes-synced', onCustom)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, doors, tractorNums])
  // ────────────────────────────────────────────────────────────────────────────

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <RequirePage pageKey="printroom">
      <datalist id="semi-slots-list">
        {activeSemiSlots.map(slot => <option key={slot} value={slot} />)}
      </datalist>
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">🖨️ Print Room</h1>
          <p className="text-sm text-gray-500">Enter trucks per door. Trucks auto-appear in Live Movement.</p>
        </div>
        <button
          onClick={syncRoutesFromRouteSheet}
          disabled={syncing}
          title="Pull routes from Route Sheet data and fill the Rt column (ignores semis/tractors)"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex-shrink-0 ${
            syncing
              ? 'bg-[#222] text-gray-500 border-[#333] cursor-wait'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
          }`}>
          {syncing ? '⏳ Syncing...' : '🔄 Sync Routes'}
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* LEFT: Loading Doors */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {doors.map(door => {
              const doorEntries = (entries[door.id] || []).filter(e => {
                // Hide entries for unused semi trailer slots (e.g. 170-2 when slot 2 is empty)
                if (e.truck_number && e.truck_number.includes('-')) {
                  const base = e.truck_number.split('-')[0]
                  if (tractorNums.has(base)) {
                    // It's a semi slot — only show if slot is active
                    return activeSemiSlots.has(e.truck_number) || activeSemiSlots.size === 0
                  }
                }
                return true
              })
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
                              list="semi-slots-list"
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

      {/* ── Route Sync Result Dialog ── */}
      {syncResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-amber-500 font-bold text-lg">🔄 Route Sync Results</h3>
                <p className="text-xs text-gray-500">{syncResult.updated.length + syncResult.missing.length} trucks processed</p>
              </div>
              <button onClick={() => setSyncResult(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            {syncResult.updated.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 font-bold text-sm">✅ Updated ({syncResult.updated.length})</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {syncResult.updated.map((u, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-1.5 text-sm">
                      <span className="font-bold text-amber-500">{u.truck}</span>
                      <span className="text-xs text-gray-400">{u.door}</span>
                      <span className="text-green-400 font-bold">→ {u.route}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {syncResult.missing.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-400 font-bold text-sm">⚠️ Not in Route Sheet ({syncResult.missing.length})</span>
                  <span className="text-xs text-gray-500">— these trucks are in Print Room but have no route data</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {syncResult.missing.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-1.5 text-sm">
                      <span className="font-bold text-amber-500">{m.truck}</span>
                      <span className="text-xs text-gray-400">{m.door}</span>
                      <span className="text-red-400 text-xs">Not in route sheet</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">These may be trucks added after the route data was pulled, or trucks not on today&apos;s routes.</p>
              </div>
            )}

            {syncResult.updated.length === 0 && syncResult.missing.length === 0 && (
              <p className="text-gray-400 text-sm">No box trucks found in Print Room to sync.</p>
            )}

            <button onClick={() => setSyncResult(null)}
              className="mt-4 w-full bg-amber-500 text-black py-2 rounded-lg font-bold hover:bg-amber-400">
              Done
            </button>
          </div>
        </div>
      )}
    </RequirePage>
  )
}
