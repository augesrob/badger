'use client'
import Link from 'next/link'

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
      <p className="text-gray-400 mb-6 max-w-sm">
        You don&apos;t have permission to view this page. Contact your admin if you think this is a mistake.
      </p>
      <Link href="/" className="bg-amber-500 text-black px-6 py-2.5 rounded-lg font-bold hover:bg-amber-400 transition-colors">
        ← Go Home
      </Link>
    </div>
  )
}
