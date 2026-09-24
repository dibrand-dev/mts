import { z } from 'zod';

export const clientFormSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Ingrese la razón social de la empresa.')
    .max(255, 'La razón social no puede superar los 255 caracteres.'),
  tax_id: z
    .string()
    .min(1, 'Ingrese el RUT o identificación fiscal.')
    .max(50, 'El RUT no puede superar los 50 caracteres.'),
  billing_emails: z
    .array(z.string().email('Formato de email inválido.'))
    .min(1, 'Debe ingresar al menos un correo de facturación.'),
  phone_number: z.string().optional(),
  payment_due_days: z
    .number({ message: 'Ingrese un número válido.' })
    .int('Debe ser un número entero.')
    .min(0, 'Los días de vencimiento no pueden ser negativos.'),
  is_active: z.boolean(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
