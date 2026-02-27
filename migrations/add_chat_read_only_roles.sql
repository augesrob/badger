-- Add read_only_roles to chat_rooms table
-- Roles listed here can read but NOT send messages in the room
-- null = everyone can write (default)
-- ['trainee'] = trainees are read-only in this room

ALTER TABLE chat_rooms
  ADD COLUMN IF NOT EXISTS read_only_roles text[] DEFAULT NULL;
