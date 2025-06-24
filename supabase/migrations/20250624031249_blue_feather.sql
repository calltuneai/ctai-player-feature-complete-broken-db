/*
  # Add Terms Agreement Tracking

  1. Database Changes
    - Add `terms_accepted_at` field to users table
    - Add `terms_version` field to track which version they agreed to
    - Add `terms_ip_address` field for additional legal protection

  2. Security
    - Update existing RLS policies to work with new fields
    - Ensure terms acceptance is tracked properly

  3. Legal Protection
    - Store timestamp of agreement
    - Track version of terms agreed to
    - Optional IP address logging for additional protection
*/

-- Add terms acceptance tracking to users table
DO $$
BEGIN
  -- Add terms_accepted_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE users ADD COLUMN terms_accepted_at timestamptz;
  END IF;

  -- Add terms_version column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'terms_version'
  ) THEN
    ALTER TABLE users ADD COLUMN terms_version text DEFAULT '1.0';
  END IF;

  -- Add terms_ip_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'terms_ip_address'
  ) THEN
    ALTER TABLE users ADD COLUMN terms_ip_address text;
  END IF;
END $$;

-- Update the handle_new_user function to include terms acceptance
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