'use client'
import { StagingDoor } from '@/lib/types'

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
            <div className={`${compact ? 'px-1 text-xs' : 'px-3 text-sm'} py-1.5 font-bold text-gray-300 text-center`}>{door.door_label}</div>
            <div className="px-1 py-1 border-l border-[#333]">
              <input
                defaultValue={door.in_front || ''}
                placeholder="—"
                onBlur={e => onSave(door.id, 'in_front', e.target.value)}
                className={`w-full bg-transparent border border-transparent rounded px-2 py-1 ${compact ? 'text-xs' : 'text-sm'} font-semibold
                  text-green-400 focus:border-amber-500 focus:bg-[#222] outline-none text-center`}
              />
            </div>
            <div className="px-1 py-1 border-l border-[#333]">
              <input
                defaultValue={door.in_back || ''}
                placeholder="—"
                onBlur={e => onSave(door.id, 'in_back', e.target.value)}
                className={`w-full bg-transparent border border-transparent rounded px-2 py-1 ${compact ? 'text-xs' : 'text-sm'} font-semibold
                  text-blue-400 focus:border-amber-500 focus:bg-[#222] outline-none text-center`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
