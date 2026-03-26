-- Movement Change Log
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS movement_log (
  id          BIGSERIAL PRIMARY KEY,
  changed_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  changed_by  TEXT,
  truck_number TEXT,
  field_changed TEXT NOT NULL,  -- 'truck_status' | 'door_status' | 'dock_lock'
  old_value   TEXT,
  new_value   TEXT,
  door_name   TEXT
);

CREATE INDEX IF NOT EXISTS movement_log_changed_at_idx ON movement_log (changed_at DESC);

ALTER TABLE movement_log ENABLE ROW LEVEL SECURITY;

-- Admins and print_room can read all logs
CREATE POLICY "Admins can read movement log" ON movement_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'print_room'))
  );

-- Any authenticated user can insert (actions happen from movement page)
CREATE POLICY "Authenticated users can insert movement log" ON movement_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can delete (for reset)
CREATE POLICY "Admins can delete movement log" ON movement_log
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
