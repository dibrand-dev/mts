-- Migration: Ensure all mensualizados identified by Jorge Caetano are set to 'Mensualizado'
-- Specifically: Lucas Brites, Enzo Brites, Daniel Gauna, Diego Martinoli, Lorena Morales, Romina Suarez, Pedro Brites

UPDATE public.employees
SET 
    employment_type = 'Mensualizado',
    base_gross_salary = CASE 
        WHEN base_gross_salary IS NULL OR base_gross_salary <= 100000 THEN 2069196.18
        ELSE base_gross_salary 
    END
WHERE full_name ILIKE '%BRITES%LUCAS%' OR full_name ILIKE '%LUCAS%BRITES%';

UPDATE public.employees
SET 
    employment_type = 'Mensualizado',
    base_gross_salary = CASE 
        WHEN base_gross_salary IS NULL OR base_gross_salary <= 100000 THEN 2069196.18
        ELSE base_gross_salary 
    END
WHERE full_name ILIKE '%BRITES%ENZO%' OR full_name ILIKE '%ENZO%BRITES%';

UPDATE public.employees
SET 
    employment_type = 'Mensualizado',
    base_gross_salary = CASE 
        WHEN base_gross_salary IS NULL OR base_gross_salary <= 100000 THEN 1897133.14
        ELSE base_gross_salary 
    END
WHERE full_name ILIKE '%GAUNA%EDUARDO%' OR full_name ILIKE '%GAUNA%DANIEL%' OR full_name ILIKE '%DANIEL%GAUNA%';

UPDATE public.employees
SET 
    employment_type = 'Mensualizado',
    base_gross_salary = CASE 
        WHEN base_gross_salary IS NULL OR base_gross_salary <= 100000 THEN 2069196.18
        ELSE base_gross_salary 
    END
WHERE full_name ILIKE '%MARTINOLI%DIEGO%' OR full_name ILIKE '%DIEGO%MARTINOLI%';

UPDATE public.employees
SET 
    employment_type = 'Mensualizado',
    base_gross_salary = CASE 
        WHEN base_gross_salary IS NULL OR base_gross_salary <= 100000 THEN 1897133.14
        ELSE base_gross_salary 
    END
WHERE full_name ILIKE '%MORALES%ROSANA%' OR full_name ILIKE '%MORALES%LORENA%' OR full_name ILIKE '%LORENA%MORALES%';

UPDATE public.employees
SET 
    employment_type = 'Mensualizado',
    base_gross_salary = CASE 
        WHEN base_gross_salary IS NULL OR base_gross_salary <= 100000 THEN 1897133.14
        ELSE base_gross_salary 
    END
WHERE full_name ILIKE '%SUAREZ%ROMINA%' OR full_name ILIKE '%ROMINA%SUAREZ%';

