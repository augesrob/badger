'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { StatusValue, DoorStatusValue, DockLockStatusValue } from '@/lib/types'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

type Tab = 'truck' | 'door' | 'docklock'

function StatusChip({ s, editId, editForm, setEditForm, onSave, onCancel, onEdit, onDelete }: {
  s: StatusValue | DoorStatusValue | DockLockStatusValue
  editId: number | null
  editForm: { name: string; color: string }
  setEditForm: (f: { name: string; color: string }) => void
  onSave: () => void; onCancel: () => void; onEdit: () => void; onDelete: () => void
}) {
  if (editId === s.id) {
    return (
      <div className="flex gap-1 items-center bg-[#222] border border-amber-500 rounded-lg px-2 py-1">
        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          className="bg-transparent outline-none text-sm w-24" />
        <input type="color" value={editForm.color} onChange={e => setEditForm({ ...editForm, color: e.target.value })}
          className="w-6 h-6 rounded cursor-pointer border-0" />
        <button onClick={onSave} className="text-green-400 text-xs px-1">✓</button>
        <button onClick={onCancel} className="text-red-400 text-xs px-1">✗</button>
      </div>
    )
  }
  return (
    <div className="flex gap-1 items-center bg-[#222] border border-[#333] rounded-lg px-3 py-1.5 group">
      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.status_color }} />
      <span className="text-sm font-medium">{s.status_name}</span>
      <button onClick={onEdit} className="ml-1 text-gray-600 hover:text-amber-400 text-xs opacity-0 group-hover:opacity-100">✏️</button>
      <button onClick={onDelete} className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100">✕</button>
    </div>
  )
}

