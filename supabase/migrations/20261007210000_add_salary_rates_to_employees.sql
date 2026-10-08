-- Migration: Add salary hourly rates (Valores Hora Hombre / Sueldos) directly to employees
-- Description: Assigns wages directly to each staff member in employees table.
-- Preloaded with official Excel MTS pocket wages:
-- Encargados: $10.777,06 / $16.165,60 / $21.554,13
-- Apuntadores: $8.983,68 / $13.475,53 / $17.967,37

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS hourly_rate_regular NUMERIC(12,2) NOT NULL DEFAULT 8983.68,
ADD COLUMN IF NOT EXISTS hourly_rate_overtime_50 NUMERIC(12,2) NOT NULL DEFAULT 13475.53,
ADD COLUMN IF NOT EXISTS hourly_rate_overtime_100 NUMERIC(12,2) NOT NULL DEFAULT 17967.37,
ADD COLUMN IF NOT EXISTS salary_effective_from DATE NOT NULL DEFAULT CURRENT_DATE;

-- Populate Encargados employees with official Excel wages
UPDATE public.employees e
SET 
    hourly_rate_regular = 10777.06,
    hourly_rate_overtime_50 = 16165.60,
    hourly_rate_overtime_100 = 21554.13
FROM public.positions p
WHERE e.default_position_id = p.id AND p.name ILIKE '%encargado%';

-- Populate Apuntadores employees with official Excel wages
UPDATE public.employees e
SET 
    hourly_rate_regular = 8983.68,
    hourly_rate_overtime_50 = 13475.53,
    hourly_rate_overtime_100 = 17967.37
FROM public.positions p
WHERE e.default_position_id = p.id AND p.name ILIKE '%apuntador%';

-- Comments
COMMENT ON COLUMN public.employees.hourly_rate_regular IS 'Valor hora normal de bolsillo asignado al trabajador para liquidación de sueldo';
COMMENT ON COLUMN public.employees.hourly_rate_overtime_50 IS 'Valor hora extra al 50% asignado al trabajador para liquidación de sueldo';
COMMENT ON COLUMN public.employees.hourly_rate_overtime_100 IS 'Valor hora extra al 100% asignado al trabajador para liquidación de sueldo';
COMMENT ON COLUMN public.employees.salary_effective_from IS 'Fecha de vigencia del valor hora de sueldo del trabajador';

