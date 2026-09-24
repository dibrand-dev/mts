-- Migration: Positions Management & Performance Indexing
-- Description: Ensures optimal indexing and documentation for positions CRUD, staff assignment, and client rate joins.

-- 1. Index on positions name for search queries
CREATE INDEX IF NOT EXISTS idx_positions_name ON public.positions(name);

-- 2. Index on employees default_position_id for fast group lookups
CREATE INDEX IF NOT EXISTS idx_employees_default_position ON public.employees(default_position_id);

-- 3. Index on client_position_rates position_id for fast tariff lookups
CREATE INDEX IF NOT EXISTS idx_client_position_rates_pos ON public.client_position_rates(position_id);

-- 4. Document columns and business rules
COMMENT ON TABLE public.positions IS 'Catálogo de puestos u oficios operativos (ej: Encargado, Apuntador, Chofer, Capataz)';
COMMENT ON COLUMN public.positions.requires_vehicle_bonus IS 'Indica si las jornadas en este puesto computan el plus de escala vehicular del CCT según vehículos operados en el turno';
