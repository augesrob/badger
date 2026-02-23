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
  // Notify same-tab listeners (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent('badger:tts-changed'))
}

export function speak(text: string, settings: TTSSettings) {
  if (!settings.enabled) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // iOS: if speechSynthesis was paused by background, resume it first
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }

  // Cancel any current/stuck speech
  window.speechSynthesis.cancel()

  // Small delay to let cancel settle (required on iOS)
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = settings.volume
    utterance.rate = settings.rate
    utterance.pitch = 1

    // iOS requires explicit voice selection — pick English or fallback to first
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
      utterance.voice = englishVoice
    }

    // iOS bug: utterances >~15s get cut off. Split long text into sentences.
    // For our short status announcements this won't trigger, but good to have.
    window.speechSynthesis.speak(utterance)

    // iOS sometimes needs a kick after speak() — resume if it didn't start
    setTimeout(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume()
    }, 100)
  }, 50)
}

// Hook for movement page TTS
export function useMovementTTS(
  doors: { id: number; door_name: string; door_status: string }[],
  trucks: { truck_number: string; status_name?: string }[],
  settings: TTSSettings,
) {
  const prevDoorSnapshot  = useRef<string>('')
  const prevTruckSnapshot = useRef<string>('')
  const initialized       = useRef(false)

  useEffect(() => {
    const doorSnap  = JSON.stringify(doors.map(d => [d.id, d.door_status]))
    const truckSnap = JSON.stringify(trucks.map(t => [t.truck_number, t.status_name || '']))

    // First load — store snapshot without announcing
    if (!initialized.current) {
      if (doors.length > 0 || trucks.length > 0) {
        prevDoorSnapshot.current  = doorSnap
        prevTruckSnapshot.current = truckSnap
        initialized.current = true
      }
      return
    }

    if (!settings.enabled) {
      prevDoorSnapshot.current  = doorSnap
      prevTruckSnapshot.current = truckSnap
      return
    }

    // Detect door changes
    if (settings.doorStatus && doorSnap !== prevDoorSnapshot.current) {
      const prevDoors: [number, string][] = prevDoorSnapshot.current ? JSON.parse(prevDoorSnapshot.current) : []
      const prevMap = new Map(prevDoors)
      doors.forEach(d => {
        const prev = prevMap.get(d.id)
        if (prev !== undefined && prev !== d.door_status) {
          speak(`Door ${d.door_name} is now ${d.door_status}`, settings)
        }
      })
    }

    // Detect truck status changes
    if (settings.truckStatus && truckSnap !== prevTruckSnapshot.current) {
      const prevTrucks: [string, string][] = prevTruckSnapshot.current ? JSON.parse(prevTruckSnapshot.current) : []
      const prevMap = new Map(prevTrucks)
      trucks.forEach(t => {
        const prev = prevMap.get(t.truck_number)
        const curr = t.status_name || ''
        if (prev !== undefined && prev !== curr) {
          speak(`Truck ${t.truck_number}, ${curr || 'status unknown'}`, settings)
        }
      })
    }

    prevDoorSnapshot.current  = doorSnap
    prevTruckSnapshot.current = truckSnap
  }, [doors, trucks, settings])
}
