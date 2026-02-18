'use client'
import { StagingDoor } from '@/lib/types'
import { useRef } from 'react'

export function PreShiftTable({ doors, onSave, compact = false }: {
  doors: StagingDoor[]
  onSave: (id: number, field: 'in_front' | 'in_back', value: string) => void
  compact?: boolean
}) {
  const gridCols = compact ? 'grid-cols-[40px_1fr_1fr]' : 'grid-cols-[70px_1fr_1fr]'

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`grid ${gridCols} gap-0 bg-[#111] border-b-2 border-amber-500`}>
        <div className="px-2 py-2 text-xs font-bold text-amber-500 uppercase">{compact ? '' : 'Door #'}</div>
        <div className="px-3 py-2 text-xs font-bold text-amber-500 uppercase border-l border-[#333]">In Front</div>
        <div className="px-3 py-2 text-xs font-bold text-amber-500 uppercase border-l border-[#333]">In Back</div>
      </div>

      {/* Rows */}
      {doors.map((door, i) => {
        const isNewDoorGroup = i > 0 && door.door_number !== doors[i - 1].door_number
        return (
          <div key={door.id}
            className={`grid ${gridCols} gap-0 border-b border-white/5 hover:bg-white/[0.02]
              ${isNewDoorGroup ? 'border-t border-t-[#444]' : ''}
              ${door.door_side === 'A' ? 'bg-white/[0.02]' : ''}`}>
            <div className={`${compact ? 'px-1 text-xs' : 'px-3 text-sm'} py-1.5 font-bold text-gray-300 text-center self-center`}>{door.door_label}</div>
            <CellInput
              defaultValue={door.in_front || ''}
              color="text-green-400"
              compact={compact}
              onSave={val => onSave(door.id, 'in_front', val)}
            />
            <CellInput
              defaultValue={door.in_back || ''}
              color="text-blue-400"
              compact={compact}
              onSave={val => onSave(door.id, 'in_back', val)}
            />
          </div>
        )
      })}
    </div>
  )
}

function CellInput({ defaultValue, color, compact, onSave }: {
  defaultValue: string
  color: string
  compact?: boolean
  onSave: (val: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Tapping the whole cell focuses the input
  const handleCellTap = () => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }

  return (
    <div
      className="border-l border-[#333] cursor-text"
      style={{ touchAction: 'manipulation' }}
      onClick={handleCellTap}
    >
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder="—"
        inputMode="numeric"
        onBlur={e => onSave(e.target.value)}
        onFocus={e => e.target.select()}
        className={`w-full bg-transparent border border-transparent rounded px-2 ${compact ? 'text-xs py-1' : 'text-sm py-2.5'} font-semibold
          ${color} focus:border-amber-500 focus:bg-[#222] outline-none text-center`}
        style={{ touchAction: 'manipulation', minHeight: compact ? undefined : '44px' }}
      />
    </div>
  )
}
