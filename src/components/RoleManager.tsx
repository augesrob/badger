'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { MASTER_PAGES, MASTER_FEATURES } from '@/lib/permissions'
import { useToast } from '@/components/Toast'

interface RoleRecord {
  role_name: string
  display_name: string
  color: string
  pages: string[]
  features: string[]
  is_system: boolean
}

// Group pages and features by their group field
function groupBy<T extends { group: string }>(items: T[]) {
  const map: Record<string, T[]> = {}
  items.forEach(item => {
    if (!map[item.group]) map[item.group] = []
    map[item.group].push(item)
  })
  return map
}

const pageGroups    = groupBy(MASTER_PAGES)
const featureGroups = groupBy(MASTER_FEATURES)

export default function RoleManager() {
  const toast = useToast()
  const { session } = useAuth()
  const [roles, setRoles]           = useState<RoleRecord[]>([])
  const [selectedRole, setSelected] = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [seeding, setSeeding]       = useState(false)
  const [tab, setTab]               = useState<'pages' | 'features'>('pages')

  // Create role modal
  const [showCreate, setShowCreate] = useState(false)
  const [newRoleName, setNewRoleName]   = useState('')
  const [newDisplay, setNewDisplay]     = useState('')
  const [newColor, setNewColor]         = useState('#6b7280')
  const [creating, setCreating]         = useState(false)

  const authHeader = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session])

  const loadRoles = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/roles', { headers: authHeader() })
    if (res.ok) {
      const { roles: data } = await res.json()
      setRoles(data || [])
      // Auto-select first role
      if (data?.length && !selectedRole) setSelected(data[0].role_name)
    } else {
      toast('Failed to load roles — table may not exist yet. Click "Seed Defaults" to set up.', 'error')
    }
    setLoading(false)
  }, [authHeader, selectedRole, toast])

  useEffect(() => { if (session) loadRoles() }, [session, loadRoles])

  const activeRole = roles.find(r => r.role_name === selectedRole) ?? null

  // Toggle a page on/off for the selected role
  const togglePage = (key: string) => {
    if (!activeRole) return
    const has = activeRole.pages.includes(key)
    const updated = has ? activeRole.pages.filter(p => p !== key) : [...activeRole.pages, key]
    setRoles(prev => prev.map(r => r.role_name === selectedRole ? { ...r, pages: updated } : r))
  }

  // Toggle a feature on/off for the selected role
  const toggleFeature = (key: string) => {
    if (!activeRole) return
    const has = activeRole.features.includes(key)
    const updated = has ? activeRole.features.filter(f => f !== key) : [...activeRole.features, key]
    setRoles(prev => prev.map(r => r.role_name === selectedRole ? { ...r, features: updated } : r))
  }

  // Select all / none for a group
  const setGroupPages = (groupKeys: string[], value: boolean) => {
    if (!activeRole) return
    let updated = [...activeRole.pages]
    if (value) {
      groupKeys.forEach(k => { if (!updated.includes(k)) updated.push(k) })
    } else {
      updated = updated.filter(p => !groupKeys.includes(p))
    }
    setRoles(prev => prev.map(r => r.role_name === selectedRole ? { ...r, pages: updated } : r))
  }

  const setGroupFeatures = (groupKeys: string[], value: boolean) => {
    if (!activeRole) return
    let updated = [...activeRole.features]
    if (value) {
      groupKeys.forEach(k => { if (!updated.includes(k)) updated.push(k) })
    } else {
      updated = updated.filter(f => !groupKeys.includes(f))
    }
    setRoles(prev => prev.map(r => r.role_name === selectedRole ? { ...r, features: updated } : r))
  }

  // Save to DB
  const save = async () => {
    if (!activeRole) return
    setSaving(true)
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        action: 'update',
        role_name: activeRole.role_name,
        pages: activeRole.pages,
        features: activeRole.features,
      }),
    })
    setSaving(false)
    if (res.ok) toast(`${activeRole.display_name} permissions saved!`)
    else toast('Save failed', 'error')
  }

  // Create new role
  const createRole = async () => {
    if (!newRoleName.trim()) { toast('Role name required', 'error'); return }
    // Validate: lowercase letters, numbers, underscores only
    if (!/^[a-z0-9_]+$/.test(newRoleName)) {
      toast('Role name: lowercase letters, numbers, underscores only', 'error'); return
    }
    setCreating(true)
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        action: 'create',
        role_name: newRoleName.trim(),
        display_name: newDisplay.trim() || newRoleName.trim(),
        color: newColor,
      }),
    })
    setCreating(false)
    if (res.ok) {
      toast(`Role "${newDisplay || newRoleName}" created!`)
      setNewRoleName(''); setNewDisplay(''); setNewColor('#6b7280')
      setShowCreate(false)
      await loadRoles()
      setSelected(newRoleName.trim())
    } else {
      const { error } = await res.json()
      toast(error || 'Failed to create role', 'error')
    }
  }

  // Delete role
  const deleteRole = async (role_name: string) => {
    if (!confirm(`Delete role "${role_name}"? Users with this role will lose all access.`)) return
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ action: 'delete', role_name }),
    })
    if (res.ok) {
      toast('Role deleted')
      setSelected(null)
      loadRoles()
    } else {
      const { error } = await res.json()
      toast(error || 'Delete failed', 'error')
    }
  }

  // Seed defaults
  const seed = async () => {
    setSeeding(true)
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ action: 'seed' }),
    })
    setSeeding(false)
    if (res.ok) {
      const { seeded } = await res.json()
      toast(`Seeded ${seeded} default roles!`)
      loadRoles()
    } else toast('Seed failed', 'error')
  }

  // ── RENDER ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-500">
      <span className="animate-pulse">Loading roles...</span>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">🛡️ Role Manager</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Control which pages and features each role can access. Admin always has full access.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {roles.length === 0 && (
            <button onClick={seed} disabled={seeding}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500">
              {seeding ? '⏳ Seeding...' : '🌱 Seed Defaults'}
            </button>
          )}
          <button onClick={() => setShowCreate(true)}
            className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400">
            + New Role
          </button>
        </div>
      </div>

      {roles.length === 0 ? (
        <div className="text-center py-16 bg-[#1a1a1a] border border-[#333] rounded-xl">
          <div className="text-4xl mb-3">🛡️</div>
          <p className="text-gray-400 mb-2">No roles found in database.</p>
          <p className="text-sm text-gray-500 mb-4">
            The <code className="text-amber-500">role_permissions</code> table needs to be created first.
          </p>
          <div className="bg-[#111] border border-amber-500/20 rounded-lg p-4 text-left mx-auto max-w-lg mb-4">
            <p className="text-xs text-amber-500 font-bold mb-2">Run this SQL in Supabase:</p>
            <pre className="text-[11px] text-gray-300 overflow-x-auto whitespace-pre-wrap">{SQL_SETUP}</pre>
          </div>
          <button onClick={seed} disabled={seeding}
            className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-amber-400">
            {seeding ? '⏳ Seeding...' : '🌱 Then click: Seed Defaults'}
          </button>
        </div>
      ) : (
        <div className="flex gap-4" style={{ minHeight: 500 }}>
          {/* LEFT: Role list */}
          <div className="w-48 flex-shrink-0 space-y-1">
            {roles.map(role => (
              <button key={role.role_name} onClick={() => setSelected(role.role_name)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedRole === role.role_name
                    ? 'text-black'
                    : 'bg-[#1a1a1a] border border-[#333] text-gray-300 hover:border-amber-500/30 hover:text-white'
                }`}
                style={selectedRole === role.role_name ? { background: role.color, borderColor: role.color } : {}}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: role.color }} />
                <span className="truncate">{role.display_name}</span>
                {role.is_system && <span className="ml-auto text-[8px] opacity-60">SYS</span>}
              </button>
            ))}
          </div>

          {/* RIGHT: Permission editor */}
          {activeRole ? (
            <div className="flex-1 min-w-0">
              {/* Role header bar */}
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border"
                style={{ background: `${activeRole.color}15`, borderColor: `${activeRole.color}40` }}>
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: activeRole.color }} />
                <div>
                  <div className="font-bold text-white">{activeRole.display_name}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{activeRole.role_name}</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-gray-500">{activeRole.pages.length} pages · {activeRole.features.length} features</span>
                  {!activeRole.is_system && (
                    <button onClick={() => deleteRole(activeRole.role_name)}
                      className="text-red-500/50 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-red-900/20">
                      🗑 Delete Role
                    </button>
                  )}
                  {activeRole.role_name === 'admin' && (
                    <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Always Full Access</span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-[#111] rounded-lg p-1 w-fit">
                <button onClick={() => setTab('pages')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'pages' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
                  📄 Pages ({activeRole.pages.length})
                </button>
                <button onClick={() => setTab('features')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'features' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
                  ⚡ Features ({activeRole.features.length})
                </button>
              </div>

              {/* Disabled note for admin */}
              {activeRole.role_name === 'admin' ? (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-6 text-center text-amber-400 text-sm">
                  🔒 Admin role always has access to everything. Permissions cannot be restricted.
                </div>
              ) : (
                <>
                  {tab === 'pages' && (
                    <div className="space-y-4">
                      {Object.entries(pageGroups).map(([group, pages]) => {
                        const groupKeys = pages.map(p => p.key)
                        const allOn = groupKeys.every(k => activeRole.pages.includes(k))
                        const anyOn = groupKeys.some(k => activeRole.pages.includes(k))
                        return (
                          <div key={group} className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                            {/* Group header */}
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border-b border-[#333]">
                              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{group}</span>
                              <div className="ml-auto flex gap-2">
                                <button onClick={() => setGroupPages(groupKeys, true)}
                                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${allOn ? 'text-green-500 bg-green-900/20' : 'text-gray-500 hover:text-green-400 hover:bg-green-900/10'}`}>
                                  All On
                                </button>
                                <button onClick={() => setGroupPages(groupKeys, false)}
                                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${!anyOn ? 'text-red-500 bg-red-900/20' : 'text-gray-500 hover:text-red-400 hover:bg-red-900/10'}`}>
                                  All Off
                                </button>
                              </div>
                            </div>
                            {/* Page rows */}
                            {pages.map(page => {
                              const on = activeRole.pages.includes(page.key)
                              return (
                                <div key={page.key} onClick={() => togglePage(page.key)}
                                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5 last:border-0 transition-colors ${on ? 'hover:bg-green-900/5' : 'hover:bg-white/[0.02] opacity-60'}`}>
                                  <Toggle on={on} />
                                  <span className="text-lg">{page.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${on ? 'text-white' : 'text-gray-500'}`}>{page.label}</div>
                                    <div className="text-[10px] text-gray-500">{page.description}</div>
                                  </div>
                                  <code className="text-[9px] text-gray-600 font-mono">{page.key}</code>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {tab === 'features' && (
                    <div className="space-y-4">
                      {Object.entries(featureGroups).map(([group, features]) => {
                        const groupKeys = features.map(f => f.key)
                        const allOn = groupKeys.every(k => activeRole.features.includes(k))
                        const anyOn = groupKeys.some(k => activeRole.features.includes(k))
                        return (
                          <div key={group} className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border-b border-[#333]">
                              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{group}</span>
                              <div className="ml-auto flex gap-2">
                                <button onClick={() => setGroupFeatures(groupKeys, true)}
                                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${allOn ? 'text-green-500 bg-green-900/20' : 'text-gray-500 hover:text-green-400 hover:bg-green-900/10'}`}>
                                  All On
                                </button>
                                <button onClick={() => setGroupFeatures(groupKeys, false)}
                                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${!anyOn ? 'text-red-500 bg-red-900/20' : 'text-gray-500 hover:text-red-400 hover:bg-red-900/10'}`}>
                                  All Off
                                </button>
                              </div>
                            </div>
                            {features.map(feat => {
                              const on = activeRole.features.includes(feat.key)
                              return (
                                <div key={feat.key} onClick={() => toggleFeature(feat.key)}
                                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5 last:border-0 transition-colors ${on ? 'hover:bg-green-900/5' : 'hover:bg-white/[0.02] opacity-60'}`}>
                                  <Toggle on={on} />
                                  <span className="text-lg">{feat.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${on ? 'text-white' : 'text-gray-500'}`}>{feat.label}</div>
                                    <div className="text-[10px] text-gray-500">{feat.description}</div>
                                  </div>
                                  <code className="text-[9px] text-gray-600 font-mono">{feat.key}</code>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Save button */}
                  <div className="mt-4 flex justify-end">
                    <button onClick={save} disabled={saving}
                      className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${saving ? 'bg-[#333] text-gray-500' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>
                      {saving ? '⏳ Saving...' : '💾 Save Permissions'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              ← Select a role to edit
            </div>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-amber-500 font-bold text-lg mb-4">🛡️ Create New Role</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Role Key <span className="text-red-400">*</span></label>
                <input value={newRoleName} onChange={e => setNewRoleName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. supervisor" className="input-field font-mono" />
                <p className="text-[10px] text-gray-600 mt-1">Lowercase, underscores only. Used as the role identifier in the database.</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Display Name</label>
                <input value={newDisplay} onChange={e => setNewDisplay(e.target.value)}
                  placeholder="e.g. Supervisor" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0" />
                  <span className="text-xs text-gray-500">Used for role badge color in UI</span>
                </div>
              </div>
            </div>
            <div className="bg-[#111] rounded-lg p-3 mb-4">
              <p className="text-[11px] text-gray-500">
                ⚠️ After creating the role, you&apos;ll also need to manually assign it to users via the <strong className="text-white">Manage Users</strong> page or Supabase directly. The new role starts with <strong className="text-amber-500">no permissions</strong> — toggle what it needs here.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={createRole} disabled={creating}
                className="flex-1 bg-amber-500 text-black py-2 rounded font-bold hover:bg-amber-400">
                {creating ? 'Creating...' : 'Create Role'}
              </button>
              <button onClick={() => setShowCreate(false)} className="bg-[#333] text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-9 h-5 rounded-full flex-shrink-0 relative transition-colors ${on ? 'bg-green-500' : 'bg-[#333]'}`}>
      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${on ? 'left-4' : 'left-0.5'}`} />
    </div>
  )
}

const SQL_SETUP = `CREATE TABLE IF NOT EXISTS role_permissions (
  id           serial PRIMARY KEY,
  role_name    text UNIQUE NOT NULL,
  display_name text NOT NULL,
  color        text DEFAULT '#6b7280',
  pages        text[] DEFAULT '{}',
  features     text[] DEFAULT '{}',
  is_system    boolean DEFAULT false,
  updated_at   timestamptz DEFAULT now()
);

-- Allow admins to read/write via service role
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON role_permissions
  USING (true) WITH CHECK (true);

-- Allow all authenticated users to READ their own role perms
CREATE POLICY "Auth users can read" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');`
