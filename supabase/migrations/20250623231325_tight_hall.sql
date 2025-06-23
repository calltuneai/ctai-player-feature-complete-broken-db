/*
  # Add App Configuration Table

  1. New Tables
    - `app_config`
      - `id` (uuid, primary key)
      - `must_update` (boolean) - Kill switch flag
      - `message` (text) - Custom message to show users
      - `min_version` (text) - Minimum required version (optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_config` table
    - Add policy for public read access (no auth required)
    - Only admins can modify (handled outside app)

  3. Initial Data
    - Insert default config with kill switch disabled
*/

-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  must_update boolean DEFAULT false,
  message text DEFAULT 'A new version of CallTuneAI Player is available. Please update to continue using the app.',
  min_version text DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no authentication required)
CREATE POLICY "Anyone can read app config"
  ON app_config
  FOR SELECT
  TO public
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_app_config_updated_at();

-- Insert default configuration
INSERT INTO app_config (must_update, message, min_version) 
VALUES (false, 'A new version of CallTuneAI Player is available. Please update to continue using the app.', '1.0.0')
ON CONFLICT DO NOTHING;