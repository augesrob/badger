'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { LoadingDoor, LiveMovement, StatusValue, PrintroomEntry, StagingDoor, Tractor, TrailerItem, DoorStatusValue, DockLockStatusValue, DOOR_STATUSES, doorStatusColor } from '@/lib/types'
import { getTTSSettings, useMovementTTS } from '@/lib/tts'
import { TTSMiniToggle } from '@/components/TTSPanel'
import RequirePage from '@/components/RequirePage'

// ─── Custom Door Status Bar ───────────────────────────────────────────────────
// Uses a fully custom dropdown instead of native <select> so it looks identical
// on Chrome, Firefox, Edge, and Safari — native selects vary in height/padding by OS.
function DoorPill({ door, statusOptions, statusColor, onSelect }: {
  door: LoadingDoor
  statusOptions: string[]
  statusColor: (s: string) => string
  onSelect: (status: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const st = door.door_status || 'Loading'
  const col = statusColor(st)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Pill button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 0,
          border: `1px solid ${col}`, borderRadius: 6,
          background: `${col}22`, overflow: 'hidden',
          cursor: 'pointer', padding: 0, height: 30,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', padding: '0 7px', borderRight: `1px solid ${col}`, height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          {door.door_name}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: col, padding: '0 6px', height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', gap: 4 }}>
          {st} <span style={{ fontSize: 8, opacity: 0.8 }}>▼</span>
        </span>
      </button>
      {/* Dropdown menu */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 3, zIndex: 100,
          background: '#1a1a1a', border: '1px solid #444', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)', minWidth: '100%', overflow: 'hidden',
        }}>
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => { onSelect(s); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '6px 10px', fontSize: 11, fontWeight: 600,
                color: '#fff', background: s === st ? `${statusColor(s)}44` : 'transparent',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                borderLeft: `3px solid ${statusColor(s)}`,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${statusColor(s)}33`)}
              onMouseLeave={e => (e.currentTarget.style.background = s === st ? `${statusColor(s)}44` : 'transparent')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DoorStatusBar({ doors, doorStatusValues, onSetDoorStatus, lastUpdate, ttsToggle }: {
  doors: LoadingDoor[]
  doorStatusValues: DoorStatusValue[]
  onSetDoorStatus: (id: number, status: string) => void
  lastUpdate: string
  ttsToggle: React.ReactNode
}) {
  const statusOptions = doorStatusValues.length > 0
    ? doorStatusValues.map(s => s.status_name)
    : [...DOOR_STATUSES]
  const statusColor = (s: string) => doorStatusColor(s, doorStatusValues)

  return (
    <div style={{ position: 'sticky', top: 49, zIndex: 40, background: '#0f0f0f', borderBottom: '1px solid #333', margin: '0 -1rem', padding: '5px 1rem', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflowX: 'auto' }}>
        {/* Pop-out button */}
        <button
          onClick={() => window.open('/door-status', 'door-status', 'popup,width=420,height=340')}
          title="Open door status in pop-out window"
          style={{ flexShrink: 0, height: 30, padding: '0 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          🚪↗
        </button>
        {/* Door pills */}
        {doors.map(d => (
          <DoorPill
            key={d.id}
            door={d}
            statusOptions={statusOptions}
            statusColor={statusColor}
            onSelect={status => onSetDoorStatus(d.id, status)}
          />
        ))}
        {/* Right: TTS + live */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {ttsToggle}
          <span style={{ fontSize: 10, color: '#4ade80' }} className="animate-pulse">● LIVE</span>
          <span style={{ fontSize: 10, color: '#6b7280' }}>{lastUpdate}</span>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────

export default function Movement() {
  const toast = useToast()
  const [doors, setDoors] = useState<LoadingDoor[]>([])
  const [trucks, setTrucks] = useState<LiveMovement[]>([])
  const [statuses, setStatuses] = useState<StatusValue[]>([])
  const [doorStatusValues, setDoorStatusValues] = useState<DoorStatusValue[]>([])
  const [dockLockStatusValues, setDockLockStatusValues] = useState<DockLockStatusValue[]>([])
  const [printroom, setPrintroom] = useState<(PrintroomEntry & { loading_doors?: { door_name: string } })[]>([])
  const [stagingDoors, setStagingDoors] = useState<StagingDoor[]>([])
  const [tractors, setTractors] = useState<Tractor[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [ttsSettings, setTtsSettings] = useState(() => getTTSSettings('movement'))
  const currentUserRef = useRef<string>('unknown')

  // Track who's logged in for change log
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('display_name, username').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) currentUserRef.current = data.display_name || data.username || user.email || 'unknown'
        })
    })
  }, [])

  const loadAll = useCallback(async () => {
    const [doorsRes, trucksRes, statusRes, doorStatusRes, dockLockStatusRes, prRes, stagingRes, tractorRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('live_movement').select('*, status_values(status_name, status_color)').order('truck_number'),
      supabase.from('status_values').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('door_status_values').select('*').order('sort_order'),
      supabase.from('dock_lock_status_values').select('*').order('sort_order'),
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
    if (doorStatusRes.data) setDoorStatusValues(doorStatusRes.data)
    if (dockLockStatusRes.data) setDockLockStatusValues(dockLockStatusRes.data)
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

    const makeChannel = () => supabase.channel(`movement-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_movement' }, fetchTrucks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_values' }, fetchTrucks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loading_doors' }, fetchDoors)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'door_status_values' }, fetchDoors)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printroom_entries' }, fetchPrintroom)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staging_doors' }, fetchStaging)

    let reconnecting = false
    let channel = makeChannel().subscribe((status) => {
      if ((status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') && !reconnecting) {
        reconnecting = true
        setTimeout(() => {
          supabase.removeChannel(channel)
          channel = makeChannel().subscribe()
          reconnecting = false
        }, 2000)
      }
    })

    // Reload immediately when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      loadAll()
      // Re-subscribe if channel dropped while tab was hidden (common on Firefox)
      const state = channel.state
      if (state !== 'joined' && state !== 'joining') {
        supabase.removeChannel(channel)
        channel = makeChannel().subscribe()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const handleResume = () => {
      loadAll()
      const state = channel.state
      if (state !== 'joined' && state !== 'joining') {
        supabase.removeChannel(channel)
        channel = makeChannel().subscribe()
      }
    }
    window.addEventListener('badger:resume', handleResume)

    // Fallback poll every 30s — catches updates when WebSocket silently drops
    // Especially important for Firefox which is more aggressive about suspending WebSockets
    const poll = setInterval(() => {
      // Only poll if channel is NOT subscribed (realtime working = no need to poll)
      const s = channel.state
      if (s !== 'joined') {
        fetchTrucks()
        fetchDoors()
      }
    }, 30_000)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('badger:resume', handleResume)
      clearInterval(poll)
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
    // Optimistic update — change UI instantly
    const prev = trucks.find(t => t.truck_number === truckNumber)
    const newStatus = statuses.find(s => s.id === statusId)
    setTrucks(ts => ts.map(t => t.truck_number === truckNumber
      ? { ...t, status_id: statusId, status_name: newStatus?.status_name || null, status_color: newStatus?.status_color || '#6b7280', last_updated: new Date().toISOString() }
      : t
    ))
    // Sync to DB in background
    const { error } = await supabase.from('live_movement').update({ status_id: statusId, last_updated: new Date().toISOString() }).eq('truck_number', truckNumber)
    if (error) {
      toast('Update failed — reverted', 'error')
      if (prev) setTrucks(ts => ts.map(t => t.truck_number === truckNumber ? { ...t, ...prev } : t))
      return
    }
    // Log the change
    supabase.from('movement_log').insert({
      changed_by: currentUserRef.current,
      truck_number: truckNumber,
      field_changed: 'truck_status',
      old_value: prev?.status_name || null,
      new_value: newStatus?.status_name || null,
    }).then(() => {})
    // Fire truck notifications (non-blocking)
    if (newStatus?.status_name) {
      fetch('/api/notify-truck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truck_number: truckNumber, new_status: newStatus.status_name }),
      }).catch(() => {})
    }
  }

  const setDoorStatus = async (doorId: number, status: string) => {
    const door = doors.find(d => d.id === doorId)
    const oldStatus = door?.door_status || null
    // Optimistic update
    setDoors(ds => ds.map(d => d.id === doorId ? { ...d, door_status: status } : d))
    const { error } = await supabase.from('loading_doors').update({ door_status: status }).eq('id', doorId)
    if (error) {
      toast('Door update failed — reverted', 'error')
      const { data } = await supabase.from('loading_doors').select('*').eq('id', doorId).single()
      if (data) setDoors(ds => ds.map(d => d.id === doorId ? data : d))
      return
    }
    // Log the change
    supabase.from('movement_log').insert({
      changed_by: currentUserRef.current,
      truck_number: null,
      field_changed: 'door_status',
      old_value: oldStatus,
      new_value: status,
      door_name: door?.door_name || null,
    }).then(() => {})
  }

  const setDockLock = async (doorId: number, status: string | null) => {
    const door = doors.find(d => d.id === doorId)
    const oldStatus = door?.dock_lock_status || null
    // Optimistic update
    setDoors(ds => ds.map(d => d.id === doorId ? { ...d, dock_lock_status: status } : d))
    const { error } = await supabase.from('loading_doors').update({ dock_lock_status: status }).eq('id', doorId)
    if (error) {
      toast('Dock lock update failed — reverted', 'error')
      const { data } = await supabase.from('loading_doors').select('*').eq('id', doorId).single()
      if (data) setDoors(ds => ds.map(d => d.id === doorId ? data : d))
      return
    }
    // Log the change
    supabase.from('movement_log').insert({
      changed_by: currentUserRef.current,
      truck_number: null,
      field_changed: 'dock_lock',
      old_value: oldStatus,
      new_value: status,
      door_name: door?.door_name || null,
    }).then(() => {})
  }


  const DOCK_LOCK_DOORS = new Set(['13A', '13B', '14A', '14B', '15A', '15B'])

  // Door pairs: 13A+13B, 14A+14B, 15A+15B
  const doorPairs = [['13A', '13B'], ['14A', '14B'], ['15A', '15B']]

  // Render a single door panel
  const renderDoorPanel = (doorName: string, accent: string) => {
    const group = doorGroups[doorName] || []
    const door = doors.find(d => d.door_name === doorName)
    const doorSt = door?.door_status || 'Loading'
    const doorCol = doorStatusColor(doorSt, doorStatusValues)

    return (
      <div className="flex-1 min-w-0">
        {/* Door header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]" style={{ background: `${accent}12` }}>
          <span className="text-lg font-extrabold" style={{ color: accent }}>{doorName}</span>
          {DOCK_LOCK_DOORS.has(doorName) && (() => {
            const matched = dockLockStatusValues.find(s => s.status_name === door?.dock_lock_status)
            const bgColor = matched ? matched.status_color : '#374151'
            return (
              <select
                value={door?.dock_lock_status || ''}
                onChange={e => door && setDockLock(door.id, e.target.value || null)}
                className="status-select text-[10px]"
                style={{ background: bgColor }}
              >
                <option value="">🔒 Dock Lock</option>
                {dockLockStatusValues.map(s => (
                  <option key={s.id} value={s.status_name}>{s.status_name}</option>
                ))}
              </select>
            )
          })()}
          <select value={doorSt} onChange={e => door && setDoorStatus(door.id, e.target.value)}
            className="status-select text-[10px] ml-auto" style={{ background: doorCol }}>
            {(doorStatusValues.length > 0 ? doorStatusValues.map(s => s.status_name) : [...DOOR_STATUSES]).map(s => <option key={s} value={s}>{s}</option>)}
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
    <RequirePage pageKey="movement">
    <div>
      {/* STICKY Door Status Bar — custom dropdowns, no native <select>, consistent across all browsers */}
      <DoorStatusBar
        doors={doors}
        doorStatusValues={doorStatusValues}
        onSetDoorStatus={setDoorStatus}
        lastUpdate={lastUpdate}
        ttsToggle={<TTSMiniToggle page="movement" />}
      />

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
    </RequirePage>
  )
}
