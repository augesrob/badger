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
}

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: 'admin',       label: '👑 Admin',        color: '#f59e0b' },
  { value: 'print_room',  label: '🖨️ Print Room',  color: '#3b82f6' },
  { value: 'truck_mover', label: '🚛 Truck Mover',  color: '#8b5cf6' },
  { value: 'trainee',     label: '📚 Trainee',      color: '#22c55e' },
  { value: 'driver',      label: '🚚 Driver',       color: '#6b7280' },
]

const DEFAULT_FORM = { email: '', password: '', username: '', displayName: '', role: 'driver' as Role }

export default function AdminUsersPage() {
  const { profile, isAdmin, loading: authLoading } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [users, setUsers]       = useState<UserRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [saving, setSaving]     = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]         = useState(DEFAULT_FORM)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data || []) as UserRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (!profile) { router.push('/login'); return }
      if (!isAdmin) { router.push('/'); return }
      fetchUsers()
    }
  }, [authLoading, profile, isAdmin, router, fetchUsers])

  const updateRole = async (userId: string, newRole: Role) => {
    setSaving(userId)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setSaving(null)
    if (error) { toast('Error: ' + error.message); return }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    toast('Role updated ✓')
  }

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user @${username}? This cannot be undone.`)) return
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      toast('Profile removed — delete auth user in Supabase dashboard if needed.')
      await supabase.from('profiles').delete().eq('id', userId)
    } else {
      toast(`Deleted @${username}`)
    }
    fetchUsers()
  }

  const createUser = async () => {
    if (!form.email || !form.password || !form.username) {
      toast('Email, password and username are required'); return
    }
    if (form.password.length < 6) { toast('Password must be at least 6 characters'); return }
    setCreating(true)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, requesterId: profile!.id }),
    })
    const data = await res.json()
    setCreating(false)
    if (data.error) { toast('Error: ' + data.error); return }
    toast(`Account created for @${form.username} with ${form.role} role ✓`)
    setShowCreate(false)
    setForm(DEFAULT_FORM)
    fetchUsers()
  }

  const filtered = users.filter(u =>
    u.username.includes(search.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading || loading) return <div className="text-center py-20 text-muted">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">👑 User Management</h1>
          <p className="text-xs text-muted mt-1">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="bg-input border border-[#333] rounded-lg px-4 py-2 text-sm focus:border-amber-500 outline-none w-48" />
          <button onClick={() => setShowCreate(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors whitespace-nowrap">
            + Create Account
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => (
          <span key={r.value} className="text-xs px-3 py-1 rounded-full border font-medium"
            style={{ borderColor: r.color + '44', color: r.color, background: r.color + '11' }}>
            {r.label}
          </span>
        ))}
      </div>

      {/* User table */}
      <div className="bg-card border border-[#333] rounded-2xl overflow-hidden">
        <div className="grid text-xs text-muted font-bold uppercase tracking-wider px-6 py-3 border-b border-[#333]"
          style={{ gridTemplateColumns: '1fr 1fr 180px 80px' }}>
          <span>User</span><span>Contact</span><span>Role</span><span></span>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No users found</div>
        )}

        {filtered.map(user => {
          const roleInfo = ROLES.find(r => r.value === user.role)
          const initials = (user.display_name || user.username).slice(0, 2).toUpperCase()
          return (
            <div key={user.id}
              className="grid items-center px-6 py-4 border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
              style={{ gridTemplateColumns: '1fr 1fr 180px 80px' }}>

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

              {/* Contact */}
              <div className="text-xs text-muted min-w-0">
                {user.phone && <div className="font-mono truncate">{user.phone}</div>}
                {user.sms_enabled && <div className="text-green-400 text-[10px]">📱 SMS on</div>}
                <div className="text-[10px] text-muted/60">Joined {new Date(user.created_at).toLocaleDateString()}</div>
              </div>

              {/* Role selector — admin only */}
              <div>
                <select
                  value={user.role}
                  onChange={e => updateRole(user.id, e.target.value as Role)}
                  disabled={saving === user.id || user.id === profile?.id}
                  className="bg-input border border-[#333] rounded-lg px-2 py-1.5 text-xs focus:border-amber-500 outline-none disabled:opacity-40 w-full"
                  style={{ color: roleInfo?.color }}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {saving === user.id && <div className="text-[10px] text-amber-400 mt-1">Saving...</div>}
              </div>

              {/* Delete */}
              <div className="flex justify-end">
                {user.id !== profile?.id && (
                  <button onClick={() => deleteUser(user.id, user.username)}
                    className="text-red-500/50 hover:text-red-400 text-xs p-1 transition-colors" title="Delete user">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Account Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">➕ Create Account</h2>
              <button onClick={() => { setShowCreate(false); setForm(DEFAULT_FORM) }}
                className="text-muted hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Username *</label>
                  <input value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="johnd"
                    className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Display Name</label>
                  <input value={form.displayName}
                    onChange={e => setForm({ ...form, displayName: e.target.value })}
                    placeholder="John D."
                    className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted mb-1 block">Email *</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
              </div>

              <div>
                <label className="text-xs text-muted mb-1 block">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 pr-10 text-sm focus:border-amber-500 outline-none" />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white text-xs">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-1">They can change this after signing in. Account is pre-verified — no email confirmation needed.</p>
              </div>

              <div>
                <label className="text-xs text-muted mb-1 block">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}
                  className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none">
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-xs text-muted space-y-1">
                <div>📧 Email: <span className="text-white">{form.email || '—'}</span></div>
                <div>👤 Username: <span className="text-amber-400">@{form.username || '—'}</span></div>
                <div>🏷️ Role: <span className="text-white">{ROLES.find(r => r.value === form.role)?.label}</span></div>
                <div className="text-green-400">✅ Pre-verified — can sign in immediately</div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={createUser} disabled={creating}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Account'}
              </button>
              <button onClick={() => { setShowCreate(false); setForm(DEFAULT_FORM) }}
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
