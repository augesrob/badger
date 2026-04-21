'use client'
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

  const [sheetSyncing, setSheetSyncing] = useState(false)

  const syncFromGoogleSheet = async () => {
    setSheetSyncing(true)
    try {
      const res = await fetch('/api/sync-gsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'preshift' }),
      })
      const data = await res.json()
      if (!data.ok) { toast(`Sheet sync failed: ${data.error}`, 'error'); return }
      toast(`✅ Sheet sync: ${data.preshiftUpdated ?? 0} door(s) filled`)
      await loadDoors()
    } catch {
      toast('Sheet sync error', 'error')
    } finally {
      setSheetSyncing(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <RequirePage pageKey="preshift">
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">📋 PreShift Setup</h1>
          <p className="text-sm text-gray-500">Truck Order – Door Placement. Enter truck numbers for each staging door.</p>
        </div>
        <button
          onClick={syncFromGoogleSheet}
          disabled={sheetSyncing}
          title="Fill blank In Front / In Back from Google Sheet TruckOrder tab"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex-shrink-0 ${
            sheetSyncing
              ? 'bg-[#222] text-gray-500 border-[#333] cursor-wait'
              : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
          }`}>
          {sheetSyncing ? '⏳ Syncing...' : '📊 Sync Sheet'}
        </button>
      </div>
      <PreShiftTable doors={doors} onSave={saveField} activeTrucks={activeTrucks} />
    </div>
    </RequirePage>
  )
}
