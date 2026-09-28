import { z } from 'zod';

export const locationFormSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es requerido.')
    .max(50, 'El código no puede superar los 50 caracteres.'),
  name: z
    .string()
    .min(1, 'El nombre es requerido.')
    .max(255, 'El nombre no puede superar los 255 caracteres.'),
  port_city: z
    .string()
    .min(1, 'El puerto o ciudad es requerido.')
    .max(255, 'El puerto o ciudad no puede superar los 255 caracteres.'),
  status: z.enum(['active', 'maintenance', 'inactive'], {
    message: 'Estado no válido.',
  }),
});

export type LocationFormData = z.infer<typeof locationFormSchema>;
