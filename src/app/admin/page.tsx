'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Truck, Trailer, StatusValue, DoorStatusValue, DockLockStatusValue, GlobalMessage, Route, TrailerItem, Tractor, AutomationRule } from '@/lib/types'
import { TTSPanel } from '@/components/TTSPanel'
import { runPreshiftAutomation, runAutomation } from '@/lib/automation'
import RoleManager from '@/components/RoleManager'
import NotificationPrefs from '@/components/NotificationPrefs'
import AutoResetConfig from './AutoResetConfig'

const NAV_ITEMS = [
  { id: 'trucks',      label: '🚚 Truck Database',   ready: true },
  { id: 'tractors',    label: '🚛 Tractor Trailers',  ready: true },
  { id: 'fleet',       label: '🚛 Fleet Inventory',   ready: true },
  { id: 'automation',  label: '⚡ Automation',         ready: true },
  { id: 'statuses',    label: '🏷️ Status Values',     ready: true },
  { id: 'routes',      label: '🗺️ Routes',            ready: true },
  { id: 'roles',       label: '🛡️ Role Manager',      ready: true },
  { id: 'reset',       label: '⚠️ Data Reset',        ready: true },
  { id: 'movement_log', label: '📋 Change Log',       ready: true },
  { id: 'notifications', label: '🔔 Notifications',   ready: true },
  { id: 'api',         label: '🔌 API',               ready: true },
  { id: 'backup',      label: '💾 Backup',             ready: true },
  { id: 'accounts',    label: '👤 Accounts',          ready: true },
  { id: 'debug',       label: '📱 Mobile Debug',      ready: true },
]

