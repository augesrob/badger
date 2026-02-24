'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions'
import type { User, Session } from '@supabase/supabase-js'

export type Role = 'admin' | 'print_room' | 'truck_mover' | 'trainee' | 'driver' | string

export interface Profile {
  id: string
  username: string
  display_name: string | null
  role: Role
  phone: string | null
  carrier: string | null
  sms_enabled: boolean
  avatar_color: string
  avatar_url: string | null
}

// PageKey is now a plain string — no longer a fixed union.
// The full list lives in src/lib/permissions.ts (MASTER_PAGES).
export type PageKey = string
export type FeatureKey = string

interface AuthCtx {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Permission helpers
  isAdmin: boolean
  can: (page: PageKey) => boolean
  canFeature: (feature: FeatureKey) => boolean
  // Raw permission sets (useful for UI checks)
  allowedPages: Set<string>
  allowedFeatures: Set<string>
}

const Ctx = createContext<AuthCtx>({
  user: null, profile: null, session: null, loading: true,
  signIn: async () => null, signUp: async () => null,
  signOut: async () => {}, refreshProfile: async () => {},
  isAdmin: false, can: () => false, canFeature: () => false,
  allowedPages: new Set(), allowedFeatures: new Set(),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]             = useState<User | null>(null)
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [session, setSession]       = useState<Session | null>(null)
  const [loading, setLoading]       = useState(true)
  const [allowedPages, setAllowedPages]       = useState<Set<string>>(new Set())
  const [allowedFeatures, setAllowedFeatures] = useState<Set<string>>(new Set())

  // Load role permissions from DB, fall back to hardcoded defaults
  const loadPermissions = useCallback(async (role: Role) => {
    try {
      const { data } = await supabase
        .from('role_permissions')
        .select('pages, features')
        .eq('role_name', role)
        .single()

      if (data) {
        setAllowedPages(new Set(data.pages || []))
        setAllowedFeatures(new Set(data.features || []))
        return
      }
    } catch {
      // Table may not exist yet — fall through to defaults
    }

    // Fallback to hardcoded defaults
    const defaults = DEFAULT_ROLE_PERMISSIONS[role] || { pages: ['profile'], features: [] }
    setAllowedPages(new Set(defaults.pages))
    setAllowedFeatures(new Set(defaults.features))
  }, [])

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) {
      setProfile(data as Profile)
      await loadPermissions(data.role)
    }
  }, [loadPermissions])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setAllowedPages(new Set())
        setAllowedFeatures(new Set())
      }
    })
    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (email: string, password: string, username: string, displayName: string): Promise<string | null> => {
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
    if (existing) return 'Username already taken'
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username, display_name: displayName } }
    })
    return error?.message ?? null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setAllowedPages(new Set())
    setAllowedFeatures(new Set())
  }

  const isAdmin   = profile?.role === 'admin'
  const can       = (page: PageKey)    => isAdmin || allowedPages.has(page)
  const canFeature = (feat: FeatureKey) => isAdmin || allowedFeatures.has(feat)

  return (
    <Ctx.Provider value={{
      user, profile, session, loading,
      signIn, signUp, signOut, refreshProfile,
      isAdmin, can, canFeature,
      allowedPages, allowedFeatures,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() { return useContext(Ctx) }
