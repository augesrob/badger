'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { doorStatusColor, DOOR_STATUSES } from '@/lib/types'
import type { LoadingDoor, DoorStatusValue } from '@/lib/types'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

export default function DoorStatusWindow() {
  const { profile, loading: authLoading, can } = useAuth()
  const router = useRouter()
  const [doors, setDoors] = useState<LoadingDoor[]>([])
  const [doorStatusValues, setDoorStatusValues] = useState<DoorStatusValue[]>([])

  // Strip all chrome — zero out the main wrapper and body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    const main = document.querySelector('main.badger-main') as HTMLElement | null
    if (main) {
      main.style.maxWidth = '100vw'
      main.style.width = '100vw'
      main.style.margin = '0'
      main.style.padding = '0'
    }
    return () => {
      document.body.style.overflow = ''
      if (main) { main.style.maxWidth = ''; main.style.width = ''; main.style.margin = ''; main.style.padding = '' }
    }
  }, [])

  // Auth guard
  useEffect(() => {
    if (authLoading) return
    if (!profile) { router.replace('/login?redirect=/door-status'); return }
    if (!can('movement')) router.replace('/unauthorized')
  }, [authLoading, profile, can, router])

  const fetchAll = useCallback(async () => {
    const [doorsRes, statusRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('door_status_values').select('*').order('sort_order'),
    ])
    if (doorsRes.data) setDoors(doorsRes.data)
    if (statusRes.data) setDoorStatusValues(statusRes.data)
  }, [])

  useEffect(() => {
    if (!profile || !can('movement')) return
    fetchAll()
    const channel = supabase.channel('door-window-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loading_doors' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'door_status_values' }, fetchAll)
      .subscribe()
    const poll = setInterval(fetchAll, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [fetchAll, profile, can])

  const setDoorStatus = async (doorId: number, status: string) => {
    setDoors(ds => ds.map(d => d.id === doorId ? { ...d, door_status: status } : d))
    await supabase.from('loading_doors').update({ door_status: status }).eq('id', doorId)
  }

  const statusOptions = doorStatusValues.length > 0
    ? doorStatusValues.map(s => s.status_name)
    : [...DOOR_STATUSES]

  if (authLoading || !profile || !can('movement')) {
    return (
      <div style={{ width: '100vw', height: '100dvh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#6b7280', fontSize: 13 }}>Loading...</span>
      </div>
    )
  }

  const rows = Math.ceil(doors.length / 2)

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      background: '#0f0f0f',
      padding: 6,
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: 6,
      overflow: 'hidden',
    }}>
      {doors.map(door => {
        const st = door.door_status || 'Loading'
        const col = doorStatusColor(st, doorStatusValues)
        return (
          <div key={door.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 10px',
            borderRadius: 8,
            border: `2px solid ${col}`,
            background: `${col}22`,
            overflow: 'hidden',
            minHeight: 0,
          }}>
            <span style={{
              fontWeight: 800,
              fontSize: 'clamp(12px, 3vw, 22px)',
              color: '#fff',
              minWidth: '2.2em',
              flexShrink: 0,
            }}>
              {door.door_name}
            </span>
            <select
              value={st}
              onChange={e => setDoorStatus(door.id, e.target.value)}
              style={{
                flex: 1,
                background: col,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 6px',
                fontSize: 'clamp(10px, 2vw, 15px)',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                minWidth: 0,
                width: '100%',
              }}
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )
      })}
    </div>
  )
}
