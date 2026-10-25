-- Seed script for local Supabase development environment (MTS Gestión Logística)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Seed default Admin user into auth.users and auth.identities
DO $$
DECLARE
    admin_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    user_encrypted_password TEXT;
BEGIN
    user_encrypted_password := extensions.crypt('Admin123!', extensions.gen_salt('bf'));

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
            format('{"sub":"%s","email":"admin@mtslogistics.com.ar"}', admin_user_id)::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW(),
            'admin@mtslogistics.com.ar'
        );
    END IF;
END $$;

-- 2. Seed Clients (Clientes con días de vencimiento)
INSERT INTO public.clients (company_name, tax_id, billing_email, phone_number, payment_due_days, is_active)
VALUES 
    ('CAT ARGENTINA SA', '30-70812345-1', 'facturacion@catargentina.com.ar', '+54 11 4300-1111', 30, true),
    ('DELTA DOCK SA', '30-70987654-2', 'administracion@deltadock.com.ar', '+54 11 4300-2222', 15, true),
    ('COOPTACORD', '30-71122334-3', 'finanzas@cooptacord.com.ar', '+54 11 4300-3333', 7, true),
    ('SERGIO DANCHUK', '20-22334455-4', 'sdanchuk@danchuk.com.ar', '+54 11 4300-4444', 15, true)
ON CONFLICT (tax_id) DO UPDATE SET 
    company_name = EXCLUDED.company_name,
    payment_due_days = EXCLUDED.payment_due_days;

-- 3. Seed Positions (Puestos) con Valores de Sueldo Oficiales (Excel Sueldos MTS)
INSERT INTO public.positions (name, requires_vehicle_bonus, hourly_rate_regular, hourly_rate_overtime_50, hourly_rate_overtime_100)
VALUES 
    ('Encargado', true, 10777.06, 16165.60, 21554.13),
    ('Apuntador', true, 8983.68, 13475.53, 17967.37)
ON CONFLICT (name) DO UPDATE SET
    requires_vehicle_bonus = EXCLUDED.requires_vehicle_bonus,
    hourly_rate_regular = EXCLUDED.hourly_rate_regular,
    hourly_rate_overtime_50 = EXCLUDED.hourly_rate_overtime_50,
    hourly_rate_overtime_100 = EXCLUDED.hourly_rate_overtime_100;

-- 4. Seed Hour Types (Tipos de Hora)
INSERT INTO public.hour_types (code, description)
VALUES 
    ('REGULAR', 'Hora Normal'),
    ('OVERTIME_50', 'Hora Extra 50%'),
    ('OVERTIME_100', 'Hora Extra 100%')
ON CONFLICT (code) DO NOTHING;

-- 5. Seed Locations (Ubicaciones / Lugares de Trabajo)
INSERT INTO public.locations (code, name, port_city, status)
VALUES 
    ('LOC-001', 'Terminal Zárate (Muelle)', 'Zárate', 'active'),
    ('LOC-002', 'Plazoleta Fiscal TZ', 'Zárate', 'active'),
    ('LOC-003', 'Depósito Nacional Delta Dock', 'Lima / Zárate', 'active'),
    ('LOC-004', 'Depósito Fiscal Delta Dock', 'Lima / Zárate', 'active')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    port_city = EXCLUDED.port_city;

-- 6. Seed Employees, Commercial Rates, Operations, Approved Shifts & Sample Proformas
DO $$
DECLARE
    admin_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    encargado_id UUID;
    apuntador_id UUID;
    cat_id UUID;
    dd_id UUID;
    coop_id UUID;
    danchuk_id UUID;
    loc_muelle UUID;
    loc_pf UUID;
    loc_dep_nac UUID;
    loc_dep_fis UUID;
    emp_brites UUID;
    emp_belo UUID;
    emp_suarez UUID;
    emp_morales UUID;
    emp_arena UUID;
    emp_gomez UUID;
    emp_perez UUID;
    emp_gauna UUID;
    emp_martinoli UUID;
    emp_sellanes UUID;
    log_id UUID;
    v_date DATE;
    v_dow INT;
    v_fis_emp UUID;
