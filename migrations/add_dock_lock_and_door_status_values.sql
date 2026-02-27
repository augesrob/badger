-- ============================================================
-- Migration: Dock Lock + Door Status Values realtime
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add dock_lock_status column to loading_doors
ALTER TABLE loading_doors
  ADD COLUMN IF NOT EXISTS dock_lock_status TEXT DEFAULT NULL;

-- Valid values: 'working', 'not_working', NULL (unknown/unset)
-- No constraint needed — kept flexible for future values

-- 2. Ensure door_status_values table exists (may already exist from previous migration)
CREATE TABLE IF NOT EXISTS door_status_values (
  id          SERIAL PRIMARY KEY,
  status_name TEXT NOT NULL,
  status_color TEXT NOT NULL DEFAULT '#6B7280',
  sort_order  INT  NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Enable Realtime on door_status_values so Android picks up admin changes live
-- Run in Supabase Dashboard: Database → Replication → Tables → enable door_status_values
-- OR run this:
ALTER PUBLICATION supabase_realtime ADD TABLE door_status_values;

-- 4. Enable Realtime on loading_doors if not already (for dock_lock_status sync)
-- This is likely already enabled — skip if you get an error
ALTER PUBLICATION supabase_realtime ADD TABLE loading_doors;

-- Done. Verify with:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'loading_doors';
