-- ============================================================
-- Migration: Dock Lock Status Values table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS dock_lock_status_values (
  id          SERIAL PRIMARY KEY,
  status_name TEXT NOT NULL UNIQUE,
  status_color TEXT NOT NULL DEFAULT '#22c55e',
  sort_order  INT  NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with defaults (you can change colors in Admin after)
INSERT INTO dock_lock_status_values (status_name, status_color, sort_order)
VALUES
  ('Working',     '#22c55e', 1),
  ('Not Working', '#ef4444', 2)
ON CONFLICT (status_name) DO NOTHING;

-- Enable Realtime so Android picks up admin changes instantly
ALTER PUBLICATION supabase_realtime ADD TABLE dock_lock_status_values;

-- Verify:
-- SELECT * FROM dock_lock_status_values;
