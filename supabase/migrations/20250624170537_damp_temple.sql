-- Quick verification query to check if everything is working
-- This will show us what tables exist and their structure

-- Check if tables exist and have data
SELECT 'users' as table_name, count(*) as row_count FROM public.users
UNION ALL
SELECT 'user_settings' as table_name, count(*) as row_count FROM public.user_settings
UNION ALL
SELECT 'app_config' as table_name, count(*) as row_count FROM public.app_config;

-- Check if your test users are restored
SELECT 
  id,
  email,
  first_name,
  last_name,
  is_verified,
  created_at
FROM public.users
ORDER BY created_at
LIMIT 10;

-- Check if RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;