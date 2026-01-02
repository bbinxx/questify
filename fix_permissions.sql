-- ==========================================
-- QUICK FIX: Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: Drop and recreate schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Step 2: Grant permissions to all roles
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 3: After running this, run the entire supabase_setup.sql file
-- That will create all tables with proper permissions
