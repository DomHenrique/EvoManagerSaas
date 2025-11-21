-- DB schema additions for EvoManager
-- Run this in your Supabase SQL editor or psql connected to your database.
-- Ensure the cryptographic extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- NOTE: Run this file in the Supabase SQL Editor (Project -> SQL) as an admin/service-role user.

-- Ensure profiles has necessary columns
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- If your project does not yet have a 'profiles' table (Supabase auth linked), you can create a minimal one for development:
CREATE TABLE IF NOT EXISTS profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE,
  full_name text,
  role text DEFAULT 'user',
  status text DEFAULT 'active',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Table to map which instances a user can view/manage
CREATE TABLE IF NOT EXISTS user_instances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  can_view boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, instance_name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_instances_user_id ON user_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_instances_instance_name ON user_instances(instance_name);
