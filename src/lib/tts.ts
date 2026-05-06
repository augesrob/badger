'use client'
import { useEffect, useRef } from 'react'

interface TTSSettings {
  enabled: boolean
  volume: number // 0-1
  rate: number   // 0.5-2
  doorStatus: boolean
  truckStatus: boolean
}

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: false,
  volume: 0.8,
  rate: 1,
  doorStatus: true,
  truckStatus: true,
}

function getSettingsKey(page: string) {
  return `badger-tts-${page}`
}

export function getTTSSettings(page: string): TTSSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(getSettingsKey(page))
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

export function saveTTSSettings(page: string, settings: TTSSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getSettingsKey(page), JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent('badger:tts-changed'))
}

// ============================================================
// SPEECH QUEUE — queues announcements so they don't cancel each other
// ============================================================
const speechQueue: { text: string; settings: TTSSettings }[] = []
let isSpeaking = false

// Track user interaction for Chrome autoplay policy
if (typeof window !== 'undefined') {
  const markInteraction = () => { /* tracked for Chrome autoplay */ }
  window.addEventListener('click', markInteraction, { passive: true })
  window.addEventListener('touchstart', markInteraction, { passive: true })
  window.addEventListener('keydown', markInteraction, { passive: true })
}

function processQueue() {
  if (isSpeaking || speechQueue.length === 0) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Chrome blocks speech if no recent user interaction (>1 hour idle)
  // Still try — worst case it silently fails
  const item = speechQueue.shift()!
  isSpeaking = true

  // Reset stuck speechSynthesis
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }
  window.speechSynthesis.cancel()

  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(item.text)
    utterance.volume = item.settings.volume
    utterance.rate = item.settings.rate
    utterance.pitch = 1

    // Pick English voice
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
      utterance.voice = englishVoice
    }

    utterance.onend = () => {
      isSpeaking = false
      // Small gap between announcements
      setTimeout(processQueue, 300)
    }
    utterance.onerror = () => {
      isSpeaking = false
      setTimeout(processQueue, 300)
    }

    window.speechSynthesis.speak(utterance)

    // Failsafe: if speech doesn't end within 10 seconds, force next
    setTimeout(() => {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        isSpeaking = false
        processQueue()
      }
    }, 10000)
  }, 80)
}

export function speak(text: string, settings: TTSSettings) {
  if (!settings.enabled) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Add to queue instead of cancelling current speech
  speechQueue.push({ text, settings })

  // Limit queue to 5 to prevent flood
  while (speechQueue.length > 5) speechQueue.shift()

  processQueue()
}

// ============================================================
// MOVEMENT TTS HOOK
// ============================================================
export function useMovementTTS(
  doors: { id: number; door_name: string; door_status: string }[],
  trucks: { truck_number: string; status_name?: string }[],
  settings: TTSSettings,
) {
  // Use refs to avoid re-running effect when settings object reference changes
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const prevDoorSnapshot = useRef<string>('')
  const prevTruckSnapshot = useRef<string>('')
  const initialized = useRef(false)

  // Stable snapshot strings — only change when actual data changes
  const doorSnap = JSON.stringify(doors.map(d => [d.id, d.door_status]))
  const truckSnap = JSON.stringify(trucks.map(t => [t.truck_number, t.status_name || '']))

  useEffect(() => {
    const s = settingsRef.current

    // First load — store snapshot without announcing
    if (!initialized.current) {
      if (doors.length > 0 || trucks.length > 0) {
        prevDoorSnapshot.current = doorSnap
        prevTruckSnapshot.current = truckSnap
        initialized.current = true
      }
      return
    }

    // Always update snapshots even if TTS disabled — prevents announcement flood on enable
    if (!s.enabled) {
      prevDoorSnapshot.current = doorSnap
      prevTruckSnapshot.current = truckSnap
      return
    }

    // Detect door status changes
    if (s.doorStatus && doorSnap !== prevDoorSnapshot.current && prevDoorSnapshot.current) {
      const prevDoors: [number, string][] = JSON.parse(prevDoorSnapshot.current)
      const prevMap = new Map(prevDoors)
      doors.forEach(d => {
        const prev = prevMap.get(d.id)
        if (prev !== undefined && prev !== d.door_status && d.door_status) {
          speak(`Door ${d.door_name} is now ${d.door_status}`, s)
        }
      })
    }

    // Detect truck status changes
    if (s.truckStatus && truckSnap !== prevTruckSnapshot.current && prevTruckSnapshot.current) {
      const prevTrucks: [string, string][] = JSON.parse(prevTruckSnapshot.current)
      const prevMap = new Map(prevTrucks)
      trucks.forEach(t => {
        const prev = prevMap.get(t.truck_number)
        const curr = t.status_name || ''
        if (prev !== undefined && prev !== curr && curr) {
          speak(`Truck ${t.truck_number}, ${curr}`, s)
        }
      })
    }

    prevDoorSnapshot.current = doorSnap
    prevTruckSnapshot.current = truckSnap
  // ONLY re-run when actual snapshot data changes, NOT on settings/reference changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doorSnap, truckSnap])
}
