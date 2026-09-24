import { z } from 'zod';

export const employeeFormSchema = z.object({
  full_name: z
    .string()
    .min(1, 'El nombre completo es requerido.')
    .max(255, 'El nombre no puede superar los 255 caracteres.'),
  national_id: z
    .string()
    .min(1, 'El DNI o documento es requerido.')
    .max(50, 'El documento no puede superar los 50 caracteres.'),
  file_number: z.string().optional(),
  tax_id: z.string().optional(),
  default_position_id: z.string().optional(),
  phone_number: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave'], {
    message: 'Estado no válido.',
  }),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;
