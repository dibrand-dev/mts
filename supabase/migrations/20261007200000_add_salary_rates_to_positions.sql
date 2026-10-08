-- Migration: Add salary hourly rates (Valores Hora Hombre / Sueldos de Personal) to positions
-- Description: Decouples employee payroll calculation from client commercial billing rates.
-- Preloads historical Excel wages: Encargado ($10.777,06 / $16.165,60 / $21.554,13) and Apuntador ($8.983,68 / $13.475,53 / $17.967,37)

ALTER TABLE public.positions
ADD COLUMN IF NOT EXISTS hourly_rate_regular NUMERIC(12,2) NOT NULL DEFAULT 8983.68,
ADD COLUMN IF NOT EXISTS hourly_rate_overtime_50 NUMERIC(12,2) NOT NULL DEFAULT 13475.53,
ADD COLUMN IF NOT EXISTS hourly_rate_overtime_100 NUMERIC(12,2) NOT NULL DEFAULT 17967.37,
ADD COLUMN IF NOT EXISTS salary_effective_from DATE NOT NULL DEFAULT CURRENT_DATE;

-- Populate Encargados with official Excel wages
UPDATE public.positions
SET 
    hourly_rate_regular = 10777.06,
    hourly_rate_overtime_50 = 16165.60,
    hourly_rate_overtime_100 = 21554.13
WHERE name ILIKE '%encargado%';

-- Populate Apuntadores with official Excel wages
UPDATE public.positions
SET 
    hourly_rate_regular = 8983.68,
    hourly_rate_overtime_50 = 13475.53,
    hourly_rate_overtime_100 = 17967.37
WHERE name ILIKE '%apuntador%';

-- Comments
COMMENT ON COLUMN public.positions.hourly_rate_regular IS 'Valor hora normal de bolsillo / sueldo para liquidación del personal';
COMMENT ON COLUMN public.positions.hourly_rate_overtime_50 IS 'Valor hora extra al 50% para liquidación del personal';
COMMENT ON COLUMN public.positions.hourly_rate_overtime_100 IS 'Valor hora extra al 100% para liquidación del personal';
COMMENT ON COLUMN public.positions.salary_effective_from IS 'Fecha de vigencia del valor hora hombre de sueldo';

