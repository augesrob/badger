'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { doorStatusColor, DOOR_STATUSES } from '@/lib/types'
import type { LoadingDoor, DoorStatusValue } from '@/lib/types'

export default function DoorStatusWindow() {
  const [doors, setDoors] = useState<LoadingDoor[]>([])
  const [doorStatusValues, setDoorStatusValues] = useState<DoorStatusValue[]>([])
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchAll = useCallback(async () => {
    const [doorsRes, statusRes] = await Promise.all([
      supabase.from('loading_doors').select('*').order('sort_order'),
      supabase.from('door_status_values').select('*').order('sort_order'),
    ])
    if (doorsRes.data) setDoors(doorsRes.data)
    if (statusRes.data) setDoorStatusValues(statusRes.data)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    fetchAll()
    const channel = supabase.channel('door-window-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loading_doors' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'door_status_values' }, fetchAll)
      .subscribe()
    const poll = setInterval(fetchAll, 5000)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [fetchAll])

  const setDoorStatus = async (doorId: number, status: string) => {
    setDoors(ds => ds.map(d => d.id === doorId ? { ...d, door_status: status } : d))
    await supabase.from('loading_doors').update({ door_status: status }).eq('id', doorId)
  }

  const statusOptions = doorStatusValues.length > 0
    ? doorStatusValues.map(s => s.status_name)
    : [...DOOR_STATUSES]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      padding: 8,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: '#1a1a1a',
        borderRadius: 8,
        marginBottom: 8,
        border: '1px solid #333',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: '#f59e0b' }}>🚪 Door Status</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#22c55e' }}>● LIVE</span>
          <span style={{ fontSize: 10, color: '#6b7280' }}>{lastUpdate}</span>
        </div>
      </div>

      {/* Grid — always 2 columns, cells stretch to fill window */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridAutoRows: 'minmax(48px, 1fr)',
        gap: 6,
      }}>
        {doors.map(door => {
          const st = door.door_status || 'Loading'
          const col = doorStatusColor(st, doorStatusValues)
          return (
            <div key={door.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 8,
              border: `1px solid ${col}`,
              background: `${col}22`,
            }}>
              <span style={{
                fontWeight: 800,
                fontSize: 16,
                color: '#fff',
                minWidth: 38,
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
                  padding: '5px 6px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 0,
                  width: '100%',
                }}
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
