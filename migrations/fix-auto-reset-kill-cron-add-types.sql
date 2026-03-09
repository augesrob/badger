-- ============================================================
-- Badger Auto-Reset Migration
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vjmvuqunedyuovtqtotj/sql/new
-- ============================================================

-- 1. KILL THE SUPABASE PG_CRON JOB (job id 2 = badger-auto-reset)
--    This removes the hourly Edge Function call entirely.
--    All reset scheduling is now controlled by the website admin panel.
SELECT cron.unschedule(2);

-- Verify it's gone:
-- SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid;

-- ============================================================

-- 2. Add reset_types column to auto_reset_config if it doesn't exist
ALTER TABLE public.auto_reset_config
  ADD COLUMN IF NOT EXISTS reset_types text[] DEFAULT ARRAY['printroom','preshift','movement'];

-- 3. Ensure the config row exists (id=1) with safe defaults
INSERT INTO public.auto_reset_config (id, enabled, hour, minute, days, reset_types, updated_at)
VALUES (1, false, 6, 0, ARRAY[1,2,3,4,5,6], ARRAY['printroom','preshift','movement'], now())
ON CONFLICT (id) DO UPDATE
  SET reset_types = COALESCE(auto_reset_config.reset_types, EXCLUDED.reset_types);

-- ============================================================

-- 4. Verify final state
SELECT id, enabled, hour, minute, days, reset_types, updated_at
FROM public.auto_reset_config
WHERE id = 1;
