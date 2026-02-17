'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Truck, Trailer, StatusValue, Route } from '@/lib/types'

export default function Admin() {
  const toast = useToast()
  const [trucks, setTrucks] = useState<(Truck & { trailers: Trailer[] })[]>([])
  const [statuses, setStatuses] = useState<StatusValue[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [showTruckModal, setShowTruckModal] = useState(false)
  const [editTruck, setEditTruck] = useState<Truck | null>(null)
  const [form, setForm] = useState({ truck_number: '', truck_type: 'box_truck', transmission: 'automatic', trailer_count: '1', notes: '' })
  const [newStatus, setNewStatus] = useState({ name: '', color: '#6b7280' })
  const [newRoute, setNewRoute] = useState({ name: '', number: '' })
  const [resetLog, setResetLog] = useState<{id: number; reset_type: string; reset_at: string; reset_by: string}[]>([])

  const loadAll = useCallback(async () => {
    const { data: t } = await supabase.from('trucks').select('*').order('truck_number')
    if (t) {
      const withTrailers = await Promise.all(t.map(async (truck: Truck) => {
        if (truck.truck_type === 'semi') {
          const { data: tr } = await supabase.from('trailers').select('*').eq('truck_id', truck.id).eq('is_active', true).order('trailer_number')
          return { ...truck, trailers: tr || [] }
        }
        return { ...truck, trailers: [] }
      }))
      setTrucks(withTrailers)
    }
    const { data: s } = await supabase.from('status_values').select('*').order('sort_order')
    if (s) setStatuses(s)
    const { data: r } = await supabase.from('routes').select('*').order('sort_order')
    if (r) setRoutes(r)
    const { data: rl } = await supabase.from('reset_log').select('*').order('reset_at', { ascending: false }).limit(20)
    if (rl) setResetLog(rl)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Truck CRUD
  const saveTruck = async () => {
    const num = parseInt(form.truck_number)
    if (!num) { toast('Truck number required', 'error'); return }

    if (editTruck) {
      await supabase.from('trucks').update({
        truck_number: num, truck_type: form.truck_type, transmission: form.transmission, notes: form.notes || null,
      }).eq('id', editTruck.id)

      if (form.truck_type === 'semi') {
        const count = parseInt(form.trailer_count) || 1
        const { data: existing } = await supabase.from('trailers').select('trailer_number').eq('truck_id', editTruck.id)
        const maxExisting = existing ? Math.max(...existing.map(e => e.trailer_number), 0) : 0
        for (let i = maxExisting + 1; i <= count; i++) {
          await supabase.from('trailers').insert({ truck_id: editTruck.id, trailer_number: i })
        }
      }
    } else {
      const { data: newTruck, error } = await supabase.from('trucks').insert({
        truck_number: num, truck_type: form.truck_type, transmission: form.transmission, notes: form.notes || null,
      }).select().single()

      if (error) { toast(error.message.includes('unique') ? 'Truck number already exists' : error.message, 'error'); return }

      if (form.truck_type === 'semi' && newTruck) {
        const count = parseInt(form.trailer_count) || 1
        for (let i = 1; i <= count; i++) {
          await supabase.from('trailers').insert({ truck_id: newTruck.id, trailer_number: i })
        }
      }
    }

    setShowTruckModal(false)
    toast('Truck saved!')
    loadAll()
  }

  const deleteTruck = async (id: number) => {
    if (!confirm('Delete this truck? Cannot be undone.')) return
    await supabase.from('trucks').delete().eq('id', id)
    toast('Truck deleted')
    loadAll()
  }

  const openEdit = (t: Truck & { trailers: Trailer[] }) => {
    setEditTruck(t)
    setForm({
      truck_number: String(t.truck_number),
      truck_type: t.truck_type,
      transmission: t.transmission,
      trailer_count: String(t.trailers.length || 1),
      notes: t.notes || '',
    })
    setShowTruckModal(true)
  }

  const openAdd = () => {
    setEditTruck(null)
    setForm({ truck_number: '', truck_type: 'box_truck', transmission: 'automatic', trailer_count: '1', notes: '' })
    setShowTruckModal(true)
  }

  // Status CRUD
  const addStatus = async () => {
    if (!newStatus.name) { toast('Enter a status name', 'error'); return }
    const maxOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.sort_order)) + 1 : 1
    const { error } = await supabase.from('status_values').insert({ status_name: newStatus.name, status_color: newStatus.color, sort_order: maxOrder })
    if (error) { toast('Status already exists', 'error'); return }
    setNewStatus({ name: '', color: '#6b7280' })
    toast('Status added')
    loadAll()
  }

  const deleteStatus = async (id: number) => {
    if (!confirm('Delete this status?')) return
    await supabase.from('status_values').delete().eq('id', id)
    loadAll()
  }

  // Route CRUD
  const addRoute = async () => {
    if (!newRoute.name) { toast('Enter a route name', 'error'); return }
    await supabase.from('routes').insert({ route_name: newRoute.name, route_number: newRoute.number || null })
    setNewRoute({ name: '', number: '' })
    toast('Route added')
    loadAll()
  }

  const deleteRoute = async (id: number) => {
    if (!confirm('Delete this route?')) return
    await supabase.from('routes').delete().eq('id', id)
    loadAll()
  }

  // Reset
  const resetData = async (type: string) => {
    if (type === 'all') {
      const input = prompt('⚠️ This resets ALL daily data. Truck database is protected.\n\nType "RESET" to confirm:')
      if (input !== 'RESET') { toast('Cancelled', 'error'); return }
    } else {
      if (!confirm(`Reset ${type}? Cannot be undone.`)) return
    }

    if (type === 'printroom' || type === 'all') {
      await supabase.from('printroom_entries').delete().neq('id', 0)
      await supabase.from('loading_doors').update({ is_done_for_night: false, door_status: 'Loading' }).neq('id', 0)
    }
    if (type === 'preshift' || type === 'all') {
      await supabase.from('staging_doors').update({ position1_truck: null, position2_truck: null, position3_truck: null, position4_truck: null }).neq('id', 0)
    }
    if (type === 'movement' || type === 'all') {
      await supabase.from('live_movement').delete().neq('id', 0)
    }

    await supabase.from('reset_log').insert({ reset_type: type, reset_by: 'manual' })
    toast(`Reset ${type} complete`)
    loadAll()
  }

  const typeIcons: Record<string, string> = { box_truck: '🚚 Box', van: '🚐 Van', tandem: '🚛 Tandem', semi: '🚛 Semi' }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">⚙️ Admin Settings</h1>

      {/* TRUCK DATABASE */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-amber-500 font-bold">🚚 Truck Database <span className="text-xs text-gray-500">(Protected)</span></h3>
          <button onClick={openAdd} className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400">+ Add Truck</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-amber-500 uppercase border-b border-[#333]">
              <th className="py-2 text-left">Truck#</th><th className="text-left">Type</th><th className="text-left">Trans.</th>
              <th className="text-left">Trailers</th><th className="text-left">Notes</th><th></th>
            </tr></thead>
            <tbody>
              {trucks.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2 font-extrabold text-amber-500 text-lg">{t.truck_number}</td>
                  <td>{typeIcons[t.truck_type]}</td>
                  <td>{t.transmission === 'manual' ? '⚙️ Manual' : '🅰️ Auto'}</td>
                  <td className="text-xs text-gray-400">{t.trailers.length > 0 ? t.trailers.map(tr => `${t.truck_number}-${tr.trailer_number}`).join(', ') : '—'}</td>
                  <td className="text-xs text-gray-500">{t.notes || ''}</td>
                  <td className="text-right">
                    <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-white mr-2">✏️</button>
                    <button onClick={() => deleteTruck(t.id)} className="text-red-500/50 hover:text-red-500">✕</button>
                  </td>
                </tr>
              ))}
              {trucks.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No trucks yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* STATUSES */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-4">
        <h3 className="text-amber-500 font-bold mb-3">🏷️ Status Values</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input value={newStatus.name} onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
            placeholder="New status..." className="bg-[#222] border border-[#333] rounded px-3 py-2 text-sm focus:border-amber-500 outline-none" />
          <input type="color" value={newStatus.color} onChange={e => setNewStatus({ ...newStatus, color: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border-0" />
          <button onClick={addStatus} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold">+ Add</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold text-white" style={{ background: s.status_color }}>
              {s.status_name}
              <button onClick={() => deleteStatus(s.id)} className="text-white/50 hover:text-white ml-1">&times;</button>
            </span>
          ))}
        </div>
      </div>

      {/* ROUTES */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-4">
        <h3 className="text-amber-500 font-bold mb-3">🗺️ Routes</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input value={newRoute.name} onChange={e => setNewRoute({ ...newRoute, name: e.target.value })}
            placeholder="Route name" className="bg-[#222] border border-[#333] rounded px-3 py-2 text-sm focus:border-amber-500 outline-none" />
          <input value={newRoute.number} onChange={e => setNewRoute({ ...newRoute, number: e.target.value })}
            placeholder="Code" className="bg-[#222] border border-[#333] rounded px-3 py-2 text-sm w-20 focus:border-amber-500 outline-none" />
          <button onClick={addRoute} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold">+ Add</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {routes.map(r => (
            <span key={r.id} className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold bg-[#222] border border-[#333]">
              {r.route_name} {r.route_number ? `(${r.route_number})` : ''}
              <button onClick={() => deleteRoute(r.id)} className="text-red-500/50 hover:text-red-500 ml-1">&times;</button>
            </span>
          ))}
        </div>
      </div>

      {/* RESET */}
      <div className="bg-[#1a1a1a] border border-red-900 rounded-xl p-4 mb-4">
        <h3 className="text-red-400 font-bold mb-2">⚠️ Data Reset</h3>
        <p className="text-sm text-gray-500 mb-3">Truck database is <strong className="text-green-500">always protected</strong>.</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => resetData('printroom')} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm">🖨️ Reset Print Room</button>
          <button onClick={() => resetData('preshift')} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm">📋 Reset PreShift</button>
          <button onClick={() => resetData('movement')} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm">🚚 Reset Movement</button>
          <button onClick={() => resetData('all')} className="bg-red-700 text-white px-5 py-2 rounded font-bold text-sm border-2 border-white">💣 RESET ALL</button>
        </div>
        {resetLog.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <h4 className="font-bold mb-1">Recent Resets</h4>
            {resetLog.map(l => (
              <div key={l.id}>📋 <strong>{l.reset_type}</strong> — {new Date(l.reset_at).toLocaleString()} ({l.reset_by})</div>
            ))}
          </div>
        )}
      </div>

      {/* TRUCK MODAL */}
      {showTruckModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-amber-500 font-bold text-lg mb-4">{editTruck ? `Edit Truck ${editTruck.truck_number}` : 'Add Truck'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Truck Number</label>
                <input type="number" value={form.truck_number} onChange={e => setForm({ ...form, truck_number: e.target.value })}
                  className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 mt-1 focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Type</label>
                <select value={form.truck_type} onChange={e => setForm({ ...form, truck_type: e.target.value })}
                  className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 mt-1 focus:border-amber-500 outline-none">
                  <option value="box_truck">🚚 Box Truck</option><option value="van">🚐 Van</option>
                  <option value="tandem">🚛 Tandem</option><option value="semi">🚛 Semi</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Transmission</label>
                <select value={form.transmission} onChange={e => setForm({ ...form, transmission: e.target.value })}
                  className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 mt-1 focus:border-amber-500 outline-none">
                  <option value="automatic">Automatic</option><option value="manual">Manual</option>
                </select>
              </div>
              {form.truck_type === 'semi' && (
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Number of Trailers</label>
                  <input type="number" value={form.trailer_count} onChange={e => setForm({ ...form, trailer_count: e.target.value })}
                    min="1" max="10" className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 mt-1 focus:border-amber-500 outline-none" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional" className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 mt-1 focus:border-amber-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveTruck} className="flex-1 bg-amber-500 text-black py-2 rounded font-bold hover:bg-amber-400">Save</button>
              <button onClick={() => setShowTruckModal(false)} className="bg-[#333] text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
