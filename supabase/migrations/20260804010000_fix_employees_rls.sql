-- Grant table privileges to authenticated and anon roles for Supabase API access
-- RLS (Row Level Security) will enforce row-level filtering based on user roles and policies.
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Ensure default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated, anon;

-- Clean up any temporary fix policies if present
DROP POLICY IF EXISTS "Admins full access positions fix" ON public.positions;
DROP POLICY IF EXISTS "Admins full access employees fix" ON public.employees;
DROP POLICY IF EXISTS "Allow all on positions" ON public.positions;
DROP POLICY IF EXISTS "Allow all on employees" ON public.employees;
