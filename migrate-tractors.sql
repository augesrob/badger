-- Run this in Supabase SQL Editor
-- Tractor Trailer Database

-- Standalone trailer list
CREATE TABLE IF NOT EXISTS trailer_list (
  id BIGSERIAL PRIMARY KEY,
  trailer_number TEXT NOT NULL UNIQUE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tractors with driver info and up to 4 trailer assignments
CREATE TABLE IF NOT EXISTS tractors (
  id BIGSERIAL PRIMARY KEY,
  truck_number INTEGER NOT NULL UNIQUE,
  driver_name TEXT,
  driver_cell TEXT,
  trailer_1_id BIGINT REFERENCES trailer_list(id) ON DELETE SET NULL,
  trailer_2_id BIGINT REFERENCES trailer_list(id) ON DELETE SET NULL,
  trailer_3_id BIGINT REFERENCES trailer_list(id) ON DELETE SET NULL,
  trailer_4_id BIGINT REFERENCES trailer_list(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS + public access
ALTER TABLE trailer_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON trailer_list FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON tractors FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE trailer_list;
ALTER PUBLICATION supabase_realtime ADD TABLE tractors;
