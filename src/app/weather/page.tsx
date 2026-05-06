'use client'
import { useEffect, useState, useCallback } from 'react'

interface CurrentWeather {
  temp: number; feelsLike: number; condition: string; humidity: number
  dewPoint: number; wind: string; windSpeed?: number; windDir?: string
  pressure?: string; weatherCode?: number; updated: string
}
interface HourlyItem {
  time: string; temp: number; feelsLike: number; humidity: number
  dewPoint: number; precipChance: number; condition: string
  weatherCode: number; windSpeed: number
}
interface MinuteItem { time: string; precipitation: number; weatherCode: number }
interface DoorStatus {
  doorAction: string; triggeringRule: string; currentTemp: number
  currentDewPoint: number; rules: Rule[]; updated: string
}
interface Rule {
  id: number; rule_name: string; rule_type: string; threshold: number
  door_action: string; priority: number; is_active: boolean; description: string
}

const weatherIcon = (code: number): string => {
  if (code === 0) return '☀️'
  if (code <= 2) return '⛅'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 67) return '🧊'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '❄️'
  if (code >= 95) return '⛈️'
  return '🌤️'
}

export default function WeatherPage() {
  const [tab, setTab] = useState<'current' | 'minutecast' | 'hourly' | 'doorstatus'>('current')
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
  const [hourly, setHourly] = useState<HourlyItem[]>([])
  const [minutes, setMinutes] = useState<MinuteItem[]>([])
  const [doorStatus, setDoorStatus] = useState<DoorStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWeather = useCallback(async () => {
    try {
      const [curRes, hourRes, minRes, doorRes] = await Promise.all([
        fetch('/api/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'current' }) }),
        fetch('/api/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'hourly' }) }),
        fetch('/api/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'minutecast' }) }),
        fetch('/api/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'door_status' }) }),
      ])
      const [curData, hourData, minData, doorData] = await Promise.all([
        curRes.json(), hourRes.json(), minRes.json(), doorRes.json(),
      ])
      if (curData.temp !== undefined) setCurrent(curData)
      if (hourData.hours) setHourly(hourData.hours)
      if (minData.minutes) setMinutes(minData.minutes)
      if (doorData.doorAction) setDoorStatus(doorData)
    } catch (e) { console.error('Weather fetch error:', e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [fetchWeather])

  const tabs = [
    { id: 'current' as const, label: 'Current' },
    { id: 'minutecast' as const, label: 'Minute Cast' },
    { id: 'hourly' as const, label: 'Hourly' },
    { id: 'doorstatus' as const, label: 'Door Status' },
  ]

  const doorsOpen = doorStatus?.doorAction === 'open'

  if (loading) return <div className="text-center py-20 text-gray-500">Loading weather...</div>

  return (
    <div>
      {/* Door status banner */}
      {doorStatus && (
        <div className={`rounded-xl px-4 py-3 mb-4 flex items-center justify-between ${doorsOpen ? 'bg-green-500/15 border border-green-500/30' : 'bg-red-500/15 border border-red-500/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${doorsOpen ? 'text-green-400' : 'text-red-400'}`}>
              {doorsOpen ? '🟢' : '🔴'}
            </div>
            <div>
              <div className={`font-extrabold text-lg ${doorsOpen ? 'text-green-400' : 'text-red-400'}`}>
                DOORS {doorsOpen ? 'OPEN' : 'CLOSED'}
              </div>
              <div className="text-xs text-gray-400">{doorStatus.triggeringRule}</div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-gray-400">Dew Point: <span className={`font-bold ${doorStatus.currentDewPoint >= 51 ? 'text-red-400' : 'text-green-400'}`}>{doorStatus.currentDewPoint}°</span></div>
            <div className="text-gray-400">Temp: <span className="font-bold text-amber-400">{doorStatus.currentTemp}°F</span></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#1a1a1a] rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === t.id
                ? t.id === 'doorstatus'
                  ? doorsOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  : 'bg-amber-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'current' && current && <CurrentTab data={current} />}
      {tab === 'minutecast' && <MinutecastTab data={minutes} />}
      {tab === 'hourly' && <HourlyTab data={hourly} />}
      {tab === 'doorstatus' && doorStatus && <DoorStatusTab data={doorStatus} />}
    </div>
  )
}

// ============================================================
// CURRENT WEATHER TAB
// ============================================================
function CurrentTab({ data }: { data: CurrentWeather }) {
  return (
    <div className="space-y-4">
      {/* Main temp card */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
        <div className="text-5xl mb-2">{weatherIcon(data.weatherCode || 0)}</div>
        <div className="text-6xl font-extrabold text-white mb-1">{data.temp}°<span className="text-2xl text-gray-500">F</span></div>
        <div className="text-lg text-gray-400">{data.condition}</div>
        <div className="text-sm text-gray-500 mt-1">Feels like {data.feelsLike}°F</div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <DetailCard label="Humidity" value={`${data.humidity}%`} icon="💧" />
        <DetailCard label="Dew Point" value={`${data.dewPoint}°F`} icon="🌡️"
          highlight={data.dewPoint >= 51 ? 'red' : 'green'} />
        <DetailCard label="Wind" value={data.wind || '—'} icon="💨" />
        {data.pressure && <DetailCard label="Pressure" value={data.pressure} icon="📊" />}
      </div>

      <div className="text-xs text-gray-600 text-center">
        Fond du Lac, WI 54935 • Updated {new Date(data.updated).toLocaleTimeString()}
      </div>
    </div>
  )
}

function DetailCard({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: 'red' | 'green' }) {
  return (
    <div className={`bg-[#1a1a1a] border rounded-xl p-4 ${
      highlight === 'red' ? 'border-red-500/30 bg-red-500/5' :
      highlight === 'green' ? 'border-green-500/30 bg-green-500/5' :
      'border-[#333]'
    }`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold mt-1 ${
        highlight === 'red' ? 'text-red-400' :
        highlight === 'green' ? 'text-green-400' :
        'text-white'
      }`}>{value}</div>
    </div>
  )
}

// ============================================================
// MINUTECAST TAB
// ============================================================
function MinutecastTab({ data }: { data: MinuteItem[] }) {
  if (data.length === 0) return <div className="text-center py-10 text-gray-500">No minutecast data available</div>

  const maxPrecip = Math.max(...data.map(m => m.precipitation), 0.1)
  const hasRain = data.some(m => m.precipitation > 0)

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
      <h3 className="font-bold text-white mb-1">Precipitation — Next 2 Hours</h3>
      <p className="text-xs text-gray-500 mb-4">
        {hasRain ? 'Precipitation expected' : 'No precipitation expected'}
      </p>

      <div className="flex items-end gap-1 h-32">
        {data.map((m, i) => {
          const height = Math.max((m.precipitation / maxPrecip) * 100, 2)
          const time = new Date(m.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t" style={{
                height: `${height}%`,
                background: m.precipitation > 0 ? '#3b82f6' : '#333',
                minHeight: '2px',
              }} />
              <div className="text-[8px] text-gray-600 rotate-[-45deg] w-8 text-center">{time}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// HOURLY TAB
// ============================================================
function HourlyTab({ data }: { data: HourlyItem[] }) {
  if (data.length === 0) return <div className="text-center py-10 text-gray-500">No hourly data available</div>

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-7 gap-2 px-3 py-2 text-[10px] text-amber-500 font-bold uppercase">
        <div>Time</div>
        <div className="text-center">Temp</div>
        <div className="text-center">Feels</div>
        <div className="text-center">Humid</div>
        <div className="text-center">Dew Pt</div>
        <div className="text-center">Rain</div>
        <div className="text-center">Wind</div>
      </div>

      {data.map((h, i) => {
        const time = new Date(h.time)
        const isNow = i === 0
        const dewHighlight = h.dewPoint >= 51

        return (
          <div key={i} className={`grid grid-cols-7 gap-2 px-3 py-2.5 rounded-lg text-sm ${
            isNow ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-[#1a1a1a]'
          }`}>
            <div className="flex items-center gap-1">
              <span className="text-base">{weatherIcon(h.weatherCode)}</span>
              <span className="text-xs text-gray-400 font-medium">
                {isNow ? 'Now' : time.toLocaleTimeString([], { hour: 'numeric' })}
              </span>
            </div>
            <div className="text-center font-bold text-white">{h.temp}°</div>
            <div className="text-center text-gray-400">{h.feelsLike}°</div>
            <div className="text-center text-blue-400">{h.humidity}%</div>
            <div className={`text-center font-bold ${dewHighlight ? 'text-red-400' : 'text-green-400'}`}>{h.dewPoint}°</div>
            <div className="text-center text-blue-300">{h.precipChance}%</div>
            <div className="text-center text-gray-400">{h.windSpeed}</div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// DOOR STATUS TAB
// ============================================================
function DoorStatusTab({ data }: { data: DoorStatus }) {
  const isOpen = data.doorAction === 'open'

  return (
    <div className="space-y-4">
      {/* Big status indicator */}
      <div className={`rounded-xl p-8 text-center border-2 ${
        isOpen ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'
      }`}>
        <div className="text-6xl mb-3">{isOpen ? '✅' : '🚫'}</div>
        <div className={`text-4xl font-extrabold ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
          DOORS {isOpen ? 'OPEN' : 'CLOSED'}
        </div>
        <div className="text-sm text-gray-400 mt-2">{data.triggeringRule}</div>
      </div>

      {/* Current readings */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-4 border ${data.currentDewPoint >= 51 ? 'bg-red-500/5 border-red-500/30' : 'bg-green-500/5 border-green-500/30'}`}>
          <div className="text-xs text-gray-500 uppercase">Dew Point</div>
          <div className={`text-3xl font-extrabold ${data.currentDewPoint >= 51 ? 'text-red-400' : 'text-green-400'}`}>
            {data.currentDewPoint}°<span className="text-lg">F</span>
          </div>
        </div>
        <div className="rounded-xl p-4 border border-[#333] bg-[#1a1a1a]">
          <div className="text-xs text-gray-500 uppercase">Temperature</div>
          <div className="text-3xl font-extrabold text-amber-400">
            {data.currentTemp}°<span className="text-lg">F</span>
          </div>
        </div>
      </div>

      {/* Active rules */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#222] font-bold text-sm text-white">Active Rules</div>
        <div className="divide-y divide-white/5">
          {data.rules.filter(r => r.is_active).map(rule => {
            // Check if this rule is currently triggered
            let triggered = false
            if (rule.rule_type === 'dew_point_min') triggered = data.currentDewPoint >= rule.threshold
            if (rule.rule_type === 'dew_point_max') triggered = data.currentDewPoint <= rule.threshold
            if (rule.rule_type === 'temp_min') triggered = data.currentTemp >= rule.threshold
            if (rule.rule_type === 'temp_max') triggered = data.currentTemp <= rule.threshold

            return (
              <div key={rule.id} className={`px-4 py-3 flex items-center justify-between ${triggered ? 'bg-amber-500/5' : ''}`}>
                <div className="flex items-center gap-3">
                  {triggered && <span className="text-amber-400 text-xs">⚡ Active</span>}
                  <div>
                    <div className="text-sm text-white font-medium">{rule.description || rule.rule_name}</div>
                    <div className="text-xs text-gray-500">Priority: {rule.priority}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  rule.door_action === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {rule.door_action === 'open' ? 'OPEN' : 'CLOSE'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-gray-600 text-center">
        Updated {new Date(data.updated).toLocaleTimeString()} • Rules managed in Admin
      </div>
    </div>
  )
}
