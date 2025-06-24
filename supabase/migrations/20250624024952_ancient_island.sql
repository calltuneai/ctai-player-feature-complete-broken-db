/*
  # Add User Sounds Storage

  1. New Tables
    - `user_sounds` - User-specific sound library
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text) - Sound name
      - `description` (text) - Sound description
      - `category` (text) - Sound category
      - `tags` (text[]) - Array of tags
      - `duration` (numeric) - Duration in seconds
      - `file_path` (text) - Path to file in Supabase Storage
      - `file_size` (bigint) - File size in bytes
      - `is_favorite` (boolean) - Favorite status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create storage bucket for user sound files
    - Enable RLS on storage bucket

  3. Security
    - Enable RLS on user_sounds table
    - Add policies for users to manage their own sounds
    - Add storage policies for user file access
*/

-- Create user_sounds table
CREATE TABLE IF NOT EXISTS user_sounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  tags text[] DEFAULT '{}',
  duration numeric NOT NULL DEFAULT 0,
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_sounds_user_id_idx ON user_sounds (user_id);
CREATE INDEX IF NOT EXISTS user_sounds_category_idx ON user_sounds (category);
CREATE INDEX IF NOT EXISTS user_sounds_created_at_idx ON user_sounds (created_at DESC);
CREATE INDEX IF NOT EXISTS user_sounds_is_favorite_idx ON user_sounds (is_favorite) WHERE is_favorite = true;

-- Enable RLS
ALTER TABLE user_sounds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_sounds table
CREATE POLICY "Users can view own sounds"
  ON user_sounds
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sounds"
  ON user_sounds
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sounds"
  ON user_sounds
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sounds"
  ON user_sounds
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for user sound files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-sounds', 'user-sounds', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can view own sound files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'user-sounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own sound files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-sounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own sound files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'user-sounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own sound files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-sounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add updated_at trigger
CREATE TRIGGER update_user_sounds_updated_at
  BEFORE UPDATE ON user_sounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();