BEGIN
    SELECT id INTO encargado_id FROM public.positions WHERE name = 'Encargado' LIMIT 1;
    SELECT id INTO apuntador_id FROM public.positions WHERE name = 'Apuntador' LIMIT 1;

    SELECT id INTO cat_id FROM public.clients WHERE company_name ILIKE '%CAT%' LIMIT 1;
    SELECT id INTO dd_id FROM public.clients WHERE company_name ILIKE '%DELTA DOCK%' LIMIT 1;
    SELECT id INTO coop_id FROM public.clients WHERE company_name ILIKE '%COOPTACORD%' LIMIT 1;
    SELECT id INTO danchuk_id FROM public.clients WHERE company_name ILIKE '%DANCHUK%' LIMIT 1;

    SELECT id INTO loc_muelle FROM public.locations WHERE code = 'LOC-001' LIMIT 1;
    SELECT id INTO loc_pf FROM public.locations WHERE code = 'LOC-002' LIMIT 1;
    SELECT id INTO loc_dep_nac FROM public.locations WHERE code = 'LOC-003' LIMIT 1;
    SELECT id INTO loc_dep_fis FROM public.locations WHERE code = 'LOC-004' LIMIT 1;

    -- 6a. Employees
    INSERT INTO public.employees (national_id, file_number, tax_id, full_name, default_position_id, phone_number, status)
    VALUES 
        ('34567890', 'LEG-1042', '20-34567890-9', 'BRITES LUCAS DAVID', encargado_id, '+54 11 5555-0101', 'active'),
        ('35678901', 'LEG-1043', '20-35678901-9', 'BELO BRUNO JOAQUIN', apuntador_id, '+54 11 5555-0102', 'active'),
        ('36789012', 'LEG-1044', '27-36789012-4', 'SUAREZ ROMINA', apuntador_id, '+54 11 5555-0103', 'active'),
        ('37890123', 'LEG-1045', '27-37890123-4', 'MORALES ROSANA LORENA', apuntador_id, '+54 11 5555-0104', 'active'),
        ('38901234', 'LEG-1046', '27-38901234-4', 'ARENA CECILIA', apuntador_id, '+54 11 5555-0105', 'active'),
        ('39012345', 'LEG-1047', '20-39012345-9', 'GOMEZ MATIAS', apuntador_id, '+54 11 5555-0106', 'active'),
        ('40123456', 'LEG-1048', '20-40123456-9', 'PEREZ HERNAN', apuntador_id, '+54 11 5555-0107', 'active'),
        ('41234567', 'LEG-1049', '20-41234567-9', 'GAUNA EDUARDO DANIEL', apuntador_id, '+54 11 5555-0108', 'active'),
        ('42345678', 'LEG-1050', '20-42345678-9', 'MARTINOLI DIEGO RICARDO', apuntador_id, '+54 11 5555-0109', 'active'),
        ('43456789', 'LEG-1051', '27-43456789-4', 'SELLANES MARIA ELENA', apuntador_id, '+54 11 5555-0110', 'active')
    ON CONFLICT (national_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        default_position_id = EXCLUDED.default_position_id;

    SELECT id INTO emp_brites FROM public.employees WHERE national_id = '34567890' LIMIT 1;
    SELECT id INTO emp_belo FROM public.employees WHERE national_id = '35678901' LIMIT 1;
    SELECT id INTO emp_suarez FROM public.employees WHERE national_id = '36789012' LIMIT 1;
    SELECT id INTO emp_morales FROM public.employees WHERE national_id = '37890123' LIMIT 1;
    SELECT id INTO emp_arena FROM public.employees WHERE national_id = '38901234' LIMIT 1;
    SELECT id INTO emp_gomez FROM public.employees WHERE national_id = '39012345' LIMIT 1;
    SELECT id INTO emp_perez FROM public.employees WHERE national_id = '40123456' LIMIT 1;
    SELECT id INTO emp_gauna FROM public.employees WHERE national_id = '41234567' LIMIT 1;
    SELECT id INTO emp_martinoli FROM public.employees WHERE national_id = '42345678' LIMIT 1;
    SELECT id INTO emp_sellanes FROM public.employees WHERE national_id = '43456789' LIMIT 1;

    -- 6b. Client Commercial Hourly Rates (Tarifas Comerciales de Facturación Excel Octubre 2026)
    INSERT INTO public.client_position_rates (client_id, position_id, hour_type_id, hourly_rate, effective_from)
    SELECT 
        c.id as client_id,
        p.id as position_id,
        ht.id as hour_type_id,
        CASE 
            WHEN p.name = 'Encargado' AND ht.code = 'REGULAR' THEN 14957.99
            WHEN p.name = 'Encargado' AND ht.code = 'OVERTIME_50' THEN 22436.99
            WHEN p.name = 'Encargado' AND ht.code = 'OVERTIME_100' THEN 29915.98
            WHEN p.name = 'Apuntador' AND ht.code = 'REGULAR' THEN 12396.95
            WHEN p.name = 'Apuntador' AND ht.code = 'OVERTIME_50' THEN 18595.44
            WHEN p.name = 'Apuntador' AND ht.code = 'OVERTIME_100' THEN 24793.92
            ELSE 12396.95
        END as hourly_rate,
        '2026-01-01'::DATE as effective_from
    FROM public.clients c
    CROSS JOIN public.positions p
    CROSS JOIN public.hour_types ht
    ON CONFLICT (client_id, position_id, hour_type_id, effective_from) DO UPDATE SET
        hourly_rate = EXCLUDED.hourly_rate;

    -- 6c. Client Operations Catalog (Buques, Plazoletas y Depósitos)
    INSERT INTO public.client_operations (client_id, name, operation_type)
    VALUES
        (cat_id, 'GOODWOOD', 'vessel'),
        (cat_id, 'BRASILIA HWY', 'vessel'),
        (cat_id, 'INQUEBRANTABLE', 'vessel'),
        (cat_id, 'PLAZOLETA FISCAL', 'yard'),
        (cat_id, 'INSPECCIONES ESPECIALES', 'yard'),
        (dd_id, 'DEPÓSITO NACIONAL', 'deposit'),
        (dd_id, 'DEPÓSITO FISCAL', 'deposit'),
        (dd_id, 'DEPÓSITO ARROZ', 'deposit'),
        (coop_id, 'APUNTADORES PLAZ. FISCAL (10%)', 'yard'),
        (danchuk_id, 'PLAZOLETA FISCAL TERMINAL ZÁRATE', 'general')
    ON CONFLICT (client_id, name) DO UPDATE SET
        is_active = true,
        operation_type = EXCLUDED.operation_type;

    -- 6d. Union Bonus Scales
    DELETE FROM public.union_bonus_scales;
    INSERT INTO public.union_bonus_scales (min_vehicles, max_vehicles, bonus_amount, effective_from)
    VALUES
        (0, 1499, 88200.48, '2026-01-01'),
        (1500, 1999, 102015.99, '2026-01-01'),
        (2000, 2499, 118540.55, '2026-01-01'),
        (2500, 2999, 135065.11, '2026-01-01'),
        (3000, 3499, 143503.04, '2026-01-01'),
        (3500, 99999, 155000.00, '2026-01-01');

    -- 6e. Master Variables
    INSERT INTO public.master_variables (code, name, numeric_value, is_active)
    VALUES 
        ('OVERDUE_CADENCE_DAYS', 'Cadencia de Reclamo Factura Vencida (Días)', 3.0, true)
    ON CONFLICT (code) DO NOTHING;

    -- =========================================================================
    -- 7. SEED APPROVED DAILY WORK LOGS & STAFF ENTRIES (OCTUBRE 2026 & AGOSTO 2026)
    -- =========================================================================
    DELETE FROM public.daily_work_logs;

    -- -------------------------------------------------------------------------
    -- CASO 1: BUQUE "GOODWOOD" (CAT ARGENTINA SA, 11 al 13 OCTUBRE 2026)
    -- -------------------------------------------------------------------------
    INSERT INTO public.daily_work_logs (
        work_date, client_id, location_id, vessel_name,
        total_vehicles_handled, vehicles_regular_time, vehicles_overtime,
        is_export_day, logged_by
    ) VALUES (
        '2026-10-11', cat_id, loc_muelle, 'GOODWOOD',
        594, 212, 382, false, admin_id
    ) RETURNING id INTO log_id;

    INSERT INTO public.daily_staff_entries (
        daily_work_log_id, employee_id, position_id,
        shift_start_date, shift_start_time, shift_end_date, shift_end_time,
        regular_hours, overtime_50_hours, overtime_100_hours,
        shuttles_count, meal_allowance_count, bonus_applied_amount, is_approved, approved_at, approved_by
    ) VALUES
        (log_id, emp_brites, encargado_id, '2026-10-11', '08:00', '2026-10-11', '20:00', 0, 0, 12, 1.0, 1, 88200.48, true, NOW(), admin_id),
        (log_id, emp_belo, apuntador_id, '2026-10-11', '08:00', '2026-10-11', '20:00', 0, 0, 12, 1.0, 1, 88200.48, true, NOW(), admin_id),
        (log_id, emp_suarez, apuntador_id, '2026-10-11', '08:00', '2026-10-11', '20:00', 0, 0, 12, 1.0, 1, 88200.48, true, NOW(), admin_id),
        (log_id, emp_morales, apuntador_id, '2026-10-11', '20:00', '2026-10-12', '06:00', 0, 0, 10, 1.0, 1, 88200.48, true, NOW(), admin_id),
        (log_id, emp_arena, apuntador_id, '2026-10-11', '20:00', '2026-10-12', '06:00', 0, 0, 10, 1.0, 1, 88200.48, true, NOW(), admin_id);

    INSERT INTO public.daily_work_logs (
        work_date, client_id, location_id, vessel_name,
        total_vehicles_handled, vehicles_regular_time, vehicles_overtime,
        is_export_day, logged_by
    ) VALUES (
        '2026-10-12', cat_id, loc_muelle, 'GOODWOOD',
        223, 100, 123, false, admin_id
    ) RETURNING id INTO log_id;

    INSERT INTO public.daily_staff_entries (
        daily_work_log_id, employee_id, position_id,
        shift_start_date, shift_start_time, shift_end_date, shift_end_time,
        regular_hours, overtime_50_hours, overtime_100_hours,
        shuttles_count, meal_allowance_count, bonus_applied_amount, is_approved, approved_at, approved_by
    ) VALUES
        (log_id, emp_brites, encargado_id, '2026-10-12', '08:00', '2026-10-12', '18:00', 8, 2, 0, 1.0, 1, 88200.48, true, NOW(), admin_id),
        (log_id, emp_gomez, apuntador_id, '2026-10-12', '08:00', '2026-10-12', '18:00', 8, 2, 0, 1.0, 1, 88200.48, true, NOW(), admin_id),
        (log_id, emp_perez, apuntador_id, '2026-10-12', '08:00', '2026-10-12', '18:00', 8, 2, 0, 1.0, 1, 88200.48, true, NOW(), admin_id);

    -- -------------------------------------------------------------------------
    -- CASO 2: PLAZOLETA FISCAL + INSPECCIONES ESPECIALES (CAT ARGENTINA SA, 01-15 OCT 2026)
    -- -------------------------------------------------------------------------
    INSERT INTO public.daily_work_logs (
        work_date, client_id, location_id, vessel_name,
        total_vehicles_handled, is_export_day, logged_by
    ) VALUES (
        '2026-10-01', cat_id, loc_pf, 'PLAZOLETA FISCAL',
        0, false, admin_id
    ) RETURNING id INTO log_id;

    INSERT INTO public.daily_staff_entries (
        daily_work_log_id, employee_id, position_id,
        shift_start_date, shift_start_time, shift_end_date, shift_end_time,
        regular_hours, overtime_50_hours, overtime_100_hours,
        shuttles_count, meal_allowance_count, is_approved, approved_at, approved_by
    ) VALUES
        (log_id, emp_brites, encargado_id, '2026-10-01', '08:00', '2026-10-01', '18:00', 8, 2, 0, 2.0, 0, true, NOW(), admin_id),
        (log_id, emp_belo, apuntador_id, '2026-10-01', '08:00', '2026-10-01', '18:00', 8, 2, 0, 0, 0, true, NOW(), admin_id),
        (log_id, emp_suarez, apuntador_id, '2026-10-01', '08:00', '2026-10-01', '18:00', 8, 2, 0, 0, 0, true, NOW(), admin_id),
        (log_id, emp_morales, apuntador_id, '2026-10-01', '08:00', '2026-10-01', '18:00', 8, 2, 0, 0, 0, true, NOW(), admin_id);

    -- Día de EXPO en Plazoleta Fiscal (90% CAT / 10% Cooptacord)
    INSERT INTO public.daily_work_logs (
        work_date, client_id, location_id, vessel_name,
        total_vehicles_handled, is_export_day, logged_by
    ) VALUES (
        '2026-10-05', cat_id, loc_pf, 'PLAZOLETA FISCAL',
        0, true, admin_id
    ) RETURNING id INTO log_id;

    INSERT INTO public.daily_staff_entries (
        daily_work_log_id, employee_id, position_id,
        shift_start_date, shift_start_time, shift_end_date, shift_end_time,
        regular_hours, overtime_50_hours, overtime_100_hours,
        shuttles_count, meal_allowance_count, is_approved, approved_at, approved_by
    ) VALUES
        (log_id, emp_arena, apuntador_id, '2026-10-05', '08:00', '2026-10-05', '18:00', 8, 2, 0, 2.0, 0, true, NOW(), admin_id),
        (log_id, emp_gomez, apuntador_id, '2026-10-05', '08:00', '2026-10-05', '18:00', 8, 2, 0, 2.0, 0, true, NOW(), admin_id);

    -- Inspecciones Especiales dentro de la quincena de Plazoleta Fiscal (16 hs norm + 13 hs 50%)
    INSERT INTO public.daily_work_logs (
        work_date, client_id, location_id, vessel_name,
        total_vehicles_handled, is_export_day, logged_by
    ) VALUES (
        '2026-10-02', cat_id, loc_pf, 'INSPECCIONES ESPECIALES',
        0, false, admin_id
    ) RETURNING id INTO log_id;

    INSERT INTO public.daily_staff_entries (
        daily_work_log_id, employee_id, position_id,
        shift_start_date, shift_start_time, shift_end_date, shift_end_time,
        regular_hours, overtime_50_hours, overtime_100_hours,
        shuttles_count, meal_allowance_count, is_approved, approved_at, approved_by
    ) VALUES
        (log_id, emp_perez, apuntador_id, '2026-10-02', '08:00', '2026-10-02', '22:00', 8, 6, 0, 0, 0, true, NOW(), admin_id),
        (log_id, emp_gomez, apuntador_id, '2026-10-03', '08:00', '2026-10-03', '23:00', 8, 7, 0, 0, 0, true, NOW(), admin_id);

    -- -------------------------------------------------------------------------
    -- CASO 3: DEPÓSITOS NACIONAL Y FISCAL DELTA DOCK (OCTUBRE 2026 Q1 Y Q2)
    -- Incluye ambos depósitos en simultáneo día por día:
    --   - DEPÓSITO NACIONAL (APUNTADOR 1) con tramo remis 1.00
    --   - DEPÓSITO FISCAL (APUNTADOR 2) con tramo remis 0.50
    -- -------------------------------------------------------------------------
    FOR i IN 1..31 LOOP
        v_date := ('2026-10-' || LPAD(i::TEXT, 2, '0'))::DATE;
        v_dow := EXTRACT(DOW FROM v_date);

        -- Días hábiles lunes a viernes (excepto feriado 12/10 que figura como FERIADO en el Excel)
        IF v_dow BETWEEN 1 AND 5 AND i <> 12 THEN
            -- Depósito Nacional (APUNTADOR 1 — GAUNA EDUARDO DANIEL — TTE = 1.00)
            INSERT INTO public.daily_work_logs (
                work_date, client_id, location_id, vessel_name,
                total_vehicles_handled, is_export_day, logged_by
            ) VALUES (
                v_date, dd_id, loc_dep_nac, 'DEPÓSITO NACIONAL',
                0, false, admin_id
            ) RETURNING id INTO log_id;

            INSERT INTO public.daily_staff_entries (
                daily_work_log_id, employee_id, position_id,
                shift_start_date, shift_start_time, shift_end_date, shift_end_time,
                regular_hours, overtime_50_hours, overtime_100_hours,
                shuttles_count, meal_allowance_count, is_approved, approved_at, approved_by
            ) VALUES (
                log_id, emp_gauna, apuntador_id,
                v_date, '08:00', v_date, '16:00',
                8, 0, 0,
                1.00, 0, true, NOW(), admin_id
            );

            -- Depósito Fiscal (APUNTADOR 2 — rotación oficial Excel — TTE = 0.50)
            v_fis_emp := CASE (i % 5)
                WHEN 1 THEN emp_martinoli
                WHEN 2 THEN emp_morales
                WHEN 3 THEN emp_sellanes
                WHEN 4 THEN emp_suarez
                ELSE emp_gauna
            END;

            INSERT INTO public.daily_work_logs (
                work_date, client_id, location_id, vessel_name,
                total_vehicles_handled, is_export_day, logged_by
            ) VALUES (
                v_date, dd_id, loc_dep_fis, 'DEPÓSITO FISCAL',
                0, false, admin_id
            ) RETURNING id INTO log_id;

            INSERT INTO public.daily_staff_entries (
                daily_work_log_id, employee_id, position_id,
                shift_start_date, shift_start_time, shift_end_date, shift_end_time,
                regular_hours, overtime_50_hours, overtime_100_hours,
                shuttles_count, meal_allowance_count, is_approved, approved_at, approved_by
            ) VALUES (
                log_id, v_fis_emp, apuntador_id,
                v_date, '08:00', v_date, '16:00',
                8, 0, 0,
                0.50, 0, true, NOW(), admin_id
            );
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- CASO 4: INCIDENCIA PLUS "INQUEBRANTABLE" (CAT ARGENTINA SA, 25 AGOSTO 2026)
    -- -------------------------------------------------------------------------
    INSERT INTO public.daily_work_logs (
        work_date, client_id, location_id, vessel_name,
        total_vehicles_handled, vehicles_regular_time, vehicles_overtime,
        is_export_day, logged_by
    ) VALUES (
        '2026-08-25', cat_id, loc_muelle, 'INQUEBRANTABLE',
        259, 259, 0, false, admin_id
    ) RETURNING id INTO log_id;

    INSERT INTO public.daily_staff_entries (
        daily_work_log_id, employee_id, position_id,
        shift_start_date, shift_start_time, shift_end_date, shift_end_time,
        regular_hours, overtime_50_hours, overtime_100_hours,
        shuttles_count, meal_allowance_count, bonus_applied_amount, is_approved, approved_at, approved_by
    ) VALUES
        (log_id, emp_brites, encargado_id, '2026-08-25', '08:00', '2026-08-25', '17:00', 8, 1, 0, 0, 0, 88200.48, true, NOW(), admin_id),
        (log_id, emp_belo, apuntador_id, '2026-08-25', '08:00', '2026-08-25', '17:00', 8, 1, 0, 0, 0, 88200.48, true, NOW(), admin_id),
        (log_id, emp_suarez, apuntador_id, '2026-08-25', '08:00', '2026-08-25', '17:00', 8, 1, 0, 0, 0, 88200.48, true, NOW(), admin_id),
        (log_id, emp_morales, apuntador_id, '2026-08-25', '08:00', '2026-08-25', '17:00', 8, 1, 0, 0, 0, 88200.48, true, NOW(), admin_id),
        (log_id, emp_arena, apuntador_id, '2026-08-25', '08:00', '2026-08-25', '17:00', 8, 1, 0, 0, 0, 88200.48, true, NOW(), admin_id),
        (log_id, emp_gomez, apuntador_id, '2026-08-25', '08:00', '2026-08-25', '17:00', 8, 1, 0, 0, 0, 88200.48, true, NOW(), admin_id),
        (log_id, emp_perez, apuntador_id, '2026-08-25', '08:00', '2026-08-25', '17:00', 8, 1, 0, 0, 0, 88200.48, true, NOW(), admin_id);

    -- -------------------------------------------------------------------------
    -- CASO 5: COOPTACORD 10% (01-15 OCTUBRE 2026)
    -- -------------------------------------------------------------------------
    FOR i IN 1..5 LOOP
        INSERT INTO public.daily_work_logs (
            work_date, client_id, location_id, vessel_name,
            total_vehicles_handled, is_export_day, logged_by
        ) VALUES (
            ('2026-10-' || LPAD((i * 2)::TEXT, 2, '0'))::DATE, coop_id, loc_pf, 'APUNTADORES PLAZ. FISCAL (10%)',
            0, true, admin_id
        ) RETURNING id INTO log_id;

        INSERT INTO public.daily_staff_entries (
            daily_work_log_id, employee_id, position_id,
            shift_start_date, shift_start_time, shift_end_date, shift_end_time,
            regular_hours, overtime_50_hours, overtime_100_hours,
            shuttles_count, meal_allowance_count, is_approved, approved_at, approved_by
        ) VALUES
            (log_id, emp_arena, apuntador_id, ('2026-10-' || LPAD((i * 2)::TEXT, 2, '0'))::DATE, '08:00', ('2026-10-' || LPAD((i * 2)::TEXT, 2, '0'))::DATE, '18:00', 8, 2, 0, 2.0, 0, true, NOW(), admin_id),
            (log_id, emp_gomez, apuntador_id, ('2026-10-' || LPAD((i * 2)::TEXT, 2, '0'))::DATE, '08:00', ('2026-10-' || LPAD((i * 2)::TEXT, 2, '0'))::DATE, '18:00', 8, 2, 0, 2.0, 0, true, NOW(), admin_id);
    END LOOP;

    -- -------------------------------------------------------------------------
    -- CASO 6: SERGIO DANCHUK - PLAZOLETA FISCAL TERMINAL ZÁRATE (01-15 OCT 2026)
    -- -------------------------------------------------------------------------
    FOR i IN 1..5 LOOP
        INSERT INTO public.daily_work_logs (
            work_date, client_id, location_id, vessel_name,
            total_vehicles_handled, is_export_day, logged_by
        ) VALUES (
            ('2026-10-' || LPAD((i * 2 + 1)::TEXT, 2, '0'))::DATE, danchuk_id, loc_pf, 'PLAZOLETA FISCAL TERMINAL ZÁRATE',
            0, false, admin_id
        ) RETURNING id INTO log_id;

        INSERT INTO public.daily_staff_entries (
            daily_work_log_id, employee_id, position_id,
            shift_start_date, shift_start_time, shift_end_date, shift_end_time,
            regular_hours, overtime_50_hours, overtime_100_hours,
            shuttles_count, meal_allowance_count, is_approved, approved_at, approved_by
        ) VALUES
            (log_id, emp_belo, apuntador_id, ('2026-10-' || LPAD((i * 2 + 1)::TEXT, 2, '0'))::DATE, '07:00', ('2026-10-' || LPAD((i * 2 + 1)::TEXT, 2, '0'))::DATE, '19:00', 8, 4, 0, 2.0, 2, true, NOW(), admin_id),
            (log_id, emp_perez, apuntador_id, ('2026-10-' || LPAD((i * 2 + 1)::TEXT, 2, '0'))::DATE, '07:00', ('2026-10-' || LPAD((i * 2 + 1)::TEXT, 2, '0'))::DATE, '19:00', 8, 4, 0, 2.0, 2, true, NOW(), admin_id);
    END LOOP;

    -- =========================================================================
    -- 8. SEED 6 PROFORMAS DE EJEMPLO (UNA POR CADA MODELO OFICIAL EXCEL)
    -- =========================================================================
    DELETE FROM public.proformas;

    -- 8.1 BUQUE: GOODWOOD (11-13 OCTUBRE 2026)
    INSERT INTO public.proformas (
        proforma_number, proforma_type, client_id, fortnight_period, concept_type, status,
        vessel_name, operation_dates, discount_percentage, discount_amount,
        subtotal_operativa, subtotal_encargado, subtotal_compensacion,
        subtotal, total_neto, tax_amount, total,
        issue_date, due_date, calculation_payload, notes
    ) VALUES (
        'PROF-2026-1001', 'vessel', cat_id, '2026-10-Q1', 'general_hours', 'approved',
        'GOODWOOD', '11-13 OCTUBRE 2026', 3.00, 128025.49,
        4139491.03, 560924.64, 347115.20,
        5047530.87, 5047530.87, 1059981.48, 6107512.35,
        '2026-10-15', '2026-10-20',
        '{
          "vessel_name": "GOODWOOD",
          "operation_dates": "11-13 OCTUBRE 2026",
          "tab_buque": {
            "total_vehiculos": 817,
            "vehiculos_horario_normal": 312,
            "vehiculos_horario_extra": 505,
            "tarifa_vehiculo_normal": 2744.17,
            "tarifa_vehiculo_extra": 5488.11,
            "importe_vehiculos_normal": 856181.04,
            "importe_vehiculos_extra": 2771495.55,
            "subtotal_vehiculos": 3627676.59,
            "viajes_remis": 8,
            "tarifa_remis": 35594.34,
            "importe_remis": 284754.72,
            "subtotal_sin_bonificacion": 4267516.52,
            "bonificacion_pct": 3,
            "bonificacion_monto": 128025.49,
            "subtotal_operativa_bonificada": 4139491.03,
            "shift_rows": [
              {"workDate": "2026-10-11", "employeeName": "BELO BRUNO JOAQUIN", "roleLabel": "APUNTADOR", "timeRange": "08:00 a 20:00", "regularHours": 0, "overtime50Hours": 0, "overtime100Hours": 12, "totalHours": 12, "shuttlesCount": 1},
              {"workDate": "2026-10-11", "employeeName": "SUAREZ ROMINA", "roleLabel": "APUNTADOR", "timeRange": "08:00 a 20:00", "regularHours": 0, "overtime50Hours": 0, "overtime100Hours": 12, "totalHours": 12, "shuttlesCount": 1},
              {"workDate": "2026-10-12", "employeeName": "GOMEZ MATIAS", "roleLabel": "APUNTADOR", "timeRange": "08:00 a 18:00", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10, "shuttlesCount": 1}
            ]
          },
          "tab_plus": {
            "escala_aplicada": 88200.48,
            "cantidad_operarios": 7,
            "total_plus_bruto": 617403.36,
            "coeficiente_markup": 0.52,
            "plus_con_cargas": 938453.11,
            "incidencia_facturada": 355085.21
          },
          "tab_compensacion": {
            "horas_compensacion": 56,
            "tarifa_compensacion": 6198.48,
            "subtotal_compensacion": 347115.20
          },
          "tab_encargado": {
            "horas_normales": 8,
            "horas_50": 2,
            "horas_100": 12,
            "tarifa_normal": 14957.99,
            "tarifa_50": 22436.99,
            "tarifa_100": 29915.98,
            "importe_normal": 119663.92,
            "importe_50": 44873.98,
            "importe_100": 358991.76,
            "viajes_remis": 2,
            "importe_remis": 71188.68,
            "subtotal_encargado": 560924.64
          }
        }'::jsonb,
        ARRAY['PROFORMA DE CONTROL — Plazo máximo de reclamo: 5 días corridos desde su emisión.']
    );

    -- 8.2 PLAZOLETA FISCAL + INSPECCIONES ESPECIALES (01-15 OCTUBRE 2026)
    INSERT INTO public.proformas (
        proforma_number, proforma_type, client_id, fortnight_period, concept_type, status,
        vessel_name, operation_dates, discount_percentage, discount_amount,
        subtotal_operativa, subtotal_encargado, subtotal_compensacion,
        subtotal, total_neto, tax_amount, total,
        issue_date, due_date, calculation_payload, notes
    ) VALUES (
        'PROF-2026-1002', 'fiscal_yard', cat_id, '2026-10-Q1', 'general_hours', 'approved',
        'PLAZOLETA FISCAL', '01-15 OCTUBRE 2026', 3.00, 622666.08,
        19692857.28, 427319.99, 2566323.51,
        22686500.78, 22686500.78, 4764165.16, 27450665.94,
        '2026-10-15', '2026-10-20',
        '{
          "consolidado": {
            "plazoleta_fiscal": 19692857.28,
            "inspecciones_especiales": 427319.99,
            "transporte_personal": 783075.48,
            "control_expo": 1783248.03
          },
          "tab_plazoleta": {
            "horas_encargado": {"norm": 88, "ot50": 21, "ot100": 0},
            "horas_apuntador": {"norm": 1056, "ot50": 252, "ot100": 0},
            "tarifas_encargado": {"REGULAR": 14957.99, "OVERTIME_50": 22436.99, "OVERTIME_100": 29915.98},
            "tarifas_apuntador": {"REGULAR": 12396.95, "OVERTIME_50": 18595.44, "OVERTIME_100": 24793.92},
            "importes": {
              "enc_reg": 1316303.12,
              "enc_ot50": 471176.79,
              "enc_ot100": 0,
              "ap_reg": 13091179.20,
              "ap_ot50": 4686050.88,
              "ap_ot100": 0,
              "neto_sin_bonif": 20301914.72,
              "bonificacion": 609057.44,
              "subtotal_bonificado": 19692857.28
            },
            "totales_grilla": {
              "total_regular": 1144,
              "total_ot50": 273,
              "total_ot100": 0,
              "total_hours": 1417
            },
            "slots_summary": [
              {"slotCode": "ENCARGADO PF", "positionTitle": "Encargado Plazoleta", "assignedEmployee": "BRITES LUCAS DAVID", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 14957.99, "ot50Rate": 22436.99, "ot100Rate": 29915.98, "subtotalAmount": 1787479.91, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 01", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "BELO BRUNO JOAQUIN", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 02", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "ARENA CECILIA", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 03", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "BUET MARIA", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 04", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "SARLI ROQUE", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 05", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "LIBARONO MAXIMILIANO", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 06", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "CORNEJO NELSON", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 07", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "GUERRERO ANGEL", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 08", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "ACOSTA JOAQUIN", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 09", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "SUAREZ ROMINA", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 10", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "MORALES ROSANA", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 11", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "BRITES ENZO NICOLAS", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 12", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "MARTINOLI DIEGO", "totalRegular": 88, "totalOt50": 21, "totalOt100": 0, "totalHours": 109, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 1481435.84, "isBonificado": false},
              {"slotCode": "APUNTADOR PF 13", "positionTitle": "Apuntador Plazoleta", "assignedEmployee": "BONIFICADO", "totalRegular": 0, "totalOt50": 0, "totalOt100": 0, "totalHours": 0, "regularRate": 12396.95, "ot50Rate": 18595.44, "ot100Rate": 24793.92, "subtotalAmount": 0, "isBonificado": true}
            ]
          },
          "tab_inspecciones": {
            "activa": true,
            "horas_apuntador": {"norm": 16, "ot50": 13, "ot100": 0},
            "tarifas_apuntador": {"REGULAR": 12396.95, "OVERTIME_50": 18595.44, "OVERTIME_100": 24793.92},
            "importes": {
              "ap_reg": 198351.20,
              "ap_ot50": 241740.72,
              "ap_ot100": 0,
              "neto_sin_bonif": 440536.07,
              "bonificacion": 13216.08,
              "subtotal_bonificado": 427319.99
            },
            "shift_rows": [
              {"workDate": "2026-10-02", "slotPosition": "APUNTADOR INSP 01", "employeeName": "PEREZ HERNAN", "timeRange": "08:00 a 22:00", "regularHours": 8, "overtime50Hours": 6, "overtime100Hours": 0, "totalHours": 14},
              {"workDate": "2026-10-03", "slotPosition": "APUNTADOR INSP 02", "employeeName": "GOMEZ MATIAS", "timeRange": "08:00 a 23:00", "regularHours": 8, "overtime50Hours": 7, "overtime100Hours": 0, "totalHours": 15}
            ]
          },
          "tab_transporte": {
            "viajes": 22,
            "tarifa_por_viaje": 35594.34,
            "total_transporte": 783075.48,
            "viajes_rows": [
              {"workDate": "2026-10-01", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-02", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-03", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-05", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-06", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-07", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-08", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-09", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-12", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-13", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""},
              {"workDate": "2026-10-14", "timeRange": "0700-1700", "viajes": 2, "staffCount": 13, "notaMark": ""}
            ]
          },
          "tab_expo": {
            "factor_asignacion": 0.90,
            "horas_base": {"norm": 88, "ot50": 21, "ot100": 0},
            "horas_facturadas": {"norm": 79.2, "ot50": 18.9, "ot100": 0},
            "importes": {
              "reg": 981838.44,
              "ot50": 351453.82,
              "ot100": 0,
              "total": 1783248.03
            },
            "shift_rows": [
              {"workDate": "2026-10-01", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-02", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-03", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 1, "overtime100Hours": 0, "totalHours": 9},
              {"workDate": "2026-10-05", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-06", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-07", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-08", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-09", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-12", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-13", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10},
              {"workDate": "2026-10-14", "slotPosition": "CONTROL EXPO", "employeeName": "BRITES LUCAS DAVID", "timeRange": "0700-1700", "regularHours": 8, "overtime50Hours": 2, "overtime100Hours": 0, "totalHours": 10}
            ]
          }
        }'::jsonb,
        ARRAY['PROFORMA PLAZOLETA FISCAL + INSPECCIONES ESPECIALES — Bonificación 3% aplicada.']
    );

    -- 8.3 DEPÓSITOS NACIONAL Y FISCAL DELTA DOCK (01-15 OCTUBRE 2026)
    INSERT INTO public.proformas (
        proforma_number, proforma_type, client_id, fortnight_period, concept_type, status,
        vessel_name, operation_dates, discount_percentage, discount_amount,
        subtotal_operativa, subtotal_encargado, subtotal_compensacion,
        subtotal, total_neto, tax_amount, total,
        issue_date, due_date, calculation_payload, notes
    ) VALUES (
        'PROF-2026-1003', 'fixed_deposit', dd_id, '2026-10-Q1', 'general_hours', 'approved',
        'DEPÓSITO NACIONAL Y FISCAL', '01-15 OCTUBRE 2026', 3.00, 0,
        6025441.25, 0, 0,
        6025441.25, 6025441.25, 1265342.66, 7290783.91,
        '2026-10-15', '2026-10-20',
        '{
          "from_date": "2026-10-01",
          "to_date": "2026-10-15",
          "sector": "Depósito Nacional y Depósito Fiscal",
          "lugar": "DELTA DOCK - LIMA",
          "servicio": "DESPACHO BOLSONES",
          "categoria": "APUNTADOR",
          "abono_quincenal": 5466694.70,
          "depositos": [
            {
              "code": "nacional",
              "title": "DEPOSITO NACIONAL",
              "apuntadorLabel": "APUNTADOR 1",
              "tarifaLabel": "TARIFA MENSUAL BONIFICADA 1",
              "tarifaMensual": 5466694.70,
              "importeQuincena": 2733347.35,
              "hs50": 0,
              "tarifa50": 46591.18,
              "importe50": 0,
              "hs100": 0,
              "tarifa100": 62121.57,
              "importe100": 0,
              "importeTotalBlock": 2733347.35,
              "totalNormales": 80,
              "totalTte": 10.0,
              "turnos": [
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-01", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-02", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-05", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-06", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-07", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-08", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-09", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "FERIADO", "fecha": "2026-10-12", "desdeHasta": "0800-1600", "horas": 0, "normales": 0, "hs50": 0, "hs100": 0, "tte": 0, "isHoliday": true},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-13", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-14", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0},
                {"buque": "DEPOSITO NACIONAL", "puesto": "APUNTADOR 1", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-15", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 1.0}
              ]
            },
            {
              "code": "fiscal",
              "title": "DEPOSITO FISCAL",
              "apuntadorLabel": "APUNTADOR 2",
              "tarifaLabel": "TARIFA MENSUAL BONIFICADA 2",
              "tarifaMensual": 5466694.70,
              "importeQuincena": 2733347.35,
              "hs50": 0,
              "tarifa50": 46591.18,
              "importe50": 0,
              "hs100": 0,
              "tarifa100": 62121.57,
              "importe100": 0,
              "importeTotalBlock": 2733347.35,
              "totalNormales": 80,
              "totalTte": 5.0,
              "turnos": [
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "MARTINOLI DIEGO RICARDO", "fecha": "2026-10-01", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "MORALES ROSANA LORENA", "fecha": "2026-10-02", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "MORALES ROSANA LORENA", "fecha": "2026-10-05", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "SELLANES MARIA ELENA", "fecha": "2026-10-06", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "SUAREZ ROMINA", "fecha": "2026-10-07", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "SELLANES MARIA ELENA", "fecha": "2026-10-08", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-09", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "FERIADO", "fecha": "2026-10-12", "desdeHasta": "0800-1600", "horas": 0, "normales": 0, "hs50": 0, "hs100": 0, "tte": 0, "isHoliday": true},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "MORALES ROSANA LORENA", "fecha": "2026-10-13", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "SUAREZ ROMINA", "fecha": "2026-10-14", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5},
                {"buque": "DEPOSITO FISCAL", "puesto": "APUNTADOR 2", "apellido": "GAUNA EDUARDO DANIEL", "fecha": "2026-10-15", "desdeHasta": "0800-1600", "horas": 8, "normales": 8, "hs50": 0, "hs100": 0, "tte": 0.5}
              ]
            }
          ],
          "horas_extras": {
            "hs_50": 0,
            "tarifa_50": 46591.18,
            "imp_50": 0,
            "hs_100": 0,
            "tarifa_100": 62121.57,
            "imp_100": 0
          },
          "transporte": {
            "tramos": 15.0,
            "tarifa_tramo": 37249.77,
            "total_transporte": 558746.55
          },
          "totales": {
            "total_neto": 6025441.25,
            "iva_21": 1265342.66,
            "total_factura": 7290783.91
          }
        }'::jsonb,
        ARRAY['NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026']
    );

    -- 8.4 INCIDENCIA PLUS: INQUEBRANTABLE (25 AGOSTO 2026)
    INSERT INTO public.proformas (
        proforma_number, proforma_type, client_id, fortnight_period, concept_type, status,
        vessel_name, operation_dates, discount_percentage, discount_amount,
        subtotal_operativa, subtotal_encargado, subtotal_compensacion,
        subtotal, total_neto, tax_amount, total,
        issue_date, due_date, calculation_payload, notes
    ) VALUES (
        'PROF-2026-1004', 'plus_incidence', cat_id, '2026-08-Q2', 'general_hours', 'approved',
        'INQUEBRANTABLE', '25 AGOSTO 2026', 3.00, 15284.72,
        494205.84, 0, 0,
        494205.84, 494205.84, 103783.23, 597989.07,
        '2026-08-26', '2026-08-31',
        '{
          "vessel_name": "INQUEBRANTABLE",
          "operation_dates": "25 AGOSTO 2026",
          "total_vehicles": 259,
          "escala_plus_unitaria": 88200.48,
          "coeficiente_cargas": 0.52,
          "encargado_shifts": 1,
          "apuntador_shifts": 6,
          "total_staff": 7,
          "plus_bruto_total": 617403.36,
          "plus_con_cargas": 938453.11,
          "subtotal_horas_sin_plus": 428962.53,
          "incidencia_plus_neta": 509490.56,
          "bonificacion_pct": 3,
          "bonificacion_monto": 15284.72,
          "total_neto": 494205.84,
          "shift_rows": [
            {"workDate": "2026-08-25", "employeeName": "BRITES LUCAS DAVID", "roleLabel": "ENCARGADO", "timeRange": "08:00 a 17:00", "regularHours": 8, "overtime50Hours": 1, "overtime100Hours": 0, "plusAmount": 88200.48},
            {"workDate": "2026-08-25", "employeeName": "BELO BRUNO JOAQUIN", "roleLabel": "APUNTADOR", "timeRange": "08:00 a 17:00", "regularHours": 8, "overtime50Hours": 1, "overtime100Hours": 0, "plusAmount": 88200.48},
            {"workDate": "2026-08-25", "employeeName": "SUAREZ ROMINA", "roleLabel": "APUNTADOR", "timeRange": "08:00 a 17:00", "regularHours": 8, "overtime50Hours": 1, "overtime100Hours": 0, "plusAmount": 88200.48}
          ]
        }'::jsonb,
        ARRAY['LIQUIDACIÓN DE INCIDENCIA PLUS — Buque INQUEBRANTABLE (259 vehículos operados).']
    );

    -- 8.5 COOPTACORD 10% (01-15 OCTUBRE 2026)
    INSERT INTO public.proformas (
        proforma_number, proforma_type, client_id, fortnight_period, concept_type, status,
        vessel_name, operation_dates, discount_percentage, discount_amount,
        subtotal_operativa, subtotal_encargado, subtotal_compensacion,
        subtotal, total_neto, tax_amount, total,
        issue_date, due_date, calculation_payload, notes
    ) VALUES (
        'PROF-2026-1005', 'shared_expo', coop_id, '2026-10-Q1', 'export_tallymen', 'approved',
        'APUNTADORES PLAZ. FISCAL (10%)', '01-15 OCTUBRE 2026', 0.00, 0,
        226451.14, 0, 0,
        226451.14, 226451.14, 47554.74, 274005.88,
        '2026-10-15', '2026-10-20',
        '{
          "factor_coparticipacion": 0.10,
          "horas_base": {"norm": 88, "ot50": 21, "ot100": 0},
          "horas_asignadas": {"norm": 8.8, "ot50": 2.1, "ot100": 0},
          "tarifas": {"REGULAR": 12396.95, "OVERTIME_50": 18595.44, "OVERTIME_100": 24793.92},
          "importes_horas": {"reg": 109093.16, "ot50": 39050.42, "ot100": 0, "subtotal": 148143.58},
          "transporte": {"viajes_totales": 22, "viajes_asignados": 2.2, "tarifa_viaje": 35594.34, "subtotal_transporte": 78307.55},
          "total_neto": 226451.14
        }'::jsonb,
        ARRAY['PROFORMA COOPTACORD — Asignación del 10% sobre Horas y Transporte de Plazoleta Fiscal.']
    );

    -- 8.6 SERGIO DANCHUK: PLAZOLETA FISCAL TERMINAL ZÁRATE (01-15 OCTUBRE 2026)
    INSERT INTO public.proformas (
        proforma_number, proforma_type, client_id, fortnight_period, concept_type, status,
        vessel_name, operation_dates, discount_percentage, discount_amount,
        subtotal_operativa, subtotal_encargado, subtotal_compensacion,
        subtotal, total_neto, tax_amount, total,
        issue_date, due_date, calculation_payload, notes
    ) VALUES (
        'PROF-2026-1006', 'standard', danchuk_id, '2026-10-Q1', 'general_hours', 'approved',
        'PLAZOLETA FISCAL TERMINAL ZÁRATE', '01-15 OCTUBRE 2026', 0.00, 0,
        2968443.40, 0, 0,
        2968443.40, 2968443.40, 623373.11, 3591816.51,
        '2026-10-15', '2026-10-20',
        '{
          "horas": {"norm": 80, "ot50": 40, "ot100": 14},
          "tarifas": {"REGULAR": 12396.95, "OVERTIME_50": 18595.44, "OVERTIME_100": 24793.92},
          "importes_horas": {"reg": 991756.00, "ot50": 743817.60, "ot100": 347114.88, "subtotal": 2082688.48},
          "viandas": {"cantidad": 20, "tarifa": 6545.18, "subtotal": 130903.60},
          "transporte": {"viajes_cmp_tz": 20, "tarifa_cmp_tz": 37685.28, "subtotal": 753705.60},
          "total_neto": 2968443.40
        }'::jsonb,
        ARRAY['PROFORMA PLAZOLETA FISCAL TERMINAL ZÁRATE — Incluye Horas, Viandas y Transporte CMP-TZ.']
    );

    -- =========================================================================
    -- 9. SEED FLUJO DE CAJA (MOVIMIENTOS DE EJEMPLO PERSISTENTES)
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM public.cash_movements LIMIT 1) THEN
        INSERT INTO public.cash_movements (movement_date, type, area, detail, amount, created_by)
        VALUES
            ('2026-10-05', 'income', 'Cobros', 'Cobro Factura Quincena 2 Septiembre - CAT Argentina', 18450230.50, admin_id),
            ('2026-10-10', 'income', 'Cobros', 'Cobro Abono Depósito Nacional y Fiscal - Delta Dock', 7820415.00, admin_id),
            ('2026-10-12', 'expense', 'Proveedores', 'Pago Quincenal Remisería Traslados Personal', 1420000.00, admin_id),
            ('2026-10-15', 'expense', 'Sueldos', 'Liquidación Quincenal Apuntadores y Encargados', 9650000.00, admin_id);
    END IF;

END $$;
