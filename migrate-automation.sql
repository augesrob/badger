-- Run this in Supabase SQL Editor
-- Automation Rules Engine

CREATE TABLE IF NOT EXISTS automation_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  -- Condition
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'truck_number_equals',
    'truck_number_contains',
    'is_last_truck_with_status',
    'truck_is_end_marker',
    'status_equals',
    'preshift_in_front',
    'preshift_in_back'
  )),
  trigger_field TEXT,
  trigger_value TEXT,
  -- Action
  action_type TEXT NOT NULL CHECK (action_type IN (
    'set_truck_status',
    'set_door_status',
    'set_truck_location'
  )),
  action_value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS + public access
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON automation_rules FOR ALL USING (true) WITH CHECK (true);

-- Seed rules
INSERT INTO automation_rules (rule_name, description, trigger_type, trigger_value, action_type, action_value, sort_order) VALUES
  ('Last END → Done for Night', 'When the last truck in a door has END marker, set door to Done for Night', 'is_last_truck_with_status', 'END', 'set_door_status', 'Done for Night', 10),
  ('GAP → Gap Status', 'When truck number is "gap", set its status to Gap', 'truck_number_equals', 'gap', 'set_truck_status', 'Gap', 20),
  ('CPU → Ignore', 'When truck number is "cpu", set its status to Ignore', 'truck_number_equals', 'cpu', 'set_truck_status', 'Ignore', 30),
  ('999 → Ignore', 'When truck number is "999", set its status to Ignore', 'truck_number_equals', '999', 'set_truck_status', 'Ignore', 40),
  ('PreShift In Front → Ready', 'Truck in front position on preshift gets Ready status', 'preshift_in_front', NULL, 'set_truck_status', 'Ready', 50),
  ('PreShift In Back → In Back', 'Truck in back position on preshift gets In Back status', 'preshift_in_back', NULL, 'set_truck_status', 'In Back', 60);
