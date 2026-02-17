-- Run this in Supabase SQL Editor
-- Drops old staging_doors and recreates with A/B + In Front/In Back layout

DROP TABLE IF EXISTS staging_doors;

CREATE TABLE staging_doors (
  id BIGSERIAL PRIMARY KEY,
  door_label TEXT NOT NULL UNIQUE,  -- e.g. '18A', '18B', '19A', etc.
  door_number INTEGER NOT NULL,     -- e.g. 18, 19, 20...
  door_side TEXT NOT NULL CHECK (door_side IN ('A','B')),
  in_front TEXT,                    -- truck number in front position
  in_back TEXT,                     -- truck number in back position
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all doors 18-28, A and B
INSERT INTO staging_doors (door_label, door_number, door_side) VALUES
  ('18A', 18, 'A'), ('18B', 18, 'B'),
  ('19A', 19, 'A'), ('19B', 19, 'B'),
  ('20A', 20, 'A'), ('20B', 20, 'B'),
  ('21A', 21, 'A'), ('21B', 21, 'B'),
  ('22A', 22, 'A'), ('22B', 22, 'B'),
  ('23A', 23, 'A'), ('23B', 23, 'B'),
  ('24A', 24, 'A'), ('24B', 24, 'B'),
  ('25A', 25, 'A'), ('25B', 25, 'B'),
  ('26A', 26, 'A'), ('26B', 26, 'B'),
  ('27A', 27, 'A'), ('27B', 27, 'B'),
  ('28A', 28, 'A'), ('28B', 28, 'B');

-- Re-enable RLS + public access
ALTER TABLE staging_doors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON staging_doors FOR ALL USING (true) WITH CHECK (true);

-- Re-enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE staging_doors;
