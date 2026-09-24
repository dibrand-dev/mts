import { z } from 'zod';

export const commercialRateFormSchema = z.object({
  client_id: z.string().min(1, 'El cliente es requerido.'),
  position_id: z.string().min(1, 'El puesto de trabajo es requerido.'),
  effective_from: z.string().min(1, 'La fecha de vigencia es requerida.'),
  rate_regular: z
    .number({ message: 'La tarifa regular debe ser un número válido.' })
    .positive('La tarifa regular debe ser mayor a 0.'),
  rate_overtime_50: z
    .number({ message: 'El recargo debe ser un número válido.' })
    .min(0, 'El valor no puede ser negativo.'),
  rate_overtime_100: z
    .number({ message: 'El recargo debe ser un número válido.' })
    .min(0, 'El valor no puede ser negativo.'),
});

export type CommercialRateFormData = z.infer<typeof commercialRateFormSchema>;

