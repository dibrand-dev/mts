-- Migration: Set Pedro Brites as Jornalizado
-- Description: Pedro Brites is an Encargado who operates as Jornalizado (liquidating only actual worked hours, not fixed 192hs).

UPDATE public.employees
SET 
    employment_type = 'Jornalizado',
    base_gross_salary = 79047.21
WHERE full_name ILIKE '%BRITES%PEDRO%' OR full_name ILIKE '%PEDRO%BRITES%';
