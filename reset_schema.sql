-- ==========================================
-- RESET SCRIPT - Run this in Supabase SQL Editor
-- ==========================================
-- WARNING: This will DELETE ALL DATA!
-- ==========================================

-- Step 1: Drop existing schema
DROP SCHEMA IF EXISTS public CASCADE;

-- Step 2: Recreate schema with permissions
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Step 3: Now run the main setup file
-- After running this, execute supabase_setup.sql in the SQL Editor
