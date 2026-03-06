-- Gmail OAuth tokens table
-- Stores the refresh token so it can be updated from the admin UI
-- without needing a Vercel redeployment.

CREATE TABLE IF NOT EXISTS gmail_tokens (
  id            INT PRIMARY KEY DEFAULT 1,
  refresh_token TEXT NOT NULL,
  access_token  TEXT,
  token_expiry  TIMESTAMPTZ,
  authorized_at TIMESTAMPTZ DEFAULT now(),
  authorized_by TEXT,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Only one row ever
ALTER TABLE gmail_tokens DROP CONSTRAINT IF EXISTS gmail_tokens_single_row;
ALTER TABLE gmail_tokens ADD CONSTRAINT gmail_tokens_single_row CHECK (id = 1);

-- RLS: only service role can read/write
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

-- No public access — only the server-side API (service key) can touch this table
-- (No policies needed; service role bypasses RLS)
