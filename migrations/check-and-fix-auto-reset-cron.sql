-- ============================================================
-- CHECK & FIX: Double auto-reset (auto_all firing twice)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/vjmvuqunedyuovtqtotj/sql/new
-- ============================================================

-- 1. See all pg_cron jobs (what's scheduled)
SELECT jobid, jobname, schedule, command, active
FROM cron.job
ORDER BY jobid;

-- 2. See recent job run history (look for double-fires)
SELECT jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 30;

-- ============================================================
-- IF you see duplicate jobs for the same reset, run this to
-- list them all and then delete the duplicates:
-- ============================================================

-- List all jobs with their IDs so you can identify duplicates:
-- SELECT jobid, jobname, schedule FROM cron.job;

-- Delete a specific duplicate job by ID (replace 999 with actual jobid):
-- SELECT cron.unschedule(999);

-- Or unschedule by name if you know it:
-- SELECT cron.unschedule('auto-reset-all');

-- ============================================================
-- VERIFY: Check reset_log for the double-fire pattern
-- ============================================================
SELECT reset_type, reset_at, reset_by
FROM reset_log
ORDER BY reset_at DESC
LIMIT 20;
