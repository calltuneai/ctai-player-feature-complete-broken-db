-- Quick check to see what we have in the database right now
-- This will tell us if everything is actually working

-- 1. Check if all tables exist and have data
SELECT 'users' as table_name, count(*) as row_count FROM public.users
UNION ALL
SELECT 'user_settings' as table_name, count(*) as row_count FROM public.user_settings  
UNION ALL
SELECT 'app_config' as table_name, count(*) as row_count FROM public.app_config;

-- 2. Check if your test users are there
SELECT 
  email,
  first_name,
  last_name,
  is_verified,
  created_at
FROM public.users
ORDER BY created_at
LIMIT 10;

-- 3. Check the kill switch status
SELECT must_update, message, min_version FROM public.app_config LIMIT 1;