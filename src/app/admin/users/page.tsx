'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { useRouter } from 'next/navigation'
import type { Role } from '@/components/AuthProvider'

interface UserRow {
  id: string
  username: string
  display_name: string | null
  role: Role
  avatar_color: string
  avatar_url: string | null
  phone: string | null
  sms_enabled: boolean
  created_at: string
  email?: string
}

interface EditForm {
  displayName: string
  username: string
  email: string
  phone: string
  role: Role
  smsEnabled: boolean
  newPassword: string
  showPassword: boolean
}

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: 'admin',       label: '👑 Admin',       color: '#f59e0b' },
  { value: 'print_room',  label: '🖨️ Print Room', color: '#3b82f6' },
  { value: 'truck_mover', label: '🚛 Truck Mover', color: '#8b5cf6' },
  { value: 'trainee',     label: '📚 Trainee',     color: '#22c55e' },
  { value: 'driver',      label: '🚚 Driver',      color: '#6b7280' },
]

const CREATE_DEFAULT = { email: '', password: '', username: '', displayName: '', role: 'driver' as Role }

export default function AdminUsersPage() {
  const { profile, isAdmin, loading: authLoading } = useAuth()
  const toast  = useToast()
  const router = useRouter()

  const [users, setUsers]           = useState<UserRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [editUser, setEditUser]     = useState<UserRow | null>(null)
  const [editForm, setEditForm]     = useState<EditForm | null>(null)
  const [saving, setSaving]         = useState(false)
  const [resetting, setResetting]   = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(CREATE_DEFAULT)
  const [creating, setCreating]     = useState(false)
  const [showCreatePw, setShowCreatePw] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    // Try view with emails first, fall back to profiles if view doesn't exist/RLS blocks
    const { data: viewData, error: viewError } = await supabase
      .from('profiles_with_email')
      .select('*')
      .order('created_at', { ascending: false })

    if (!viewError && viewData) {
      setUsers(viewData as UserRow[])
    } else {
      // Fallback: profiles only (no email column)
      const { data: fallback } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setUsers((fallback || []) as UserRow[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (!profile) { router.push('/login'); return }
      if (!isAdmin) { router.push('/'); return }
      fetchUsers()
    }
  }, [authLoading, profile, isAdmin, router, fetchUsers])

  const openEdit = (user: UserRow) => {
    setEditUser(user)
    setEditForm({
      displayName: user.display_name || '',
      username: user.username,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      smsEnabled: user.sms_enabled,
      newPassword: '',
      showPassword: false,
    })
  }

  const saveEdit = async () => {
    if (!editUser || !editForm || !profile) return
    setSaving(true)

    const updates: Record<string, unknown> = {
      displayName: editForm.displayName,
      username: editForm.username,
      role: editForm.role,
      phone: editForm.phone,
      smsEnabled: editForm.smsEnabled,
    }
    if (editForm.email && editForm.email !== editUser.email) updates.email = editForm.email
    if (editForm.newPassword) updates.newPassword = editForm.newPassword

    const res = await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: profile.id, targetId: editUser.id, updates }),
    })
    const data = await res.json()
    setSaving(false)

    if (data.error) { toast('Error: ' + data.error); return }
    toast('User updated ✓')
    setEditUser(null)
    setEditForm(null)
    fetchUsers()
  }

  const sendPasswordReset = async () => {
    if (!editUser || !editForm?.email || !profile) return
    setResetting(true)
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: profile.id, targetEmail: editForm.email || editUser.email }),
    })
    const data = await res.json()
    setResetting(false)
    if (data.error) { toast('Error: ' + data.error); return }
    toast('Password reset email sent ✓')
  }

  const deleteUser = async (user: UserRow) => {
    if (!confirm(`Delete @${user.username}? This cannot be undone.`)) return
    const res = await fetch('/api/admin/update-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: profile?.id, targetId: user.id }),
    })
    const data = await res.json()
    if (data.error) { toast('Error: ' + data.error); return }
    toast(`Deleted @${user.username}`)
    fetchUsers()
  }

  const createUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.username) {
      toast('Email, password and username are required'); return
    }
    if (createForm.password.length < 6) { toast('Password must be at least 6 characters'); return }
    setCreating(true)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createForm, requesterId: profile!.id }),
    })
    const data = await res.json()
    setCreating(false)
    if (data.error) { toast('Error: ' + data.error); return }
    toast(`Account created for @${createForm.username} ✓`)
    setShowCreate(false)
    setCreateForm(CREATE_DEFAULT)
    fetchUsers()
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading || loading) return <div className="text-center py-20 text-muted">Loading...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">👑 User Management</h1>
          <p className="text-xs text-muted mt-1">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, @tag, email..."
            className="bg-input border border-[#333] rounded-lg px-4 py-2 text-sm focus:border-amber-500 outline-none w-56" />
          <button onClick={() => setShowCreate(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors whitespace-nowrap">
            + Create Account
          </button>
        </div>
      </div>

      {/* User list */}
      <div className="bg-card border border-[#333] rounded-2xl overflow-hidden">
        <div className="hidden md:grid text-xs text-muted font-bold uppercase tracking-wider px-6 py-3 border-b border-[#333]"
          style={{ gridTemplateColumns: '1fr 180px 150px 110px' }}>
          <span>User</span><span>Email</span><span>Role</span><span>Actions</span>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No users found</div>
        )}

        {filtered.map(user => {
          const roleInfo = ROLES.find(r => r.value === user.role)
          const initials = (user.display_name || user.username).slice(0, 2).toUpperCase()
          return (
            <div key={user.id}
              className="flex flex-wrap md:grid items-center px-6 py-4 border-b border-[#222] hover:bg-[#1a1a1a] transition-colors gap-3"
              style={{ gridTemplateColumns: '1fr 180px 150px 110px' }}>

              {/* Avatar + name */}
              <div className="flex items-center gap-3 min-w-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: user.avatar_color || '#f59e0b' }}>
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{user.display_name || user.username}</div>
                  <div className="text-xs text-muted truncate">@{user.username}</div>
                  {user.id === profile?.id && <div className="text-[10px] text-amber-500">YOU</div>}
                </div>
              </div>

              <div className="text-xs text-muted truncate pr-2 hidden md:block">{user.email || '—'}</div>

              <div className="hidden md:block">
                <span className="text-xs font-medium px-2 py-1 rounded-full border"
                  style={{ color: roleInfo?.color, borderColor: (roleInfo?.color || '#888') + '44', background: (roleInfo?.color || '#888') + '11' }}>
                  {roleInfo?.label}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto md:ml-0">
                <button onClick={() => openEdit(user)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24' }}>
                  ✏️ Edit
                </button>
                {user.id !== profile?.id && (
                  <button onClick={() => deleteUser(user)}
                    className="px-2 py-1.5 rounded-lg text-xs transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                    title="Delete user">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Edit User Modal ── */}
      {editUser && editForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setEditUser(null); setEditForm(null) }}>
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#333]">
              {editUser.avatar_url ? (
                <img src={editUser.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: editUser.avatar_color || '#f59e0b' }}>
                  {(editUser.display_name || editUser.username).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-bold">{editUser.display_name || editUser.username}</div>
                <div className="text-xs text-muted">@{editUser.username}</div>
              </div>
              <button onClick={() => { setEditUser(null); setEditForm(null) }}
                className="ml-auto text-muted hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Identity */}
              <section>
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Identity</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted mb-1 block">Display Name</label>
                    <input value={editForm.displayName}
                      onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                      placeholder="John D."
                      className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">@Username</label>
                    <input value={editForm.username}
                      onChange={e => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      placeholder="johnd"
                      className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none font-mono" />
                  </div>
                </div>
              </section>

              {/* Role */}
              <section>
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Role & Access</div>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} onClick={() => setEditForm({ ...editForm, role: r.value })}
                      disabled={editUser.id === profile?.id}
                      style={{
                        border: `1px solid ${editForm.role === r.value ? r.color : '#333'}`,
                        background: editForm.role === r.value ? r.color + '22' : 'transparent',
                        color: editForm.role === r.value ? r.color : '#888',
                        padding: '8px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        cursor: editUser.id === profile?.id ? 'not-allowed' : 'pointer',
                        opacity: editUser.id === profile?.id ? 0.5 : 1,
                      }}>
                      {r.label}
                    </button>
                  ))}
                </div>
                {editUser.id === profile?.id && (
                  <p className="text-[10px] text-muted mt-1">You cannot change your own role.</p>
                )}
              </section>

              {/* Contact */}
              <section>
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Contact</div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted mb-1 block">Email</label>
                    <input type="email" value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                    <p className="text-[10px] text-muted mt-1">Change takes effect immediately — no confirmation email.</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">Phone</label>
                    <div className="flex gap-2">
                      <input value={editForm.phone}
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+1 555 000 0000"
                        className="flex-1 bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none font-mono" />
                      <button
                        onClick={() => setEditForm({ ...editForm, smsEnabled: !editForm.smsEnabled })}
                        style={{
                          background: editForm.smsEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                          border: `1px solid ${editForm.smsEnabled ? 'rgba(34,197,94,0.5)' : '#444'}`,
                          color: editForm.smsEnabled ? '#4ade80' : '#6b7280',
                          padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        }}>
                        {editForm.smsEnabled ? '📱 SMS On' : '📵 SMS Off'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Password */}
              <section>
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Password</div>
                <div className="space-y-2">
                  <div className="relative">
                    <input type={editForm.showPassword ? 'text' : 'password'}
                      value={editForm.newPassword}
                      onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                      placeholder="Set new password (leave blank to keep current)"
                      className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 pr-10 text-sm focus:border-amber-500 outline-none" />
                    <button type="button"
                      onClick={() => setEditForm({ ...editForm, showPassword: !editForm.showPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white text-xs">
                      {editForm.showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button onClick={sendPasswordReset} disabled={resetting || !editForm.email}
                    className="w-full bg-[#1a1a1a] border border-[#333] hover:border-amber-500/50 text-sm py-2 rounded-lg transition-colors text-muted hover:text-white disabled:opacity-40">
                    {resetting ? 'Sending...' : '📧 Send Password Reset Email'}
                  </button>
                  {!editForm.email && <p className="text-[10px] text-red-400">Email required to send reset link.</p>}
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-[#333] flex gap-3">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditUser(null); setEditForm(null) }}
                className="bg-[#333] hover:bg-[#444] text-white px-5 py-2.5 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Account Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowCreate(false); setCreateForm(CREATE_DEFAULT) }}>
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">➕ Create Account</h2>
              <button onClick={() => { setShowCreate(false); setCreateForm(CREATE_DEFAULT) }} className="text-muted hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Username *</label>
                  <input value={createForm.username}
                    onChange={e => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="johnd"
                    className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Display Name</label>
                  <input value={createForm.displayName}
                    onChange={e => setCreateForm({ ...createForm, displayName: e.target.value })}
                    placeholder="John D."
                    className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Email *</label>
                <input type="email" value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Password *</label>
                <div className="relative">
                  <input type={showCreatePw ? 'text' : 'password'} value={createForm.password}
                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 pr-10 text-sm focus:border-amber-500 outline-none" />
                  <button type="button" onClick={() => setShowCreatePw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white text-xs">
                    {showCreatePw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} onClick={() => setCreateForm({ ...createForm, role: r.value })}
                      style={{
                        border: `1px solid ${createForm.role === r.value ? r.color : '#333'}`,
                        background: createForm.role === r.value ? r.color + '22' : 'transparent',
                        color: createForm.role === r.value ? r.color : '#888',
                        padding: '8px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-xs text-muted space-y-1">
                <div>📧 <span className="text-white">{createForm.email || '—'}</span></div>
                <div>👤 <span className="text-amber-400">@{createForm.username || '—'}</span></div>
                <div>🏷️ <span className="text-white">{ROLES.find(r => r.value === createForm.role)?.label}</span></div>
                <div className="text-green-400">✅ Pre-verified — can sign in immediately</div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={createUser} disabled={creating}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Account'}
              </button>
              <button onClick={() => { setShowCreate(false); setCreateForm(CREATE_DEFAULT) }}
                className="bg-[#333] hover:bg-[#444] text-white px-5 py-2.5 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
