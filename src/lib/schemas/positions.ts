import { z } from 'zod';

export const positionFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del puesto es requerido.')
    .max(255, 'El nombre no puede superar los 255 caracteres.'),
  requires_vehicle_bonus: z.boolean().default(false),
});

export type PositionFormData = z.infer<typeof positionFormSchema>;
