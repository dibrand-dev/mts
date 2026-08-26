-- Remove capacity column from public.locations
ALTER TABLE public.locations DROP COLUMN IF EXISTS capacity;
