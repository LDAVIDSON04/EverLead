-- Verification Query: Check if critical indexes exist
-- Run this in Supabase SQL Editor to verify the migration was applied

SELECT 
    tablename,
    indexname,
    CASE 
        WHEN indexname IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'leads', 'appointments')
  AND indexname IN (
    'idx_profiles_agent_province',
    'idx_leads_province',
    'idx_leads_city',
    'idx_leads_assigned_agent_id',
    'idx_leads_province_assigned',
    'idx_leads_available_province',
    'idx_appointments_agent_id',
    'idx_appointments_agent_status_date',
    'idx_profiles_role_approval',
    'idx_profiles_agent_location'
  )
ORDER BY tablename, indexname;

-- Expected Result: You should see 10 rows (one for each index)
-- If you see fewer than 10 rows, some indexes are missing and you need to run the migration

-- Additional check: List all indexes on these tables (to see what else exists)
SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'leads', 'appointments')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

