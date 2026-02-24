'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Truck, Trailer, StatusValue, Route, TrailerItem, Tractor, AutomationRule } from '@/lib/types'
import { TTSPanel } from '@/components/TTSPanel'
import { runPreshiftAutomation, runAutomation } from '@/lib/automation'
import Link from 'next/link'
import RoleManager from '@/components/RoleManager'
import NotificationPrefs from '@/components/NotificationPrefs'

const NAV_ITEMS = [
  { id: 'trucks',      label: '🚚 Truck Database',   ready: true },
  { id: 'tractors',    label: '🚛 Tractor Trailers',  ready: true },
  { id: 'fleet',       label: '🚛 Fleet Inventory',   ready: true },
  { id: 'automation',  label: '⚡ Automation',         ready: true },
  { id: 'statuses',    label: '🏷️ Status Values',     ready: true },
  { id: 'routes',      label: '🗺️ Routes',            ready: true },
  { id: 'roles',       label: '🛡️ Role Manager',      ready: true },
  { id: 'reset',       label: '⚠️ Data Reset',        ready: true },
  { id: 'notifications', label: '🔔 Notifications',   ready: true },
  { id: 'api',         label: '🔌 API',               ready: false },
  { id: 'accounts',    label: '👤 Accounts',          ready: true, href: '/admin/users' },
]

export default function Admin() {
  const toast = useToast()
  const [activeSection, setActiveSection] = useState('trucks')

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
  const [routes, setRoutes] = useState<Route[]>([])
  const [newStatus, setNewStatus] = useState({ name: '', color: '#6b7280' })
  const [newRoute, setNewRoute] = useState({ name: '', number: '' })
  const [resetLog, setResetLog] = useState<{ id: number; reset_type: string; reset_at: string; reset_by: string }[]>([])

  // Status editing
  const [editStatusId, setEditStatusId] = useState<number | null>(null)
  const [editStatusForm, setEditStatusForm] = useState({ name: '', color: '' })

  // Automation state
  const [autoRules, setAutoRules] = useState<AutomationRule[]>([])
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editRule, setEditRule] = useState<AutomationRule | null>(null)
  const [ruleForm, setRuleForm] = useState({ rule_name: '', description: '', trigger_type: 'truck_number_equals', trigger_value: '', action_type: 'set_truck_status', action_value: '', sort_order: '100' })

  const loadAll = useCallback(async () => {
    const [trucksRes, statusRes, routeRes, resetRes, tractorRes, trailerRes, rulesRes] = await Promise.all([
      supabase.from('trucks').select('*').order('truck_number'),
      supabase.from('status_values').select('*').order('sort_order'),
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
    if (routeRes.data) setRoutes(routeRes.data)
    if (resetRes.data) setResetLog(resetRes.data)
    if (tractorRes.data) setTractors(tractorRes.data)
    if (trailerRes.data) setTrailerList(trailerRes.data)
    if (rulesRes.data) setAutoRules(rulesRes.data)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

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

  const statusSectionJSX = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">🏷️ Status Values</h2>
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
        <div className="flex gap-2 mb-4 flex-wrap items-end">
          <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status Name</label>
            <input value={newStatus.name} onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && addStatus()} placeholder="New status..." className="input-field" /></div>
          <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color</label>
            <input type="color" value={newStatus.color} onChange={e => setNewStatus({ ...newStatus, color: e.target.value })} className="w-10 h-[38px] rounded cursor-pointer border-0" /></div>
          <button onClick={addStatus} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              {editStatusId === s.id ? (
                <div className="flex items-center gap-1.5 bg-[#222] rounded-lg px-2 py-1.5 border border-amber-500/50">
                  <input type="color" value={editStatusForm.color}
                    onChange={e => setEditStatusForm({ ...editStatusForm, color: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 flex-shrink-0" />
                  <input value={editStatusForm.name}
                    onChange={e => setEditStatusForm({ ...editStatusForm, name: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') saveEditStatus(); if (e.key === 'Escape') setEditStatusId(null) }}
                    autoFocus
                    className="input-field text-xs py-1 w-24" />
                  <button onClick={saveEditStatus} className="text-green-500 hover:text-green-400 text-xs font-bold">✓</button>
                  <button onClick={() => setEditStatusId(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 rounded-lg pl-0.5 pr-1 py-0.5 hover:bg-white/5 group">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-white cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: s.status_color }}
                    onClick={() => startEditStatus(s)} title="Click to edit">
                    {s.status_name}
                  </span>
                  <button onClick={() => startEditStatus(s)} className="text-gray-600 hover:text-white text-[10px] opacity-0 group-hover:opacity-100">✏️</button>
                  <button onClick={() => deleteStatus(s.id)} className="text-red-500/20 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100">&times;</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex gap-0 -mx-4 -mt-4" style={{ minHeight: 'calc(100vh - 49px)' }}>
      {/* LEFT SIDEBAR NAV */}
      <div className="w-[220px] flex-shrink-0 bg-[#111] border-r border-[#333] py-4 hidden md:block">
        <h2 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Admin Settings</h2>
        {NAV_ITEMS.map(item => (
          item.href ? (
            <Link key={item.id} href={item.href}
              className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 hover:bg-white/5 text-gray-300 cursor-pointer">
              {item.label}
              <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">New</span>
            </Link>
          ) : (
            <button key={item.id} onClick={() => item.ready && setActiveSection(item.id)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2
                ${activeSection === item.id ? 'bg-amber-500/10 text-amber-500 border-r-2 border-amber-500' : ''}
                ${item.ready ? 'hover:bg-white/5 text-gray-300 cursor-pointer' : 'text-gray-600 cursor-not-allowed'}`}>
              {item.label}
              {!item.ready && <span className="ml-auto text-[9px] bg-[#222] text-gray-500 px-1.5 py-0.5 rounded">Soon</span>}
            </button>
          )
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
                        <option value="Loading">Loading</option>
                        <option value="End Of Tote">End Of Tote</option>
                        <option value="EOT+1">EOT+1</option>
                        <option value="Change Truck/Trailer">Change Truck/Trailer</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Done for Night">Done for Night</option>
                        <option value="100%">100%</option>
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

  function renderSection() {
    switch (activeSection) {
      case 'trucks': return <TruckSection />
      case 'tractors': return <TractorSection />
      case 'fleet': return <FleetSection />
      case 'automation': return <AutomationSection />
      case 'statuses': return statusSectionJSX()
      case 'routes': return <RouteSection />
      case 'roles': return <RoleManager />
      case 'reset': return <ResetSection />
      case 'notifications': return <NotificationsSection />
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
        {resetLog.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Recent Resets</h3>
            {resetLog.map(l => (
              <div key={l.id} className="text-xs text-gray-500 flex gap-2 py-0.5"><span className="font-bold text-gray-400">{l.reset_type}</span><span>—</span><span>{new Date(l.reset_at).toLocaleString()}</span></div>
            ))}
          </div>
        )}
      </div>
    )
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">{label}</label>{children}</div>
}

function NotificationsSection() {
  const [users, setUsers]           = useState<{ id: string; display_name: string | null; username: string; role: string; avatar_color: string }[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">🔔 Notification Preferences</h2>
          <p className="text-xs text-gray-500 mt-1">Manage notification settings for each user. Users can also manage their own in their Profile.</p>
        </div>
      </div>

      {/* TTS / Sound — kept for admin reference */}
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

      {/* Per-user notification preferences */}
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
                {/* User row header */}
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

                {/* Expanded prefs */}
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
  )
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
