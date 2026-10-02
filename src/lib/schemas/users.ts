import { z } from 'zod';

export const userRoleEnum = z.enum(['admin', 'accounting_auditor']);

export const inviteUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'El correo electrónico es requerido')
    .email('Formato de correo electrónico inválido'),
  role: userRoleEnum,
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserRoleSchema = z.object({
  role: userRoleEnum,
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;
export type UpdateUserStatusData = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;
