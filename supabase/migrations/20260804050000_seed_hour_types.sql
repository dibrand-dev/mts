-- Seed default hour_types if they do not exist
INSERT INTO public.hour_types (code, description)
VALUES 
    ('REGULAR', 'Hora Normal'),
    ('OVERTIME_50', 'Hora Extra 50%'),
    ('OVERTIME_100', 'Hora Extra 100%')
ON CONFLICT (code) DO NOTHING;
