-- Seed script for local Supabase development environment
-- Seed default Admin user into auth.users and auth.identities

DO $$
DECLARE
    admin_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    user_encrypted_password TEXT;
BEGIN
    -- Password hash for 'Admin123!' generated using pgcrypto extension
    user_encrypted_password := crypt('Admin123!', gen_salt('bf'));

    -- Insert Admin into auth.users if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_user_id) THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            admin_user_id,
            'authenticated',
            'authenticated',
            'admin@mtscaetano.com',
            user_encrypted_password,
            NOW(),
            '',
            '',
            '',
            '',
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Administrador General", "role": "admin"}',
            NOW(),
            NOW(),
            FALSE
        );

        -- Insert identity into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at,
            provider_id
        ) VALUES (
            gen_random_uuid(),
            admin_user_id,
            format('{"sub":"%s","email":"admin@mtscaetano.com"}', admin_user_id)::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW(),
            'admin@mtscaetano.com'
        );
    END IF;
END $$;

-- Seed default Positions (Puestos)
INSERT INTO public.positions (name, requires_vehicle_bonus)
VALUES 
    ('Encargado', true),
    ('Apuntador', false)
ON CONFLICT (name) DO NOTHING;

-- Seed default Hour Types (Tipos de Hora)
INSERT INTO public.hour_types (code, description)
VALUES 
    ('REGULAR', 'Hora Normal'),
    ('OVERTIME_50', 'Hora Extra 50%'),
    ('OVERTIME_100', 'Hora Extra 100%')
ON CONFLICT (code) DO NOTHING;

-- Seed default Clients (Clientes)
INSERT INTO public.clients (company_name, tax_id, billing_email, phone_number, payment_due_days, is_active)
VALUES 
    ('Logística Sur S.A.', '30-71123456-8', 'facturacion@logisticasur.com', '+54 11 4321-8765', 30, true),
    ('Naviera del Puerto', '30-68987654-2', 'administracion@navieradelpuerto.com', '+54 11 5678-1234', 60, true),
    ('Distribuidora Central', '30-54321098-7', 'pagos@distribuidoracentral.com', '+54 11 8765-4321', 15, true)
ON CONFLICT (tax_id) DO NOTHING;


