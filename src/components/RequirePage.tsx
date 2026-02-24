'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

/**
 * Drop this at the top of any page to enforce page-level permissions.
 * If the user doesn't have the required page key, they get redirected to /unauthorized.
 * Works with the dynamic role_permissions system.
 */
export default function RequirePage({ pageKey, children }: { pageKey: string; children: React.ReactNode }) {
  const { profile, loading, can } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!profile) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (!can(pageKey)) {
      router.replace('/unauthorized')
    }
  }, [loading, profile, pageKey, can, router])

  // Still loading auth — show nothing (avoids flash)
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-500 text-sm animate-pulse">Loading...</div>
    </div>
  )

  // Not permitted — show nothing while redirect fires
  if (!profile || !can(pageKey)) return null

  return <>{children}</>
}
