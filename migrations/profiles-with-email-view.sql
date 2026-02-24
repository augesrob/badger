-- Run this in your Supabase SQL Editor
-- Creates a view that joins profiles with auth.users emails
-- Only admins can read it (enforced by RLS)

create or replace view public.profiles_with_email as
select
  p.*,
  u.email
from public.profiles p
join auth.users u on u.id = p.id;

-- RLS: only authenticated admins can select
alter view public.profiles_with_email owner to authenticated;

create policy "Admins can view all profiles with email"
  on public.profiles_with_email
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
