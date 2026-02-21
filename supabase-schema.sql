-- ============================================================
-- BADGER AUTH + PROFILES + CHAT + SUBSCRIPTIONS SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PROFILES TABLE (extends auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  role          text not null default 'driver'
                  check (role in ('admin','print_room','truck_mover','trainee','driver')),
  phone         text,
  carrier       text,  -- 'verizon','att','tmobile','sprint','cricket','boost','metro','uscellular'
  sms_enabled   boolean not null default false,
  avatar_color  text default '#f59e0b',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup (username defaults to email prefix)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'driver')
  );
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. TRUCK SUBSCRIPTIONS TABLE
create table if not exists public.truck_subscriptions (
  id           bigserial primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  truck_number text not null,
  notify_sms   boolean not null default true,
  notify_app   boolean not null default true,
  created_at   timestamptz not null default now(),
  unique(user_id, truck_number)
);

-- 3. NOTIFICATIONS TABLE (in-app + SMS queue)
create table if not exists public.notifications (
  id           bigserial primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  truck_number text,
  message      text not null,
  type         text not null default 'status_change', -- 'status_change','chat','system'
  is_read      boolean not null default false,
  sent_sms     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- 4. CHAT ROOMS TABLE
create table if not exists public.chat_rooms (
  id             bigserial primary key,
  name           text,
  type           text not null default 'global'
                   check (type in ('global','role','direct')),
  role_target    text,  -- for role rooms: 'print_room','truck_mover', etc.
  participant_ids uuid[],  -- for direct rooms
  created_at     timestamptz not null default now()
);

-- Seed default rooms
insert into public.chat_rooms (name, type) values ('🌐 Global', 'global') on conflict do nothing;
insert into public.chat_rooms (name, type, role_target) values ('🖨️ Print Room', 'role', 'print_room') on conflict do nothing;
insert into public.chat_rooms (name, type, role_target) values ('🚚 Truck Movers', 'role', 'truck_mover') on conflict do nothing;
insert into public.chat_rooms (name, type, role_target) values ('🚛 Drivers', 'role', 'driver') on conflict do nothing;

-- 5. MESSAGES TABLE
create table if not exists public.messages (
  id           bigserial primary key,
  room_id      bigint not null references public.chat_rooms(id) on delete cascade,
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  content      text not null,
  created_at   timestamptz not null default now()
);

-- Enable Realtime on messages and notifications
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.truck_subscriptions;

-- 6. ROW LEVEL SECURITY
alter table public.profiles          enable row level security;
alter table public.truck_subscriptions enable row level security;
alter table public.notifications     enable row level security;
alter table public.chat_rooms        enable row level security;
alter table public.messages          enable row level security;

-- PROFILES policies
create policy "Users can read all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin can update any profile" on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- TRUCK SUBSCRIPTIONS policies  
create policy "Users manage own subscriptions" on public.truck_subscriptions
  for all using (auth.uid() = user_id);
create policy "Admin reads all subscriptions" on public.truck_subscriptions for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- NOTIFICATIONS policies
create policy "Users read own notifications" on public.notifications for select
  using (auth.uid() = user_id);
create policy "System can insert notifications" on public.notifications for insert
  with check (true);
create policy "Users mark own read" on public.notifications for update
  using (auth.uid() = user_id);

-- CHAT ROOMS policies
create policy "Authenticated users can read rooms" on public.chat_rooms for select
  using (auth.role() = 'authenticated');

-- MESSAGES policies
create policy "Authenticated users can read messages" on public.messages for select
  using (auth.role() = 'authenticated');
create policy "Authenticated users can send messages" on public.messages for insert
  with check (auth.uid() = sender_id);

-- 7. FUNCTION: notify subscribers when movement status changes
-- (Call this from a DB trigger on live_movements or from your edge function)
create or replace function public.notify_truck_status_change(
  p_truck_number text,
  p_new_status   text,
  p_location     text default null
) returns void language plpgsql security definer as $$
declare
  sub record;
  msg text;
begin
  msg := format('🚚 Truck %s: %s%s',
    p_truck_number,
    p_new_status,
    case when p_location is not null then ' @ ' || p_location else '' end
  );

  for sub in
    select ts.user_id, p.sms_enabled, p.phone, p.carrier
    from public.truck_subscriptions ts
    join public.profiles p on p.id = ts.user_id
    where ts.truck_number = p_truck_number and ts.notify_app = true
  loop
    insert into public.notifications (user_id, truck_number, message, type)
    values (sub.user_id, p_truck_number, msg, 'status_change');
  end loop;
end; $$;

-- 8. HELPER VIEW: profiles with email (admin only use)
create or replace view public.profiles_with_email as
  select p.*, u.email
  from public.profiles p
  join auth.users u on u.id = p.id;

-- Grant access
grant select on public.profiles_with_email to service_role;
grant all on public.profiles to authenticated;
grant all on public.truck_subscriptions to authenticated;
grant all on public.notifications to authenticated;
grant select on public.chat_rooms to authenticated;
grant all on public.messages to authenticated;
grant usage, select on all sequences in schema public to authenticated;
