'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

const cards = [
  { href: '/printroom', page: 'printroom', icon: '🖨️', title: 'Print Room', desc: 'Loading doors 13A-15B. Assign routes, track pods/pallets, organize batches.', color: 'border-amber-500' },
  { href: '/preshift', page: 'preshift', icon: '📋', title: 'PreShift Setup', desc: 'Staging doors 18-28. 4-position garage layout for box trucks, vans, tandems.', color: 'border-blue-500' },
  { href: '/movement', page: 'movement', icon: '🚚', title: 'Live Movement', desc: 'Real-time truck positions. Filter by status. Instant updates.', color: 'border-green-500' },
  { href: '/admin', page: 'admin', icon: '⚙️', title: 'Admin Settings', desc: 'Manage trucks, routes, statuses, reset controls.', color: 'border-purple-500' },
]

export default function Home() {
  const { profile, loading, can } = useAuth()
  const router = useRouter()

  // Users without access to the main operations pages (e.g. drivers)
  // get sent straight to Live Movement
  useEffect(() => {
    if (loading || !profile) return
    const accessible = cards.filter(c => can(c.page))
    if (accessible.length === 1 && accessible[0].page === 'movement') {
      router.replace('/movement')
    }
  }, [loading, profile, can, router])

  const visibleCards = profile ? cards.filter(c => can(c.page)) : cards

  return (
    <div className="py-10 text-center">
      <div className="flex justify-center mb-4">
        <Image src="/icon-192.png" alt="Badger" width={80} height={80} className="rounded-full" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Badger Truck Management</h1>
      <p className="text-gray-500 mb-10 text-lg">Real-time warehouse truck operations</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {visibleCards.map(c => (
          <Link key={c.href} href={c.href}
            className={`block bg-[#1a1a1a] border border-[#333] ${c.color} border-l-4 rounded-xl p-5 text-left hover:border-amber-500 transition-colors`}>
            <h3 className="text-amber-500 font-bold text-lg mb-1">{c.icon} {c.title}</h3>
            <p className="text-gray-400 text-sm">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
