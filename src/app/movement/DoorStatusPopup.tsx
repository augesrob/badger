'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { doorStatusColor } from '@/lib/types'
import type { LoadingDoor, DoorStatusValue } from '@/lib/types'

interface Props {
  doors: LoadingDoor[]
  doorStatusValues: DoorStatusValue[]
  onSetDoorStatus: (doorId: number, status: string) => void
  lastUpdate: string
  ttsToggle: React.ReactNode
}

const DOOR_PAIRS = [['13A', '13B'], ['14A', '14B'], ['15A', '15B']]

export default function DoorStatusPopup({ doors, doorStatusValues, onSetDoorStatus, lastUpdate, ttsToggle }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 16, y: 60 })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const popupRef = useRef<HTMLDivElement>(null)

  // Drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const el = popupRef.current
      if (!el) return
      const maxX = window.innerWidth - el.offsetWidth - 8
      const maxY = window.innerHeight - el.offsetHeight - 8
      setPos({
        x: Math.max(8, Math.min(maxX, e.clientX - offset.current.x)),
        y: Math.max(8, Math.min(maxY, e.clientY - offset.current.y)),
      })
    }
    const onMouseUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Touch drag support
  useEffect(() => {
    const el = popupRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return
      const t = e.touches[0]
      const maxX = window.innerWidth - el.offsetWidth - 8
      const maxY = window.innerHeight - el.offsetHeight - 8
      setPos({
        x: Math.max(8, Math.min(maxX, t.clientX - offset.current.x)),
        y: Math.max(8, Math.min(maxY, t.clientY - offset.current.y)),
      })
    }
    const onTouchEnd = () => { dragging.current = false }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [open])

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true
    const t = e.touches[0]
    offset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }
  }

  // Get door object by name
  const getDoor = (name: string) => doors.find(d => d.door_name === name)

  return (
    <>
      {/* Inline bar — shown when popup is closed */}
      {!open && (
        <div className="sticky top-[49px] z-40 bg-[#0f0f0f] border-b border-[#333] -mx-4 px-4 py-2 mb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-amber-500/20 transition-colors"
              title="Open door status popup"
            >
              🚪 Doors ↗
            </button>
            {doors.map(d => {
              const st = d.door_status || 'Loading'
              const col = doorStatusColor(st, doorStatusValues)
              return (
                <div key={d.id} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 flex-shrink-0 border"
                  style={{ borderColor: col, background: `${col}15` }}>
                  <span className="text-xs font-extrabold text-white">{d.door_name}</span>
                  <select value={st} onChange={e => onSetDoorStatus(d.id, e.target.value)}
                    className="status-select text-[10px] py-0.5 px-1" style={{ background: col }}>
                    {doorStatusValues.map(s => <option key={s.id} value={s.status_name}>{s.status_name}</option>)}
                  </select>
                </div>
              )
            })}
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              {ttsToggle}
              <span className="text-xs text-green-500 animate-pulse">● LIVE</span>
              <span className="text-[10px] text-gray-500">{lastUpdate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Spacer when inline bar is hidden */}
      {open && <div className="h-3" />}

      {/* Floating draggable popup */}
      {open && (
        <div
          ref={popupRef}
          style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, minWidth: 260 }}
          className="bg-[#111] border border-amber-500/40 rounded-xl shadow-2xl shadow-black/60 select-none"
        >
          {/* Drag handle / title bar */}
          <div
            className="flex items-center justify-between px-3 py-2 bg-amber-500/10 rounded-t-xl border-b border-amber-500/20 cursor-grab active:cursor-grabbing"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            <span className="text-xs font-bold text-amber-400">🚪 Door Status</span>
            <div className="flex items-center gap-2">
              {ttsToggle}
              <span className="text-[10px] text-green-500 animate-pulse">● LIVE</span>
              <span className="text-[10px] text-gray-500">{lastUpdate}</span>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white text-sm leading-none ml-1"
                title="Close popup"
              >✕</button>
            </div>
          </div>

          {/* Door grid: 2 columns, pairs stacked */}
          <div className="p-3 grid grid-cols-2 gap-2">
            {DOOR_PAIRS.map(([left, right]) => (
              <div key={left + right} className="contents">
                {[left, right].map(name => {
                  const door = getDoor(name)
                  const st = door?.door_status || 'Loading'
                  const col = doorStatusColor(st, doorStatusValues)
                  return (
                    <div key={name}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 border"
                      style={{ borderColor: col, background: `${col}20` }}
                    >
                      <span className="text-sm font-extrabold text-white w-8 flex-shrink-0">{name}</span>
                      <select
                        value={st}
                        onChange={e => door && onSetDoorStatus(door.id, e.target.value)}
                        className="status-select text-[10px] py-0.5 px-1 flex-1 min-w-0"
                        style={{ background: col }}
                      >
                        {doorStatusValues.map(s => (
                          <option key={s.id} value={s.status_name}>{s.status_name}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Any extra doors not in pairs */}
          {doors.filter(d => !DOOR_PAIRS.flat().includes(d.door_name)).length > 0 && (
            <div className="px-3 pb-3 grid grid-cols-2 gap-2 border-t border-[#222] pt-2">
              {doors.filter(d => !DOOR_PAIRS.flat().includes(d.door_name)).map(door => {
                const st = door.door_status || 'Loading'
                const col = doorStatusColor(st, doorStatusValues)
                return (
                  <div key={door.id}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 border"
                    style={{ borderColor: col, background: `${col}20` }}
                  >
                    <span className="text-sm font-extrabold text-white w-8 flex-shrink-0">{door.door_name}</span>
                    <select
                      value={st}
                      onChange={e => onSetDoorStatus(door.id, e.target.value)}
                      className="status-select text-[10px] py-0.5 px-1 flex-1 min-w-0"
                      style={{ background: col }}
                    >
                      {doorStatusValues.map(s => (
                        <option key={s.id} value={s.status_name}>{s.status_name}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