export default function StatusValuesPage() {
  const { canFeature, isAdmin, loading: authLoading } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('truck')

  const [statuses, setStatuses]               = useState<StatusValue[]>([])
  const [doorStatuses, setDoorStatuses]       = useState<DoorStatusValue[]>([])
  const [dockLockStatuses, setDockLock]       = useState<DockLockStatusValue[]>([])

  const [newStatus,         setNewStatus]         = useState({ name: '', color: '#f59e0b' })
  const [newDoorStatus,     setNewDoorStatus]     = useState({ name: '', color: '#3b82f6' })
  const [newDockLockStatus, setNewDockLockStatus] = useState({ name: '', color: '#22c55e' })

  const [editStatusId,       setEditStatusId]       = useState<number | null>(null)
  const [editDoorStatusId,   setEditDoorStatusId]   = useState<number | null>(null)
  const [editDockLockId,     setEditDockLockId]     = useState<number | null>(null)
  const [editStatusForm,     setEditStatusForm]     = useState({ name: '', color: '' })
  const [editDoorStatusForm, setEditDoorStatusForm] = useState({ name: '', color: '' })
  const [editDockLockForm,   setEditDockLockForm]   = useState({ name: '', color: '' })

  const load = useCallback(async () => {
    const [s, d, dl] = await Promise.all([
      supabase.from('status_values').select('*').order('sort_order'),
      supabase.from('door_status_values').select('*').order('sort_order'),
      supabase.from('dock_lock_status_values').select('*').order('sort_order'),
    ])
    if (s.data)  setStatuses(s.data)
    if (d.data)  setDoorStatuses(d.data)
    if (dl.data) setDockLock(dl.data)
  }, [])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  // Redirect if no access
  useEffect(() => {
    if (!authLoading && !isAdmin && !canFeature('admin_statuses')) {
      router.push('/')
    }
  }, [authLoading, isAdmin, canFeature, router])

  if (authLoading) return <div className="text-center py-20 text-muted">Loading...</div>
  if (!isAdmin && !canFeature('admin_statuses')) return null

  const addStatus = async () => {
    if (!newStatus.name.trim()) return
    const maxOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.sort_order ?? 0)) + 1 : 0
    const { error } = await supabase.from('status_values').insert({ status_name: newStatus.name, status_color: newStatus.color, sort_order: maxOrder })
    if (error) { toast('Error: ' + error.message); return }
    setNewStatus({ name: '', color: '#f59e0b' }); load(); toast('Status added ✓')
  }
  const deleteStatus = async (id: number) => { if (!confirm('Delete?')) return; await supabase.from('status_values').delete().eq('id', id); load() }
  const startEditStatus = (s: StatusValue) => { setEditStatusId(s.id); setEditStatusForm({ name: s.status_name, color: s.status_color }) }
  const saveEditStatus = async () => {
    await supabase.from('status_values').update({ status_name: editStatusForm.name, status_color: editStatusForm.color }).eq('id', editStatusId)
    setEditStatusId(null); load(); toast('Saved ✓')
  }

  const addDoorStatus = async () => {
    if (!newDoorStatus.name.trim()) return
    const maxOrder = doorStatuses.length > 0 ? Math.max(...doorStatuses.map(s => s.sort_order ?? 0)) + 1 : 0
    await supabase.from('door_status_values').insert({ status_name: newDoorStatus.name, status_color: newDoorStatus.color, sort_order: maxOrder })
    setNewDoorStatus({ name: '', color: '#3b82f6' }); load(); toast('Door status added ✓')
  }
  const deleteDoorStatus = async (id: number) => { if (!confirm('Delete?')) return; await supabase.from('door_status_values').delete().eq('id', id); load() }
  const startEditDoorStatus = (s: DoorStatusValue) => { setEditDoorStatusId(s.id); setEditDoorStatusForm({ name: s.status_name, color: s.status_color }) }
  const saveEditDoorStatus = async () => {
    await supabase.from('door_status_values').update({ status_name: editDoorStatusForm.name, status_color: editDoorStatusForm.color }).eq('id', editDoorStatusId)
    setEditDoorStatusId(null); load(); toast('Saved ✓')
  }

  const addDockLockStatus = async () => {
    if (!newDockLockStatus.name.trim()) return
    const maxOrder = dockLockStatuses.length > 0 ? Math.max(...dockLockStatuses.map(s => s.sort_order ?? 0)) + 1 : 0
    await supabase.from('dock_lock_status_values').insert({ status_name: newDockLockStatus.name, status_color: newDockLockStatus.color, sort_order: maxOrder })
    setNewDockLockStatus({ name: '', color: '#22c55e' }); load(); toast('Dock lock status added ✓')
  }
  const deleteDockLockStatus = async (id: number) => { if (!confirm('Delete?')) return; await supabase.from('dock_lock_status_values').delete().eq('id', id); load() }
  const startEditDockLockStatus = (s: DockLockStatusValue) => { setEditDockLockId(s.id); setEditDockLockForm({ name: s.status_name, color: s.status_color }) }
  const saveEditDockLockStatus = async () => {
    await supabase.from('dock_lock_status_values').update({ status_name: editDockLockForm.name, status_color: editDockLockForm.color }).eq('id', editDockLockId)
    setEditDockLockId(null); load(); toast('Saved ✓')
  }

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">🏷️ Status Values</h1>
        <p className="text-xs text-gray-500 mt-1">Changes sync instantly to the Android app and TTS announcements.</p>
      </div>

      <div className="flex gap-1 bg-[#111] rounded-lg p-1 w-fit">
        {(['truck', 'door', 'docklock'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
            {t === 'truck' ? `🚚 Truck (${statuses.length})` : t === 'door' ? `🚪 Door (${doorStatuses.length})` : `🔒 Dock Lock (${dockLockStatuses.length})`}
          </button>
        ))}
      </div>

      {tab === 'truck' && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[11px] text-gray-500 mb-3">Used on Live Movement, voice commands, and TTS announcements.</p>
          <div className="flex gap-2 mb-4 flex-wrap items-end">
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status Name</label>
              <input value={newStatus.name} onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addStatus()} placeholder="e.g. In Door"
                className="bg-[#222] border border-[#333] rounded px-3 py-2 text-sm focus:border-amber-500 outline-none" /></div>
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color</label>
              <input type="color" value={newStatus.color} onChange={e => setNewStatus({ ...newStatus, color: e.target.value })} className="w-10 h-[38px] rounded cursor-pointer border-0" /></div>
            <button onClick={addStatus} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <StatusChip key={s.id} s={s} editId={editStatusId} editForm={editStatusForm} setEditForm={setEditStatusForm}
                onSave={saveEditStatus} onCancel={() => setEditStatusId(null)} onEdit={() => startEditStatus(s)} onDelete={() => deleteStatus(s.id)} />
            ))}
            {statuses.length === 0 && <p className="text-sm text-gray-500">No truck statuses yet.</p>}
          </div>
        </div>
      )}

      {tab === 'door' && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[11px] text-gray-500 mb-3">Used on Loading Doors, voice commands, and the Android app.</p>
          <div className="flex gap-2 mb-4 flex-wrap items-end">
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status Name</label>
              <input value={newDoorStatus.name} onChange={e => setNewDoorStatus({ ...newDoorStatus, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addDoorStatus()} placeholder="e.g. Loading"
                className="bg-[#222] border border-[#333] rounded px-3 py-2 text-sm focus:border-amber-500 outline-none" /></div>
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color</label>
              <input type="color" value={newDoorStatus.color} onChange={e => setNewDoorStatus({ ...newDoorStatus, color: e.target.value })} className="w-10 h-[38px] rounded cursor-pointer border-0" /></div>
            <button onClick={addDoorStatus} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {doorStatuses.map(s => (
              <StatusChip key={s.id} s={s} editId={editDoorStatusId} editForm={editDoorStatusForm} setEditForm={setEditDoorStatusForm}
                onSave={saveEditDoorStatus} onCancel={() => setEditDoorStatusId(null)} onEdit={() => startEditDoorStatus(s)} onDelete={() => deleteDoorStatus(s.id)} />
            ))}
            {doorStatuses.length === 0 && <p className="text-sm text-gray-500">No door statuses yet.</p>}
          </div>
        </div>
      )}

      {tab === 'docklock' && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[11px] text-gray-500 mb-3">Controls the dock lock chip on doors in Movement and Android.</p>
          <div className="flex gap-2 mb-4 flex-wrap items-end">
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status Name</label>
              <input value={newDockLockStatus.name} onChange={e => setNewDockLockStatus({ ...newDockLockStatus, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addDockLockStatus()} placeholder="e.g. Working"
                className="bg-[#222] border border-[#333] rounded px-3 py-2 text-sm focus:border-amber-500 outline-none" /></div>
            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color</label>
              <input type="color" value={newDockLockStatus.color} onChange={e => setNewDockLockStatus({ ...newDockLockStatus, color: e.target.value })} className="w-10 h-[38px] rounded cursor-pointer border-0" /></div>
            <button onClick={addDockLockStatus} className="bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-amber-400">+ Add</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {dockLockStatuses.map(s => (
              <StatusChip key={s.id} s={s} editId={editDockLockId} editForm={editDockLockForm} setEditForm={setEditDockLockForm}
                onSave={saveEditDockLockStatus} onCancel={() => setEditDockLockId(null)} onEdit={() => startEditDockLockStatus(s)} onDelete={() => deleteDockLockStatus(s.id)} />
            ))}
            {dockLockStatuses.length === 0 && <p className="text-sm text-gray-500">No dock lock statuses yet.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
