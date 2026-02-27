-- Add email notification fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_email         BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notify_email_address TEXT        DEFAULT NULL;

-- Add email notification fields to truck_subscriptions
ALTER TABLE truck_subscriptions
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT FALSE;
