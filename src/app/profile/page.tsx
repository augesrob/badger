'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { useRouter } from 'next/navigation'

const CARRIERS = [
  { label: 'Verizon',     value: 'verizon',    gateway: 'vtext.com' },
  { label: 'AT&T',        value: 'att',        gateway: 'txt.att.net' },
  { label: 'T-Mobile',    value: 'tmobile',    gateway: 'tmomail.net' },
  { label: 'Sprint',      value: 'sprint',     gateway: 'messaging.sprintpcs.com' },
  { label: 'Cricket',     value: 'cricket',    gateway: 'sms.cricketwireless.net' },
  { label: 'Boost',       value: 'boost',      gateway: 'sms.myboostmobile.com' },
  { label: 'Metro PCS',   value: 'metro',      gateway: 'mymetropcs.com' },
  { label: 'US Cellular', value: 'uscellular', gateway: 'email.uscc.net' },
]

const PRESET_COLORS = [
  '#f59e0b','#f97316','#ef4444','#ec4899','#8b5cf6',
  '#3b82f6','#06b6d4','#14b8a6','#22c55e','#84cc16',
  '#ffffff','#94a3b8','#64748b','#1e293b','#000000',
]

const ROLE_LABELS: Record<string, string> = {
  admin: '👑 Admin', print_room: '🖨️ Print Room', truck_mover: '🚛 Truck Mover',
  trainee: '📚 Trainee', driver: '🚚 Driver',
}

