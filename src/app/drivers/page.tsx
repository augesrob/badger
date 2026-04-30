'use client'
import { useEffect, useState, useCallback } from 'react'

interface DriverRoute {
  id: number
  region: string
  route_number: string
  route_name: string
  driver_name: string
  driver_phone: string
  truck_number: string
  helper_name: string
  cases_expected: number
  stops: number
  weight: number
  start_time: string
  transfer_driver: string
  transfer_truck: string
  notes: string
  upload_date: string
}

export default function DriversPage() {
  const [routes, setRoutes] = useState<DriverRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [regionFilter, setRegionFilter] = useState('all')
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      })
      const data = await res.json()
      if (data.data) setRoutes(data.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Filter
  const regions = Array.from(new Set(routes.map(r => r.region))).sort()
  let filtered = regionFilter === 'all' ? routes : routes.filter(r => r.region === regionFilter)

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(r =>
      r.transfer_driver?.toLowerCase().includes(q) ||
      r.driver_name?.toLowerCase().includes(q) ||
      r.route_number?.includes(q) ||
      r.route_name?.toLowerCase().includes(q) ||
      r.truck_number?.includes(q)
    )
  }

  // Group by transfer driver
  const byDriver = new Map<string, DriverRoute[]>()
  filtered.forEach(r => {
    const key = r.transfer_driver || 'Unassigned'
    if (!byDriver.has(key)) byDriver.set(key, [])
    byDriver.get(key)!.push(r)
  })
  const sortedDrivers = Array.from(byDriver.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">🚛 Transfer Routing</h1>
      <p className="text-sm text-gray-500 mb-4">
        {routes.length > 0
          ? `${routes.length} routes • ${routes[0]?.upload_date || ''}`
          : 'No routing data available'}
      </p>

      {routes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📄</div>
          <div className="text-gray-400">No routing data loaded yet</div>
        </div>
      ) : (
        <>
          {/* Search + filters */}
          <div className="flex gap-3 flex-wrap mb-4 items-center">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search driver, route, truck..."
              className="flex-1 min-w-[200px] bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none"
            />
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setRegionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${regionFilter === 'all' ? 'bg-amber-500 text-black' : 'bg-[#333] text-gray-400 hover:text-white'}`}>
                All
              </button>
              {regions.map(r => (
                <button key={r} onClick={() => setRegionFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${regionFilter === r ? 'bg-amber-500 text-black' : 'bg-[#333] text-gray-400 hover:text-white'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Driver groups */}
          <div className="space-y-4">
            {sortedDrivers.map(([driverName, driverRoutes]) => {
              const transferTruck = driverRoutes[0]?.transfer_truck || ''
              const driverRegions = Array.from(new Set(driverRoutes.map(r => r.region)))
              const totalCases = driverRoutes.reduce((sum, r) => sum + (r.cases_expected || 0), 0)

              return (
                <div key={driverName} className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                  {/* Driver header */}
                  <div className="bg-[#222] px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-extrabold text-white">{driverName}</div>
                      {driverRegions.map(r => (
                        <span key={r} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">{r}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {transferTruck && <span>Truck: <span className="font-bold text-amber-500">{transferTruck}</span></span>}
                      <span>{driverRoutes.length} routes</span>
                      <span>{totalCases.toLocaleString()} cases</span>
                    </div>
                  </div>

                  {/* Route list */}
                  <div className="divide-y divide-white/5">
                    {driverRoutes.map(r => (
                      <div key={r.id} className="px-4 py-2.5">
                        <div className="flex items-center gap-3 text-sm">
                          {/* Route # */}
                          <div className="w-12 font-extrabold text-amber-500">{r.route_number}</div>
                          {/* Route name */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">{r.route_name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                              {r.driver_name && <span>{r.driver_name}</span>}
                              {r.driver_phone && <span className="text-gray-600">{r.driver_phone}</span>}
                              {r.helper_name && <span className="text-purple-400">+ {r.helper_name}</span>}
                            </div>
                          </div>
                          {/* Truck */}
                          <div className="text-center">
                            <div className="text-[10px] text-gray-600">Truck</div>
                            <div className="font-bold text-green-400">{r.truck_number || '—'}</div>
                          </div>
                          {/* Cases */}
                          <div className="text-center w-14">
                            <div className="text-[10px] text-gray-600">Cases</div>
                            <div className="font-bold text-white">{r.cases_expected || '—'}</div>
                          </div>
                          {/* Stops */}
                          <div className="text-center w-12 hidden sm:block">
                            <div className="text-[10px] text-gray-600">Stops</div>
                            <div className="font-bold text-white">{r.stops || '—'}</div>
                          </div>
                          {/* Start */}
                          <div className="text-center w-16 hidden sm:block">
                            <div className="text-[10px] text-gray-600">Start</div>
                            <div className="font-medium text-blue-400 text-xs">{r.start_time || '—'}</div>
                          </div>
                        </div>
                        {/* Notes */}
                        {r.notes && (
                          <div className="text-xs text-yellow-500/70 mt-1 ml-[60px]">📝 {r.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
