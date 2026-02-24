'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { LoadingDoor, LiveMovement, StatusValue, PrintroomEntry, StagingDoor, Tractor, TrailerItem, DOOR_STATUSES, doorStatusColor } from '@/lib/types'
import { getTTSSettings, useMovementTTS } from '@/lib/tts'
import { TTSMiniToggle } from '@/components/TTSPanel'

export default function Movement() {
  const toast = useToast()
  const [doors, setDoors] = useState<LoadingDoor[]>([])
  const [trucks, setTrucks] = useState<LiveMovement[]>([])
  const [statuses, setStatuses] = useState<StatusValue[]>([])
  const [printroom, setPrintroom] = useState<(PrintroomEntry & { loading_doors?: { door_name: string } })[]>([])
  const [stagingDoors, setStagingDoors] = useState<StagingDoor[]>([])
  const [tractors, setTractors] = useState<Tractor[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [ttsSettings, setTtsSettings] = useState(() => getTTSSettings('movement'))

  const loadAll = useCallback(async () => {
    const [doorsRes, trucksRes, statusRes, prRes, stagingRes, tractorRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('live_movement').select('*, status_values(status_name, status_color)').order('truck_number'),
      supabase.from('status_values').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('printroom_entries').select('*, loading_doors(door_name)').order('loading_door_id').order('batch_number').order('row_order'),
      supabase.from('staging_doors').select('*').order('door_number').order('door_side'),
      supabase.from('tractors').select('*, trailer_1:trailer_list!tractors_trailer_1_id_fkey(*), trailer_2:trailer_list!tractors_trailer_2_id_fkey(*), trailer_3:trailer_list!tractors_trailer_3_id_fkey(*), trailer_4:trailer_list!tractors_trailer_4_id_fkey(*)').order('truck_number'),
    ])

    if (doorsRes.data) setDoors(doorsRes.data)
    if (trucksRes.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = trucksRes.data.map((t: any) => ({
        ...t,
        status_name: t.status_values?.status_name || null,
        status_color: t.status_values?.status_color || '#6b7280',
        status_values: undefined,
      }))
      setTrucks(mapped)
    }
    if (statusRes.data) setStatuses(statusRes.data)
    if (prRes.data) setPrintroom(prRes.data)
    if (stagingRes.data) setStagingDoors(stagingRes.data)
    if (tractorRes.data) setTractors(tractorRes.data)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    loadAll()

    // Each table gets its own targeted reload instead of loadAll() on everything
    const fetchTrucks = async () => {
      const { data } = await supabase.from('live_movement').select('*, status_values(status_name, status_color)').order('truck_number')
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = data.map((t: any) => ({
          ...t,
          status_name: t.status_values?.status_name || null,
          status_color: t.status_values?.status_color || '#6b7280',
          status_values: undefined,
        }))
        setTrucks(mapped)
      }
      setLastUpdate(new Date().toLocaleTimeString())
    }
    const fetchDoors = async () => {
      const { data } = await supabase.from('loading_doors').select('*').order('sort_order')
      if (data) setDoors(data)
    }
    const fetchPrintroom = async () => {
      const { data } = await supabase.from('printroom_entries').select('*, loading_doors(door_name)').order('loading_door_id').order('batch_number').order('row_order')
      if (data) setPrintroom(data)
    }
    const fetchStaging = async () => {
      const { data } = await supabase.from('staging_doors').select('*').order('door_number').order('door_side')
      if (data) setStagingDoors(data)
    }

    const channel = supabase.channel('movement-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_movement' }, fetchTrucks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loading_doors' }, fetchDoors)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printroom_entries' }, fetchPrintroom)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staging_doors' }, fetchStaging)
      .subscribe()

    const handleResume = () => loadAll()
    window.addEventListener('badger:resume', handleResume)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('badger:resume', handleResume)
    }
  }, [loadAll])

  // Refresh TTS settings — both cross-tab (storage event) and same-tab (custom event)
  useEffect(() => {
    const handler = () => setTtsSettings(getTTSSettings('movement'))
    window.addEventListener('storage', handler)
    window.addEventListener('badger:tts-changed', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('badger:tts-changed', handler)
    }
  }, [])

  // TTS: announce door/truck status changes
  const truckTTSData = trucks.map(t => ({
    truck_number: t.truck_number,
    status_name: t.status_name || '',
  }))
  useMovementTTS(doors, truckTTSData, ttsSettings)

  // Build preshift location lookup: truck_number → just door label "22B"
  // And behind lookup: if truck is in back, show which truck is in front
  const preshiftLookup: Record<string, string> = {}
  const behindLookup: Record<string, string> = {} // truck_in_back → truck_in_front
  stagingDoors.forEach(sd => {
    if (sd.in_front) preshiftLookup[sd.in_front] = sd.door_label
    if (sd.in_back) {
      preshiftLookup[sd.in_back] = sd.door_label
      if (sd.in_front) behindLookup[sd.in_back] = sd.in_front
    }
  })

  // Resolve tractor-trailer: "170-1" → trailer number "203"
  const resolveTrailer = (truckNum: string): string | null => {
    const match = truckNum.match(/^(\d+)-(\d+)$/)
    if (!match) return null
    const tractorNum = parseInt(match[1])
    const slot = parseInt(match[2]) as 1|2|3|4
    if (slot < 1 || slot > 4) return null
    const tractor = tractors.find(t => t.truck_number === tractorNum)
    if (!tractor) return null
    const trailer = tractor[`trailer_${slot}` as keyof Tractor] as TrailerItem | null
    return trailer?.trailer_number || null
  }

  // Build truck→door mapping AND preserve printroom order
  const truckToDoor: Record<string, { door_name: string; route: string; batch: number; order: number; pods: number; pallets: number; notes: string }> = {}
  let orderIndex = 0
  printroom.forEach(pe => {
    if (pe.truck_number && pe.truck_number !== 'end') {
      truckToDoor[pe.truck_number] = {
        door_name: pe.loading_doors?.door_name || '?',
        route: pe.route_info || '',
        batch: pe.batch_number,
        order: orderIndex++,
        pods: pe.pods || 0,
        pallets: pe.pallets_trays || 0,
        notes: pe.notes || '',
      }
    }
  })

  // Filter & search — ONLY show trucks that exist in printroom
  let filtered = trucks.filter(t => truckToDoor[t.truck_number])
  if (filter !== 'all') filtered = filtered.filter(t => (t.status_name || 'No Status') === filter)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(t => {
      // Match truck number
      if (t.truck_number.toLowerCase().includes(q)) return true
      // Match door name (e.g. "13", "13A", "14B")
      const di = truckToDoor[t.truck_number]
      if (di && di.door_name.toLowerCase().includes(q)) return true
      // Match location (e.g. "26" matches "26A", "26B")
      const preshiftLoc = preshiftLookup[t.truck_number] || ''
      const displayLoc = t.current_location || preshiftLoc
      if (displayLoc && displayLoc.toLowerCase().includes(q)) return true
      return false
    })
  }

  // Group by door, preserving printroom order
  const doorGroups: Record<string, LiveMovement[]> = {}
  filtered.forEach(t => {
    const di = truckToDoor[t.truck_number]
    if (di) {
      if (!doorGroups[di.door_name]) doorGroups[di.door_name] = []
      doorGroups[di.door_name].push(t)
    }
  })
  // Sort each door's trucks by printroom order
  Object.keys(doorGroups).forEach(doorName => {
    doorGroups[doorName].sort((a, b) => (truckToDoor[a.truck_number]?.order || 0) - (truckToDoor[b.truck_number]?.order || 0))
  })

  // Status counts (only printroom trucks)
  const printroomTrucks = trucks.filter(t => truckToDoor[t.truck_number])
  const statusCounts: Record<string, number> = {}
  printroomTrucks.forEach(t => {
    const name = t.status_name || 'No Status'
    statusCounts[name] = (statusCounts[name] || 0) + 1
  })

  const updateStatus = async (truckNumber: string, statusId: number) => {
    const { error } = await supabase.from('live_movement').update({ status_id: statusId, last_updated: new Date().toISOString() }).eq('truck_number', truckNumber)
    if (error) { toast('Update failed', 'error'); return }
    // Fire truck notifications (non-blocking)
    const statusName = statuses.find(s => s.id === statusId)?.status_name
    if (statusName) {
      fetch('/api/notify-truck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truck_number: truckNumber, new_status: statusName }),
      }).catch(() => {})
    }
  }

  const setDoorStatus = async (doorId: number, status: string) => {
    await supabase.from('loading_doors').update({ door_status: status }).eq('id', doorId)
  }

  // Door pairs: 13A+13B, 14A+14B, 15A+15B
  const doorPairs = [['13A', '13B'], ['14A', '14B'], ['15A', '15B']]

  // Render a single door panel
  const renderDoorPanel = (doorName: string, accent: string) => {
    const group = doorGroups[doorName] || []
    const door = doors.find(d => d.door_name === doorName)
    const doorSt = door?.door_status || 'Loading'
    const doorCol = doorStatusColor(doorSt)

    return (
      <div className="flex-1 min-w-0">
        {/* Door header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]" style={{ background: `${accent}12` }}>
          <span className="text-lg font-extrabold" style={{ color: accent }}>{doorName}</span>
          <select value={doorSt} onChange={e => door && setDoorStatus(door.id, e.target.value)}
            className="status-select text-[10px] ml-auto" style={{ background: doorCol }}>
            {DOOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[55px_35px_65px_1fr_40px_40px] gap-1 px-2 py-1 text-[9px] text-gray-500 font-bold uppercase border-b border-[#222]">
          <span>Truck#</span><span>Rt</span><span>Location</span><span>Status</span><span>Pods</span><span>Pal</span>
        </div>

        {/* Truck rows */}
        {group.length > 0 ? group.map((t, idx) => {
          const di = truckToDoor[t.truck_number]
          const preshiftLoc = preshiftLookup[t.truck_number] || ''
          const displayLoc = t.current_location || preshiftLoc
          const trailerNum = resolveTrailer(t.truck_number)
          const behind = behindLookup[t.truck_number]
          // Batch divider: check if previous truck was a different batch
          const prevBatch = idx > 0 ? truckToDoor[group[idx - 1].truck_number]?.batch : di?.batch
          const showBatchDivider = idx > 0 && di?.batch && prevBatch && di.batch !== prevBatch
          return (
            <div key={t.id}>
              {showBatchDivider && (
                <div className="flex items-center gap-2 px-2 py-0.5">
                  <div className="flex-1 border-t border-dashed border-amber-500/30" />
                  <span className="text-[8px] text-amber-500/40 font-bold uppercase tracking-wider">Next Wave</span>
                  <div className="flex-1 border-t border-dashed border-amber-500/30" />
                </div>
              )}
              <div className="border-b border-white/5 hover:bg-white/[0.02]">
              <div className="grid grid-cols-[55px_35px_65px_1fr_40px_40px] gap-1 items-center px-2 py-1">
                <div className="text-sm font-extrabold text-amber-500 pl-1" style={{ borderLeft: `3px solid ${t.status_color || '#6b7280'}` }}>
                  {t.truck_number}
                  {trailerNum && <div className="text-[9px] text-purple-400 font-normal">TR: {trailerNum}</div>}
                </div>
                <div className="text-[11px] text-gray-500">{di?.route || ''}</div>
                <div className="text-[11px] font-medium truncate" title={displayLoc}>
                  <span className="text-blue-400">{displayLoc || '—'}</span>
                  {behind && <div className="text-[9px] text-red-400/80">Behind {behind}</div>}
                </div>
                <select
                  value={t.status_id || ''}
                  onChange={e => updateStatus(t.truck_number, Number(e.target.value))}
                  className="status-select text-[10px] w-full"
                  style={{ background: t.status_color || '#6b7280' }}>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.status_name}</option>)}
                </select>
                <div className="text-[11px] text-gray-300 text-center font-semibold">{di?.pods || '—'}</div>
                <div className="text-[11px] text-gray-300 text-center font-semibold">{di?.pallets || '—'}</div>
              </div>
              {di?.notes && (
                <div className="px-3 pb-1 -mt-0.5">
                  <span className="text-[10px] text-yellow-500/80 italic">📝 {di.notes}</span>
                </div>
              )}
            </div>
            </div>
          )
        }) : (
          <div className="px-3 py-4 text-center text-xs text-gray-600">No trucks</div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* STICKY Door Status Bar - always visible at top */}
      <div className="sticky top-[49px] z-40 bg-[#0f0f0f] border-b border-[#333] -mx-4 px-4 py-2 mb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {doors.map(d => {
            const st = d.door_status || 'Loading'
            const col = doorStatusColor(st)
            return (
              <div key={d.id} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 flex-shrink-0 border"
                style={{ borderColor: col, background: `${col}15` }}>
                <span className="text-xs font-extrabold text-white">{d.door_name}</span>
                <select value={st} onChange={e => setDoorStatus(d.id, e.target.value)}
                  className="status-select text-[10px] py-0.5 px-1" style={{ background: col }}>
                  {DOOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )
          })}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <TTSMiniToggle page="movement" />
            <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
            <span className="text-[10px] text-gray-500">{lastUpdate}</span>
          </div>
        </div>
      </div>

      <h1 className="text-xl font-bold mb-2">🚚 Live Movement</h1>

      {/* Filter chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === 'all' ? 'bg-amber-500 text-black border-amber-500' : 'bg-[#1a1a1a] text-gray-400 border-[#333] hover:text-amber-500'}`}>
          All ({printroomTrucks.length})
        </button>
        {statuses.filter(s => statusCounts[s.status_name]).map(s => (
          <button key={s.id} onClick={() => setFilter(s.status_name)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === s.status_name ? 'text-black' : 'bg-[#1a1a1a] text-gray-400'}`}
            style={filter === s.status_name ? { background: s.status_color, borderColor: s.status_color } : { borderColor: s.status_color }}>
            {s.status_name} ({statusCounts[s.status_name]})
          </button>
        ))}
      </div>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Search truck #, door, or location..." className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2.5 mb-4 text-sm focus:border-amber-500 outline-none" />

      {/* Door pairs: A and B side by side */}
      {doorPairs.map(([doorA, doorB], pairIdx) => {
        const doorNum = doorA.replace(/[AB]/, '')
        const pairColors = ['#3b82f6', '#8b5cf6', '#10b981'] // blue, purple, green
        const accent = pairColors[pairIdx] || '#6b7280'

        return (
          <div key={doorNum} className="mb-4">
            {/* Pair header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: accent }} />
              <span className="text-base font-extrabold text-white">Door {doorNum}</span>
            </div>

            {/* Side by side on desktop, stacked on mobile */}
            <div className="bg-[#1a1a1a] rounded-xl overflow-hidden" style={{ border: `1px solid ${accent}40` }}>
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 min-w-0 border-b md:border-b-0 md:border-r" style={{ borderColor: `${accent}40` }}>
                  {renderDoorPanel(doorA, accent)}
                </div>
                <div className="flex-1 min-w-0">
                  {renderDoorPanel(doorB, accent)}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          {printroomTrucks.length === 0 ? 'No trucks yet. Add trucks in Print Room first.' : 'No trucks match your filter.'}
        </div>
      )}
    </div>
  )
}
