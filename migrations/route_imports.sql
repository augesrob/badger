-- Route Imports table for email ping/pong system
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS route_imports (
  id INTEGER PRIMARY KEY DEFAULT 1,
  status TEXT DEFAULT 'idle', -- idle, sent, received
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  csv_data TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE route_imports;

-- Enable RLS but allow all (same as other tables)
ALTER TABLE route_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON route_imports FOR ALL USING (true) WITH CHECK (true);

-- Insert initial row
INSERT INTO route_imports (id, status) VALUES (1, 'idle') ON CONFLICT (id) DO NOTHING;
