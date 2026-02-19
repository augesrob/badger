'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Truck, Tractor, TrailerItem } from '@/lib/types'

interface TruckUsage {
  truck: Truck
  inUse: boolean
  door?: string
  status?: string
  statusColor?: string
}

interface TractorUsage {
  tractor: Tractor
  inUse: boolean
  door?: string
  status?: string
  statusColor?: string
  trailerLabel?: string
}

export default function Fleet() {
  const [truckUsage, setTruckUsage] = useState<TruckUsage[]>([])
  const [tractorUsage, setTractorUsage] = useState<TractorUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [viewFilter, setViewFilter] = useState<'all' | 'in_use' | 'available'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const loadData = useCallback(async () => {
    const [trucksRes, tractorsRes, movementRes, printroomRes] = await Promise.all([
      supabase.from('trucks').select('*').eq('is_active', true).order('truck_number'),
      supabase.from('tractors').select('*, trailer_1:trailer_list!tractors_trailer_1_id_fkey(*), trailer_2:trailer_list!tractors_trailer_2_id_fkey(*), trailer_3:trailer_list!tractors_trailer_3_id_fkey(*), trailer_4:trailer_list!tractors_trailer_4_id_fkey(*)').order('truck_number'),
      supabase.from('live_movement').select('*, status_values(status_name, status_color)'),
      supabase.from('printroom_entries').select('*, loading_doors(door_name)').not('truck_number', 'is', null),
    ])

    const trucks = trucksRes.data || []
    const tractors = tractorsRes.data || []
    const movement = movementRes.data || []
    const printroom = printroomRes.data || []

    // Build lookup: truck_number → movement data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mvLookup: Record<string, any> = {}
    movement.forEach((m: Record<string, unknown>) => { mvLookup[m.truck_number as string] = m })

    // Build lookup: truck_number → door name from printroom
    const doorLookup: Record<string, string> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    printroom.forEach((p: any) => {
      if (p.truck_number) doorLookup[p.truck_number] = p.loading_doors?.door_name || ''
    })

    // Map trucks
    const tUsage: TruckUsage[] = trucks.map(t => {
      const num = String(t.truck_number)
      const mv = mvLookup[num]
      return {
        truck: t,
        inUse: !!mv,
        door: doorLookup[num] || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (mv as any)?.status_values?.status_name || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        statusColor: (mv as any)?.status_values?.status_color || undefined,
      }
    })

    // Map tractors — check all trailer slot combinations
    const trUsage: TractorUsage[] = []
    tractors.forEach((tr: Tractor) => {
      const slots = [1, 2, 3, 4] as const
      let tractorInUse = false
      let usedSlot: string | undefined
      let usedDoor: string | undefined
      let usedStatus: string | undefined
      let usedStatusColor: string | undefined

      for (const slot of slots) {
        const key = `${tr.truck_number}-${slot}`
        const mv = mvLookup[key]
        if (mv) {
          tractorInUse = true
          const trailer = tr[`trailer_${slot}` as keyof Tractor] as TrailerItem | null
          usedSlot = trailer ? `TR:${trailer.trailer_number}` : `Slot ${slot}`
          usedDoor = doorLookup[key]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usedStatus = (mv as any)?.status_values?.status_name
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usedStatusColor = (mv as any)?.status_values?.status_color
          break
        }
      }

      // Also check bare tractor number
      if (!tractorInUse) {
        const mv = mvLookup[String(tr.truck_number)]
        if (mv) {
          tractorInUse = true
          usedDoor = doorLookup[String(tr.truck_number)]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usedStatus = (mv as any)?.status_values?.status_name
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usedStatusColor = (mv as any)?.status_values?.status_color
        }
      }

      trUsage.push({
        tractor: tr,
        inUse: tractorInUse,
        door: usedDoor,
        status: usedStatus,
        statusColor: usedStatusColor,
        trailerLabel: usedSlot,
      })
    })

    setTruckUsage(tUsage)
    setTractorUsage(trUsage)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const channel = supabase.channel('fleet-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_movement' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printroom_entries' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tractors' }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  // Filter
  const filteredTrucks = truckUsage.filter(t => {
    if (viewFilter === 'in_use' && !t.inUse) return false
    if (viewFilter === 'available' && t.inUse) return false
    if (typeFilter !== 'all' && t.truck.truck_type !== typeFilter) return false
    return true
  })

  const filteredTractors = tractorUsage.filter(t => {
    if (viewFilter === 'in_use' && !t.inUse) return false
    if (viewFilter === 'available' && t.inUse) return false
    if (typeFilter !== 'all' && typeFilter !== 'semi') return false
    return true
  })

  const inUseCount = truckUsage.filter(t => t.inUse).length + tractorUsage.filter(t => t.inUse).length
  const availableCount = truckUsage.filter(t => !t.inUse).length + tractorUsage.filter(t => !t.inUse).length
  const totalCount = truckUsage.length + tractorUsage.length

  const typeIcons: Record<string, string> = { box_truck: '🚚', van: '🚐', tandem: '🚛', semi: '🚛' }
  const typeLabels: Record<string, string> = { box_truck: 'Box', van: 'Van', tandem: 'Tandem', semi: 'Semi' }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">🚛 Fleet Overview</h1>
      <p className="text-xs text-gray-500 mb-4">Real-time truck availability across all operations</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-center">
          <div className="text-2xl font-extrabold text-white">{totalCount}</div>
          <div className="text-[10px] text-gray-500 uppercase font-bold">Total Fleet</div>
        </div>
        <div className="bg-[#1a1a1a] border border-green-500/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-extrabold text-green-500">{inUseCount}</div>
          <div className="text-[10px] text-gray-500 uppercase font-bold">In Use</div>
        </div>
        <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-extrabold text-amber-500">{availableCount}</div>
          <div className="text-[10px] text-gray-500 uppercase font-bold">Available</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'in_use', 'available'] as const).map(f => (
          <button key={f} onClick={() => setViewFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              viewFilter === f ? 'bg-amber-500 text-black border-amber-500' : 'bg-[#1a1a1a] text-gray-400 border-[#333] hover:text-amber-500'
            }`}>
            {f === 'all' ? `All (${totalCount})` : f === 'in_use' ? `In Use (${inUseCount})` : `Available (${availableCount})`}
          </button>
        ))}
        <div className="border-l border-[#333] mx-1" />
        {['all', 'box_truck', 'van', 'tandem', 'semi'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === t ? 'bg-blue-500 text-white border-blue-500' : 'bg-[#1a1a1a] text-gray-400 border-[#333] hover:text-blue-400'
            }`}>
            {t === 'all' ? 'All Types' : `${typeIcons[t]} ${typeLabels[t]}`}
          </button>
        ))}
      </div>

      {/* Trucks Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filteredTrucks.map(({ truck, inUse, door, status, statusColor }) => (
          <div key={`t-${truck.id}`}
            className={`rounded-xl p-3 border transition-colors ${
              inUse ? 'bg-green-500/5 border-green-500/30' : 'bg-[#1a1a1a] border-[#333]'
            }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg font-extrabold text-amber-500">{truck.truck_number}</span>
              <span className="text-xs">{typeIcons[truck.truck_type]}</span>
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{typeLabels[truck.truck_type]}</div>
            {inUse ? (
              <div>
                {door && <div className="text-[11px] text-blue-400 font-medium">📍 {door}</div>}
                {status && (
                  <div className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: statusColor || '#6b7280' }}>
                    {status}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-gray-600 italic">Available</div>
            )}
          </div>
        ))}

        {/* Tractors */}
        {filteredTractors.map(({ tractor, inUse, door, status, statusColor, trailerLabel }) => (
          <div key={`tr-${tractor.id}`}
            className={`rounded-xl p-3 border transition-colors ${
              inUse ? 'bg-green-500/5 border-green-500/30' : 'bg-[#1a1a1a] border-[#333]'
            }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg font-extrabold text-purple-400">{tractor.truck_number}</span>
              <span className="text-xs">🚛</span>
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Semi</div>
            {tractor.driver_name && <div className="text-[10px] text-gray-400 truncate">👤 {tractor.driver_name}</div>}
            {inUse ? (
              <div>
                {trailerLabel && <div className="text-[10px] text-purple-400 font-medium">{trailerLabel}</div>}
                {door && <div className="text-[11px] text-blue-400 font-medium">📍 {door}</div>}
                {status && (
                  <div className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: statusColor || '#6b7280' }}>
                    {status}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-gray-600 italic">Available</div>
            )}
          </div>
        ))}
      </div>

      {filteredTrucks.length === 0 && filteredTractors.length === 0 && (
        <div className="text-center py-8 text-gray-600">No trucks match your filters</div>
      )}
    </div>
  )
}
