import { supabase } from '@/lib/supabase'
import { AutomationRule } from '@/lib/types'

interface PrintroomContext {
  truck_number: string
  loading_door_id: number
  is_end_marker: boolean
  batch_number: number
  row_order: number
}

// Statuses that should NOT be overwritten by automation
// (truck has progressed beyond what automation would set)
const PROTECTED_STATUSES = new Set([
  'In Door',
  'Put Away',
  'On Route',
  'Done for Night',
])

// Run all active rules after a printroom entry changes
export async function runAutomation(entry: PrintroomContext) {
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (!rules || rules.length === 0) return

  for (const rule of rules as AutomationRule[]) {
    await processRule(rule, entry)
  }
}

// Run preshift automation: when a truck is placed in front or back
// Only sets status if truck doesn't already have a more advanced status
export async function runPreshiftAutomation() {
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('is_active', true)
    .in('trigger_type', ['preshift_in_front', 'preshift_in_back'])
    .order('sort_order')

  if (!rules || rules.length === 0) return

  const { data: stagingDoors } = await supabase.from('staging_doors').select('*')
  if (!stagingDoors) return

  // Get all current movement statuses in one query (avoid N+1)
  const { data: allMovement } = await supabase
    .from('live_movement')
    .select('truck_number, status_id, status_values(status_name)')

  // Build lookup: truck_number → current status name
  const currentStatuses: Record<string, string> = {}
  if (allMovement) {
    for (const m of allMovement) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statusName = (m as any).status_values?.status_name || ''
      currentStatuses[m.truck_number] = statusName
    }
  }

  for (const rule of rules as AutomationRule[]) {
    for (const sd of stagingDoors) {
      if (rule.trigger_type === 'preshift_in_front' && sd.in_front) {
        const currentStatus = currentStatuses[sd.in_front] || ''
        // Don't overwrite if truck already has a protected/advanced status
        if (!PROTECTED_STATUSES.has(currentStatus)) {
          await executeActionForTruck(rule, sd.in_front)
        }
      }
      if (rule.trigger_type === 'preshift_in_back' && sd.in_back) {
        const currentStatus = currentStatuses[sd.in_back] || ''
        if (!PROTECTED_STATUSES.has(currentStatus)) {
          await executeActionForTruck(rule, sd.in_back)
        }
      }
    }
  }
}

async function processRule(rule: AutomationRule, entry: PrintroomContext) {
  const truckLower = (entry.truck_number || '').toLowerCase().trim()

  switch (rule.trigger_type) {
    case 'truck_number_equals': {
      if (truckLower === (rule.trigger_value || '').toLowerCase().trim()) {
        await executeAction(rule, entry)
      }
      break
    }

    case 'truck_number_contains': {
      if (truckLower.includes((rule.trigger_value || '').toLowerCase().trim())) {
        await executeAction(rule, entry)
      }
      break
    }

    case 'is_last_truck_with_status': {
      if (rule.trigger_value?.toUpperCase() === 'END' && entry.is_end_marker) {
        // Check no entries exist AFTER this one in the same door/batch
        const { data: laterEntries } = await supabase
          .from('printroom_entries')
          .select('id')
          .eq('loading_door_id', entry.loading_door_id)
          .gt('row_order', entry.row_order)
          .eq('batch_number', entry.batch_number)
          .limit(1)

        // Check no higher batch exists for this door
        const { data: higherBatch } = await supabase
          .from('printroom_entries')
          .select('id')
          .eq('loading_door_id', entry.loading_door_id)
          .gt('batch_number', entry.batch_number)
          .limit(1)

        if ((!laterEntries || laterEntries.length === 0) && (!higherBatch || higherBatch.length === 0)) {
          await executeAction(rule, entry)
        }
      }
      break
    }

    case 'truck_is_end_marker': {
      if (entry.is_end_marker) {
        await executeAction(rule, entry)
      }
      break
    }

    case 'status_equals': {
      const { data: mv } = await supabase
        .from('live_movement')
        .select('*, status_values(status_name)')
        .eq('truck_number', entry.truck_number)
        .maybeSingle()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statusName = (mv as any)?.status_values?.status_name || ''
      if (statusName.toLowerCase() === (rule.trigger_value || '').toLowerCase()) {
        await executeAction(rule, entry)
      }
      break
    }
  }
}

async function executeActionForTruck(rule: AutomationRule, truckNumber: string) {
  switch (rule.action_type) {
    case 'set_truck_status': {
      const { data: status } = await supabase
        .from('status_values')
        .select('id')
        .ilike('status_name', rule.action_value)
        .maybeSingle()

      if (status) {
        // Only update if truck exists in movement
        const { data: existing } = await supabase
          .from('live_movement')
          .select('id')
          .eq('truck_number', truckNumber)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('live_movement')
            .update({ status_id: status.id, last_updated: new Date().toISOString() })
            .eq('truck_number', truckNumber)
        }
      }
      break
    }

    case 'set_truck_location': {
      const { data: existing } = await supabase
        .from('live_movement')
        .select('id')
        .eq('truck_number', truckNumber)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('live_movement')
          .update({ current_location: rule.action_value, last_updated: new Date().toISOString() })
          .eq('truck_number', truckNumber)
      }
      break
    }
  }
}

async function executeAction(rule: AutomationRule, entry: PrintroomContext) {
  switch (rule.action_type) {
    case 'set_truck_status': {
      const { data: status } = await supabase
        .from('status_values')
        .select('id')
        .ilike('status_name', rule.action_value)
        .maybeSingle()

      if (status) {
        await supabase
          .from('live_movement')
          .update({ status_id: status.id, last_updated: new Date().toISOString() })
          .eq('truck_number', entry.truck_number)
      }
      break
    }

    case 'set_door_status': {
      await supabase
        .from('loading_doors')
        .update({ door_status: rule.action_value })
        .eq('id', entry.loading_door_id)
      break
    }

    case 'set_truck_location': {
      await supabase
        .from('live_movement')
        .update({ current_location: rule.action_value, last_updated: new Date().toISOString() })
        .eq('truck_number', entry.truck_number)
      break
    }
  }
}
