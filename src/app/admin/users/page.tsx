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
  email?: string
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

export default function AdminUsersPage() {
  const { profile, isAdmin, loading: authLoading } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [users, setUsers]     = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [saving, setSaving]   = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
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
    // Note: deleting from auth.users cascades to profiles via FK
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      // Fallback: just clear the profile (service_role needed for auth.admin)
      toast('Note: Use Supabase dashboard to fully delete auth users. Profile removed.')
      await supabase.from('profiles').delete().eq('id', userId)
    } else {
      toast(`Deleted @${username}`)
    }
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
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="bg-input border border-[#333] rounded-lg px-4 py-2 text-sm focus:border-amber-500 outline-none w-64" />
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
          <span>User</span>
          <span>Contact</span>
          <span>Role</span>
          <span></span>
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

              {/* User info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 bg-amber-500">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{user.display_name || user.username}</div>
                  <div className="text-xs text-muted truncate">@{user.username}</div>
                  {user.id === profile?.id && (
                    <div className="text-[10px] text-amber-500">YOU</div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="text-xs text-muted min-w-0">
                {user.phone && <div className="font-mono truncate">{user.phone}</div>}
                {user.sms_enabled && <div className="text-green-400 text-[10px]">📱 SMS on</div>}
                <div className="text-[10px] text-muted/60">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Role selector */}
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

              {/* Actions */}
              <div className="flex justify-end">
                {user.id !== profile?.id && (
                  <button onClick={() => deleteUser(user.id, user.username)}
                    className="text-red-500/50 hover:text-red-400 text-xs p-1 transition-colors"
                    title="Delete user">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
