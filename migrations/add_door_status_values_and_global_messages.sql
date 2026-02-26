-- ── Door Status Values ────────────────────────────────────────────────────────
-- Mirrors status_values but for loading door statuses.
-- Replaces the hard-coded DOOR_STATUSES array so admins can manage them live.

create table if not exists door_status_values (
  id           serial primary key,
  status_name  text    not null unique,
  status_color text    not null default '#6b7280',
  sort_order   integer not null default 100,
  is_active    boolean not null default true,
  created_at   timestamptz default now()
);

-- Seed with the existing hard-coded values (preserving current colors)
insert into door_status_values (status_name, status_color, sort_order) values
  ('Loading',              '#3b82f6', 1),
  ('End Of Tote',          '#f59e0b', 2),
  ('EOT+1',                '#f97316', 3),
  ('Change Truck/Trailer', '#8b5cf6', 4),
  ('Waiting',              '#6b7280', 5),
  ('Done for Night',       '#22c55e', 6),
  ('100%',                 '#22c55e', 7)
on conflict (status_name) do nothing;

-- Allow anon read (Android app uses anon key)
alter table door_status_values enable row level security;
create policy "Anyone can read door_status_values"
  on door_status_values for select using (true);
create policy "Admins can manage door_status_values"
  on door_status_values for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Global Messages ───────────────────────────────────────────────────────────
-- Admin-created banner messages shown to all users (or filtered by role).
-- Dismissed per-user via dismissed_by array.

create table if not exists global_messages (
  id           serial primary key,
  message      text    not null,
  message_type text    not null default 'info',  -- info | warning | success | error
  created_by   uuid    references auth.users(id),
  created_at   timestamptz default now(),
  expires_at   timestamptz,                       -- null = never expires
  visible_roles text[] default array['admin','print_room','truck_mover','trainee','driver'],
  dismissed_by  uuid[] default array[]::uuid[],  -- user IDs who clicked dismiss
  is_active    boolean not null default true
);

alter table global_messages enable row level security;

-- Anyone authenticated can read active messages
create policy "Auth users can read global_messages"
  on global_messages for select using (auth.uid() is not null);

-- Only admins can insert/update/delete
create policy "Admins can manage global_messages"
  on global_messages for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Enable realtime so the banner updates live without page refresh
alter publication supabase_realtime add table global_messages;
alter publication supabase_realtime add table door_status_values;

-- ── RPC: dismiss_global_message ────────────────────────────────────────────
-- Records which users dismissed a message (for admin stats).
create or replace function dismiss_global_message(msg_id int)
returns void language plpgsql security definer as $$
begin
  update global_messages
  set dismissed_by = array_append(dismissed_by, auth.uid())
  where id = msg_id
    and not (auth.uid() = any(dismissed_by));
end;
$$;
