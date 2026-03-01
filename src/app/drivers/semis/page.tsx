'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Tractor, TrailerItem } from '@/lib/types'
import RequirePage from '@/components/RequirePage'

export default function SemiTrailerList() {
  const [tractors, setTractors] = useState<Tractor[]>([])
  const [lastUpdate, setLastUpdate] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('tractors')
      .select('*, trailer_1:trailer_list!tractors_trailer_1_id_fkey(*), trailer_2:trailer_list!tractors_trailer_2_id_fkey(*), trailer_3:trailer_list!tractors_trailer_3_id_fkey(*), trailer_4:trailer_list!tractors_trailer_4_id_fkey(*)')
      .eq('is_active', true)
      .order('truck_number')
    if (data) setTractors(data)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    load()
    const channel = supabase.channel('semis-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tractors' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trailer_list' }, load)
      .subscribe()
    const poll = setInterval(load, 2_000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [load])

  // Build rows: one row per tractor-trailer slot pair
  // Group by tractor, show each trailer as a sub-row
  // Match your screenshot format: Truck# | Trailer# | Truck# | Trailer# | Truck# | Trailer#
  // Split tractors into groups of 3 columns
  const COLS = 3
  const activeTractors = tractors.filter(t => {
    const slots = [t.trailer_1, t.trailer_2, t.trailer_3, t.trailer_4] as (TrailerItem | null)[]
    return slots.some(s => s !== null)
  })

  // Build display rows per tractor: [{truckLabel, trailerNum}]
  const tractorRows = activeTractors.map(tractor => {
    const slots = [
      tractor.trailer_1 as TrailerItem | null,
      tractor.trailer_2 as TrailerItem | null,
      tractor.trailer_3 as TrailerItem | null,
      tractor.trailer_4 as TrailerItem | null,
    ]
    return {
      truck_number: tractor.truck_number,
      driver: tractor.driver_name,
      trailers: slots.filter(Boolean) as TrailerItem[],
      rows: slots
        .map((s, i) => ({ slot: i + 1, trailer: s }))
        .filter(r => r.trailer !== null)
        .map(r => ({
          truck: `${tractor.truck_number}-${r.slot}`,
          trailer: r.trailer!.trailer_number,
        })),
    }
  })

  // Split into column groups for the 3-column table layout
  const colGroups: typeof tractorRows[] = [[], [], []]
  tractorRows.forEach((t, i) => {
    colGroups[i % COLS].push(t)
  })

  const maxRows = Math.max(...colGroups.map(g => g.reduce((s, t) => s + t.rows.length, 0)))

  // Build flat table: each visual row is [col0_truck, col0_trailer, col1_truck, col1_trailer, col2_truck, col2_trailer]
  type CellData = { truck: string; trailer: string; firstInTractor?: boolean; color?: string } | null
  const tableRows: CellData[][] = []

  const COL_COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6']

  // Build per-column flat arrays
  const colFlat: CellData[][] = colGroups.map((group, ci) => {
    const flat: CellData[] = []
    group.forEach(tractor => {
      tractor.rows.forEach((row, ri) => {
        flat.push({ truck: row.truck, trailer: row.trailer, firstInTractor: ri === 0, color: COL_COLORS[ci] })
      })
    })
    return flat
  })

  for (let i = 0; i < maxRows; i++) {
    tableRows.push([
      colFlat[0]?.[i] ?? null,
      colFlat[1]?.[i] ?? null,
      colFlat[2]?.[i] ?? null,
    ])
  }

  return (
    <RequirePage pageKey="drivers_semis">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">🚛 Semi Trailer Daily List</h1>
          <p className="text-xs text-gray-500 mt-0.5">Auto-updates in real time</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
          <span className="text-[10px] text-gray-500">{lastUpdate}</span>
        </div>
      </div>

      {activeTractors.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No active semi assignments. Add tractors in Fleet.</div>
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
              {tableRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#141414]'}>
                  {row.map((cell, ci) => {
                    const color = COL_COLORS[ci]
                    if (!cell) {
                      return (
                        <>
                          <td key={`empty-truck-${ci}`} className="border border-[#333] px-3 py-1.5" />
                          <td key={`empty-trailer-${ci}`} className="border border-[#333] px-3 py-1.5" />
                        </>
                      )
                    }
                    return (
                      <>
                        <td key={`truck-${ci}`}
                          className="border border-[#333] px-3 py-1.5 font-bold text-center"
                          style={{
                            color,
                            borderTop: cell.firstInTractor ? `2px solid ${color}60` : undefined,
                          }}>
                          {cell.truck}
                        </td>
                        <td key={`trailer-${ci}`}
                          className="border border-[#333] px-3 py-1.5 text-center font-semibold text-white"
                          style={{
                            borderTop: cell.firstInTractor ? `2px solid ${color}60` : undefined,
                          }}>
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

      {/* Summary cards */}
      {activeTractors.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{activeTractors.length}</div>
            <div className="text-xs text-gray-500 mt-1">Active Tractors</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {tractorRows.reduce((s, t) => s + t.trailers.length, 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Trailers Out</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {tractorRows.filter(t => t.trailers.length >= 2).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Double Pulls</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {tractorRows.filter(t => t.driver).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Drivers Assigned</div>
          </div>
        </div>
      )}
    </div>
    </RequirePage>
  )
}
