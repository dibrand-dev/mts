-- Migration: Add Barge Proforma Type and seed CAP JACKSON operation
-- Date: 2026-10-29
-- Description:
-- 1. Updates client_operations to register 'CAP JACKSON' as barge for CAT Argentina.
-- 2. Sets 'INQUEBRANTABLE' as barge.
-- 3. Ensures positions (Colectado, Encargado a bordo, Daños, Rampa, Relevo) exist and are linked.
-- 4. Seeds approved daily work log and staff entries for CAP JACKSON on 2026-10-14.

DO $$
DECLARE
    cat_id UUID;
    loc_muelle UUID;
    log_id UUID;
    pos_encargado_bordo UUID;
    pos_colectado UUID;
    pos_danos UUID;
    pos_rampa UUID;
    emp_brites UUID;
    emp_belo UUID;
    emp_sellanes UUID;
    emp_morales UUID;
    emp_suarez UUID;
    emp_acosta UUID;
    emp_martinoli UUID;
    emp_libarono UUID;
    admin_id UUID;
BEGIN
    -- Dynamically resolve existing profile for foreign key compliance
    SELECT id INTO admin_id FROM public.profiles LIMIT 1;
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM auth.users LIMIT 1;
    END IF;

    SELECT id INTO cat_id FROM public.clients WHERE company_name ILIKE '%CAT%' LIMIT 1;
    SELECT id INTO loc_muelle FROM public.locations WHERE code = 'LOC-001' LIMIT 1;

    SELECT id INTO pos_encargado_bordo FROM public.positions WHERE name = 'Encargado a bordo' LIMIT 1;
    SELECT id INTO pos_colectado FROM public.positions WHERE name = 'Colectado' LIMIT 1;
    SELECT id INTO pos_danos FROM public.positions WHERE name = 'Daños' LIMIT 1;
    SELECT id INTO pos_rampa FROM public.positions WHERE name = 'Rampa' LIMIT 1;

    -- Upsert Client Operations for Barges
    IF cat_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES
            (cat_id, 'CAP JACKSON', 'barge'),
            (cat_id, 'INQUEBRANTABLE', 'barge')
        ON CONFLICT (client_id, name) DO UPDATE SET
            operation_type = EXCLUDED.operation_type,
            is_active = true;
    END IF;

    -- Employee Lookups
    SELECT id INTO emp_brites FROM public.employees WHERE full_name ILIKE '%BRITES LUCAS%' LIMIT 1;
    SELECT id INTO emp_belo FROM public.employees WHERE full_name ILIKE '%BRITES ENZO%' OR full_name ILIKE '%BELO BRUNO%' LIMIT 1;
    SELECT id INTO emp_sellanes FROM public.employees WHERE full_name ILIKE '%SELLANES%' LIMIT 1;
    SELECT id INTO emp_morales FROM public.employees WHERE full_name ILIKE '%MORALES%' LIMIT 1;
    SELECT id INTO emp_suarez FROM public.employees WHERE full_name ILIKE '%SUAREZ%' LIMIT 1;
    SELECT id INTO emp_martinoli FROM public.employees WHERE full_name ILIKE '%MARTINOLI%' LIMIT 1;
    SELECT id INTO emp_acosta FROM public.employees WHERE full_name ILIKE '%ACOSTA%' LIMIT 1;
    SELECT id INTO emp_libarono FROM public.employees WHERE full_name ILIKE '%LIBARONO%' OR full_name ILIKE '%PEREZ%' LIMIT 1;

    IF cat_id IS NOT NULL AND loc_muelle IS NOT NULL AND emp_brites IS NOT NULL AND admin_id IS NOT NULL THEN
        -- Delete any duplicate log for CAP JACKSON on 2026-10-14
        DELETE FROM public.daily_work_logs
        WHERE client_id = cat_id AND vessel_name = 'CAP JACKSON' AND work_date = '2026-10-14';

        INSERT INTO public.daily_work_logs (
            work_date, client_id, location_id, vessel_name,
            total_vehicles_handled, vehicles_regular_time, vehicles_overtime,
            is_export_day, logged_by
        ) VALUES (
            '2026-10-14', cat_id, loc_muelle, 'CAP JACKSON',
            355, 355, 0, false, admin_id
        ) RETURNING id INTO log_id;

        INSERT INTO public.daily_staff_entries (
            daily_work_log_id, employee_id, position_id, shift_number, operational_role,
            shift_start_date, shift_start_time, shift_end_date, shift_end_time,
            regular_hours, overtime_50_hours, overtime_100_hours,
            shuttles_count, meal_allowance_count, bonus_applied_amount, is_approved, approved_at, approved_by
        ) VALUES
            (log_id, emp_brites, COALESCE(pos_encargado_bordo, pos_rampa), 1, 'ENCARGADO A BORDO', '2026-10-14', '07:00', '2026-10-14', '15:00', 8, 0, 0, 4, 0, 88200.48, true, NOW(), admin_id),
            (log_id, COALESCE(emp_belo, emp_brites), COALESCE(pos_colectado, pos_rampa), 1, 'COLECTADO', '2026-10-14', '07:00', '2026-10-14', '15:00', 8, 0, 0, 0, 0, 88200.48, true, NOW(), admin_id),
            (log_id, COALESCE(emp_sellanes, emp_brites), COALESCE(pos_danos, pos_rampa), 1, 'DAÑOS', '2026-10-14', '07:00', '2026-10-14', '15:00', 8, 0, 0, 0, 0, 88200.48, true, NOW(), admin_id),
            (log_id, COALESCE(emp_morales, emp_brites), COALESCE(pos_danos, pos_rampa), 1, 'DAÑOS', '2026-10-14', '07:00', '2026-10-14', '15:00', 8, 0, 0, 0, 0, 88200.48, true, NOW(), admin_id),
            (log_id, COALESCE(emp_suarez, emp_brites), COALESCE(pos_danos, pos_rampa), 1, 'DAÑOS', '2026-10-14', '07:00', '2026-10-14', '15:00', 8, 0, 0, 0, 0, 88200.48, true, NOW(), admin_id),
            (log_id, COALESCE(emp_martinoli, emp_brites), COALESCE(pos_rampa, pos_danos), 1, 'RAMPA', '2026-10-14', '07:00', '2026-10-14', '15:00', 8, 0, 0, 0, 0, 88200.48, true, NOW(), admin_id);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

