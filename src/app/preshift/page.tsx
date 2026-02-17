'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { StagingDoor } from '@/lib/types'

const posLabels = [
  { pos: 1, label: 'Front Left', bg: 'bg-white/[0.06]' },
  { pos: 3, label: 'Front Right', bg: 'bg-white/[0.06]' },
  { pos: 2, label: 'Back Left', bg: 'bg-white/[0.02]' },
  { pos: 4, label: 'Back Right', bg: 'bg-white/[0.02]' },
]

export default function PreShift() {
  const toast = useToast()
  const [doors, setDoors] = useState<StagingDoor[]>([])
  const [loading, setLoading] = useState(true)

  const loadDoors = useCallback(async () => {
    const { data } = await supabase.from('staging_doors').select('*').order('door_number')
    if (data) setDoors(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDoors()
    const channel = supabase.channel('preshift-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staging_doors' }, () => loadDoors())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadDoors])

  const savePosition = async (doorId: number, position: number, value: string) => {
    const col = `position${position}_truck`
    const { error } = await supabase.from('staging_doors').update({ [col]: value || null }).eq('id', doorId)
    if (error) toast('Save failed', 'error')
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">📋 PreShift Setup</h1>
      <p className="text-sm text-gray-500 mb-4">Staging Doors 18–28. Each door = 4-position garage. Front (lighter), Back (darker). Type truck numbers directly.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {doors.map(door => (
          <div key={door.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
            <div className="py-2 px-4 bg-[#111] border-b border-[#333] text-center">
              <span className="text-lg font-extrabold text-amber-500">Door {door.door_number}</span>
            </div>
            <div className="grid grid-cols-2 grid-rows-2 gap-[2px] p-2">
              {posLabels.map(({ pos, label, bg }) => {
                const colKey = `position${pos}_truck` as keyof StagingDoor
                return (
                  <div key={pos} className={`${bg} rounded-lg p-3 text-center`}>
                    <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">
                      {pos} - {label}
                    </label>
                    <input
                      defaultValue={(door[colKey] as string) || ''}
                      placeholder="Truck #"
                      onBlur={e => savePosition(door.id, pos, e.target.value)}
                      className="w-full text-center bg-[#222] border border-[#333] rounded px-2 py-2 text-base font-bold focus:border-amber-500 outline-none"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
