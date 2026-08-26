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
            'admin@mtslogistics.com.ar',
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

-- Seed default Clients (Clientes con días de vencimiento)
INSERT INTO public.clients (company_name, tax_id, billing_email, phone_number, payment_due_days, is_active)
VALUES 
    ('CAT ARGENTINA SA', '30-70812345-1', 'facturacion@catargentina.com.ar', '+54 11 4300-1111', 30, true),
    ('DELTA DOCK SA', '30-70987654-2', 'administracion@deltadock.com.ar', '+54 11 4300-2222', 15, true),
    ('COOPTACORD', '30-71122334-3', 'finanzas@cooptacord.com.ar', '+54 11 4300-3333', 7, true),
    ('SERGIO DANCHUK', '20-22334455-4', 'sdanchuk@danchuk.com.ar', '+54 11 4300-4444', 15, true)
ON CONFLICT (tax_id) DO UPDATE SET 
    company_name = EXCLUDED.company_name,
    payment_due_days = EXCLUDED.payment_due_days;

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

-- Seed default Locations (Ubicaciones / Lugares de Trabajo)
INSERT INTO public.locations (code, name, port_city, status)
VALUES 
    ('LOC-001', 'Terminal Muelle Norte', 'Puerto Buenos Aires', 'active'),
    ('LOC-002', 'Muelle Fiscal Sur', 'Puerto Dock Sud', 'active')
ON CONFLICT (code) DO NOTHING;

-- Seed default Employees (Personal)
DO $$
DECLARE
    encargado_id UUID;
    apuntador_id UUID;
BEGIN
    SELECT id INTO encargado_id FROM public.positions WHERE name = 'Encargado' LIMIT 1;
    SELECT id INTO apuntador_id FROM public.positions WHERE name = 'Apuntador' LIMIT 1;

    INSERT INTO public.employees (national_id, file_number, tax_id, full_name, default_position_id, phone_number, status)
    VALUES 
        ('34567890', 'LEG-1042', '20-34567890-9', 'BRITES LUCAS DAVID', encargado_id, '+54 11 5555-0101', 'active'),
        ('35678901', 'LEG-1043', '20-35678901-9', 'BELO BRUNO JOAQUIN', apuntador_id, '+54 11 5555-0102', 'active'),
        ('36789012', 'LEG-1044', '27-36789012-4', 'SUAREZ ROMINA', apuntador_id, '+54 11 5555-0103', 'active'),
        ('37890123', 'LEG-1045', '27-37890123-4', 'MORALES ROSANA LORENA', apuntador_id, '+54 11 5555-0104', 'active'),
        ('38901234', 'LEG-1046', '27-38901234-4', 'ARENA CECILIA', apuntador_id, '+54 11 5555-0105', 'active')
    ON CONFLICT (national_id) DO NOTHING;

    -- Seed Client Commercial Rates (Tarifario Comercial: Normal, 50%, 100%)
    INSERT INTO public.client_position_rates (client_id, position_id, hour_type_id, hourly_rate, effective_from)
    SELECT 
        c.id as client_id,
        p.id as position_id,
        ht.id as hour_type_id,
        CASE 
            WHEN p.name = 'Encargado' AND ht.code = 'REGULAR' THEN 10777.06
            WHEN p.name = 'Encargado' AND ht.code = 'OVERTIME_50' THEN 16165.60
            WHEN p.name = 'Encargado' AND ht.code = 'OVERTIME_100' THEN 21554.13
            WHEN p.name = 'Apuntador' AND ht.code = 'REGULAR' THEN 8983.68
            WHEN p.name = 'Apuntador' AND ht.code = 'OVERTIME_50' THEN 13475.53
            WHEN p.name = 'Apuntador' AND ht.code = 'OVERTIME_100' THEN 17967.37
            ELSE 10000.00
        END as hourly_rate,
        CURRENT_DATE as effective_from
    FROM public.clients c
    CROSS JOIN public.positions p
    CROSS JOIN public.hour_types ht
    ON CONFLICT (client_id, position_id, hour_type_id, effective_from) DO UPDATE SET
        hourly_rate = EXCLUDED.hourly_rate;
END $$;



