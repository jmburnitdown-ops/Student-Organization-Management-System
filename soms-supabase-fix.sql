-- ============================================================
--  SOMS - HOTFIX: Missing users.password and auth compatibility
--  Run this in Supabase SQL Editor if register/login fails
-- ============================================================

SET search_path TO public;

-- Ensure users table exists
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add required auth columns (safe for existing DBs)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'STUDENT';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill not-null fields
UPDATE public.users SET password = '' WHERE password IS NULL;
UPDATE public.users SET first_name = '' WHERE first_name IS NULL;
UPDATE public.users SET last_name = '' WHERE last_name IS NULL;
UPDATE public.users SET role = 'STUDENT' WHERE role IS NULL;

ALTER TABLE public.users ALTER COLUMN password SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;

-- Normalize role values and constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (role IN ('STUDENT', 'ADMIN'));

-- Optional unique constraint on student_id (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND indexname = 'users_student_id_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX users_student_id_unique_idx
      ON public.users(student_id)
      WHERE student_id IS NOT NULL;
  END IF;
END
$$;
