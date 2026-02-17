import Link from 'next/link'

const cards = [
  { href: '/printroom', icon: '🖨️', title: 'Print Room', desc: 'Loading doors 13A-15B. Assign routes, track pods/pallets, organize batches.', color: 'border-amber-500' },
  { href: '/preshift', icon: '📋', title: 'PreShift Setup', desc: 'Staging doors 18-28. 4-position garage layout for box trucks, vans, tandems.', color: 'border-blue-500' },
  { href: '/movement', icon: '🚚', title: 'Live Movement', desc: 'Real-time truck positions. Filter by status. Instant updates.', color: 'border-green-500' },
  { href: '/admin', icon: '⚙️', title: 'Admin Settings', desc: 'Manage trucks, routes, statuses, reset controls.', color: 'border-purple-500' },
]

export default function Home() {
  return (
    <div className="py-10 text-center">
      <div className="text-6xl mb-4">🦡</div>
      <h1 className="text-3xl font-bold mb-2">Badger Truck Management</h1>
      <p className="text-gray-500 mb-10 text-lg">Real-time warehouse truck operations</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {cards.map(c => (
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
