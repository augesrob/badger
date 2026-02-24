'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import RequirePage from '@/components/RequirePage'
import { LoadingDoor, LiveMovement, PrintroomEntry, StagingDoor, Tractor, TrailerItem, doorStatusColor } from '@/lib/types'

export default function DriversLiveView() {
  const [doors, setDoors] = useState<LoadingDoor[]>([])
  const [trucks, setTrucks] = useState<LiveMovement[]>([])
  const [printroom, setPrintroom] = useState<(PrintroomEntry & { loading_doors?: { door_name: string } })[]>([])
  const [stagingDoors, setStagingDoors] = useState<StagingDoor[]>([])
  const [tractors, setTractors] = useState<Tractor[]>([])
  const [lastUpdate, setLastUpdate] = useState('')

  const loadAll = useCallback(async () => {
    const [doorsRes, trucksRes, prRes, stagingRes, tractorRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('live_movement').select('*, status_values(status_name, status_color)').order('truck_number'),
      supabase.from('printroom_entries').select('*, loading_doors(door_name)').order('loading_door_id').order('batch_number').order('row_order'),
      supabase.from('staging_doors').select('*').order('door_number').order('door_side'),
      supabase.from('tractors').select('*, trailer_1:trailer_list!tractors_trailer_1_id_fkey(*), trailer_2:trailer_list!tractors_trailer_2_id_fkey(*), trailer_3:trailer_list!tractors_trailer_3_id_fkey(*), trailer_4:trailer_list!tractors_trailer_4_id_fkey(*)').order('truck_number'),
    ])
    if (doorsRes.data) setDoors(doorsRes.data)
    if (trucksRes.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTrucks(trucksRes.data.map((t: any) => ({
        ...t,
        status_name: t.status_values?.status_name || null,
        status_color: t.status_values?.status_color || '#6b7280',
        status_values: undefined,
      })))
    }
    if (prRes.data) setPrintroom(prRes.data)
    if (stagingRes.data) setStagingDoors(stagingRes.data)
    if (tractorRes.data) setTractors(tractorRes.data)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    loadAll()
    const fetchTrucks = async () => {
      const { data } = await supabase.from('live_movement').select('*, status_values(status_name, status_color)').order('truck_number')
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTrucks(data.map((t: any) => ({
          ...t,
          status_name: t.status_values?.status_name || null,
          status_color: t.status_values?.status_color || '#6b7280',
          status_values: undefined,
        })))
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
    const channel = supabase.channel('drivers-live-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_movement' }, fetchTrucks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loading_doors' }, fetchDoors)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printroom_entries' }, fetchPrintroom)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staging_doors' }, fetchStaging)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAll])

  // Build lookups
  const preshiftLookup: Record<string, string> = {}
  const behindLookup: Record<string, string> = {}
  stagingDoors.forEach(sd => {
    if (sd.in_front) preshiftLookup[sd.in_front] = sd.door_label
    if (sd.in_back) {
      preshiftLookup[sd.in_back] = sd.door_label
      if (sd.in_front) behindLookup[sd.in_back] = sd.in_front
    }
  })

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

  const doorPairs = [['13A', '13B'], ['14A', '14B'], ['15A', '15B']]
  const pairColors = ['#3b82f6', '#8b5cf6', '#10b981']

  const printroomTrucks = trucks.filter(t => truckToDoor[t.truck_number])

  const renderDoorPanel = (doorName: string, accent: string) => {
    const door = doors.find(d => d.door_name === doorName)
    const doorSt = door?.door_status || 'Loading'
    const doorCol = doorStatusColor(doorSt)
    const group = printroomTrucks
      .filter(t => truckToDoor[t.truck_number]?.door_name === doorName)
      .sort((a, b) => (truckToDoor[a.truck_number]?.order || 0) - (truckToDoor[b.truck_number]?.order || 0))

    return (
      <div className="flex-1 min-w-0">
        {/* Door header - READ ONLY, just shows status as badge */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]" style={{ background: `${accent}12` }}>
          <span className="text-lg font-extrabold" style={{ color: accent }}>{doorName}</span>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-black"
            style={{ background: doorCol }}>
            {doorSt}
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[60px_35px_70px_1fr_40px_40px] gap-1 px-2 py-1 text-[9px] text-gray-500 font-bold uppercase border-b border-[#222]">
          <span>Truck#</span><span>Rt</span><span>Location</span><span>Status</span><span>Pods</span><span>Pal</span>
        </div>

        {group.length > 0 ? group.map((t, idx) => {
          const di = truckToDoor[t.truck_number]
          const preshiftLoc = preshiftLookup[t.truck_number] || ''
          const displayLoc = t.current_location || preshiftLoc
          const trailerNum = resolveTrailer(t.truck_number)
          const behind = behindLookup[t.truck_number]
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
              <div className="grid grid-cols-[60px_35px_70px_1fr_40px_40px] gap-1 items-center px-2 py-1.5 border-b border-white/5">
                <div className="text-sm font-extrabold text-amber-500 pl-1" style={{ borderLeft: `3px solid ${t.status_color || '#6b7280'}` }}>
                  {t.truck_number}
                  {trailerNum && <div className="text-[9px] text-purple-400 font-normal">TR: {trailerNum}</div>}
                </div>
                <div className="text-[11px] text-gray-500">{di?.route || ''}</div>
                <div className="text-[11px] font-medium truncate">
                  <span className="text-blue-400">{displayLoc || '—'}</span>
                  {behind && <div className="text-[9px] text-red-400/80">Behind {behind}</div>}
                </div>
                {/* READ ONLY status badge */}
                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded text-center text-black truncate"
                  style={{ background: t.status_color || '#6b7280' }}>
                  {t.status_name || '—'}
                </div>
                <div className="text-[11px] text-gray-300 text-center font-semibold">{di?.pods || '—'}</div>
                <div className="text-[11px] text-gray-300 text-center font-semibold">{di?.pallets || '—'}</div>
              </div>
              {di?.notes && (
                <div className="px-3 pb-1">
                  <span className="text-[10px] text-yellow-500/80 italic">📝 {di.notes}</span>
                </div>
              )}
            </div>
          )
        }) : (
          <div className="px-3 py-4 text-center text-xs text-gray-600">No trucks</div>
        )}
      </div>
    )
  }

  return (
    <RequirePage pageKey="drivers_live">
    <div>
      {/* Sticky door status bar - read only */}
      <div className="sticky top-[49px] z-40 bg-[#0f0f0f] border-b border-[#333] -mx-4 px-4 py-2 mb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 items-center">
          {doors.map(d => {
            const st = d.door_status || 'Loading'
            const col = doorStatusColor(st)
            return (
              <div key={d.id} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 flex-shrink-0 border"
                style={{ borderColor: col, background: `${col}15` }}>
                <span className="text-xs font-extrabold text-white">{d.door_name}</span>
                <span className="text-[10px] font-bold text-black px-1.5 py-0.5 rounded"
                  style={{ background: col }}>{st}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
            <span className="text-[10px] text-gray-500">{lastUpdate}</span>
          </div>
        </div>
      </div>

      <h1 className="text-xl font-bold mb-4">📍 Live View <span className="text-sm text-gray-500 font-normal ml-2">read-only</span></h1>

      {doorPairs.map(([doorA, doorB], pairIdx) => {
        const doorNum = doorA.replace(/[AB]/, '')
        const accent = pairColors[pairIdx] || '#6b7280'
        return (
          <div key={doorNum} className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: accent }} />
              <span className="text-base font-extrabold text-white">Door {doorNum}</span>
            </div>
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

      {printroomTrucks.length === 0 && (
        <div className="text-center py-20 text-gray-500">No trucks yet.</div>
      )}
    </div>
    </RequirePage>
  )
}