export default function Admin() {
  const toast = useToast()
  const [activeSection, setActiveSection] = useState('trucks')

  // Show Gmail auth result toast after OAuth redirect
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const gmailAuth = params.get('gmail_auth')
    if (gmailAuth === 'success') {
      toast('✅ Gmail authorized successfully!', 'success')
      window.history.replaceState({}, '', '/admin')
    } else if (gmailAuth === 'error') {
      const reason = params.get('reason') || 'unknown'
      toast(`❌ Gmail auth failed: ${reason}`, 'error')
      window.history.replaceState({}, '', '/admin')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Truck state
  const [trucks, setTrucks] = useState<(Truck & { trailers: Trailer[] })[]>([])
  const [showTruckModal, setShowTruckModal] = useState(false)
  const [editTruck, setEditTruck] = useState<Truck | null>(null)
  const [truckForm, setTruckForm] = useState({ truck_number: '', truck_type: 'box_truck', transmission: 'automatic', trailer_count: '1', notes: '' })

  // Tractor/Trailer state
  const [tractors, setTractors] = useState<Tractor[]>([])
  const [trailerList, setTrailerList] = useState<TrailerItem[]>([])
  const [showTractorModal, setShowTractorModal] = useState(false)
  const [editTractor, setEditTractor] = useState<Tractor | null>(null)
  const [tractorForm, setTractorForm] = useState({ truck_number: '', driver_name: '', driver_cell: '', trailer_1: '', trailer_2: '', trailer_3: '', trailer_4: '', notes: '' })
  const [newTrailer, setNewTrailer] = useState('')
  const [tractorTab, setTractorTab] = useState<'tractors' | 'trailers'>('tractors')

  // Status/Route state
  const [statuses, setStatuses] = useState<StatusValue[]>([])
  const [doorStatuses, setDoorStatuses] = useState<DoorStatusValue[]>([])
  const [dockLockStatuses, setDockLockStatuses] = useState<DockLockStatusValue[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [newStatus, setNewStatus] = useState({ name: '', color: '#6b7280' })
  const [newDoorStatus, setNewDoorStatus] = useState({ name: '', color: '#6b7280' })
  const [newDockLockStatus, setNewDockLockStatus] = useState({ name: '', color: '#22c55e' })
  const [newRoute, setNewRoute] = useState({ name: '', number: '' })
  const [resetLog, setResetLog] = useState<{ id: number; reset_type: string; reset_at: string; reset_by: string }[]>([])
  const [statusTab, setStatusTab] = useState<'truck' | 'door' | 'docklock'>('truck')

  // Status editing (shared for truck + door)
  const [editStatusId, setEditStatusId] = useState<number | null>(null)
  const [editStatusForm, setEditStatusForm] = useState({ name: '', color: '' })
  const [editDoorStatusId, setEditDoorStatusId] = useState<number | null>(null)
  const [editDoorStatusForm, setEditDoorStatusForm] = useState({ name: '', color: '' })
  const [editDockLockStatusId, setEditDockLockStatusId] = useState<number | null>(null)
  const [editDockLockStatusForm, setEditDockLockStatusForm] = useState({ name: '', color: '' })


  // Automation state
  const [autoRules, setAutoRules] = useState<AutomationRule[]>([])
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editRule, setEditRule] = useState<AutomationRule | null>(null)
  const [ruleForm, setRuleForm] = useState({ rule_name: '', description: '', trigger_type: 'truck_number_equals', trigger_value: '', action_type: 'set_truck_status', action_value: '', sort_order: '100' })

  const loadAll = useCallback(async () => {
    const [trucksRes, statusRes, doorStatusRes, dockLockStatusRes, routeRes, resetRes, tractorRes, trailerRes, rulesRes] = await Promise.all([
      supabase.from('trucks').select('*').order('truck_number'),
      supabase.from('status_values').select('*').order('sort_order'),
      supabase.from('door_status_values').select('*').order('sort_order'),
      supabase.from('dock_lock_status_values').select('*').order('sort_order'),
      supabase.from('routes').select('*').order('sort_order'),
      supabase.from('reset_log').select('*').order('reset_at', { ascending: false }).limit(20),
      supabase.from('tractors').select('*, trailer_1:trailer_list!tractors_trailer_1_id_fkey(*), trailer_2:trailer_list!tractors_trailer_2_id_fkey(*), trailer_3:trailer_list!tractors_trailer_3_id_fkey(*), trailer_4:trailer_list!tractors_trailer_4_id_fkey(*)').order('truck_number'),
      supabase.from('trailer_list').select('*').eq('is_active', true).order('trailer_number'),
      supabase.from('automation_rules').select('*').order('sort_order'),
    ])

    if (trucksRes.data) {
      const withTrailers = await Promise.all(trucksRes.data.map(async (truck: Truck) => {
        if (truck.truck_type === 'semi') {
          const { data: tr } = await supabase.from('trailers').select('*').eq('truck_id', truck.id).eq('is_active', true).order('trailer_number')
          return { ...truck, trailers: tr || [] }
        }
        return { ...truck, trailers: [] }
      }))
      setTrucks(withTrailers)
    }
    if (statusRes.data) setStatuses(statusRes.data)
    if (doorStatusRes.data) setDoorStatuses(doorStatusRes.data)
    if (dockLockStatusRes.data) setDockLockStatuses(dockLockStatusRes.data)
    if (routeRes.data) setRoutes(routeRes.data)
    if (resetRes.data) setResetLog(resetRes.data)
    if (tractorRes.data) setTractors(tractorRes.data)
    if (trailerRes.data) setTrailerList(trailerRes.data)
    if (rulesRes.data) setAutoRules(rulesRes.data)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tractors' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trailer_list' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_values' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_rules' }, loadAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAll])

  // === TRUCK CRUD ===
  const saveTruck = async () => {
    const num = parseInt(truckForm.truck_number)
    if (!num) { toast('Truck number required', 'error'); return }
    if (editTruck) {
      await supabase.from('trucks').update({ truck_number: num, truck_type: truckForm.truck_type, transmission: truckForm.transmission, notes: truckForm.notes || null }).eq('id', editTruck.id)
    } else {
      const { error } = await supabase.from('trucks').insert({ truck_number: num, truck_type: truckForm.truck_type, transmission: truckForm.transmission, notes: truckForm.notes || null })
      if (error) { toast(error.message.includes('unique') ? 'Truck # already exists' : error.message, 'error'); return }
    }
    setShowTruckModal(false); toast('Truck saved!'); loadAll()
  }
  const deleteTruck = async (id: number) => { if (!confirm('Delete truck?')) return; await supabase.from('trucks').delete().eq('id', id); toast('Deleted'); loadAll() }
  const openEditTruck = (t: Truck & { trailers: Trailer[] }) => { setEditTruck(t); setTruckForm({ truck_number: String(t.truck_number), truck_type: t.truck_type, transmission: t.transmission, trailer_count: String(t.trailers.length || 1), notes: t.notes || '' }); setShowTruckModal(true) }
  const openAddTruck = () => { setEditTruck(null); setTruckForm({ truck_number: '', truck_type: 'box_truck', transmission: 'automatic', trailer_count: '1', notes: '' }); setShowTruckModal(true) }

  // === TRACTOR CRUD ===
  const saveTractor = async () => {
    const num = parseInt(tractorForm.truck_number)
    if (!num) { toast('Truck number required', 'error'); return }
    const payload = {
      truck_number: num,
      driver_name: tractorForm.driver_name || null,
      driver_cell: tractorForm.driver_cell || null,
      trailer_1_id: tractorForm.trailer_1 ? Number(tractorForm.trailer_1) : null,
      trailer_2_id: tractorForm.trailer_2 ? Number(tractorForm.trailer_2) : null,
      trailer_3_id: tractorForm.trailer_3 ? Number(tractorForm.trailer_3) : null,
      trailer_4_id: tractorForm.trailer_4 ? Number(tractorForm.trailer_4) : null,
      notes: tractorForm.notes || null,
    }
    if (editTractor) {
      await supabase.from('tractors').update(payload).eq('id', editTractor.id)
    } else {
      const { error } = await supabase.from('tractors').insert(payload)
      if (error) { toast(error.message.includes('unique') ? 'Truck # already exists' : error.message, 'error'); return }
    }
    setShowTractorModal(false); toast('Tractor saved!'); loadAll()
  }
  const deleteTractor = async (id: number) => { if (!confirm('Delete tractor?')) return; await supabase.from('tractors').delete().eq('id', id); toast('Deleted'); loadAll() }
  const openEditTractor = (t: Tractor) => {
    setEditTractor(t)
    setTractorForm({
      truck_number: String(t.truck_number), driver_name: t.driver_name || '', driver_cell: t.driver_cell || '',
      trailer_1: t.trailer_1_id ? String(t.trailer_1_id) : '', trailer_2: t.trailer_2_id ? String(t.trailer_2_id) : '',
      trailer_3: t.trailer_3_id ? String(t.trailer_3_id) : '', trailer_4: t.trailer_4_id ? String(t.trailer_4_id) : '',
      notes: t.notes || '',
    })
    setShowTractorModal(true)
  }
  const openAddTractor = () => {
    setEditTractor(null)
    setTractorForm({ truck_number: '', driver_name: '', driver_cell: '', trailer_1: '', trailer_2: '', trailer_3: '', trailer_4: '', notes: '' })
    setShowTractorModal(true)
  }

  // === TRAILER LIST CRUD ===
  const addTrailer = async () => {
    if (!newTrailer.trim()) { toast('Enter trailer number', 'error'); return }
    const { error } = await supabase.from('trailer_list').insert({ trailer_number: newTrailer.trim() })
    if (error) { toast('Trailer already exists', 'error'); return }
    setNewTrailer(''); toast('Trailer added'); loadAll()
  }
  const deleteTrailer = async (id: number) => { if (!confirm('Delete trailer?')) return; await supabase.from('trailer_list').delete().eq('id', id); toast('Deleted'); loadAll() }

  // === STATUS CRUD ===
  const addStatus = async () => {
    if (!newStatus.name) { toast('Enter status name', 'error'); return }
    const maxOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.sort_order)) + 1 : 1
    const { error } = await supabase.from('status_values').insert({ status_name: newStatus.name, status_color: newStatus.color, sort_order: maxOrder })
    if (error) { toast('Already exists', 'error'); return }
    setNewStatus({ name: '', color: '#6b7280' }); toast('Status added'); loadAll()
  }
  const deleteStatus = async (id: number) => { if (!confirm('Delete?')) return; await supabase.from('status_values').delete().eq('id', id); loadAll() }

  // === ROUTE CRUD ===
  const addRoute = async () => {
    if (!newRoute.name) { toast('Enter route name', 'error'); return }
    await supabase.from('routes').insert({ route_name: newRoute.name, route_number: newRoute.number || null })
    setNewRoute({ name: '', number: '' }); toast('Route added'); loadAll()
  }
  const deleteRoute = async (id: number) => { if (!confirm('Delete?')) return; await supabase.from('routes').delete().eq('id', id); loadAll() }

  // === AUTOMATION CRUD ===
  const saveRule = async () => {
    if (!ruleForm.rule_name) { toast('Rule name required', 'error'); return }
    const payload = {
      rule_name: ruleForm.rule_name,
      description: ruleForm.description || null,
      trigger_type: ruleForm.trigger_type,
      trigger_value: ruleForm.trigger_value || null,
      action_type: ruleForm.action_type,
      action_value: ruleForm.action_value,
      sort_order: parseInt(ruleForm.sort_order) || 100,
    }
    if (editRule) {
      await supabase.from('automation_rules').update(payload).eq('id', editRule.id)
    } else {
      await supabase.from('automation_rules').insert(payload)
    }
    setShowRuleModal(false); toast('Rule saved!'); loadAll()
  }
  const deleteRule = async (id: number) => { if (!confirm('Delete rule?')) return; await supabase.from('automation_rules').delete().eq('id', id); loadAll() }
  const toggleRule = async (id: number, active: boolean) => { await supabase.from('automation_rules').update({ is_active: !active }).eq('id', id); loadAll() }
  const openEditRule = (r: AutomationRule) => {
    setEditRule(r)
    setRuleForm({ rule_name: r.rule_name, description: r.description || '', trigger_type: r.trigger_type, trigger_value: r.trigger_value || '', action_type: r.action_type, action_value: r.action_value, sort_order: String(r.sort_order) })
    setShowRuleModal(true)
  }
  const openAddRule = () => {
    setEditRule(null)
    setRuleForm({ rule_name: '', description: '', trigger_type: 'truck_number_equals', trigger_value: '', action_type: 'set_truck_status', action_value: '', sort_order: '100' })
    setShowRuleModal(true)
  }

  const [syncing, setSyncing] = useState(false)
  const forceSync = async () => {
    setSyncing(true)
    try {
      // Run preshift automation for all current preshift positions
      await runPreshiftAutomation()

      // Run printroom automation for all current printroom entries
      const { data: entries } = await supabase.from('printroom_entries').select('*').not('truck_number', 'is', null)
      if (entries) {
        for (const entry of entries) {
          if (entry.truck_number && entry.truck_number !== 'end') {
            await runAutomation({
              truck_number: entry.truck_number,
              loading_door_id: entry.loading_door_id,
              is_end_marker: entry.is_end_marker || false,
              batch_number: entry.batch_number,
              row_order: entry.row_order,
            })
          }
        }
        // Also run END markers
        for (const entry of entries) {
          if (entry.is_end_marker) {
            await runAutomation({
              truck_number: entry.truck_number || 'end',
              loading_door_id: entry.loading_door_id,
              is_end_marker: true,
              batch_number: entry.batch_number,
              row_order: entry.row_order,
            })
          }
        }
      }
      toast('Force sync complete — all rules re-evaluated')
    } catch {
      toast('Sync failed', 'error')
    }
    setSyncing(false)
  }

  // === RESET ===
  const resetData = async (type: string) => {
    if (type === 'all') { const input = prompt('Type RESET to confirm:'); if (input !== 'RESET') return }
    else { if (!confirm(`Reset ${type}?`)) return }
    if (type === 'printroom' || type === 'all') { await supabase.from('printroom_entries').delete().neq('id', 0); await supabase.from('loading_doors').update({ is_done_for_night: false, door_status: 'Loading' }).neq('id', 0) }
    if (type === 'preshift' || type === 'all') { await supabase.from('staging_doors').update({ in_front: null, in_back: null }).neq('id', 0) }
    if (type === 'movement' || type === 'all') { await supabase.from('live_movement').delete().neq('id', 0) }
    if (type === 'all') { await supabase.from('movement_log').delete().neq('id', 0) }
    if (type === 'documents' || type === 'all') {
      localStorage.removeItem('badger-routesheet-v1')
      localStorage.removeItem('badger-cheatsheet-v1')
    }
    await supabase.from('reset_log').insert({ reset_type: type, reset_by: 'manual' })
    toast(`Reset ${type} complete`); loadAll()
  }

  const typeIcons: Record<string, string> = { box_truck: '🚚 Box', van: '🚐 Van', tandem: '🚛 Tandem', semi: '🚛 Semi' }
  const getTrailerNum = (t: Tractor, slot: 1|2|3|4): string => {
    const trailer = t[`trailer_${slot}` as keyof Tractor] as TrailerItem | null
    return trailer?.trailer_number || '—'
  }

  const startEditStatus = (s: StatusValue) => {
    setEditStatusId(s.id)
    setEditStatusForm({ name: s.status_name, color: s.status_color })
  }
  const saveEditStatus = async () => {
    if (!editStatusId || !editStatusForm.name) return
    await supabase.from('status_values').update({ status_name: editStatusForm.name, status_color: editStatusForm.color }).eq('id', editStatusId)
    setEditStatusId(null)
    toast('Status updated')
    loadAll()
  }

  // === DOOR STATUS CRUD ===
  const addDoorStatus = async () => {
    if (!newDoorStatus.name) { toast('Enter status name', 'error'); return }
    const maxOrder = doorStatuses.length > 0 ? Math.max(...doorStatuses.map(s => s.sort_order)) + 1 : 1
    const { error } = await supabase.from('door_status_values').insert({ status_name: newDoorStatus.name, status_color: newDoorStatus.color, sort_order: maxOrder })
    if (error) { toast('Already exists', 'error'); return }
    setNewDoorStatus({ name: '', color: '#6b7280' }); toast('Door status added'); loadAll()
  }
  const deleteDoorStatus = async (id: number) => { if (!confirm('Delete?')) return; await supabase.from('door_status_values').delete().eq('id', id); loadAll() }
  const startEditDoorStatus = (s: DoorStatusValue) => { setEditDoorStatusId(s.id); setEditDoorStatusForm({ name: s.status_name, color: s.status_color }) }
  const saveEditDoorStatus = async () => {
    if (!editDoorStatusId || !editDoorStatusForm.name) return
    await supabase.from('door_status_values').update({ status_name: editDoorStatusForm.name, status_color: editDoorStatusForm.color }).eq('id', editDoorStatusId)
    setEditDoorStatusId(null); toast('Door status updated'); loadAll()
  }

  // === DOCK LOCK STATUS CRUD ===
  const addDockLockStatus = async () => {
    if (!newDockLockStatus.name) { toast('Enter status name', 'error'); return }
    const maxOrder = dockLockStatuses.length > 0 ? Math.max(...dockLockStatuses.map(s => s.sort_order)) + 1 : 1
    const { error } = await supabase.from('dock_lock_status_values').insert({ status_name: newDockLockStatus.name, status_color: newDockLockStatus.color, sort_order: maxOrder })
    if (error) { toast('Already exists', 'error'); return }
    setNewDockLockStatus({ name: '', color: '#22c55e' }); toast('Dock lock status added'); loadAll()
  }
  const deleteDockLockStatus = async (id: number) => { if (!confirm('Delete?')) return; await supabase.from('dock_lock_status_values').delete().eq('id', id); loadAll() }
  const startEditDockLockStatus = (s: DockLockStatusValue) => { setEditDockLockStatusId(s.id); setEditDockLockStatusForm({ name: s.status_name, color: s.status_color }) }
  const saveEditDockLockStatus = async () => {
    if (!editDockLockStatusId || !editDockLockStatusForm.name) return
    await supabase.from('dock_lock_status_values').update({ status_name: editDockLockStatusForm.name, status_color: editDockLockStatusForm.color }).eq('id', editDockLockStatusId)
    setEditDockLockStatusId(null); toast('Dock lock status updated'); loadAll()
  }


  const StatusChip = ({ s, editId, editForm, setEditForm, onSave, onCancel, onEdit, onDelete }: {
    s: StatusValue | DoorStatusValue
    editId: number | null
    editForm: { name: string; color: string }
    setEditForm: (f: { name: string; color: string }) => void
    onSave: () => void
    onCancel: () => void
    onEdit: () => void
    onDelete: () => void
  }) => (
    <div className="flex items-center gap-1.5">
      {editId === s.id ? (
        <div className="flex items-center gap-1.5 bg-[#222] rounded-lg px-2 py-1.5 border border-amber-500/50">
          <input type="color" value={editForm.color}
            onChange={e => setEditForm({ ...editForm, color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 flex-shrink-0" />
          <input value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
            autoFocus className="input-field text-xs py-1 w-28" />
          <button onClick={onSave} className="text-green-500 hover:text-green-400 text-xs font-bold">✓</button>
          <button onClick={onCancel} className="text-gray-500 hover:text-white text-xs">✕</button>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 rounded-lg pl-0.5 pr-1 py-0.5 hover:bg-white/5 group">
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-white cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: s.status_color }} onClick={onEdit} title="Click to edit">
            {s.status_name}
          </span>
          <button onClick={onEdit} className="text-gray-600 hover:text-white text-[10px] opacity-0 group-hover:opacity-100">✏️</button>
          <button onClick={onDelete} className="text-red-500/20 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100">&times;</button>
        </div>
      )}
    </div>
  )

  const statusSectionJSX = () => (
    <div>
      <h2 className="text-xl font-bold mb-1">🏷️ Status Values</h2>
      <p className="text-xs text-gray-500 mb-4">Changes sync instantly to the Android app and TTS announcements.</p>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-[#111] rounded-lg p-1 w-fit">
        <button onClick={() => setStatusTab('truck')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusTab === 'truck' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
          🚚 Truck Statuses ({statuses.length})
        </button>
        <button onClick={() => setStatusTab('door')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusTab === 'door' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
          🚪 Door Statuses ({doorStatuses.length})
        </button>
        <button onClick={() => setStatusTab('docklock')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusTab === 'docklock' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
          🔒 Dock Lock ({dockLockStatuses.length})
        </button>
      </div>

      {statusTab === 'truck' ? (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[11px] text-gray-500 mb-3">Used on Live Movement, voice commands, and TTS announcements.</p>
          <div className="flex gap-2 mb-4 flex-wrap items-end">
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status Name</label>
              <input value={newStatus.name} onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addStatus()} placeholder="e.g. In Door" className="input-field" /></div>
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color</label>
              <input type="color" value={newStatus.color} onChange={e => setNewStatus({ ...newStatus, color: e.target.value })} className="w-10 h-[38px] rounded cursor-pointer border-0" /></div>
            <button onClick={addStatus} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <StatusChip key={s.id} s={s}
                editId={editStatusId} editForm={editStatusForm} setEditForm={setEditStatusForm}
                onSave={saveEditStatus} onCancel={() => setEditStatusId(null)}
                onEdit={() => startEditStatus(s)} onDelete={() => deleteStatus(s.id)} />
            ))}
            {statuses.length === 0 && <p className="text-sm text-gray-500">No truck statuses yet.</p>}
          </div>
        </div>
      ) : statusTab === 'door' ? (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[11px] text-gray-500 mb-3">Used on Loading Doors (12A, 13A, etc.), voice commands, and the Android app.</p>
          <div className="flex gap-2 mb-4 flex-wrap items-end">
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status Name</label>
              <input value={newDoorStatus.name} onChange={e => setNewDoorStatus({ ...newDoorStatus, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addDoorStatus()} placeholder="e.g. Loading" className="input-field" /></div>
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color</label>
              <input type="color" value={newDoorStatus.color} onChange={e => setNewDoorStatus({ ...newDoorStatus, color: e.target.value })} className="w-10 h-[38px] rounded cursor-pointer border-0" /></div>
            <button onClick={addDoorStatus} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {doorStatuses.map(s => (
              <StatusChip key={s.id} s={s}
                editId={editDoorStatusId} editForm={editDoorStatusForm} setEditForm={setEditDoorStatusForm}
                onSave={saveEditDoorStatus} onCancel={() => setEditDoorStatusId(null)}
                onEdit={() => startEditDoorStatus(s)} onDelete={() => deleteDoorStatus(s.id)} />
            ))}
            {doorStatuses.length === 0 && <p className="text-sm text-gray-500">No door statuses yet.</p>}
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[11px] text-gray-500 mb-3">Controls the dock lock chip on doors 13A–15B in Movement and Android. Changes sync live to app.</p>
          <div className="flex gap-2 mb-4 flex-wrap items-end">
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status Name</label>
              <input value={newDockLockStatus.name} onChange={e => setNewDockLockStatus({ ...newDockLockStatus, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addDockLockStatus()} placeholder="e.g. Working" className="input-field" /></div>
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color</label>
              <input type="color" value={newDockLockStatus.color} onChange={e => setNewDockLockStatus({ ...newDockLockStatus, color: e.target.value })} className="w-10 h-[38px] rounded cursor-pointer border-0" /></div>
            <button onClick={addDockLockStatus} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {dockLockStatuses.map(s => (
              <StatusChip key={s.id} s={s}
                editId={editDockLockStatusId} editForm={editDockLockStatusForm} setEditForm={setEditDockLockStatusForm}
                onSave={saveEditDockLockStatus} onCancel={() => setEditDockLockStatusId(null)}
                onEdit={() => startEditDockLockStatus(s)} onDelete={() => deleteDockLockStatus(s.id)} />
            ))}
            {dockLockStatuses.length === 0 && <p className="text-sm text-gray-500">No dock lock statuses yet. Add &quot;Working&quot; and &quot;Not Working&quot; to get started.</p>}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex gap-0 -mx-4 -mt-4" style={{ minHeight: 'calc(100vh - 49px)' }}>
      {/* LEFT SIDEBAR NAV */}
      <div className="w-[220px] flex-shrink-0 bg-[#111] border-r border-[#333] py-4 hidden md:block">
        <h2 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Admin Settings</h2>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => item.ready && setActiveSection(item.id)}
            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2
              ${activeSection === item.id ? 'bg-amber-500/10 text-amber-500 border-r-2 border-amber-500' : ''}
              ${item.ready ? 'hover:bg-white/5 text-gray-300 cursor-pointer' : 'text-gray-600 cursor-not-allowed'}`}>
            {item.label}
            {!item.ready && <span className="ml-auto text-[9px] bg-[#222] text-gray-500 px-1.5 py-0.5 rounded">Soon</span>}
          </button>
        ))}
      </div>

      {/* MOBILE NAV */}
      <div className="md:hidden w-full">
        <div className="flex overflow-x-auto border-b border-[#333] bg-[#111] px-2 py-1 gap-1">
          {NAV_ITEMS.filter(i => i.ready).map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`whitespace-nowrap px-3 py-2 text-xs font-medium rounded-lg transition-colors flex-shrink-0
                ${activeSection === item.id ? 'bg-amber-500/20 text-amber-500' : 'text-gray-400 hover:text-white'}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-4">{renderSection()}</div>
      </div>

      {/* RIGHT CONTENT - desktop */}
      <div className="flex-1 p-6 overflow-auto hidden md:block">{renderSection()}</div>

      {/* TRUCK MODAL */}
      {showTruckModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-amber-500 font-bold text-lg mb-4">{editTruck ? `Edit Truck ${editTruck.truck_number}` : 'Add Truck'}</h3>
            <div className="space-y-3">
              <Field label="Truck Number"><input type="number" value={truckForm.truck_number} onChange={e => setTruckForm({ ...truckForm, truck_number: e.target.value })} className="input-field" /></Field>
              <Field label="Type">
                <select value={truckForm.truck_type} onChange={e => setTruckForm({ ...truckForm, truck_type: e.target.value })} className="input-field">
                  <option value="box_truck">🚚 Box Truck</option><option value="van">🚐 Van</option><option value="tandem">🚛 Tandem</option><option value="semi">🚛 Semi</option>
                </select>
              </Field>
              <Field label="Transmission">
                <select value={truckForm.transmission} onChange={e => setTruckForm({ ...truckForm, transmission: e.target.value })} className="input-field">
                  <option value="automatic">Automatic</option><option value="manual">Manual</option>
                </select>
              </Field>
              <Field label="Notes"><input value={truckForm.notes} onChange={e => setTruckForm({ ...truckForm, notes: e.target.value })} placeholder="Optional" className="input-field" /></Field>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveTruck} className="flex-1 bg-amber-500 text-black py-2 rounded font-bold hover:bg-amber-400">Save</button>
              <button onClick={() => setShowTruckModal(false)} className="bg-[#333] text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TRACTOR MODAL */}
      {showTractorModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
            <h3 className="text-amber-500 font-bold text-lg mb-4">{editTractor ? `Edit Tractor ${editTractor.truck_number}` : 'Add Tractor'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Driver Name"><input value={tractorForm.driver_name} onChange={e => setTractorForm({ ...tractorForm, driver_name: e.target.value })} placeholder="Robert" className="input-field" /></Field>
                <Field label="Cell #"><input value={tractorForm.driver_cell} onChange={e => setTractorForm({ ...tractorForm, driver_cell: e.target.value })} placeholder="555-1234" className="input-field" /></Field>
              </div>
              <Field label="Truck Number"><input type="number" value={tractorForm.truck_number} onChange={e => setTractorForm({ ...tractorForm, truck_number: e.target.value })} placeholder="170" className="input-field" /></Field>

              <div className="border border-[#333] rounded-lg p-3 bg-[#111]">
                <label className="text-xs text-amber-500 uppercase font-bold block mb-2">Trailer Assignments</label>
                <p className="text-[10px] text-gray-500 mb-3">Print Room: {tractorForm.truck_number || '___'}-1, {tractorForm.truck_number || '___'}-2, etc.</p>
                <div className="grid grid-cols-2 gap-2">
                  {([1,2,3,4] as const).map(n => (
                    <div key={n}>
                      <label className="text-[10px] text-gray-500 font-bold">Trailer {n} ({tractorForm.truck_number || '?'}-{n})</label>
                      <select value={tractorForm[`trailer_${n}` as keyof typeof tractorForm]} onChange={e => setTractorForm({ ...tractorForm, [`trailer_${n}`]: e.target.value })} className="input-field mt-0.5">
                        <option value="">— None —</option>
                        {trailerList.map(tl => <option key={tl.id} value={tl.id}>{tl.trailer_number}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <Field label="Notes"><input value={tractorForm.notes} onChange={e => setTractorForm({ ...tractorForm, notes: e.target.value })} placeholder="Optional" className="input-field" /></Field>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveTractor} className="flex-1 bg-amber-500 text-black py-2 rounded font-bold hover:bg-amber-400">Save</button>
              <button onClick={() => setShowTractorModal(false)} className="bg-[#333] text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* RULE MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
            <h3 className="text-amber-500 font-bold text-lg mb-4">{editRule ? 'Edit Rule' : 'Add Rule'}</h3>
            <div className="space-y-3">
              <Field label="Rule Name"><input value={ruleForm.rule_name} onChange={e => setRuleForm({ ...ruleForm, rule_name: e.target.value })} placeholder="e.g. GAP → Gap Status" className="input-field" /></Field>
              <Field label="Description"><input value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} placeholder="What does this rule do?" className="input-field" /></Field>

              <div className="border border-[#333] rounded-lg p-3 bg-[#111]">
                <label className="text-xs text-green-500 uppercase font-bold block mb-2">IF (Condition)</label>
                <div className="space-y-2">
                  <Field label="When">
                    <select value={ruleForm.trigger_type} onChange={e => setRuleForm({ ...ruleForm, trigger_type: e.target.value })} className="input-field">
                      <optgroup label="Print Room Triggers">
                        <option value="truck_number_equals">Truck # equals exactly</option>
                        <option value="truck_number_contains">Truck # contains text</option>
                        <option value="is_last_truck_with_status">Last entry in door is END</option>
                        <option value="truck_is_end_marker">Entry is an END marker</option>
                        <option value="status_equals">Truck status equals</option>
                      </optgroup>
                      <optgroup label="PreShift Triggers">
                        <option value="preshift_in_front">Truck is In Front (PreShift)</option>
                        <option value="preshift_in_back">Truck is In Back (PreShift)</option>
                      </optgroup>
                    </select>
                  </Field>
                  {!ruleForm.trigger_type.startsWith('preshift_') && (
                    <Field label="Match Value"><input value={ruleForm.trigger_value} onChange={e => setRuleForm({ ...ruleForm, trigger_value: e.target.value })} placeholder="e.g. gap, cpu, 999, END" className="input-field" /></Field>
                  )}
                </div>
              </div>

              <div className="border border-[#333] rounded-lg p-3 bg-[#111]">
                <label className="text-xs text-amber-500 uppercase font-bold block mb-2">THEN (Action)</label>
                <div className="space-y-2">
                  <Field label="Do">
                    <select value={ruleForm.action_type} onChange={e => setRuleForm({ ...ruleForm, action_type: e.target.value })} className="input-field">
                      <option value="set_truck_status">Set truck status to...</option>
                      <option value="set_door_status">Set door status to...</option>
                      <option value="set_truck_location">Set truck location to...</option>
                    </select>
                  </Field>
                  <Field label="Value">
                    {ruleForm.action_type === 'set_truck_status' ? (
                      <select value={ruleForm.action_value} onChange={e => setRuleForm({ ...ruleForm, action_value: e.target.value })} className="input-field">
                        <option value="">— Select Status —</option>
                        {statuses.map(s => <option key={s.id} value={s.status_name}>{s.status_name}</option>)}
                      </select>
                    ) : ruleForm.action_type === 'set_door_status' ? (
                      <select value={ruleForm.action_value} onChange={e => setRuleForm({ ...ruleForm, action_value: e.target.value })} className="input-field">
                        <option value="">— Select Door Status —</option>
                        {doorStatuses.map(ds => <option key={ds.id} value={ds.status_name}>{ds.status_name}</option>)}
                      </select>
                    ) : (
                      <input value={ruleForm.action_value} onChange={e => setRuleForm({ ...ruleForm, action_value: e.target.value })} placeholder="Value..." className="input-field" />
                    )}
                  </Field>
                </div>
              </div>

              <Field label="Priority (lower = runs first)"><input type="number" value={ruleForm.sort_order} onChange={e => setRuleForm({ ...ruleForm, sort_order: e.target.value })} className="input-field w-24" /></Field>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveRule} className="flex-1 bg-amber-500 text-black py-2 rounded font-bold hover:bg-amber-400">Save Rule</button>
              <button onClick={() => setShowRuleModal(false)} className="bg-[#333] text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function FleetSection() {
    const [truckUsage, setFleetData] = useState<{ truck: { id: number; truck_number: number; truck_type: string; is_active: boolean; transmission: string; notes: string | null }; inUse: boolean; door?: string; status?: string; statusColor?: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [viewFilter, setViewFilter] = useState<'all' | 'in_use' | 'available'>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    useEffect(() => {
      const load = async () => {
        setLoading(true)
        const [trucksRes, movementRes, printroomRes] = await Promise.all([
          supabase.from('trucks').select('*').eq('is_active', true).order('truck_number'),
          supabase.from('live_movement').select('*, status_values(status_name, status_color)'),
          supabase.from('printroom_entries').select('*, loading_doors(door_name)').not('truck_number', 'is', null),
        ])
        const trucks = trucksRes.data || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mvLookup: Record<string, any> = {}
        ;(movementRes.data || []).forEach((m: Record<string, unknown>) => { mvLookup[m.truck_number as string] = m })
        const doorLookup: Record<string, string> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(printroomRes.data || []).forEach((p: any) => { if (p.truck_number) doorLookup[p.truck_number] = p.loading_doors?.door_name || '' })

        setFleetData(trucks.map(t => {
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
        }))
        setLoading(false)
      }
      load()
    }, [])

    const typeIcons2: Record<string, string> = { box_truck: '🚚 Box', van: '🚐 Van', tandem: '🚛 Tandem', semi: '🚛 Semi' }
    const inUseCount = truckUsage.filter(t => t.inUse).length
    const availCount = truckUsage.filter(t => !t.inUse).length

    const filtered = truckUsage.filter(t => {
      if (viewFilter === 'in_use' && !t.inUse) return false
      if (viewFilter === 'available' && t.inUse) return false
      if (typeFilter !== 'all' && t.truck.truck_type !== typeFilter) return false
      return true
    })

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">🚛 Fleet Inventory</h2>
          <a href="/fleet" target="_blank" className="text-xs text-amber-500 hover:underline">Open full page ↗</a>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading fleet data...</div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-white">{truckUsage.length}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Total Fleet</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-green-400">{inUseCount}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">In Use</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-amber-500">{availCount}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Available</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap mb-4">
              {(['all', 'in_use', 'available'] as const).map(f => (
                <button key={f} onClick={() => setViewFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${viewFilter === f ? 'bg-amber-500 text-black' : 'bg-[#222] text-gray-400 hover:text-white'}`}>
                  {f === 'all' ? `All (${truckUsage.length})` : f === 'in_use' ? `In Use (${inUseCount})` : `Available (${availCount})`}
                </button>
              ))}
              <div className="w-px bg-[#333] mx-1" />
              {['all', 'box_truck', 'van', 'tandem', 'semi'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${typeFilter === t ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : 'bg-[#222] text-gray-400 hover:text-white'}`}>
                  {t === 'all' ? '🚛 All Types' : typeIcons2[t]}
                </button>
              ))}
            </div>

            {/* Truck Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {filtered.map(({ truck, inUse, door, status, statusColor }) => (
                <div key={truck.id} className={`rounded-xl p-3 border transition-colors ${inUse ? 'bg-[#1a1a1a] border-green-800/50' : 'bg-[#1a1a1a] border-[#2a2a2a]'}`}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xl font-extrabold text-amber-500">{truck.truck_number}</span>
                    <span className="text-[9px] text-gray-600">{typeIcons2[truck.truck_type]?.split(' ')[1] || ''}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{typeIcons2[truck.truck_type]?.split(' ')[0]} {typeIcons2[truck.truck_type]?.split(' ')[1]}</div>
                  {inUse ? (
                    <div>
                      {door && <div className="text-[10px] text-amber-400">📍 {door}</div>}
                      {status && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ background: statusColor || '#444' }}>{status}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-green-500 font-medium">Available</div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">No trucks match filter.</div>}
            </div>
          </>
        )}
      </div>
    )
  }

  function ChangeLogSection() {
    const [logs, setLogs] = useState<{ id: number; changed_at: string; changed_by: string | null; truck_number: string | null; field_changed: string; old_value: string | null; new_value: string | null; door_name: string | null }[]>([])
    const [loading, setLoading] = useState(true)
    const [filterField, setFilterField] = useState('')
    const [filterUser, setFilterUser] = useState('')
    const [filterTruck, setFilterTruck] = useState('')

    useEffect(() => {
      setLoading(true)
      supabase.from('movement_log').select('*').order('changed_at', { ascending: false }).limit(200)
        .then(({ data }) => { setLogs(data || []); setLoading(false) })
    }, [])

    const FIELD_LABELS: Record<string, string> = {
      truck_status: '🚚 Truck Status',
      door_status: '🚪 Door Status',
      dock_lock: '🔒 Dock Lock',
    }

    const filtered = logs.filter(l => {
      if (filterField && l.field_changed !== filterField) return false
      if (filterUser && !(l.changed_by || '').toLowerCase().includes(filterUser.toLowerCase())) return false
      if (filterTruck && !(l.truck_number || l.door_name || '').toLowerCase().includes(filterTruck.toLowerCase())) return false
      return true
    })

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">📋 Movement Change Log</h2>
            <p className="text-xs text-gray-500 mt-1">Every truck status, door status, and dock lock change on the Movement page.</p>
          </div>
          <button onClick={() => {
            setLoading(true)
            supabase.from('movement_log').select('*').order('changed_at', { ascending: false }).limit(200)
              .then(({ data }) => { setLogs(data || []); setLoading(false) })
          }} className="text-xs text-amber-500 hover:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <select value={filterField} onChange={e => setFilterField(e.target.value)} className="input-field text-sm w-auto">
            <option value="">All Types</option>
            <option value="truck_status">🚚 Truck Status</option>
            <option value="door_status">🚪 Door Status</option>
            <option value="dock_lock">🔒 Dock Lock</option>
          </select>
          <input value={filterUser} onChange={e => setFilterUser(e.target.value)} placeholder="Filter by user..." className="input-field text-sm w-40" />
          <input value={filterTruck} onChange={e => setFilterTruck(e.target.value)} placeholder="Truck # or door..." className="input-field text-sm w-40" />
          {(filterField || filterUser || filterTruck) && (
            <button onClick={() => { setFilterField(''); setFilterUser(''); setFilterTruck('') }} className="text-xs text-gray-500 hover:text-white">✕ Clear</button>
          )}
          <span className="text-xs text-gray-500 ml-auto self-center">{filtered.length} entries</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No log entries yet. Changes on the Movement page will appear here.</div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-amber-500 uppercase border-b border-[#333] bg-[#111]">
                    <th className="py-2.5 px-3 text-left">Time</th>
                    <th className="px-3 text-left">Who</th>
                    <th className="px-3 text-left">Type</th>
                    <th className="px-3 text-left">Target</th>
                    <th className="px-3 text-left">From</th>
                    <th className="px-3 text-left">To</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2 px-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(l.changed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      </td>
                      <td className="px-3 text-xs font-medium text-white">{l.changed_by || '—'}</td>
                      <td className="px-3 text-xs">{FIELD_LABELS[l.field_changed] || l.field_changed}</td>
                      <td className="px-3 text-xs font-bold text-amber-500">
                        {l.truck_number ? `Truck ${l.truck_number}` : l.door_name ? `Door ${l.door_name}` : '—'}
                      </td>
                      <td className="px-3 text-xs text-gray-500">{l.old_value || <span className="text-gray-600 italic">none</span>}</td>
                      <td className="px-3 text-xs text-green-400 font-medium">{l.new_value || <span className="text-gray-600 italic">none</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }


    switch (activeSection) {
      case 'trucks': return <TruckSection />
      case 'tractors': return <TractorSection />
      case 'fleet': return <FleetSection />
      case 'automation': return <AutomationSection />
      case 'statuses': return statusSectionJSX()
      case 'routes': return <RouteSection />
      case 'roles': return <RoleManager />
      case 'reset': return <ResetSection />
      case 'movement_log': return <ChangeLogSection />
      case 'notifications': return <NotificationsSection />
      case 'api': return <ApiSection />
      case 'backup': return <BackupSection />
      case 'accounts': return <AccountsSection />
      case 'debug': return <DebugSection />
      default: return <PlannedSection title={NAV_ITEMS.find(n => n.id === activeSection)?.label || ''} />
    }
  }

  function TruckSection() {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-xl font-bold">🚚 Truck Database</h2><p className="text-xs text-gray-500 mt-1">Protected — never auto-deleted during resets</p></div>
          <button onClick={openAddTruck} className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400">+ Add Truck</button>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-amber-500 uppercase border-b border-[#333] bg-[#111]">
              <th className="py-2.5 px-3 text-left">Truck#</th><th className="text-left px-3">Type</th><th className="text-left px-3">Trans.</th><th className="text-left px-3">Notes</th><th className="px-3"></th>
            </tr></thead>
            <tbody>
              {trucks.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-extrabold text-amber-500 text-lg">{t.truck_number}</td>
                  <td className="px-3">{typeIcons[t.truck_type]}</td>
                  <td className="px-3">{t.transmission === 'manual' ? '⚙️ Manual' : '🅰️ Auto'}</td>
                  <td className="px-3 text-xs text-gray-500">{t.notes || ''}</td>
                  <td className="px-3 text-right">
                    <button onClick={() => openEditTruck(t)} className="text-gray-400 hover:text-white mr-2">✏️</button>
                    <button onClick={() => deleteTruck(t.id)} className="text-red-500/50 hover:text-red-500">✕</button>
                  </td>
                </tr>
              ))}
              {trucks.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-gray-500">No trucks. Click + Add Truck.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function TractorSection() {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-xl font-bold">🚛 Tractor Trailer Database</h2><p className="text-xs text-gray-500 mt-1">Assign trailers to tractors. Print Room uses format: 170-1, 170-2, etc.</p></div>
        </div>

        {/* Sub-tabs: Tractors / Trailers */}
        <div className="flex gap-1 mb-4 bg-[#111] rounded-lg p-1 w-fit">
          <button onClick={() => setTractorTab('tractors')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tractorTab === 'tractors' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
            🚛 Tractors ({tractors.length})
          </button>
          <button onClick={() => setTractorTab('trailers')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tractorTab === 'trailers' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
            📦 Trailer List ({trailerList.length})
          </button>
        </div>

        {tractorTab === 'tractors' ? (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={openAddTractor} className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400">+ Add Tractor</button>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
              {/* Desktop table */}
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="text-xs text-amber-500 uppercase border-b border-[#333] bg-[#111]">
                  <th className="py-2.5 px-3 text-left">Driver</th>
                  <th className="px-3 text-left">Cell</th>
                  <th className="px-3 text-left">Truck#</th>
                  <th className="px-3 text-left">Trailer 1</th>
                  <th className="px-3 text-left">Trailer 2</th>
                  <th className="px-3 text-left">Trailer 3</th>
                  <th className="px-3 text-left">Trailer 4</th>
                  <th className="px-3"></th>
                </tr></thead>
                <tbody>
                  {tractors.map(t => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-bold text-white">{t.driver_name || '—'}</td>
                      <td className="px-3 text-xs text-gray-400">{t.driver_cell || '—'}</td>
                      <td className="px-3 font-extrabold text-amber-500 text-lg">{t.truck_number}</td>
                      <td className="px-3">
                        <span className="text-xs text-gray-500">{t.truck_number}-1:</span>{' '}
                        <span className="font-bold text-green-400">{getTrailerNum(t, 1)}</span>
                      </td>
                      <td className="px-3">
                        <span className="text-xs text-gray-500">{t.truck_number}-2:</span>{' '}
                        <span className="font-bold text-blue-400">{getTrailerNum(t, 2)}</span>
                      </td>
                      <td className="px-3">
                        <span className="text-xs text-gray-500">{t.truck_number}-3:</span>{' '}
                        <span className="font-bold text-purple-400">{getTrailerNum(t, 3)}</span>
                      </td>
                      <td className="px-3">
                        <span className="text-xs text-gray-500">{t.truck_number}-4:</span>{' '}
                        <span className="font-bold text-pink-400">{getTrailerNum(t, 4)}</span>
                      </td>
                      <td className="px-3 text-right">
                        <button onClick={() => openEditTractor(t)} className="text-gray-400 hover:text-white mr-2">✏️</button>
                        <button onClick={() => deleteTractor(t.id)} className="text-red-500/50 hover:text-red-500">✕</button>
                      </td>
                    </tr>
                  ))}
                  {tractors.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-gray-500">No tractors. Add trailers first, then add tractors.</td></tr>}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-white/5">
                {tractors.map(t => (
                  <div key={t.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-extrabold text-amber-500">{t.truck_number}</span>
                        <div>
                          <div className="font-bold text-white text-sm">{t.driver_name || '—'}</div>
                          <div className="text-xs text-gray-500">{t.driver_cell || ''}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditTractor(t)} className="text-gray-400 hover:text-white">✏️</button>
                        <button onClick={() => deleteTractor(t.id)} className="text-red-500/50 hover:text-red-500">✕</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-[#222] rounded px-2 py-1"><span className="text-gray-500">{t.truck_number}-1:</span> <span className="font-bold text-green-400">{getTrailerNum(t, 1)}</span></div>
                      <div className="bg-[#222] rounded px-2 py-1"><span className="text-gray-500">{t.truck_number}-2:</span> <span className="font-bold text-blue-400">{getTrailerNum(t, 2)}</span></div>
                      <div className="bg-[#222] rounded px-2 py-1"><span className="text-gray-500">{t.truck_number}-3:</span> <span className="font-bold text-purple-400">{getTrailerNum(t, 3)}</span></div>
                      <div className="bg-[#222] rounded px-2 py-1"><span className="text-gray-500">{t.truck_number}-4:</span> <span className="font-bold text-pink-400">{getTrailerNum(t, 4)}</span></div>
                    </div>
                  </div>
                ))}
                {tractors.length === 0 && <div className="py-10 text-center text-gray-500 text-sm">No tractors. Add trailers first, then add tractors.</div>}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-4">
              <div className="flex gap-2 items-end mb-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Add Trailer</label>
                  <input value={newTrailer} onChange={e => setNewTrailer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTrailer()}
                    placeholder="Trailer # (e.g. 203)" className="input-field" />
                </div>
                <button onClick={addTrailer} className="bg-amber-500 text-black px-4 py-2.5 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {trailerList.map(tl => {
                  // Check if this trailer is assigned
                  const assignedTo = tractors.find(tr =>
                    tr.trailer_1_id === tl.id || tr.trailer_2_id === tl.id ||
                    tr.trailer_3_id === tl.id || tr.trailer_4_id === tl.id
                  )
                  return (
                    <div key={tl.id} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${assignedTo ? 'bg-green-900/20 border-green-800' : 'bg-[#222] border-[#333]'}`}>
                      <span className="font-bold text-white">{tl.trailer_number}</span>
                      {assignedTo && <span className="text-[10px] text-green-500">→ {assignedTo.truck_number}</span>}
                      <button onClick={() => deleteTrailer(tl.id)} className="text-red-500/30 hover:text-red-500 ml-1">&times;</button>
                    </div>
                  )
                })}
                {trailerList.length === 0 && <span className="text-gray-500 text-sm">No trailers added yet.</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function AutomationSection() {
    const triggerLabels: Record<string, string> = {
      truck_number_equals: 'Truck # equals',
      truck_number_contains: 'Truck # contains',
      is_last_truck_with_status: 'Last entry is',
      truck_is_end_marker: 'Is END marker',
      status_equals: 'Status equals',
      preshift_in_front: 'Truck is In Front',
      preshift_in_back: 'Truck is In Back',
    }
    const actionLabels: Record<string, string> = {
      set_truck_status: 'Set truck status →',
      set_door_status: 'Set door status →',
      set_truck_location: 'Set location →',
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">⚡ Automation Rules</h2>
            <p className="text-xs text-gray-500 mt-1">IF condition is met THEN action runs automatically when Print Room or PreShift data changes.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={forceSync} disabled={syncing}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${syncing ? 'bg-[#222] text-gray-500 border-[#333]' : 'bg-[#1a1a1a] text-amber-500 border-amber-500/30 hover:bg-amber-500/10'}`}>
              {syncing ? '⏳ Syncing...' : '🔄 Force Sync'}
            </button>
            <button onClick={openAddRule} className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400">+ Add Rule</button>
          </div>
        </div>

        <div className="space-y-2">
          {autoRules.map(r => (
            <div key={r.id} className={`bg-[#1a1a1a] border rounded-xl p-4 transition-colors ${r.is_active ? 'border-[#333]' : 'border-[#222] opacity-50'}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleRule(r.id, r.is_active)}
                  className={`mt-0.5 w-10 h-5 rounded-full flex-shrink-0 transition-colors relative ${r.is_active ? 'bg-green-500' : 'bg-[#333]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${r.is_active ? 'left-5' : 'left-0.5'}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">{r.rule_name}</span>
                    <span className="text-[10px] text-gray-500 bg-[#222] px-2 py-0.5 rounded">Priority: {r.sort_order}</span>
                  </div>
                  {r.description && <p className="text-xs text-gray-500 mb-2">{r.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded font-medium">
                      IF {triggerLabels[r.trigger_type] || r.trigger_type}{r.trigger_value ? ` "${r.trigger_value}"` : ''}
                    </span>
                    <span className="text-xs text-gray-500">→</span>
                    <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-1 rounded font-medium">
                      THEN {actionLabels[r.action_type] || r.action_type} &quot;{r.action_value}&quot;
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEditRule(r)} className="text-gray-400 hover:text-white">✏️</button>
                  <button onClick={() => deleteRule(r.id)} className="text-red-500/50 hover:text-red-500">✕</button>
                </div>
              </div>
            </div>
          ))}
          {autoRules.length === 0 && (
            <div className="text-center py-10 text-gray-500">No rules yet. Click + Add Rule to create your first automation.</div>
          )}
        </div>
      </div>
    )
  }

  function RouteSection() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">🗺️ Routes</h2>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <div className="flex gap-2 mb-4 flex-wrap items-end">
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Route Name</label>
              <input value={newRoute.name} onChange={e => setNewRoute({ ...newRoute, name: e.target.value })} placeholder="Route name" className="input-field" /></div>
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Code</label>
              <input value={newRoute.number} onChange={e => setNewRoute({ ...newRoute, number: e.target.value })} placeholder="FDL" className="input-field w-20" /></div>
            <button onClick={addRoute} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {routes.map(r => (
              <span key={r.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#222] border border-[#333]">
                {r.route_name} {r.route_number ? `(${r.route_number})` : ''}
                <button onClick={() => deleteRoute(r.id)} className="text-red-500/50 hover:text-red-500 ml-1">&times;</button>
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function ResetSection() {
    return (
      <div>
        <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ Data Reset</h2>
        <p className="text-sm text-gray-500 mb-4">Truck &amp; Tractor databases are <strong className="text-green-500">always protected</strong>.</p>

        {/* Auto-reset scheduler */}
        <AutoResetConfig />

        {/* Manual reset buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            { type: 'printroom', icon: '🖨️', label: 'Reset Print Room', desc: 'Clears entries and resets door statuses.' },
            { type: 'preshift', icon: '📋', label: 'Reset PreShift', desc: 'Clears staging door assignments.' },
            { type: 'movement', icon: '🚚', label: 'Reset Movement', desc: 'Clears live movement data.' },
            { type: 'documents', icon: '📄', label: 'Reset Documents', desc: 'Clears Route Sheet typed data (signatures, routes, loader names).' },
          ].map(r => (
            <button key={r.type} onClick={() => resetData(r.type)} className="bg-[#1a1a1a] border border-red-900 rounded-xl p-4 text-left hover:bg-red-900/10 transition-colors">
              <div className="text-red-400 font-bold mb-1">{r.icon} {r.label}</div><div className="text-xs text-gray-500">{r.desc}</div>
            </button>
          ))}
          <button onClick={() => resetData('all')} className="bg-red-900/20 border-2 border-red-600 rounded-xl p-4 text-left hover:bg-red-900/30 transition-colors">
            <div className="text-red-400 font-bold mb-1">💣 RESET ALL</div><div className="text-xs text-gray-400">Requires typing RESET.</div>
          </button>
        </div>

        {/* Reset log */}
        {resetLog.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Recent Resets</h3>
            {resetLog.map(l => (
              <div key={l.id} className="text-xs text-gray-500 flex gap-2 py-0.5">
                <span className={`font-bold ${l.reset_by === 'auto' ? 'text-amber-400' : 'text-gray-400'}`}>
                  {l.reset_by === 'auto' ? '🕐' : '👤'} {l.reset_type}
                </span>
                <span>—</span>
                <span>{new Date(l.reset_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

    function NotificationsSection() {
  const [globalMessages, setGlobalMessages] = useState<GlobalMessage[]>([])
  const [newMsg, setNewMsg] = useState({ message: '', message_type: 'info', expires_hours: '', visible_roles: ['admin','print_room','truck_mover','trainee','driver'] as string[] })

  useEffect(() => {
    supabase.from('global_messages').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setGlobalMessages(data) })
  }, [])

  const addGlobalMessage = async () => {
    if (!newMsg.message.trim()) { toast('Enter a message', 'error'); return }
    const expires = newMsg.expires_hours ? new Date(Date.now() + parseFloat(newMsg.expires_hours) * 3600000).toISOString() : null
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('global_messages').insert({
      message: newMsg.message.trim(),
      message_type: newMsg.message_type,
      expires_at: expires,
      visible_roles: newMsg.visible_roles,
      created_by: user?.id ?? null,
    })
    setNewMsg({ message: '', message_type: 'info', expires_hours: '', visible_roles: ['admin','print_room','truck_mover','trainee','driver'] })
    toast('Message posted!')
    supabase.from('global_messages').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setGlobalMessages(data) })
  }
  const deactivateMessage = async (id: number) => {
    await supabase.from('global_messages').update({ is_active: false }).eq('id', id)
    supabase.from('global_messages').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setGlobalMessages(data) })
  }
  const deleteMessage = async (id: number) => {
    if (!confirm('Delete message?')) return
    await supabase.from('global_messages').delete().eq('id', id)
    supabase.from('global_messages').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setGlobalMessages(data) })
  }

    const [users, setUsers]           = useState<{ id: string; display_name: string | null; username: string; role: string; avatar_color: string }[]>([])
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [notifTab, setNotifTab] = useState<'messages' | 'prefs'>('messages')

    useEffect(() => {
      supabase.from('profiles').select('id, display_name, username, role, avatar_color')
        .order('display_name')
        .then(({ data }) => { setUsers(data || []); setLoadingUsers(false) })
    }, [])

    const ROLE_COLORS: Record<string, string> = {
      admin: '#f59e0b', print_room: '#3b82f6', truck_mover: '#8b5cf6',
      trainee: '#22c55e', driver: '#6b7280',
    }
    const ROLE_LABELS: Record<string, string> = {
      admin: '👑 Admin', print_room: '🖨️ Print Room', truck_mover: '🚛 Truck Mover',
      trainee: '📚 Trainee', driver: '🚚 Driver',
    }
    const ALL_ROLES = ['admin','print_room','truck_mover','trainee','driver']
    const MSG_TYPES = [
      { value: 'info',    label: '💬 Info',    bg: 'bg-blue-900/40',   border: 'border-blue-600',   text: 'text-blue-300'   },
      { value: 'warning', label: '⚠️ Warning', bg: 'bg-yellow-900/40', border: 'border-yellow-600', text: 'text-yellow-300' },
      { value: 'success', label: '✅ Success', bg: 'bg-green-900/40',  border: 'border-green-600',  text: 'text-green-300'  },
      { value: 'error',   label: '🚨 Alert',   bg: 'bg-red-900/40',    border: 'border-red-600',    text: 'text-red-300'    },
    ]
    const typeStyle = (type: string) => MSG_TYPES.find(t => t.value === type) || MSG_TYPES[0]

    return (
      <div>
        <h2 className="text-xl font-bold mb-4">🔔 Notifications</h2>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-[#111] rounded-lg p-1 w-fit">
          <button onClick={() => setNotifTab('messages')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${notifTab === 'messages' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
            📢 Global Messages
          </button>
          <button onClick={() => setNotifTab('prefs')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${notifTab === 'prefs' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
            🔔 User Preferences
          </button>
        </div>

        {notifTab === 'messages' ? (
          <div className="space-y-4">
            {/* Compose new message */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-500 mb-3">📢 Post a Global Message</h3>
              <p className="text-xs text-gray-500 mb-4">Appears as a banner at the top of the website for the roles you choose. Dismissable per user.</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Message</label>
                  <textarea value={newMsg.message} onChange={e => setNewMsg({ ...newMsg, message: e.target.value })}
                    placeholder="e.g. I'll be coming in late today — cover the 6AM trucks. Back by 8AM."
                    rows={2} className="input-field w-full resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Type</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {MSG_TYPES.map(t => (
                        <button key={t.value} onClick={() => setNewMsg({ ...newMsg, message_type: t.value })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${newMsg.message_type === t.value ? `${t.bg} ${t.border} ${t.text}` : 'bg-[#111] border-[#333] text-gray-500 hover:text-white'}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Expires After</label>
                    <select value={newMsg.expires_hours} onChange={e => setNewMsg({ ...newMsg, expires_hours: e.target.value })} className="input-field">
                      <option value="">Never expires</option>
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="4">4 hours</option>
                      <option value="8">8 hours</option>
                      <option value="24">24 hours</option>
                      <option value="48">2 days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Visible To</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {ALL_ROLES.map(r => (
                      <button key={r} onClick={() => setNewMsg(prev => ({
                        ...prev,
                        visible_roles: prev.visible_roles.includes(r)
                          ? prev.visible_roles.filter(x => x !== r)
                          : [...prev.visible_roles, r]
                      }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${newMsg.visible_roles.includes(r) ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-[#333] text-gray-500 hover:text-white'}`}>
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={addGlobalMessage}
                  className="bg-amber-500 text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-amber-400 w-full">
                  📢 Post Message
                </button>
              </div>
            </div>

            {/* Active messages */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Active Messages</h3>
              {globalMessages.filter(m => m.is_active).length === 0 && (
                <div className="text-sm text-gray-500 py-4 text-center">No active messages.</div>
              )}
              <div className="space-y-2">
                {globalMessages.filter(m => m.is_active).map(m => {
                  const ts = typeStyle(m.message_type)
                  const expired = m.expires_at && new Date(m.expires_at) < new Date()
                  return (
                    <div key={m.id} className={`rounded-xl p-4 border ${ts.bg} ${ts.border} ${expired ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${ts.text} mb-1`}>{m.message}</p>
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                            <span>Posted {new Date(m.created_at).toLocaleString()}</span>
                            {m.expires_at && <span>· Expires {new Date(m.expires_at).toLocaleString()}</span>}
                            {expired && <span className="text-red-400 font-bold">· EXPIRED</span>}
                            <span>· Dismissed by {m.dismissed_by.length}</span>
                            <span>· Roles: {m.visible_roles.map(r => ROLE_LABELS[r] || r).join(', ')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => deactivateMessage(m.id)}
                            className="text-xs text-gray-500 hover:text-white bg-[#222] px-2 py-1 rounded">
                            Hide
                          </button>
                          <button onClick={() => deleteMessage(m.id)}
                            className="text-xs text-red-500/60 hover:text-red-400 bg-[#222] px-2 py-1 rounded">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Past messages */}
            {globalMessages.filter(m => !m.is_active).length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Past / Hidden Messages</h3>
                <div className="space-y-1.5">
                  {globalMessages.filter(m => !m.is_active).map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-[#111] border border-[#222] rounded-lg px-3 py-2 opacity-50">
                      <p className="text-xs text-gray-400 truncate flex-1">{m.message}</p>
                      <button onClick={() => deleteMessage(m.id)} className="text-red-500/50 hover:text-red-400 ml-3">&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* User preferences tab */
          <div>
            {/* TTS panel */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-amber-500">🔊 TTS / Sound</span>
                <span className="text-[10px] text-gray-500 bg-[#222] px-2 py-0.5 rounded">Your Voice Announcements</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h3 className="text-xs text-gray-400 font-bold uppercase mb-2">Movement Page</h3><TTSPanel page="movement" /></div>
                <div><h3 className="text-xs text-gray-400 font-bold uppercase mb-2">Print Room Page</h3><TTSPanel page="printroom" /></div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Per-User Preferences</h3>
            {loadingUsers ? (
              <div className="text-center py-10 text-gray-500">Loading users...</div>
            ) : (
              <div className="space-y-2">
                {users.map(u => {
                  const isOpen = expandedId === u.id
                  const initials = (u.display_name || u.username).slice(0, 2).toUpperCase()
                  return (
                    <div key={u.id} className={`bg-[#1a1a1a] border rounded-xl overflow-hidden transition-colors ${isOpen ? 'border-amber-500/40' : 'border-[#2a2a2a]'}`}>
                      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                        onClick={() => setExpandedId(isOpen ? null : u.id)}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: u.avatar_color || '#f59e0b' }}>
                          {initials}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-medium text-white">{u.display_name || u.username}</div>
                          <div className="text-[10px] text-gray-500">@{u.username}</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: (ROLE_COLORS[u.role] || '#444') + '30', color: ROLE_COLORS[u.role] || '#aaa' }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">{isOpen ? '▲' : '▼'}</span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#2a2a2a] px-4 py-4">
                          <NotificationPrefs userId={u.id} compact={false} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }


}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">{label}</label>{children}</div>
}

function PlannedSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">🚧</div>
      <h2 className="text-xl font-bold text-gray-400 mb-2">{title}</h2>
      <span className="mt-2 text-xs bg-[#222] text-gray-500 px-3 py-1 rounded-full">Coming Soon</span>
    </div>
  )
}

// ── API Section ─────────────────────────────────────────────────────────────
const API_TABLES = [
  { name: 'debug_logs',               icon: '📱', group: 'Monitoring',  desc: 'Android app logs' },
  { name: 'live_movement',            icon: '🚚', group: 'Operations',  desc: 'Current truck locations and statuses' },
  { name: 'printroom_entries',        icon: '🖨️', group: 'Operations',  desc: 'Print room door assignments' },
  { name: 'loading_doors',            icon: '🚪', group: 'Operations',  desc: 'Loading door status and dock lock state' },
  { name: 'staging_doors',            icon: '📋', group: 'Operations',  desc: 'PreShift staging door assignments' },
  { name: 'trucks',                   icon: '🚛', group: 'Fleet',       desc: 'Truck database' },
  { name: 'tractors',                 icon: '🚛', group: 'Fleet',       desc: 'Tractor/semi assignments' },
  { name: 'trailer_list',             icon: '📦', group: 'Fleet',       desc: 'Trailer inventory list' },
  { name: 'status_values',            icon: '🏷️', group: 'Config',      desc: 'Truck status options' },
  { name: 'door_status_values',       icon: '🏷️', group: 'Config',      desc: 'Loading door status options' },
  { name: 'dock_lock_status_values',  icon: '🔒', group: 'Config',      desc: 'Dock lock status options' },
  { name: 'automation_rules',         icon: '⚡', group: 'Config',      desc: 'IF/THEN automation rules' },
  { name: 'routes',                   icon: '🗺️', group: 'Config',      desc: 'Route definitions' },
  { name: 'profiles',                 icon: '👤', group: 'Users',       desc: 'User profiles, roles, avatar colors' },
  { name: 'role_permissions',         icon: '🛡️', group: 'Users',       desc: 'Role definitions and page access' },
  { name: 'notifications',            icon: '🔔', group: 'Users',       desc: 'Push notification log' },
  { name: 'notification_preferences', icon: '🔔', group: 'Users',       desc: 'Per-user notification preferences' },
  { name: 'global_messages',          icon: '📢', group: 'Users',       desc: 'Admin broadcast banners' },
  { name: 'truck_subscriptions',      icon: '📲', group: 'Users',       desc: 'User truck subscriptions' },
  { name: 'chat_rooms',               icon: '💬', group: 'Chat',        desc: 'Chat room definitions' },
  { name: 'messages',                 icon: '💬', group: 'Chat',        desc: 'Chat messages' },
  { name: 'ptt_messages',             icon: '🎙️', group: 'Chat',        desc: 'PTT voice message log' },
  { name: 'reset_log',                icon: '⚠️', group: 'System',      desc: 'History of manual data resets' },
  { name: 'route_imports',            icon: '📄', group: 'System',      desc: 'Route CSV import history' },
]
const API_GROUPS = ['Monitoring', 'Operations', 'Fleet', 'Config', 'Users', 'Chat', 'System']
const API_LVL_COLOR: Record<string, string> = { INFO: 'text-blue-400', ERROR: 'text-red-400', WARN: 'text-yellow-400', DEBUG: 'text-purple-400', OK: 'text-green-400' }
const API_LVL_BG:    Record<string, string> = { ERROR: 'bg-red-950/30 border-l-2 border-red-500/50', WARN: 'bg-yellow-950/20 border-l-2 border-yellow-500/30' }

function ApiSection() {
  const [tab, setTab]                   = useState<'explorer' | 'docs' | 'live'>('explorer')
  const [selTable, setSelTable]         = useState('debug_logs')
  const [tableData, setTableData]       = useState<Record<string, unknown>[]>([])
  const [counts, setCounts]             = useState<Record<string, number | string>>({})
  const [loadingData, setLoadingData]   = useState(false)
  const [filterText, setFilterText]     = useState('')
  const [limitVal, setLimitVal]         = useState('100')
  const [jsonMode, setJsonMode]         = useState(false)
  const [copied, setCopied]             = useState(false)
  const [token, setToken]               = useState('')
  const [liveLevel, setLiveLevel]       = useState('')
  const [liveTag, setLiveTag]           = useState('')
  const [liveDev, setLiveDev]           = useState('')
  const [liveLogs, setLiveLogs]         = useState<Record<string, unknown>[]>([])
  const [liveOn, setLiveOn]             = useState(false)
  const liveRef    = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const logEndRef  = useRef<HTMLDivElement>(null)
  const watchRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const BASE_URL   = typeof window !== 'undefined' ? window.location.origin : ''
  const apiBase    = `${BASE_URL}/api/badger`
  const grouped    = API_GROUPS.map(g => ({ group: g, tables: API_TABLES.filter(t => t.group === g) }))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session?.access_token) setToken(session.access_token) })
  }, [])
  useEffect(() => {
    if (!token) return
    fetch(apiBase, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { if (d.counts) setCounts(d.counts) }).catch(() => {})
  }, [token, apiBase])

  const loadTable = useCallback(async (tbl: string) => {
    if (!token) return
    setLoadingData(true); setTableData([])
    const p = new URLSearchParams({ table: tbl, limit: limitVal })
    if (filterText) p.set('filter', filterText)
    const d = await fetch(`${apiBase}?${p}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    setTableData(d.data || []); setLoadingData(false)
  }, [token, limitVal, filterText, apiBase])

  useEffect(() => { if (tab === 'explorer' && token) loadTable(selTable) }, [selTable, tab, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const subscribeLive = useCallback(() => {
    if (liveRef.current) { supabase.removeChannel(liveRef.current); liveRef.current = null }
    const ch = supabase.channel(`api-live-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debug_logs' }, payload => {
        setLiveLogs(prev => [...prev.slice(-499), payload.new as Record<string, unknown>])
        setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
    ch.subscribe(); liveRef.current = ch
  }, [])

  const startLive = useCallback(() => {
    setLiveLogs([]); setLiveOn(true); subscribeLive()
    watchRef.current = setInterval(() => {
      const ch = liveRef.current as unknown as { state?: string } | null
      if (!ch || ch.state !== 'joined') subscribeLive()
    }, 15000)
  }, [subscribeLive])

  const stopLive = useCallback(() => {
    if (watchRef.current) { clearInterval(watchRef.current); watchRef.current = null }
    if (liveRef.current) { supabase.removeChannel(liveRef.current); liveRef.current = null }
    setLiveOn(false)
  }, [])

  useEffect(() => { if (tab === 'live') startLive(); else stopLive() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopLive(), [stopLive])

  const filtLive = liveLogs.filter(l => {
    if (liveLevel && l.level !== liveLevel) return false
    if (liveTag && !String(l.tag || '').toLowerCase().includes(liveTag.toLowerCase())) return false
    if (liveDev && !String(l.device_name || l.device_id || '').toLowerCase().includes(liveDev.toLowerCase())) return false
    return true
  })

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold">🔌 Badger API</h1><p className="text-xs text-gray-500 mt-1">Explore database tables, monitor live device logs</p></div>
        <div className="flex gap-1 bg-[#111] rounded-lg p-1">
          {(['explorer','live','docs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
              {t === 'explorer' ? '🔍 Explorer' : t === 'live' ? '📡 Live' : '📖 Docs'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'explorer' && (
        <div className="flex gap-4 items-start">
          <div className="w-52 flex-shrink-0 space-y-3">
            {grouped.map(({ group, tables }) => (
              <div key={group}>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1 mb-1">{group}</div>
                {tables.map(t => (
                  <button key={t.name} onClick={() => setSelTable(t.name)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-1 ${selTable === t.name ? 'bg-amber-500/15 text-amber-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <span className="truncate">{t.icon} {t.name}</span>
                    {counts[t.name] !== undefined && <span className="text-[10px] text-gray-600 flex-shrink-0">{counts[t.name]}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-sm font-bold text-amber-500">{selTable}</span>
              <span className="text-xs text-gray-500 flex-1">{API_TABLES.find(t => t.name === selTable)?.desc}</span>
              <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="level=eq.ERROR"
                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs w-40 focus:border-amber-500 outline-none font-mono" />
              <select value={limitVal} onChange={e => setLimitVal(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs outline-none">
                {['25','50','100','250','500'].map(v => <option key={v} value={v}>{v} rows</option>)}
              </select>
              <button onClick={() => loadTable(selTable)} disabled={loadingData} className="bg-amber-500 text-black px-3 py-1 rounded text-xs font-bold hover:bg-amber-400 disabled:opacity-50">{loadingData ? '...' : '▶ Run'}</button>
              <button onClick={() => setJsonMode(m => !m)} className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${jsonMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-[#333] text-gray-500 hover:text-white'}`}>{'{}'}</button>
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(tableData, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="px-3 py-1 rounded text-xs font-bold border border-[#333] text-gray-500 hover:text-white">{copied ? '✔' : '📋'}</button>
            </div>
            <div className="bg-[#111] rounded-lg px-3 py-2 mb-3 font-mono text-[11px] text-gray-500 flex items-center gap-2 overflow-x-auto">
              <span className="text-green-500 flex-shrink-0">GET</span>
              <span>{apiBase}?table={selTable}&limit={limitVal}{filterText ? `&filter=${filterText}` : ''}</span>
            </div>
            {loadingData ? <div className="text-center py-20 text-gray-500 text-sm">Loading {selTable}...</div>
              : tableData.length === 0 ? <div className="text-center py-20 text-gray-500 text-sm">No rows returned</div>
              : jsonMode ? <pre className="bg-[#111] border border-[#333] rounded-xl p-4 text-[11px] text-green-400 overflow-auto max-h-[600px] font-mono">{JSON.stringify(tableData, null, 2)}</pre>
              : (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 z-10 bg-[#111] border-b border-[#333]">
                        <tr>{Object.keys(tableData[0]).map(col => <th key={col} className="px-3 py-2 text-left font-bold text-amber-500 whitespace-nowrap">{col}</th>)}</tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, i) => (
                          <tr key={i} className={`border-b border-white/5 hover:bg-white/[0.02] ${selTable === 'debug_logs' ? (API_LVL_BG[String(row.level)] || '') : ''}`}>
                            {Object.entries(row).map(([col, val]) => {
                              let disp: React.ReactNode = val === null ? <span className="text-gray-600">null</span>
                                : val === true ? <span className="text-green-400">true</span>
                                : val === false ? <span className="text-red-400">false</span>
                                : typeof val === 'object' ? <span className="text-blue-400">{JSON.stringify(val)}</span>
                                : String(val)
                              if (col === 'level' && typeof val === 'string') disp = <span className={`font-bold ${API_LVL_COLOR[val] || 'text-gray-400'}`}>{val}</span>
                              if (['created_at','updated_at','reset_at'].includes(col) && val) disp = <span className="text-gray-500">{new Date(String(val)).toLocaleString()}</span>
                              if ((col === 'status_color' || col === 'avatar_color') && typeof val === 'string') disp = <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: val }} />{val}</span>
                              return <td key={col} className="px-3 py-1.5 align-top max-w-[300px]"><div className="truncate">{disp}</div></td>
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-3 py-2 border-t border-[#333] text-[10px] text-gray-500">{tableData.length} rows</div>
                </div>
              )}
          </div>
        </div>
      )}

      {tab === 'live' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${liveOn ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-sm font-bold">{liveOn ? 'Live — watching debug_logs' : 'Stopped'}</span>
            <button onClick={liveOn ? stopLive : startLive} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${liveOn ? 'bg-red-900/50 text-red-400' : 'bg-green-700 text-white'}`}>{liveOn ? '⏹ Stop' : '▶ Start'}</button>
            <button onClick={() => setLiveLogs([])} className="px-4 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-500 hover:text-white">🗑 Clear</button>
            <span className="text-xs text-gray-600 ml-auto">{liveLogs.length} events</span>
            <select value={liveLevel} onChange={e => setLiveLevel(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs outline-none">
              <option value="">All levels</option>{['DEBUG','INFO','WARN','ERROR','OK'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input value={liveTag} onChange={e => setLiveTag(e.target.value)} placeholder="Tag..." className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs w-28 outline-none" />
            <input value={liveDev} onChange={e => setLiveDev(e.target.value)} placeholder="Device..." className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs w-28 outline-none" />
          </div>
          <div className="bg-[#0a0a0a] border border-[#333] rounded-xl overflow-hidden">
            <div className="h-[600px] overflow-y-auto font-mono text-[11px] p-3 space-y-0.5">
              {filtLive.length === 0 && <div className="text-center text-gray-600 py-20">{liveOn ? 'Waiting for device events...' : 'Start live monitor to capture logs'}</div>}
              {filtLive.map((log, i) => (
                <div key={i} className={`flex gap-2 px-2 py-1 rounded ${API_LVL_BG[String(log.level)] || 'hover:bg-white/[0.02]'}`}>
                  <span className="text-gray-600 w-20 truncate">{new Date(String(log.created_at)).toLocaleTimeString()}</span>
                  <span className={`font-bold w-12 ${API_LVL_COLOR[String(log.level)] || 'text-gray-400'}`}>{String(log.level)}</span>
                  <span className="text-amber-500/70 w-28 truncate">{String(log.tag || '')}</span>
                  <span className="text-gray-300 flex-1 break-all">{String(log.message || '')}</span>
                  <span className="text-gray-600 truncate max-w-[120px]">{String(log.device_name || log.device_id || '')}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            <div className="border-t border-[#333] px-3 py-2 text-[10px] text-gray-600 flex gap-4">
              {['DEBUG','INFO','WARN','ERROR','OK'].map(l => <span key={l} className={API_LVL_COLOR[l]}>{l}: {liveLogs.filter(x => x.level === l).length}</span>)}
            </div>
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h2 className="text-lg font-bold mb-2">📖 Badger API</h2>
            <p className="text-sm text-gray-400 mb-3">Read-only REST API for all Badger data. Requires admin auth.</p>
            <div className="bg-[#111] rounded-lg px-4 py-3 font-mono text-sm text-green-400">{apiBase}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-3">🔑 Auth</h3>
            <pre className="bg-[#111] rounded p-3 text-xs text-green-400 overflow-x-auto">{`Authorization: Bearer <session-token>\nx-badger-api-key: <BADGER_API_KEY>`}</pre>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-3">⚙️ Params: table, limit, filter, select, all</h3>
            <pre className="bg-[#111] rounded p-3 text-xs text-green-400 overflow-x-auto">{`${apiBase}?table=debug_logs&limit=50&filter=level=eq.ERROR`}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Backup Section ───────────────────────────────────────────────────────────
function BackupSection() {
  const [webhookUrl, setWebhookUrl]   = useState('')
  const [savedWebhook, setSavedWebhook] = useState('')
  const [lastBackup, setLastBackup]   = useState<Record<string, string | number | boolean | null> | null>(null)
  const [running, setRunning]         = useState(false)
  const [result, setResult]           = useState<Record<string, unknown> | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [showHook, setShowHook]       = useState(false)

  const fetchStatus = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/backup', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) setLastBackup(await res.json())
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('badger_discord_webhook')
    if (saved) { setSavedWebhook(saved); setWebhookUrl(saved) }
    fetchStatus()
  }, [fetchStatus])

  const saveHook = () => { localStorage.setItem('badger_discord_webhook', webhookUrl); setSavedWebhook(webhookUrl) }

  const runBackup = async () => {
    const url = savedWebhook || webhookUrl
    if (!url) { setError('Enter a Discord webhook URL first'); return }
    setRunning(true); setResult(null); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const res = await fetch('/api/admin/backup', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ webhook_url: url }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Backup failed')
      setResult(data); fetchStatus()
    } catch (e) { setError(String(e)) }
    setRunning(false)
  }

  const fmt = (ts: string) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  const ago = (ts: string) => { const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000); const m = Math.floor(((Date.now() - new Date(ts).getTime()) % 3600000) / 60000); return h > 24 ? `${Math.floor(h/24)}d ago` : h > 0 ? `${h}h ${m}m ago` : `${m}m ago` }

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-xl font-bold">💾 Database Backup</h1><p className="text-xs text-gray-500 mt-1">Exports all tables as JSON and sends to Discord.</p></div>

      <div className={`rounded-2xl border p-5 ${lastBackup?.last_backup_at ? lastBackup.last_backup_status === 'success' ? 'bg-green-950/20 border-green-500/30' : 'bg-yellow-950/20 border-yellow-500/30' : 'bg-[#111] border-[#333]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{lastBackup?.last_backup_at ? lastBackup.last_backup_status === 'success' ? '✅' : '⚠️' : '📭'}</span>
            <div>
              <div className="font-semibold text-sm">{lastBackup?.last_backup_at ? 'Last Backup' : 'No backups yet'}</div>
              {lastBackup?.last_backup_at && <div className="text-xs text-gray-500 mt-0.5">{fmt(String(lastBackup.last_backup_at))} · {ago(String(lastBackup.last_backup_at))}</div>}
            </div>
          </div>
          {lastBackup?.last_backup_at && (
            <div className="text-right text-xs text-gray-500 space-y-0.5">
              <div>{String(lastBackup.last_backup_tables)} tables</div>
              <div>{Number(lastBackup.last_backup_rows).toLocaleString()} rows</div>
              <div>{String(lastBackup.last_backup_size_kb)} KB</div>
            </div>
          )}
        </div>
        {lastBackup?.last_backup_filename && <div className="mt-3 font-mono text-[11px] text-gray-500 bg-black/30 rounded px-3 py-1.5">{String(lastBackup.last_backup_filename)}</div>}
      </div>

      <div className="bg-[#111] border border-[#333] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div><div className="font-semibold text-sm">Discord Webhook</div><div className="text-xs text-gray-500">{savedWebhook ? '✅ Saved' : 'Not configured'}</div></div>
          <button onClick={() => setShowHook(v => !v)} className="text-xs text-amber-400 hover:text-amber-300">{showHook ? 'Hide' : 'Edit'}</button>
        </div>
        {showHook && (
          <div className="space-y-2">
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-amber-500 outline-none font-mono" />
            <button onClick={saveHook} disabled={!webhookUrl} className="px-4 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-sm text-amber-400 disabled:opacity-40">💾 Save Webhook</button>
          </div>
        )}
      </div>

      <div className="bg-[#111] border border-[#333] rounded-2xl p-5 space-y-4">
        <div><div className="font-semibold text-sm">Manual Backup</div><div className="text-xs text-gray-500">All tables exported — new tables included automatically</div></div>
        <button onClick={runBackup} disabled={running || !savedWebhook}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 rounded-xl font-bold text-black text-sm flex items-center justify-center gap-2">
          {running ? <><span className="animate-spin">⏳</span>Running...</> : <>💾 Run Backup Now</>}
        </button>
        {!savedWebhook && <p className="text-xs text-gray-500 text-center">Configure Discord webhook above first</p>}
        {result && <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-4"><div className="text-green-400 font-bold text-sm">✅ Backup sent to Discord</div><div className="font-mono text-[11px] text-gray-500 mt-1">{String(result.filename)}</div></div>}
        {error && <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4"><div className="text-red-400 font-bold text-sm">❌ {error}</div></div>}
      </div>

      <div className="bg-[#111] border border-[#333] rounded-2xl p-5 space-y-2">
        <div className="font-semibold text-sm">📋 How to Restore</div>
        <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
          <li>Download the <code className="bg-black/40 px-1 rounded">.json</code> file from Discord</li>
          <li>Send it to Claude and say <span className="text-amber-400/80 italic">&quot;Convert this Badger backup to SQL INSERT statements&quot;</span></li>
          <li>Run the generated SQL in your Supabase SQL editor</li>
        </ol>
      </div>
    </div>
  )
}

// ── Accounts Section ─────────────────────────────────────────────────────────
type AcctRole = 'admin' | 'print_room' | 'truck_mover' | 'trainee' | 'driver'
interface AcctUser { id: string; username: string; display_name: string | null; role: AcctRole; avatar_color: string; avatar_url: string | null; phone: string | null; sms_enabled: boolean; created_at: string; email?: string }
interface AcctEditForm { displayName: string; username: string; email: string; phone: string; role: AcctRole; smsEnabled: boolean; newPassword: string; showPassword: boolean }
const ACCT_ROLES: { value: AcctRole; label: string; color: string }[] = [
  { value: 'admin',       label: '🔧 Admin',       color: '#f59e0b' },
  { value: 'print_room',  label: '🖨️ Print Room', color: '#3b82f6' },
  { value: 'truck_mover', label: '🚛 Truck Mover', color: '#8b5cf6' },
  { value: 'trainee',     label: '📚 Trainee',     color: '#22c55e' },
  { value: 'driver',      label: '🚚 Driver',      color: '#6b7280' },
]
const ACCT_CREATE_DEFAULT = { email: '', password: '', username: '', displayName: '', role: 'driver' as AcctRole }

function AccountsSection() {
  const [users, setUsers]           = useState<AcctUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [editUser, setEditUser]     = useState<AcctUser | null>(null)
  const [editForm, setEditForm]     = useState<AcctEditForm | null>(null)
  const [saving, setSaving]         = useState(false)
  const [resetting, setResetting]   = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(ACCT_CREATE_DEFAULT)
  const [creating, setCreating]     = useState(false)
  const [showCreatePw, setShowCreatePw] = useState(false)
  const [myId, setMyId]             = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data: v, error: ve } = await supabase.from('profiles_with_email').select('*').order('created_at', { ascending: false })
    if (!ve && v) { setUsers(v as AcctUser[]) }
    else { const { data: f } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); setUsers((f || []) as AcctUser[]) }
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session?.user) setMyId(session.user.id) })
    fetchUsers()
  }, [fetchUsers])

  const openEdit = (u: AcctUser) => { setEditUser(u); setEditForm({ displayName: u.display_name || '', username: u.username, email: u.email || '', phone: u.phone || '', role: u.role, smsEnabled: u.sms_enabled, newPassword: '', showPassword: false }) }

  const saveEdit = async () => {
    if (!editUser || !editForm || !myId) return
    setSaving(true)
    const upd: Record<string, unknown> = { displayName: editForm.displayName, username: editForm.username, role: editForm.role, phone: editForm.phone, smsEnabled: editForm.smsEnabled }
    if (editForm.email !== editUser.email) upd.email = editForm.email
    if (editForm.newPassword) upd.newPassword = editForm.newPassword
    const res = await fetch('/api/admin/update-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requesterId: myId, targetId: editUser.id, updates: upd }) })
    const data = await res.json(); setSaving(false)
    if (!data.error) { setEditUser(null); setEditForm(null); fetchUsers() }
  }

  const sendReset = async () => {
    if (!editUser || !editForm?.email || !myId) return
    setResetting(true)
    await fetch('/api/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requesterId: myId, targetEmail: editForm.email || editUser.email }) })
    setResetting(false)
  }

  const deleteUser = async (u: AcctUser) => {
    if (!confirm(`Delete @${u.username}?`)) return
    await fetch('/api/admin/update-user', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requesterId: myId, targetId: u.id }) })
    fetchUsers()
  }

  const createUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.username || createForm.password.length < 6) return
    setCreating(true)
    const res = await fetch('/api/admin/create-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...createForm, requesterId: myId }) })
    const data = await res.json(); setCreating(false)
    if (!data.error) { setShowCreate(false); setCreateForm(ACCT_CREATE_DEFAULT); fetchUsers() }
  }

  const filtered = users.filter(u => [u.username, u.display_name || '', u.email || ''].some(s => s.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold">👤 User Management</h1><p className="text-xs text-gray-500 mt-1">{users.length} registered users</p></div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-sm focus:border-amber-500 outline-none w-52" />
          <button onClick={() => setShowCreate(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm whitespace-nowrap">+ Create Account</button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
        {loading ? <div className="text-center py-12 text-gray-500 text-sm">Loading...</div>
          : filtered.length === 0 ? <div className="text-center py-12 text-gray-500 text-sm">No users found</div>
          : filtered.map(u => {
            const ri = ACCT_ROLES.find(r => r.value === u.role)
            return (
              <div key={u.id} className="flex items-center px-6 py-4 border-b border-[#222] hover:bg-[#111] gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: u.avatar_color || '#f59e0b' }}>{(u.display_name || u.username).slice(0,2).toUpperCase()}</div>}
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{u.display_name || u.username}</div>
                    <div className="text-xs text-gray-500">@{u.username}{u.email ? ` · ${u.email}` : ''}</div>
                    {u.id === myId && <div className="text-[10px] text-amber-500">YOU</div>}
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full border" style={{ color: ri?.color, borderColor: (ri?.color || '#888') + '44', background: (ri?.color || '#888') + '11' }}>{ri?.label}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(u)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24' }}>✏️ Edit</button>
                  {u.id !== myId && <button onClick={() => deleteUser(u)} className="px-2 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>🗑️</button>}
                </div>
              </div>
            )
          })}
      </div>

      {editUser && editForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setEditUser(null); setEditForm(null) }}>
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#333]">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: editUser.avatar_color || '#f59e0b' }}>{(editUser.display_name || editUser.username).slice(0,2).toUpperCase()}</div>
              <div><div className="font-bold">{editUser.display_name || editUser.username}</div><div className="text-xs text-gray-500">@{editUser.username}</div></div>
              <button onClick={() => { setEditUser(null); setEditForm(null) }} className="ml-auto text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <section>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Identity</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">Display Name</label><input value={editForm.displayName} onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">@Username</label><input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s/g,'') })} className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none font-mono" /></div>
                </div>
              </section>
              <section>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Role</div>
                <div className="grid grid-cols-3 gap-2">
                  {ACCT_ROLES.map(r => <button key={r.value} onClick={() => setEditForm({ ...editForm, role: r.value })} disabled={editUser.id === myId} style={{ border: `1px solid ${editForm.role === r.value ? r.color : '#333'}`, background: editForm.role === r.value ? r.color+'22' : 'transparent', color: editForm.role === r.value ? r.color : '#888', padding: '8px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{r.label}</button>)}
                </div>
              </section>
              <section>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contact</div>
                <div className="space-y-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Phone</label><input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none font-mono" /></div>
                </div>
              </section>
              <section>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Password</div>
                <div className="space-y-2">
                  <div className="relative">
                    <input type={editForm.showPassword ? 'text' : 'password'} value={editForm.newPassword} onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })} placeholder="New password (blank to keep)" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 pr-10 text-sm focus:border-amber-500 outline-none" />
                    <button type="button" onClick={() => setEditForm({ ...editForm, showPassword: !editForm.showPassword })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">{editForm.showPassword ? '🙈' : '👁️'}</button>
                  </div>
                  <button onClick={sendReset} disabled={resetting || !editForm.email} className="w-full bg-[#1a1a1a] border border-[#333] hover:border-amber-500/50 text-sm py-2 rounded-lg text-gray-500 hover:text-white disabled:opacity-40">{resetting ? 'Sending...' : '📧 Send Password Reset Email'}</button>
                </div>
              </section>
            </div>
            <div className="px-6 py-4 border-t border-[#333] flex gap-3">
              <button onClick={saveEdit} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              <button onClick={() => { setEditUser(null); setEditForm(null) }} className="bg-[#333] hover:bg-[#444] text-white px-5 py-2.5 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowCreate(false); setCreateForm(ACCT_CREATE_DEFAULT) }}>
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">🆕 Create Account</h2>
              <button onClick={() => { setShowCreate(false); setCreateForm(ACCT_CREATE_DEFAULT) }} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Username *</label><input value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/\s/g,'') })} placeholder="johnd" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none font-mono" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Display Name</label><input value={createForm.displayName} onChange={e => setCreateForm({ ...createForm, displayName: e.target.value })} placeholder="John D." className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" /></div>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Email *</label><input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Password *</label>
                <div className="relative"><input type={showCreatePw ? 'text' : 'password'} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 6 chars" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 pr-10 text-sm focus:border-amber-500 outline-none" /><button type="button" onClick={() => setShowCreatePw(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">{showCreatePw ? '🙈' : '👁️'}</button></div>
              </div>
              <div><label className="text-xs text-gray-500 mb-2 block">Role</label><div className="grid grid-cols-3 gap-2">{ACCT_ROLES.map(r => <button key={r.value} onClick={() => setCreateForm({ ...createForm, role: r.value })} style={{ border: `1px solid ${createForm.role===r.value?r.color:'#333'}`, background: createForm.role===r.value?r.color+'22':'transparent', color: createForm.role===r.value?r.color:'#888', padding:'8px 6px', borderRadius:8, fontSize:11, fontWeight:600 }}>{r.label}</button>)}</div></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createUser} disabled={creating} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">{creating ? 'Creating...' : 'Create Account'}</button>
              <button onClick={() => { setShowCreate(false); setCreateForm(ACCT_CREATE_DEFAULT) }} className="bg-[#333] hover:bg-[#444] text-white px-5 py-2.5 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Debug Section ─────────────────────────────────────────────────────────────
interface DbgLog { id: number; device_id: string; device_name: string | null; level: string; tag: string | null; message: string; created_at: string }
const DBG_COLOR: Record<string, string> = { INFO: 'text-blue-400', OK: 'text-green-400', ERROR: 'text-red-400', WARN: 'text-yellow-400', DEBUG: 'text-purple-400' }
const DBG_DOT:   Record<string, string> = { INFO: 'bg-blue-400',   OK: 'bg-green-400',   ERROR: 'bg-red-400',   WARN: 'bg-yellow-400',  DEBUG: 'bg-purple-400' }
const DBG_ROW:   Record<string, string> = { ERROR: 'bg-red-950/30 border-l-2 border-red-500/50', WARN: 'bg-yellow-950/20 border-l-2 border-yellow-500/30' }

function DebugSection() {
  const [logs, setLogs]                 = useState<DbgLog[]>([])
  const [loading, setLoading]           = useState(true)
  const [devFilter, setDevFilter]       = useState('')
  const [lvlFilter, setLvlFilter]       = useState('')
  const [tagFilter, setTagFilter]       = useState('')
  const [autoRefresh, setAutoRefresh]   = useState(true)
  const [devices, setDevices]           = useState<{ device_id: string; device_name: string | null }[]>([])
  const [nicks, setNicks]               = useState<Record<string, string>>({})
  const [lastRef, setLastRef]           = useState<Date | null>(null)
  const [editNick, setEditNick]         = useState<string | null>(null)
  const [nickIn, setNickIn]             = useState('')
  const [deleting, setDeleting]         = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNicks = useCallback(async () => {
    const { data } = await supabase.from('device_nicknames').select('device_id, nickname')
    if (data) { const m: Record<string,string> = {}; data.forEach((n: { device_id: string; nickname: string }) => { m[n.device_id] = n.nickname }); setNicks(m) }
  }, [])

  const fetchLogs = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from('debug_logs').select('*').order('created_at', { ascending: false }).limit(300)
    if (devFilter) q = q.eq('device_id', devFilter)
    if (lvlFilter) q = q.eq('level', lvlFilter)
    if (tagFilter) q = q.ilike('tag', `%${tagFilter}%`)
    const { data } = await q; if (data) setLogs(data); setLoading(false); setLastRef(new Date())
  }, [devFilter, lvlFilter, tagFilter])

  const fetchDevices = useCallback(async () => {
    const { data } = await supabase.from('debug_logs').select('device_id, device_name').order('created_at', { ascending: false }).limit(500)
    if (data) { const u = Array.from(new Map(data.map((d: { device_id: string; device_name: string | null }) => [d.device_id, d])).values()); setDevices(u as { device_id: string; device_name: string | null }[]) }
  }, [])

  useEffect(() => { fetchLogs(); fetchDevices(); fetchNicks() }, [fetchLogs, fetchDevices, fetchNicks])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoRefresh) timerRef.current = setInterval(() => { fetchLogs(); fetchDevices() }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh, fetchLogs, fetchDevices])

  const deleteViaApi = async (body: object): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return false
    const res = await fetch('/api/admin/delete-debug-logs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) })
    return res.ok
  }

  const clearAll = async () => { if (!confirm('Clear ALL debug logs?')) return; setDeleting(true); const ok = await deleteViaApi({ mode: 'all' }); if (ok) { setLogs([]); setDevices([]) }; setDeleting(false) }
  const clearDev = async (id: string) => { if (!confirm('Clear logs for this device?')) return; setDeleting(true); const ok = await deleteViaApi({ mode: 'device', device_id: id }); if (ok) { if (devFilter === id) setDevFilter(''); fetchLogs(); fetchDevices() }; setDeleting(false) }

  const saveNick = async (id: string) => {
    const t = nickIn.trim()
    if (!t) { await supabase.from('device_nicknames').delete().eq('device_id', id); setNicks(p => { const n={...p}; delete n[id]; return n }) }
    else { await supabase.from('device_nicknames').upsert({ device_id: id, nickname: t, updated_at: new Date().toISOString() }); setNicks(p => ({...p, [id]: t})) }
    setEditNick(null); setNickIn('')
  }

  const getLabel = (id: string, name: string | null) => nicks[id] || name || id.slice(0,14)+'…'
  const fmtT = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const fmtD = (ts: string) => { const d = new Date(ts); return d.toDateString() === new Date().toDateString() ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  const errCnt = logs.filter(l => l.level === 'ERROR').length
  const wrnCnt = logs.filter(l => l.level === 'WARN').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold">📱 Mobile Debug Logs</h1><p className="text-xs text-gray-500 mt-1">Real-time logs from Android devices{lastRef && <span className="ml-2 opacity-60">· {lastRef.toLocaleTimeString('en-US',{hour12:false})}</span>}</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          {errCnt > 0 && <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">⚠️ {errCnt} error{errCnt!==1?'s':''}</span>}
          {wrnCnt > 0 && <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-2.5 py-1 rounded-full">{wrnCnt} warn{wrnCnt!==1?'s':''}</span>}
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none ml-2">
            <div onClick={() => setAutoRefresh(v=>!v)} className={`w-8 h-4 rounded-full relative cursor-pointer ${autoRefresh ? 'bg-amber-500' : 'bg-[#333]'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>Live
          </label>
          <button onClick={fetchLogs} className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] hover:border-amber-500/50 rounded-lg text-sm">🔄</button>
          <button onClick={clearAll} disabled={deleting} className="px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400 disabled:opacity-50">{deleting ? '...' : '🗑️ Clear All'}</button>
        </div>
      </div>

      {devices.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {devices.map(d => {
            const devErr = logs.filter(l => l.device_id === d.device_id && l.level === 'ERROR').length
            const isSel = devFilter === d.device_id
            return (
              <div key={d.device_id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${isSel ? 'bg-amber-500/20 border-amber-500/60' : 'bg-[#111] border-[#333] hover:border-[#555]'}`}>
                <button onClick={() => setDevFilter(isSel ? '' : d.device_id)} className="flex items-center gap-2">
                  <span>📱</span>
                  <div>
                    <div className={`text-xs font-medium leading-none ${nicks[d.device_id] ? 'text-amber-400' : isSel ? 'text-amber-300' : 'text-gray-500'}`}>{getLabel(d.device_id, d.device_name)}</div>
                    <div className="text-[10px] opacity-50 mt-0.5">{d.device_id.slice(0,12)}…</div>
                  </div>
                  {devErr > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{devErr}</span>}
                </button>
                {editNick === d.device_id ? (
                  <div className="flex items-center gap-1 ml-1">
                    <input autoFocus value={nickIn} onChange={e => setNickIn(e.target.value)} onKeyDown={e => { if (e.key==='Enter') saveNick(d.device_id); if (e.key==='Escape') setEditNick(null) }} placeholder="Nickname..." className="bg-[#222] border border-amber-500/50 rounded px-2 py-0.5 text-xs w-28 outline-none text-white" />
                    <button onClick={() => saveNick(d.device_id)} className="text-green-400 text-xs">✔</button>
                    <button onClick={() => setEditNick(null)} className="text-gray-500 text-xs">✕</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditNick(d.device_id); setNickIn(nicks[d.device_id]||'') }} className="text-[10px] text-gray-600 hover:text-amber-400" title="Nickname">✏️</button>
                )}
                <button onClick={() => clearDev(d.device_id)} disabled={deleting} className="text-[10px] text-red-500/40 hover:text-red-400 disabled:opacity-30" title="Delete device logs">🗑️</button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap bg-[#111] border border-[#333] rounded-xl px-4 py-3">
        <select value={lvlFilter} onChange={e => setLvlFilter(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-amber-500 outline-none">
          <option value="">All Levels</option>{['INFO','OK','WARN','ERROR','DEBUG'].map(l=><option key={l} value={l}>{l}</option>)}
        </select>
        <input value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder="Filter by tag..." className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-amber-500 outline-none w-40" />
        {(lvlFilter||tagFilter||devFilter) && <button onClick={() => {setLvlFilter('');setTagFilter('');setDevFilter('')}} className="text-xs text-gray-500 hover:text-white">✕ Clear</button>}
        <span className="text-xs text-gray-500 ml-auto">{logs.length} entries</span>
      </div>

      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Loading logs...</div>
          : logs.length === 0 ? <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3"><span className="text-4xl">📭</span><span className="text-sm">No logs yet — open the app on a device</span></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr className="text-[10px] text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left w-20">Time</th><th className="px-4 py-2.5 text-left w-14">Date</th>
                    <th className="px-4 py-2.5 text-left w-14">Level</th><th className="px-4 py-2.5 text-left w-36">Device</th>
                    <th className="px-4 py-2.5 text-left w-28">Tag</th><th className="px-4 py-2.5 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className={`border-b border-[#1a1a1a] hover:bg-[#111] ${DBG_ROW[log.level]||''}`}>
                      <td className="px-4 py-2 text-[#555] whitespace-nowrap">{fmtT(log.created_at)}</td>
                      <td className="px-4 py-2 text-[#444] whitespace-nowrap">{fmtD(log.created_at)}</td>
                      <td className="px-4 py-2"><span className={`flex items-center gap-1.5 font-bold text-[10px] ${DBG_COLOR[log.level]||'text-gray-400'}`}><span className={`w-1.5 h-1.5 rounded-full ${DBG_DOT[log.level]||'bg-gray-400'}`}/>{log.level}</span></td>
                      <td className="px-4 py-2"><div className="truncate max-w-[144px]">{nicks[log.device_id]?<span className="text-amber-400/80">{nicks[log.device_id]}</span>:<span className="text-[#888]">{log.device_name||log.device_id.slice(0,14)+'…'}</span>}</div></td>
                      <td className="px-4 py-2 text-purple-400/80">{log.tag||'—'}</td>
                      <td className="px-4 py-2 text-[#ccc] break-all max-w-[400px]">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}
