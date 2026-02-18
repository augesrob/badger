-- Run this in Supabase SQL Editor
-- Automation Rules Engine

CREATE TABLE IF NOT EXISTS automation_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  -- Condition
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'truck_number_equals',      -- truck # matches exact value
    'truck_number_contains',    -- truck # contains text
    'is_last_truck_with_status', -- last truck in door has specific status
    'truck_is_end_marker',      -- truck is an END marker
    'status_equals'             -- movement status matches
  )),
  trigger_field TEXT,           -- the field to check
  trigger_value TEXT,           -- the value to match
  -- Action
  action_type TEXT NOT NULL CHECK (action_type IN (
    'set_truck_status',         -- change the truck's movement status
    'set_door_status',          -- change the loading door status
    'set_truck_location'        -- set truck location field
  )),
  action_value TEXT NOT NULL,   -- what to set it to (status name or door status)
  -- Priority (lower = runs first)
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS + public access
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON automation_rules FOR ALL USING (true) WITH CHECK (true);

-- Seed the 3 rules requested
INSERT INTO automation_rules (rule_name, description, trigger_type, trigger_value, action_type, action_value, sort_order) VALUES
  ('Last END → Done for Night', 'When the last truck in a door has status END, set door to Done for Night', 'is_last_truck_with_status', 'END', 'set_door_status', 'Done for Night', 10),
  ('GAP → Gap Status', 'When truck number is "gap", set its status to Gap', 'truck_number_equals', 'gap', 'set_truck_status', 'Gap', 20),
  ('CPU → Ignore', 'When truck number is "cpu", set its status to Ignore', 'truck_number_equals', 'cpu', 'set_truck_status', 'Ignore', 30),
  ('999 → Ignore', 'When truck number is "999", set its status to Ignore', 'truck_number_equals', '999', 'set_truck_status', 'Ignore', 40);
