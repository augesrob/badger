'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Tractor, TrailerItem } from '@/lib/types'
import RequirePage from '@/components/RequirePage'

interface ActiveSlot {
  truck: string       // e.g. "177-1"
  trailer: string     // e.g. "T4501"
  tractorNum: number  // e.g. 177
}

export default function SemiTrailerList() {
  const [activeSlots, setActiveSlots] = useState<ActiveSlot[]>([])
  const [lastUpdate, setLastUpdate] = useState('')
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const load = useCallback(async () => {
    const { data: tractors } = await supabase
      .from('tractors')
      .select('*, trailer_1:trailer_list!tractors_trailer_1_id_fkey(*), trailer_2:trailer_list!tractors_trailer_2_id_fkey(*), trailer_3:trailer_list!tractors_trailer_3_id_fkey(*), trailer_4:trailer_list!tractors_trailer_4_id_fkey(*)')
      .eq('is_active', true)
      .order('truck_number')

    const [{ data: printroom }, { data: movement }] = await Promise.all([
      supabase.from('printroom_entries').select('truck_number').not('truck_number', 'is', null),
      supabase.from('live_movement').select('truck_number'),
    ])

    const inUse = new Set<string>()
    ;(printroom || []).forEach(r => { if (r.truck_number) inUse.add(r.truck_number.trim()) })
    ;(movement  || []).forEach(r => { if (r.truck_number) inUse.add(r.truck_number.trim()) })

    const slots: ActiveSlot[] = []
    ;(tractors || []).forEach((tractor: Tractor) => {
      const trailers = [
        tractor.trailer_1 as TrailerItem | null,
        tractor.trailer_2 as TrailerItem | null,
        tractor.trailer_3 as TrailerItem | null,
        tractor.trailer_4 as TrailerItem | null,
      ]
      trailers.forEach((trailer, i) => {
        if (!trailer) return
        const slotKey = `${tractor.truck_number}-${i + 1}`
        if (inUse.has(slotKey)) {
          slots.push({ truck: slotKey, trailer: trailer.trailer_number, tractorNum: tractor.truck_number })
        }
      })
    })

    slots.sort((a, b) => a.tractorNum !== b.tractorNum ? a.tractorNum - b.tractorNum : a.truck.localeCompare(b.truck))
    setActiveSlots(slots)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    load()
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel(`semis-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tractors' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trailer_list' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printroom_entries' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_movement' }, load)
      .subscribe()
    channelRef.current = ch
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [load])

  const COLS = 3
  const COL_COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6']
  const colGroups: ActiveSlot[][] = [[], [], []]
  activeSlots.forEach((s, i) => colGroups[i % COLS].push(s))
  const maxRows = Math.max(...colGroups.map(g => g.length), 0)

  return (
    <RequirePage pageKey="drivers_semis">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">🚛 Tonight&apos;s Semi Assignments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Only showing tractors currently in Printroom or Live Movement</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
          <span className="text-[10px] text-gray-500">{lastUpdate}</span>
        </div>
      </div>

      {activeSlots.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-3">🚛</div>
          <div className="font-medium">No semis in Printroom or Live Movement yet.</div>
          <div className="text-xs mt-1 text-gray-600">Add them to the printroom and they&apos;ll appear here automatically.</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: 480 }}>
            <thead>
              <tr>
                {[0, 1, 2].map(ci => (
                  <>
                    <th key={`h-truck-${ci}`}
                      className="px-3 py-2 text-center font-bold text-black text-xs border border-gray-600"
                      style={{ background: COL_COLORS[ci], minWidth: 80 }}>
                      Truck #
                    </th>
                    <th key={`h-trailer-${ci}`}
                      className="px-3 py-2 text-center font-bold text-black text-xs border border-gray-600"
                      style={{ background: COL_COLORS[ci], minWidth: 80 }}>
                      Trailer #
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }).map((_, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#141414]'}>
                  {[0, 1, 2].map(ci => {
                    const cell = colGroups[ci][ri]
                    const color = COL_COLORS[ci]
                    if (!cell) return (
                      <>
                        <td key={`empty-truck-${ci}`} className="border border-[#333] px-3 py-1.5" />
                        <td key={`empty-trailer-${ci}`} className="border border-[#333] px-3 py-1.5" />
                      </>
                    )
                    return (
                      <>
                        <td key={`truck-${ci}`}
                          className="border border-[#333] px-3 py-1.5 font-bold text-center"
                          style={{ color }}>
                          {cell.truck}
                        </td>
                        <td key={`trailer-${ci}`}
                          className="border border-[#333] px-3 py-1.5 text-center font-semibold text-white">
                          {cell.trailer}
                        </td>
                      </>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSlots.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {new Set(activeSlots.map(s => s.tractorNum)).size}
            </div>
            <div className="text-xs text-gray-500 mt-1">Active Tractors</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{activeSlots.length}</div>
            <div className="text-xs text-gray-500 mt-1">Trailers Out Tonight</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {new Set(
                activeSlots
                  .filter(s => activeSlots.filter(x => x.tractorNum === s.tractorNum).length >= 2)
                  .map(s => s.tractorNum)
              ).size}
            </div>
            <div className="text-xs text-gray-500 mt-1">Double Pulls</div>
          </div>
        </div>
      )}
    </div>
    </RequirePage>
  )
}
