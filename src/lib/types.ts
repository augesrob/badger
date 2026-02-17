export interface Truck {
  id: number
  truck_number: number
  truck_type: 'box_truck' | 'van' | 'tandem' | 'semi'
  transmission: 'manual' | 'automatic'
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface Trailer {
  id: number
  truck_id: number
  trailer_number: number
  is_active: boolean
  notes: string | null
}

export interface StatusValue {
  id: number
  status_name: string
  status_color: string
  sort_order: number
  is_active: boolean
}

export interface LoadingDoor {
  id: number
  door_name: string
  door_status: string
  is_done_for_night: boolean
  sort_order: number
}

export interface PrintroomEntry {
  id: number
  loading_door_id: number
  batch_number: number
  row_order: number
  route_info: string | null
  truck_number: string | null
  pods: number
  pallets_trays: number
  notes: string | null
  is_end_marker: boolean
  created_at: string
}

export interface StagingDoor {
  id: number
  door_label: string    // '18A', '18B', etc.
  door_number: number   // 18, 19, 20...
  door_side: 'A' | 'B'
  in_front: string | null
  in_back: string | null
  updated_at: string
}

export interface LiveMovement {
  id: number
  truck_number: string
  current_location: string | null
  status_id: number | null
  in_front_of: string | null
  notes: string | null
  loading_door_id: number | null
  last_updated: string
  // Joined fields
  status_name?: string
  status_color?: string
  door_name?: string
}

export interface Route {
  id: number
  route_name: string
  route_number: string | null
  is_active: boolean
}

export const DOOR_STATUSES = [
  'Loading',
  'End Of Tote',
  'EOT+1',
  'Change Truck/Trailer',
  'Waiting',
  'Done for Night',
  '100%',
] as const

export type DoorStatus = typeof DOOR_STATUSES[number]

export function doorStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Loading': '#3b82f6',
    'End Of Tote': '#f59e0b',
    'EOT+1': '#f97316',
    'Change Truck/Trailer': '#8b5cf6',
    'Waiting': '#6b7280',
    'Done for Night': '#22c55e',
    '100%': '#22c55e',
  }
  return colors[status] || '#6b7280'
}
