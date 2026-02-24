-- Notification Preferences Table
-- One row per user, toggles for each event type
create table if not exists public.notification_preferences (
  id                    bigserial primary key,
  user_id               uuid not null references public.profiles(id) on delete cascade unique,

  -- Event type toggles
  notify_truck_status   boolean not null default true,
  notify_door_status    boolean not null default true,
  notify_chat_mention   boolean not null default true,
  notify_preshift       boolean not null default true,
  notify_system         boolean not null default true,

  -- Delivery channel toggles
  channel_app           boolean not null default true,
  channel_sms           boolean not null default true,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-update timestamp
create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.handle_updated_at();

-- Auto-create prefs row when a new profile is created
create or replace function public.handle_new_profile_prefs()
returns trigger language plpgsql security definer as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created_prefs
  after insert on public.profiles
  for each row execute function public.handle_new_profile_prefs();

-- Backfill existing users
insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- RLS
alter table public.notification_preferences enable row level security;
create policy "Users can read own prefs"   on public.notification_preferences for select using (auth.uid() = user_id);
create policy "Users can update own prefs" on public.notification_preferences for update using (auth.uid() = user_id);
create policy "Admin can read all prefs"   on public.notification_preferences for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin can update all prefs" on public.notification_preferences for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Service role full access"   on public.notification_preferences for all using (true);

-- Realtime
alter publication supabase_realtime add table public.notification_preferences;