export default function ProfilePage() {
  const { profile, refreshProfile, signOut, loading: authLoading } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone]             = useState('')
  const [carrier, setCarrier]         = useState('')
  const [smsEnabled, setSmsEnabled]   = useState(false)
  const [avatarColor, setAvatarColor] = useState('#f59e0b')
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null)

  const [subscriptions, setSubscriptions] = useState<string[]>([])
  const [newTruck, setNewTruck]           = useState('')
  const [subLoading, setSubLoading]       = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setPhone(profile.phone || '')
      setCarrier(profile.carrier || '')
      setSmsEnabled(profile.sms_enabled)
      setAvatarColor(profile.avatar_color || '#f59e0b')
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile])

  useEffect(() => {
    if (!profile) return
    supabase.from('truck_subscriptions').select('truck_number').eq('user_id', profile.id)
      .then(({ data }) => setSubscriptions((data || []).map(r => r.truck_number)))
  }, [profile])

  if (authLoading) return <div className="text-center py-20 text-muted">Loading...</div>
  if (!profile) { router.push('/login'); return null }

  const initials = (profile.display_name || profile.username).slice(0, 2).toUpperCase()
  const displayAvatar = previewUrl || avatarUrl

  // ── Image Upload ──────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      toast('Only JPG, PNG, WebP, or GIF images allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be under 5MB')
      return
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `avatars/${profile.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(path)

      // Bust cache with timestamp
      const urlWithBust = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: urlWithBust })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setAvatarUrl(urlWithBust)
      setPreviewUrl(null)
      await refreshProfile()
      toast('Profile image updated ✓')
    } catch (err: unknown) {
      setPreviewUrl(null)
      toast('Upload failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAvatar = async () => {
    const { error } = await supabase.from('profiles')
      .update({ avatar_url: null })
      .eq('id', profile.id)
    if (error) { toast('Failed to remove image'); return }
    setAvatarUrl(null)
    setPreviewUrl(null)
    await refreshProfile()
    toast('Profile image removed')
  }

  // ── Save Profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim() || profile.username,
      phone: phone.trim() || null,
      carrier: carrier || null,
      sms_enabled: smsEnabled,
      avatar_color: avatarColor,
    }).eq('id', profile.id)
    if (error) { setSaving(false); toast('Failed to save: ' + error.message); return }

    await supabase.from('truck_subscriptions')
      .update({ notify_sms: smsEnabled })
      .eq('user_id', profile.id)

    setSaving(false)
    await refreshProfile()
    toast('Profile saved ✓')
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────
  const addSubscription = async () => {
    if (!newTruck.trim()) return
    const truck = newTruck.trim().toUpperCase().replace(/^TR/i, '')
    if (subscriptions.includes(truck)) { toast('Already subscribed'); return }
    setSubLoading(true)
    const { error } = await supabase.from('truck_subscriptions').insert({
      user_id: profile.id, truck_number: truck, notify_sms: smsEnabled, notify_app: true,
    })
    setSubLoading(false)
    if (error) { toast('Error: ' + error.message); return }
    setSubscriptions(prev => [...prev, truck])
    setNewTruck('')
    toast(`Subscribed to TR${truck}`)
  }

  const removeSubscription = async (truck: string) => {
    await supabase.from('truck_subscriptions').delete().eq('user_id', profile.id).eq('truck_number', truck)
    setSubscriptions(prev => prev.filter(t => t !== truck))
    toast(`Unsubscribed from TR${truck}`)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      <h1 className="text-xl font-bold">👤 Profile</h1>

      {/* Avatar preview + role */}
      <div className="bg-card border border-[#333] rounded-2xl p-6 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          {displayAvatar ? (
            <img src={displayAvatar} alt="avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#444]" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: avatarColor }}>
              {initials}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <span className="text-xs text-white">...</span>
            </div>
          )}
        </div>
        <div>
          <div className="font-bold text-lg">{profile.display_name || profile.username}</div>
          <div className="text-sm text-muted">@{profile.username}</div>
          <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 inline-block">
            {ROLE_LABELS[profile.role] || profile.role}
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-card border border-[#333] rounded-2xl p-6 space-y-5">
        <h2 className="font-bold text-sm text-muted uppercase tracking-wider">Edit Profile</h2>

        <div>
          <label className="text-xs text-muted mb-1 block">Display Name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
        </div>

        {/* Profile Image Upload */}
        <div>
          <label className="text-xs text-muted mb-2 block">Profile Image</label>
          <div className="flex items-center gap-3">
            <div className="relative">
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#444]" />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white border-2 border-[#444]"
                  style={{ background: avatarColor }}>
                  {initials}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                {uploading ? '⏳ Uploading...' : '📷 Upload Image'}
              </button>
              {(avatarUrl || previewUrl) && (
                <button onClick={removeAvatar}
                  className="text-red-400 hover:text-red-300 text-xs transition-colors text-left">
                  ✕ Remove image
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect} className="hidden" />
          </div>
          <p className="text-[10px] text-muted mt-2">JPG, PNG, WebP, or GIF · Max 5MB · GIFs will animate</p>
        </div>

        {/* Avatar Color — only shown when no image */}
        {!displayAvatar && (
          <div>
            <label className="text-xs text-muted mb-2 block">Avatar Color <span className="text-[10px]">(used when no image is set)</span></label>
            <div className="space-y-3">
              {/* Preset swatches */}
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setAvatarColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      avatarColor === c ? 'border-white scale-125' : 'border-transparent'
                    }`}
                    style={{ background: c }} />
                ))}
              </div>
              {/* Free color picker */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted">Custom:</label>
                <input type="color" value={avatarColor} onChange={e => setAvatarColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <span className="text-xs font-mono text-muted">{avatarColor}</span>
                <div className="w-8 h-8 rounded-full border border-[#444]" style={{ background: avatarColor }} />
              </div>
            </div>
          </div>
        )}

        {/* Show color picker even with image, for fallback */}
        {displayAvatar && (
          <div>
            <label className="text-xs text-muted mb-2 block">Fallback Avatar Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={avatarColor} onChange={e => setAvatarColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <span className="text-xs font-mono text-muted">{avatarColor}</span>
              <div className="w-8 h-8 rounded-full border border-[#444] flex items-center justify-center text-xs font-bold text-white"
                style={{ background: avatarColor }}>
                {initials}
              </div>
            </div>
          </div>
        )}

        <button onClick={saveProfile} disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* SMS / Notification settings */}
      <div className="bg-card border border-[#333] rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-sm text-muted uppercase tracking-wider">📱 SMS Notifications</h2>
        <p className="text-xs text-muted">Get text messages when your subscribed trucks change status. Uses free carrier email-to-SMS — no cost.</p>

        <div>
          <label className="text-xs text-muted mb-1 block">Phone Number (10 digits)</label>
          <input value={phone} onChange={e => {
              let val = e.target.value.replace(/\D/g, '')
              if (val.length === 11 && val.startsWith('1')) val = val.slice(1)
              setPhone(val.slice(0, 10))
            }}
            placeholder="4145551234"
            className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none font-mono" />
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Carrier</label>
          <select value={carrier} onChange={e => setCarrier(e.target.value)}
            className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none">
            <option value="">Select carrier...</option>
            {CARRIERS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${smsEnabled ? 'bg-amber-500' : 'bg-[#444]'}`}
            onClick={() => setSmsEnabled(!smsEnabled)}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${smsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm">Enable SMS notifications</span>
        </label>

        {phone && carrier && (
          <p className="text-xs text-green-400">
            Texts will go to: {phone}@{CARRIERS.find(c => c.value === carrier)?.gateway}
          </p>
        )}

        <button onClick={saveProfile} disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>

      {/* Truck subscriptions */}
      <div className="bg-card border border-[#333] rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-sm text-muted uppercase tracking-wider">🚚 Truck Subscriptions</h2>
        <p className="text-xs text-muted">Get notified when a truck&apos;s status changes in Live Movement.</p>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 space-y-1 text-xs text-muted">
          <div><span className="text-amber-400 font-mono">170</span> — all trailers on truck 170</div>
          <div><span className="text-amber-400 font-mono">170-1</span> — only trailer 1 on truck 170</div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted font-mono">TR</span>
            <input value={newTruck} onChange={e => setNewTruck(e.target.value.replace(/^TR/i,''))}
              onKeyDown={e => e.key === 'Enter' && addSubscription()}
              placeholder="170  or  170-1"
              className="w-full bg-input border border-[#333] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-amber-500 outline-none font-mono" />
          </div>
          <button onClick={addSubscription} disabled={subLoading}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            + Subscribe
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-xs text-muted">No subscriptions yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subscriptions.map(truck => (
              <div key={truck}
                className="flex items-center gap-1.5 bg-[#222] border border-[#444] rounded-full px-3 py-1.5 text-sm font-mono">
                <span className="text-amber-400">TR{truck}</span>
                <button onClick={() => removeSubscription(truck)}
                  className="text-muted hover:text-red-400 text-xs ml-1 transition-colors">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="bg-card border border-[#333] rounded-2xl p-6">
        <button onClick={async () => { await signOut(); router.push('/login') }}
          className="w-full bg-red-900/40 hover:bg-red-900/70 text-red-400 font-bold py-2.5 rounded-xl text-sm transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  )
}
