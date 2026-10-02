-- Migration: User management, profiles status and strict role-based access control
-- Description: Adds is_active and email columns to profiles, updates trigger and get_user_role function to enforce immediate blocking for inactive accounts, and establishes admin management policies.

-- 1. Add is_active and email to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Update handle_new_user trigger function to capture email and is_active
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'admin'),
        COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true)
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Backfill email for existing profiles if missing
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        UPDATE public.profiles p
        SET email = u.email
        FROM auth.users u
        WHERE p.id = u.id AND p.email IS NULL;
    END IF;
END $$;

-- 5. Update get_user_role helper to IMMEDIATELY return NULL if is_active is false
-- This enforces immediate access cutoff across all RLS-protected tables
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.app_role AS $$
    SELECT role FROM public.profiles WHERE id = user_id AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 6. Add RLS Policies for Profiles table
-- Admins have full access to view, update, insert, delete profiles
DROP POLICY IF EXISTS "Profiles read access" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Admins full access profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- 7. Grant SELECT on catalog tables for accounting_auditor so read-only reports work smoothly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'positions' AND policyname = 'Accounting auditor read positions'
    ) THEN
        CREATE POLICY "Accounting auditor read positions" ON public.positions
            FOR SELECT TO authenticated
            USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'hour_types' AND policyname = 'Accounting auditor read hour_types'
    ) THEN
        CREATE POLICY "Accounting auditor read hour_types" ON public.hour_types
            FOR SELECT TO authenticated
            USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'client_position_rates' AND policyname = 'Accounting auditor read client_position_rates'
    ) THEN
        CREATE POLICY "Accounting auditor read client_position_rates" ON public.client_position_rates
            FOR SELECT TO authenticated
            USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'union_bonus_scales' AND policyname = 'Accounting auditor read union_bonus_scales'
    ) THEN
        CREATE POLICY "Accounting auditor read union_bonus_scales" ON public.union_bonus_scales
            FOR SELECT TO authenticated
            USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
    END IF;
END $$;
