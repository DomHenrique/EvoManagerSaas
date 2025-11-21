-- Login attempts logging and lockout helpers for EvoManager
-- Run this in Supabase SQL editor as an admin/service-role user

CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  email text,
  ip text,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created_at ON login_attempts(email, created_at);

-- Function to check if login attempts are allowed for the given email
-- Returns true if allowed, false if blocked
CREATE OR REPLACE FUNCTION can_attempt_login(target_email text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  -- Block if there are >= 5 failed attempts in the last 15 minutes
  SELECT (
    (SELECT COUNT(1) FROM login_attempts WHERE email = target_email AND success = false AND created_at > now() - interval '15 minutes')
    < 5
  );
$$;

-- For development convenience, allow anonymous inserts/selects on login_attempts so client can log attempts.
-- WARNING: In production, prefer server-side logging and stricter RLS policies.

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert_login_attempts" ON login_attempts
  FOR INSERT
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_select_login_attempts" ON login_attempts
  FOR SELECT
  USING (true);

-- Note: Adjust policies for production: only server/service role should INSERT, and SELECT should be restricted to admins.
