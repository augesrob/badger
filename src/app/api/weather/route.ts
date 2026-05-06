import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// AccuWeather location key for Fond du Lac, WI (54935)
// We'll look this up on first call and cache it
let locationKey = '2256656' // Default FDL key
const ACCUWEATHER_BASE = 'https://dataservice.accuweather.com'

export async function POST(req: NextRequest) {
  const { action } = await req.json()

  if (action === 'current') return getCurrentWeather()
  if (action === 'hourly') return getHourlyForecast()
  if (action === 'minutecast') return getMinutecast()
  if (action === 'rules') return getRules()
  if (action === 'update_rule') {
    const body = await req.clone().json()
    return updateRule(body)
  }
  if (action === 'add_rule') {
    const body = await req.clone().json()
    return addRule(body)
  }
  if (action === 'delete_rule') {
    const body = await req.clone().json()
    return deleteRule(body.id)
  }
  if (action === 'door_status') return getDoorStatus()
  if (action === 'config') return getConfig()
  if (action === 'update_config') {
    const body = await req.clone().json()
    return updateConfig(body)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// ============================================================
// WEATHER DATA — Scrape AccuWeather HTML (no API key needed)
// ============================================================

async function scrapeAccuWeather(path: string): Promise<string> {
  const url = `https://www.accuweather.com${path}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: 300 } // Cache for 5 minutes
  })
  return res.text()
}

async function getCurrentWeather() {
  try {
    const html = await scrapeAccuWeather('/en/us/fond-du-lac/54935/current-conditions/2256656')

    // Parse current conditions from HTML
    const temp = extractNumber(html, /class="temp-container"[^>]*>.*?(\d+)°/s) ||
                 extractNumber(html, /class="temp"[^>]*>(\d+)°/s)
    const feelsLike = extractNumber(html, /RealFeel®.*?(\d+)°/s)
    const condition = extractText(html, /class="phrase"[^>]*>([^<]+)/s)
    const humidity = extractNumber(html, /Humidity.*?(\d+)%/s)
    const dewPoint = extractNumber(html, /Dew Point.*?(\d+)°/s)
    const wind = extractText(html, /Wind.*?(\d+\s*mph[^<]*)/s)
    const visibility = extractText(html, /Visibility.*?([\d.]+\s*mi)/s)
    const uvIndex = extractText(html, /UV Index.*?(\d+\s+\w+)/s)
    const pressure = extractText(html, /Pressure.*?([\d.]+\s*(?:in|mb))/s)

    // If scraping fails, try the AccuWeather API with a free key
    if (!temp && !dewPoint) {
      return await getCurrentFromAPI()
    }

    return NextResponse.json({
      temp, feelsLike, condition, humidity, dewPoint,
      wind, visibility, uvIndex, pressure,
      source: 'accuweather',
      updated: new Date().toISOString()
    })
  } catch (err) {
    // Fallback to API
    return await getCurrentFromAPI()
  }
}

async function getCurrentFromAPI() {
  // Use Open-Meteo (free, no API key)
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.7730&longitude=-88.4471&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Chicago',
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    const c = data.current

    return NextResponse.json({
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      condition: weatherCodeToText(c.weather_code),
      humidity: Math.round(c.relative_humidity_2m),
      dewPoint: Math.round(c.dew_point_2m),
      wind: `${Math.round(c.wind_speed_10m)} mph ${degToDir(c.wind_direction_10m)}`,
      windSpeed: Math.round(c.wind_speed_10m),
      windDir: degToDir(c.wind_direction_10m),
      pressure: `${(c.surface_pressure * 0.02953).toFixed(2)} in`,
      weatherCode: c.weather_code,
      source: 'open-meteo',
      updated: new Date().toISOString()
    })
  } catch (err) {
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 500 })
  }
}

async function getHourlyForecast() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.7730&longitude=-88.4471&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Chicago&forecast_hours=24',
      { next: { revalidate: 600 } }
    )
    const data = await res.json()
    const h = data.hourly

    const hours = h.time.map((t: string, i: number) => ({
      time: t,
      temp: Math.round(h.temperature_2m[i]),
      feelsLike: Math.round(h.apparent_temperature[i]),
      humidity: Math.round(h.relative_humidity_2m[i]),
      dewPoint: Math.round(h.dew_point_2m[i]),
      precipChance: h.precipitation_probability[i],
      condition: weatherCodeToText(h.weather_code[i]),
      weatherCode: h.weather_code[i],
      windSpeed: Math.round(h.wind_speed_10m[i]),
    }))

    return NextResponse.json({ hours, source: 'open-meteo' })
  } catch {
    return NextResponse.json({ error: 'Hourly fetch failed' }, { status: 500 })
  }
}

async function getMinutecast() {
  try {
    // Open-Meteo minutely_15 for precipitation
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.7730&longitude=-88.4471&minutely_15=precipitation,weather_code&timezone=America/Chicago&forecast_minutely_15=8',
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    const m = data.minutely_15

    const minutes = m.time.map((t: string, i: number) => ({
      time: t,
      precipitation: m.precipitation[i],
      weatherCode: m.weather_code[i],
    }))

    return NextResponse.json({ minutes, source: 'open-meteo' })
  } catch {
    return NextResponse.json({ error: 'Minutecast fetch failed' }, { status: 500 })
  }
}

// ============================================================
// DOOR STATUS — evaluate rules against current weather
// ============================================================
async function getDoorStatus() {
  try {
    // Get current weather
    const weatherRes = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.7730&longitude=-88.4471&current=temperature_2m,dew_point_2m&temperature_unit=fahrenheit&timezone=America/Chicago',
      { next: { revalidate: 300 } }
    )
    const weatherData = await weatherRes.json()
    const currentTemp = Math.round(weatherData.current.temperature_2m)
    const currentDewPoint = Math.round(weatherData.current.dew_point_2m)

    // Get rules
    const { data: rules } = await supabase.from('weather_rules')
      .select('*').eq('is_active', true).order('priority', { ascending: false })

    // Evaluate rules — highest priority wins
    let doorAction = 'open' // default open
    let triggeringRule = ''

    for (const rule of (rules || [])) {
      let triggered = false
      switch (rule.rule_type) {
        case 'dew_point_min': // dew point >= threshold → action
          triggered = currentDewPoint >= rule.threshold
          break
        case 'dew_point_max': // dew point <= threshold → action
          triggered = currentDewPoint <= rule.threshold
          break
        case 'temp_min': // temp >= threshold → action
          triggered = currentTemp >= rule.threshold
          break
        case 'temp_max': // temp <= threshold → action
          triggered = currentTemp <= rule.threshold
          break
      }
      if (triggered) {
        doorAction = rule.door_action
        triggeringRule = rule.description || rule.rule_name
        break // highest priority rule wins
      }
    }

    return NextResponse.json({
      doorAction, // 'open' or 'close'
      triggeringRule,
      currentTemp,
      currentDewPoint,
      rules: rules || [],
      updated: new Date().toISOString()
    })
  } catch (err) {
    return NextResponse.json({ error: 'Door status check failed' }, { status: 500 })
  }
}

// ============================================================
// RULES CRUD
// ============================================================
async function getRules() {
  const { data } = await supabase.from('weather_rules').select('*').order('priority', { ascending: false })
  const { data: config } = await supabase.from('weather_config').select('*').eq('id', 1).single()
  return NextResponse.json({ rules: data || [], config })
}

async function addRule(body: Record<string, unknown>) {
  const { error } = await supabase.from('weather_rules').insert({
    rule_name: body.rule_name,
    rule_type: body.rule_type,
    threshold: body.threshold,
    door_action: body.door_action,
    priority: body.priority || 0,
    description: body.description,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

async function updateRule(body: Record<string, unknown>) {
  const { error } = await supabase.from('weather_rules')
    .update({
      rule_name: body.rule_name,
      rule_type: body.rule_type,
      threshold: body.threshold,
      door_action: body.door_action,
      priority: body.priority,
      description: body.description,
      is_active: body.is_active,
    })
    .eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

async function deleteRule(id: number) {
  await supabase.from('weather_rules').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

async function getConfig() {
  const { data } = await supabase.from('weather_config').select('*').eq('id', 1).single()
  return NextResponse.json({ config: data })
}

async function updateConfig(body: Record<string, unknown>) {
  const { error } = await supabase.from('weather_config')
    .update({ zip_code: body.zip_code, location_name: body.location_name, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ============================================================
// HELPERS
// ============================================================
function extractNumber(html: string, regex: RegExp): number | null {
  const m = html.match(regex)
  return m ? parseInt(m[1]) : null
}

function extractText(html: string, regex: RegExp): string | null {
  const m = html.match(regex)
  return m ? m[1].trim() : null
}

function degToDir(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function weatherCodeToText(code: number): string {
  const codes: Record<number, string> = {
    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Freezing Fog',
    51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
    61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
    66: 'Freezing Rain', 67: 'Heavy Freezing Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
    77: 'Snow Grains', 80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
    85: 'Light Snow Showers', 86: 'Heavy Snow Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ Hail', 99: 'Severe Thunderstorm',
  }
  return codes[code] || 'Unknown'
}
