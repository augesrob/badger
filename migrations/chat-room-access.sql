-- Add allowed_roles array to chat_rooms
-- null = no restriction (use old type/role_target logic)
-- array = only these roles can see the room (admin always sees everything)

alter table public.chat_rooms
  add column if not exists allowed_roles text[] default null;

alter table public.chat_rooms
  add column if not exists description text default null;
