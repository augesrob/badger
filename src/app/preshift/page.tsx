'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { StagingDoor } from '@/lib/types'
import { PreShiftTable } from '@/components/PreShiftTable'
import { runPreshiftAutomation } from '@/lib/automation'
import RequirePage from '@/components/RequirePage'

export default function PreShift() {
  const toast = useToast()
  const [doors, setDoors] = useState<StagingDoor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTrucks, setActiveTrucks] = useState<Set<string>>(new Set())

  const loadDoors = useCallback(async () => {
    const { data } = await supabase.from('staging_doors').select('*').order('door_number').order('door_side')
    if (data) setDoors(data)
    setLoading(false)
  }, [])

  const loadActive = useCallback(async () => {
    const { data } = await supabase.from('live_movement').select('truck_number')
    if (data) setActiveTrucks(new Set(data.map(t => t.truck_number)))
  }, [])

  useEffect(() => {
    loadDoors()
    loadActive()
    const channel = supabase.channel('preshift-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staging_doors' }, () => loadDoors())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_movement' }, () => loadActive())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadDoors, loadActive])

  const saveField = async (id: number, field: 'in_front' | 'in_back', value: string) => {
    const { error } = await supabase.from('staging_doors').update({ [field]: value || null }).eq('id', id)
    if (error) { toast('Save failed', 'error'); return }
    // Run preshift automation rules (In Front → Ready, In Back → In Back)
    await runPreshiftAutomation()
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <RequirePage pageKey="preshift">
    <div>
      <h1 className="text-2xl font-bold mb-2">📋 PreShift Setup</h1>
      <p className="text-sm text-gray-500 mb-4">Truck Order – Door Placement. Enter truck numbers for each staging door.</p>
      <PreShiftTable doors={doors} onSave={saveField} activeTrucks={activeTrucks} />
    </div>
    </RequirePage>
  )
}
