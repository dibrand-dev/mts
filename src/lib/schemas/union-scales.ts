import { z } from 'zod';

export const unionBonusScaleSchema = z
  .object({
    id: z.string().optional(),
    min_vehicles: z.coerce
      .number({ message: 'El mínimo de unidades debe ser un número entero.' })
      .int('El mínimo de unidades debe ser un número entero.')
      .min(0, 'El valor no puede ser menor a 0.'),
    max_vehicles: z.coerce
      .number({ message: 'El máximo de unidades debe ser un número entero.' })
      .int('El máximo de unidades debe ser un número entero.')
      .min(0, 'El valor no puede ser menor a 0.'),
    bonus_amount: z.coerce
      .number({ message: 'El monto de bonificación debe ser un número válido.' })
      .min(0, 'El monto no puede ser negativo.'),
    effective_from: z
      .string()
      .min(1, 'La fecha de vigencia es requerida.'),
  })
  .refine((data) => data.max_vehicles >= data.min_vehicles, {
    message: 'El límite máximo debe ser mayor o igual al mínimo de unidades.',
    path: ['max_vehicles'],
  });

export type UnionBonusScaleFormData = z.infer<typeof unionBonusScaleSchema>;
