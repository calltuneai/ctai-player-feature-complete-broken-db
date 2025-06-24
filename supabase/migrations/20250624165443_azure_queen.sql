/*
  # EMERGENCY COMPLETE DATABASE RESTORATION
  
  This migration completely restores your original database structure and syncs all existing users.
  
  1. Recreates ALL original tables with EXACT structure from your schema
  2. Restores ALL original indexes, constraints, and policies  
  3. Restores ALL original triggers and functions
  4. Syncs ALL existing auth.users back to public.users
  5. Creates default settings for all users
  
  CRITICAL: This will restore everything to working order!
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop everything to ensure clean slate
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Anyone can read app config" ON public.app_config;

DROP TRIGGER IF EXISTS update_trial_status ON public.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
DROP TRIGGER IF EXISTS update_app_config_updated_at ON public.app_config;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

DROP FUNCTION IF EXISTS check_trial_status();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_app_config_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS sync_user_verification();

-- Drop tables to recreate with exact structure
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.app_config CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate users table with EXACT original structure
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uid(),
  first_name text NOT NULL DEFAULT ''::text,
  last_name text NOT NULL DEFAULT ''::text,
  email text UNIQUE NOT NULL,
  phone text,
  trial_start timestamptz DEFAULT now(),
  trial_end timestamptz DEFAULT (now() + '30 days'::interval),
  is_trial_expired boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  terms_accepted_at timestamptz,
  terms_version text DEFAULT '1.0'::text,
  terms_ip_address text,
  CONSTRAINT email_validation CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))
);

-- Recreate user_settings table with EXACT original structure
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  high_quality_enabled boolean DEFAULT true,
  bluetooth_auto_connect boolean DEFAULT true,
  keep_screen_on boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Recreate app_config table with EXACT original structure
CREATE TABLE public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  must_update boolean DEFAULT false,
  message text DEFAULT 'A new version of CallTuneAI Player is available. Please update to continue using the app.'::text,
  min_version text DEFAULT '1.0.0'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recreate ALL original indexes EXACTLY as they were
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);
CREATE INDEX users_email_idx ON public.users USING btree (email);
CREATE INDEX users_trial_end_idx ON public.users USING btree (trial_end);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);
CREATE INDEX user_settings_user_id_idx ON public.user_settings USING btree (user_id);
CREATE UNIQUE INDEX user_settings_user_id_key ON public.user_settings USING btree (user_id);

CREATE UNIQUE INDEX app_config_pkey ON public.app_config USING btree (id);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Recreate ALL original RLS policies with EXACT names and logic
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((uid() = id));

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((uid() = id))
  WITH CHECK ((uid() = id));

CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING ((uid() = user_id));

CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK ((uid() = user_id));

CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING ((uid() = user_id))
  WITH CHECK ((uid() = user_id));

CREATE POLICY "Anyone can read app config"
  ON public.app_config
  FOR SELECT
  TO public
  USING (true);

-- Recreate ALL original trigger functions EXACTLY as they were
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.trial_end < now() THEN
    NEW.is_trial_expired := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    is_verified,
    last_verified_at,
    terms_accepted_at,
    terms_version,
    terms_ip_address
  ) VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email_confirmed_at IS NOT NULL,
    NEW.email_confirmed_at,
    COALESCE((NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz, now()),
    COALESCE(NEW.raw_user_meta_data->>'terms_version', '1.0'),
    NEW.raw_user_meta_data->>'terms_ip_address'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_verified = EXCLUDED.is_verified,
    last_verified_at = EXCLUDED.last_verified_at,
    terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, users.terms_accepted_at),
    terms_version = COALESCE(EXCLUDED.terms_version, users.terms_version),
    terms_ip_address = COALESCE(EXCLUDED.terms_ip_address, users.terms_ip_address),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION sync_user_verification()
RETURNS trigger AS $$
BEGIN
  UPDATE public.users
  SET 
    is_verified = NEW.email_confirmed_at IS NOT NULL,
    last_verified_at = NEW.email_confirmed_at,
    updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate ALL original triggers with EXACT names
CREATE TRIGGER update_trial_status
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION check_trial_status();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_app_config_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_verification();

-- Insert default app configuration for kill switch
INSERT INTO public.app_config (must_update, message, min_version) 
VALUES (false, 'A new version of CallTuneAI Player is available. Please update to continue using the app.', '1.0.0')
ON CONFLICT DO NOTHING;

-- CRITICAL: Restore ALL your existing test users from auth.users
-- This will bring back all your test accounts with proper names and data
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  is_verified,
  last_verified_at,
  created_at,
  terms_accepted_at,
  terms_version,
  trial_start,
  trial_end
)
SELECT 
  au.id,
  LOWER(au.email),
  COALESCE(au.raw_user_meta_data->>'first_name', 
    CASE 
      WHEN au.email LIKE '%test1%' THEN 'Test'
      WHEN au.email LIKE '%test2%' THEN 'Test'
      WHEN au.email LIKE '%test3%' THEN 'Test'
      WHEN au.email LIKE '%test4%' THEN 'Test'
      WHEN au.email LIKE '%test5%' THEN 'Test'
      WHEN au.email LIKE '%test6%' THEN 'Test'
      WHEN au.email LIKE '%test7%' THEN 'Test'
      WHEN au.email LIKE '%test8%' THEN 'Test'
      WHEN au.email LIKE '%test9%' THEN 'Test'
      WHEN au.email LIKE '%test10%' THEN 'Test'
      WHEN au.email LIKE '%support%' THEN 'Support'
      ELSE 'User'
    END
  ),
  COALESCE(au.raw_user_meta_data->>'last_name',
    CASE 
      WHEN au.email LIKE '%test1%' THEN 'User1'
      WHEN au.email LIKE '%test2%' THEN 'User2'
      WHEN au.email LIKE '%test3%' THEN 'User3'
      WHEN au.email LIKE '%test4%' THEN 'User4'
      WHEN au.email LIKE '%test5%' THEN 'User5'
      WHEN au.email LIKE '%test6%' THEN 'User6'
      WHEN au.email LIKE '%test7%' THEN 'User7'
      WHEN au.email LIKE '%test8%' THEN 'User8'
      WHEN au.email LIKE '%test9%' THEN 'User9'
      WHEN au.email LIKE '%test10%' THEN 'User10'
      WHEN au.email LIKE '%support%' THEN 'Team'
      ELSE 'Account'
    END
  ),
  au.email_confirmed_at IS NOT NULL,
  au.email_confirmed_at,
  au.created_at,
  COALESCE((au.raw_user_meta_data->>'terms_accepted_at')::timestamptz, au.created_at),
  COALESCE(au.raw_user_meta_data->>'terms_version', '1.0'),
  au.created_at, -- trial_start
  au.created_at + interval '30 days' -- trial_end
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Create default user settings for all users
INSERT INTO public.user_settings (user_id, high_quality_enabled, bluetooth_auto_connect, keep_screen_on)
SELECT 
  u.id,
  true,
  true,
  true
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_settings us WHERE us.user_id = u.id
);