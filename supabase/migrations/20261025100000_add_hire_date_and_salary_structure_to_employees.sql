-- Migration: Add hire_date, employment_type and base_gross_salary to employees table
-- Description: Supports seniority, presenteeism, and base wage calculation matching CALCULO DE SUELDOS.xls.

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30) NOT NULL DEFAULT 'Jornalizado',
ADD COLUMN IF NOT EXISTS base_gross_salary NUMERIC(12,2);

-- Pre-populate known employees with historical contract data from CALCULO DE SUELDOS.xls
-- 1. Mensualizados (Encargados: Básico $2.069.196,18 / Apuntadores: Básico $1.897.133,14)
UPDATE public.employees
SET 
    hire_date = '2004-04-11',
    employment_type = 'Mensualizado',
    base_gross_salary = 2069196.18
WHERE full_name ILIKE '%MARTINOLI DIEGO%';

UPDATE public.employees
SET 
    hire_date = '2016-06-01',
    employment_type = 'Mensualizado',
    base_gross_salary = 2069196.18
WHERE full_name ILIKE '%BRITES%PEDRO%';

UPDATE public.employees
SET 
    hire_date = '2022-10-21',
    employment_type = 'Mensualizado',
    base_gross_salary = 2069196.18
WHERE full_name ILIKE '%BRITES%ENZO%';

UPDATE public.employees
SET 
    hire_date = '2005-05-01',
    employment_type = 'Mensualizado',
    base_gross_salary = 1897133.14
WHERE full_name ILIKE '%GAUNA EDUARDO%';

UPDATE public.employees
SET 
    hire_date = '2006-03-03',
    employment_type = 'Mensualizado',
    base_gross_salary = 1897133.14
WHERE full_name ILIKE '%MORALES ROSANA%';

UPDATE public.employees
SET 
    hire_date = '2006-01-24',
    employment_type = 'Mensualizado',
    base_gross_salary = 1897133.14
WHERE full_name ILIKE '%SUAREZ ROMINA%';

-- 2. Jornalizados (Básico Jornal: $79.047,21)
UPDATE public.employees
SET 
    hire_date = '2005-12-23',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%BRITES LUCAS%';

UPDATE public.employees
SET 
    hire_date = '2023-01-01',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%BELO BRUNO%';

UPDATE public.employees
SET 
    hire_date = '2012-04-01',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%ARENA CECILIA%';

UPDATE public.employees
SET 
    hire_date = '2009-07-01',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%SELLANES MARIA%';

UPDATE public.employees
SET 
    hire_date = '2024-12-04',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%ACOSTA JOAQUIN%';

UPDATE public.employees
SET 
    hire_date = '2025-01-03',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%BUET MARIA%';

UPDATE public.employees
SET 
    hire_date = '2019-08-01',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%GUERRERO ANGEL%';

UPDATE public.employees
SET 
    hire_date = '2025-11-05',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%LIBARONO MAXIMILIANO%';

UPDATE public.employees
SET 
    hire_date = '2025-01-03',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%MARCHETTI JULIANA%';

UPDATE public.employees
SET 
    hire_date = '2025-04-15',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%PERALTA OVIDIO%';

UPDATE public.employees
SET 
    hire_date = '2018-11-01',
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%SARLI ROQUE%';

-- Default fallback for remaining employees:
UPDATE public.employees e
SET 
    base_gross_salary = CASE 
        WHEN p.name ILIKE '%encargado%' THEN 2069196.18
        WHEN e.employment_type = 'Mensualizado' THEN 1897133.14
        ELSE 79047.21
    END,
    hire_date = COALESCE(e.hire_date, e.created_at::DATE, CURRENT_DATE)
FROM public.positions p
WHERE e.default_position_id = p.id AND e.base_gross_salary IS NULL;

-- Default fallback if no position linked
UPDATE public.employees
SET 
    base_gross_salary = 79047.21,
    hire_date = COALESCE(hire_date, created_at::DATE, CURRENT_DATE)
WHERE base_gross_salary IS NULL;

-- Comments
COMMENT ON COLUMN public.employees.hire_date IS 'Fecha de ingreso del trabajador para cómputo de antigüedad (1% por año)';
COMMENT ON COLUMN public.employees.employment_type IS 'Régimen laboral: Jornalizado (base 8hs), Mensualizado (base 192hs), Temporario';
COMMENT ON COLUMN public.employees.base_gross_salary IS 'Salario básico bruto mensual (Mensualizados) o básico bruto por jornal (Jornalizados)';

