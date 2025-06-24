/*
  # Restore Complete CallTuneAI Database Schema
  
  This migration restores the complete database schema that was accidentally removed.
  
  1. New Tables
    - `users` - User profiles with trial tracking and verification
    - `user_settings` - User preferences and app settings  
    - `app_config` - App configuration and kill switch
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
  
  3. Functions & Triggers
    - Auto-update timestamps
    - Trial status management
    - User creation and verification sync
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects to avoid conflicts
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

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text,
  trial_start timestamptz DEFAULT now(),
  trial_end timestamptz DEFAULT (now() + interval '30 days'),
  is_trial_expired boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  terms_accepted_at timestamptz,
  terms_version text DEFAULT '1.0',
  terms_ip_address text,
  CONSTRAINT email_validation CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  high_quality_enabled boolean DEFAULT true,
  bluetooth_auto_connect boolean DEFAULT true,
  keep_screen_on boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create app_config table
CREATE TABLE IF NOT EXISTS public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  must_update boolean DEFAULT false,
  message text DEFAULT 'A new version of CallTuneAI Player is available. Please update to continue using the app.',
  min_version text DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_trial_end_idx ON public.users (trial_end);
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings (user_id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_settings table
CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for app_config table
CREATE POLICY "Anyone can read app config"
  ON public.app_config
  FOR SELECT
  TO public
  USING (true);

-- Create function to check and update trial status
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.trial_end < now() THEN
    NEW.is_trial_expired := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update app_config updated_at
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user creation
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

-- Create function to sync verification status
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

-- Create triggers
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

-- Insert default app configuration
INSERT INTO public.app_config (must_update, message, min_version) 
VALUES (false, 'A new version of CallTuneAI Player is available. Please update to continue using the app.', '1.0.0')
ON CONFLICT DO NOTHING;

-- Sync existing auth users to public.users table
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  is_verified,
  last_verified_at,
  created_at
)
SELECT 
  au.id,
  LOWER(au.email),
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  au.email_confirmed_at IS NOT NULL,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);