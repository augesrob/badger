-- Run this in Supabase SQL Editor
-- Adds avatar_url column to profiles

alter table public.profiles add column if not exists avatar_url text default null;
