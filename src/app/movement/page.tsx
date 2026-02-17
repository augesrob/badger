'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { LoadingDoor, LiveMovement, StatusValue, PrintroomEntry, StagingDoor, DOOR_STATUSES, doorStatusColor } from '@/lib/types'

export default function Movement() {
  const toast = useToast()
  const [doors, setDoors] = useState<LoadingDoor[]>([])
  const [trucks, setTrucks] = useState<LiveMovement[]>([])
  const [statuses, setStatuses] = useState<StatusValue[]>([])
  const [printroom, setPrintroom] = useState<(PrintroomEntry & { loading_doors?: { door_name: string } })[]>([])
  const [stagingDoors, setStagingDoors] = useState<StagingDoor[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')

  const loadAll = useCallback(async () => {
    const [doorsRes, trucksRes, statusRes, prRes, stagingRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('live_movement').select('*, status_values(status_name, status_color)').order('truck_number'),
      supabase.from('status_values').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('printroom_entries').select('*, loading_doors(door_name)').order('loading_door_id').order('batch_number').order('row_order'),
      supabase.from('staging_doors').select('*').order('door_number').order('door_side'),
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
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    loadAll()
    const channel = supabase.channel('movement-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_movement' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loading_doors' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printroom_entries' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staging_doors' }, () => loadAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAll])

  // Build preshift location lookup: truck_number → "Dr19 In Back"
  const preshiftLookup: Record<string, string> = {}
  stagingDoors.forEach(sd => {
    if (sd.in_front) preshiftLookup[sd.in_front] = `Dr${sd.door_label} Front`
    if (sd.in_back) preshiftLookup[sd.in_back] = `Dr${sd.door_label} Back`
  })

  // Build truck→door mapping
  const truckToDoor: Record<string, { door_name: string; route: string; batch: number }> = {}
  printroom.forEach(pe => {
    if (pe.truck_number && pe.truck_number !== 'end') {
      truckToDoor[pe.truck_number] = {
        door_name: pe.loading_doors?.door_name || '?',
        route: pe.route_info || '',
        batch: pe.batch_number,
      }
    }
  })

  // Filter & search — ONLY show trucks that exist in printroom
  let filtered = trucks.filter(t => truckToDoor[t.truck_number])
  if (filter !== 'all') filtered = filtered.filter(t => (t.status_name || 'No Status') === filter)
  if (search) filtered = filtered.filter(t => t.truck_number.toLowerCase().includes(search.toLowerCase()))

  // Group by door
  const doorGroups: Record<string, LiveMovement[]> = {}
  filtered.forEach(t => {
    const di = truckToDoor[t.truck_number]
    if (di) {
      if (!doorGroups[di.door_name]) doorGroups[di.door_name] = []
      doorGroups[di.door_name].push(t)
    }
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
    if (error) toast('Update failed', 'error')
  }

  const updateLocation = async (truckNumber: string, location: string) => {
    await supabase.from('live_movement').update({ current_location: location || null, last_updated: new Date().toISOString() }).eq('truck_number', truckNumber)
  }

  const updateInFront = async (truckNumber: string, value: string) => {
    await supabase.from('live_movement').update({ in_front_of: value || null, last_updated: new Date().toISOString() }).eq('truck_number', truckNumber)
  }

  const setDoorStatus = async (doorId: number, status: string) => {
    await supabase.from('loading_doors').update({ door_status: status }).eq('id', doorId)
  }

  // Door pairs: 13A+13B, 14A+14B, 15A+15B
  const doorPairs = [['13A', '13B'], ['14A', '14B'], ['15A', '15B']]

  // Render a single door panel
  const renderDoorPanel = (doorName: string) => {
    const group = doorGroups[doorName] || []
    const door = doors.find(d => d.door_name === doorName)
    const doorSt = door?.door_status || 'Loading'
    const doorCol = doorStatusColor(doorSt)

    return (
      <div className="flex-1 min-w-0">
        {/* Door header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#111] border-b border-[#333]">
          <span className="text-lg font-extrabold text-amber-500">{doorName}</span>
          <select value={doorSt} onChange={e => door && setDoorStatus(door.id, e.target.value)}
            className="status-select text-[10px] ml-auto" style={{ background: doorCol }}>
            {DOOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[55px_35px_65px_1fr_70px_60px] gap-1 px-2 py-1 text-[9px] text-gray-500 font-bold uppercase border-b border-[#222]">
          <span>Truck#</span><span>Rt</span><span>Location</span><span>Status</span><span>Loc Edit</span><span>In Front</span>
        </div>

        {/* Truck rows */}
        {group.length > 0 ? group.map(t => {
          const di = truckToDoor[t.truck_number]
          const preshiftLoc = preshiftLookup[t.truck_number] || ''
          // Show preshift location if no manual location set
          const displayLoc = t.current_location || preshiftLoc
          return (
            <div key={t.id} className="grid grid-cols-[55px_35px_65px_1fr_70px_60px] gap-1 items-center px-2 py-1 border-b border-white/5 hover:bg-white/[0.02]">
              <div className="text-sm font-extrabold text-amber-500 pl-1" style={{ borderLeft: `3px solid ${t.status_color || '#6b7280'}` }}>
                {t.truck_number}
              </div>
              <div className="text-[11px] text-gray-500">{di?.route || ''}</div>
              <div className="text-[11px] text-blue-400 font-medium truncate" title={displayLoc}>{displayLoc || '—'}</div>
              <select
                value={t.status_id || ''}
                onChange={e => updateStatus(t.truck_number, Number(e.target.value))}
                className="status-select text-[10px] w-full"
                style={{ background: t.status_color || '#6b7280' }}>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.status_name}</option>)}
              </select>
              <input defaultValue={t.current_location || ''} placeholder={preshiftLoc || 'Loc'}
                onBlur={e => updateLocation(t.truck_number, e.target.value)}
                className="bg-[#222] border border-[#333] rounded px-1 py-0.5 text-[11px] focus:border-amber-500 outline-none w-full" />
              <input defaultValue={t.in_front_of || ''} placeholder="—"
                onBlur={e => updateInFront(t.truck_number, e.target.value)}
                className="bg-[#222] border border-[#333] rounded px-1 py-0.5 text-[11px] focus:border-amber-500 outline-none w-full" />
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
      <div className="flex items-center gap-3 mb-3">
        <h1 className="text-2xl font-bold">🚚 Live Movement</h1>
        <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
        <span className="ml-auto text-xs text-gray-500">Updated: {lastUpdate}</span>
      </div>

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
        placeholder="🔍 Search truck #..." className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2.5 mb-4 text-sm focus:border-amber-500 outline-none" />

      {/* Door pairs: A and B side by side */}
      {doorPairs.map(([doorA, doorB]) => {
        const doorAData = doors.find(d => d.door_name === doorA)
        const doorBData = doors.find(d => d.door_name === doorB)
        const doorACol = doorStatusColor(doorAData?.door_status || 'Loading')
        const doorBCol = doorStatusColor(doorBData?.door_status || 'Loading')
        const doorNum = doorA.replace(/[AB]/, '')

        return (
          <div key={doorNum} className="mb-4">
            {/* Pair header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-extrabold text-white">Door {doorNum}</span>
              <div className="flex gap-1 ml-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: doorACol }}>
                  A: {doorAData?.door_status || 'Loading'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: doorBCol }}>
                  B: {doorBData?.door_status || 'Loading'}
                </span>
              </div>
            </div>

            {/* Side by side on desktop, stacked on mobile */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 min-w-0 border-b md:border-b-0 md:border-r border-[#333]">
                  {renderDoorPanel(doorA)}
                </div>
                <div className="flex-1 min-w-0">
                  {renderDoorPanel(doorB)}
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
