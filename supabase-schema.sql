-- ============================================
-- BADGER TRUCK MANAGEMENT - Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Trucks (master vehicle list)
CREATE TABLE trucks (
  id BIGSERIAL PRIMARY KEY,
  truck_number INTEGER NOT NULL UNIQUE,
  truck_type TEXT NOT NULL DEFAULT 'box_truck' CHECK (truck_type IN ('box_truck','van','tandem','semi')),
  transmission TEXT NOT NULL DEFAULT 'automatic' CHECK (transmission IN ('manual','automatic')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trailers (for semis)
CREATE TABLE trailers (
  id BIGSERIAL PRIMARY KEY,
  truck_id BIGINT NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  trailer_number INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(truck_id, trailer_number)
);

-- Status values (customizable)
CREATE TABLE status_values (
  id BIGSERIAL PRIMARY KEY,
  status_name TEXT NOT NULL UNIQUE,
  status_color TEXT DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Loading doors (13A-15B)
CREATE TABLE loading_doors (
  id BIGSERIAL PRIMARY KEY,
  door_name TEXT NOT NULL UNIQUE,
  door_status TEXT DEFAULT 'Loading',
  is_done_for_night BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Routes
CREATE TABLE routes (
  id BIGSERIAL PRIMARY KEY,
  route_name TEXT NOT NULL,
  route_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Print Room entries
CREATE TABLE printroom_entries (
  id BIGSERIAL PRIMARY KEY,
  loading_door_id BIGINT NOT NULL REFERENCES loading_doors(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL DEFAULT 1,
  row_order INTEGER NOT NULL DEFAULT 1,
  route_info TEXT,
  truck_number TEXT,
  pods INTEGER DEFAULT 0,
  pallets_trays INTEGER DEFAULT 0,
  notes TEXT,
  is_end_marker BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staging doors (18-28) for PreShift
CREATE TABLE staging_doors (
  id BIGSERIAL PRIMARY KEY,
  door_number INTEGER NOT NULL UNIQUE,
  position1_truck TEXT,
  position2_truck TEXT,
  position3_truck TEXT,
  position4_truck TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Movement tracking
CREATE TABLE live_movement (
  id BIGSERIAL PRIMARY KEY,
  truck_number TEXT NOT NULL UNIQUE,
  current_location TEXT,
  status_id BIGINT REFERENCES status_values(id) ON DELETE SET NULL,
  in_front_of TEXT,
  notes TEXT,
  loading_door_id BIGINT REFERENCES loading_doors(id) ON DELETE SET NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Admin settings
CREATE TABLE admin_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reset log
CREATE TABLE reset_log (
  id BIGSERIAL PRIMARY KEY,
  reset_type TEXT NOT NULL,
  reset_by TEXT DEFAULT 'manual',
  reset_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Default statuses
INSERT INTO status_values (status_name, status_color, sort_order) VALUES
  ('In Door', '#3b82f6', 1),
  ('Put Away', '#22c55e', 2),
  ('On Route', '#f59e0b', 3),
  ('In Front', '#8b5cf6', 4),
  ('Ready', '#06b6d4', 5),
  ('In Back', '#ec4899', 6),
  ('The Rock', '#6b7280', 7),
  ('Trailer Area', '#d97706', 8),
  ('Yard', '#84cc16', 9),
  ('Missing', '#ef4444', 10),
  ('8', '#475569', 11),
  ('9', '#475569', 12),
  ('10', '#475569', 13),
  ('11', '#475569', 14),
  ('12A', '#475569', 15),
  ('12B', '#475569', 16),
  ('13A', '#475569', 17),
  ('13B', '#475569', 18),
  ('14A', '#475569', 19),
  ('14B', '#475569', 20),
  ('15A', '#475569', 21),
  ('15B', '#475569', 22),
  ('Ignore', '#9ca3af', 23),
  ('Gap', '#9ca3af', 24),
  ('Transfer', '#7c3aed', 25),
  ('END', '#dc2626', 26);

-- Loading doors
INSERT INTO loading_doors (door_name, sort_order) VALUES
  ('13A', 1), ('13B', 2), ('14A', 3), ('14B', 4), ('15A', 5), ('15B', 6);

-- Staging doors 18-28
INSERT INTO staging_doors (door_number) VALUES
  (18),(19),(20),(21),(22),(23),(24),(25),(26),(27),(28);

-- Routes
INSERT INTO routes (route_name, route_number) VALUES
  ('Fond Du Lac', 'FDL'),
  ('Green Bay', 'GB'),
  ('Wausau', 'WAU'),
  ('Caledonia', 'CAL'),
  ('Chippewa Falls', 'CHF');

-- ============================================
-- ENABLE REAL-TIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE live_movement;
ALTER PUBLICATION supabase_realtime ADD TABLE loading_doors;
ALTER PUBLICATION supabase_realtime ADD TABLE printroom_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE staging_doors;

-- ============================================
-- ROW LEVEL SECURITY (allow public access for now)
-- ============================================
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE loading_doors ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE printroom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_doors ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_movement ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reset_log ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth for now - simple warehouse tool)
CREATE POLICY "Public access" ON trucks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON trailers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON status_values FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON loading_doors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON printroom_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON staging_doors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON live_movement FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON admin_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON reset_log FOR ALL USING (true) WITH CHECK (true);
