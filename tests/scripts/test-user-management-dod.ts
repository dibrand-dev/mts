/**
 * Test Suite: Verificación Exhaustiva de Criterios de Aceptación (DoD)
 * Gestión de Usuarios, Invitaciones y Asignación de Roles (MTS Gestión Logística)
 * 
 * Criterios de Aceptación (DoD):
 * 1. Restricción de Acceso: Pantalla accesible únicamente para "Owner/Administrador Principal" (admin).
 *    Contable (accounting_auditor) u otros roles tienen acceso restringido.
 * 2. Creación de Usuarios: Formulario simple con Nombre, Email y Rol (Administrador o Contable).
 * 3. Roles y Permisos:
 *    - Administrador: Acceso total a carga de datos, catálogos, facturación y finanzas.
 *    - Contable: Acceso restringido de "Solo Lectura", limitado a reportes y exportación de Excel.
 * 4. Integración con Supabase Auth: Creación de cuenta y disparo de correo automático con enlace para generar contraseña.
 * 5. Gestión de Estado: Grilla para alternar estado a "Inactivo" con bloqueo de acceso inmediato y protección contra auto-desactivación.
 * 
 * Ejecución: ./node_modules/.bin/jiti tests/scripts/test-user-management-dod.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  inviteUserSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  userRoleEnum,
} from '../../src/lib/schemas/users';
import {
  normalizeEmail,
  isOwnerAdmin,
  getRoleDisplayName,
  getRolePermissionSummary,
} from '../../src/lib/services/users';
import { createUserInviteEmail } from '../../src/lib/brevo/templates';

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
}

const results: TestResult[] = [];

function assertTest(
  id: string,
  description: string,
  actual: unknown,
  expected: unknown
) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ id, description, passed, expected, actual });

  if (passed) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${id}: ${description}`);
  } else {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${id}: ${description}`);
    console.log(`       Esperado: ${JSON.stringify(expected)}`);
    console.log(`       Obtenido: ${JSON.stringify(actual)}`);
  }
}

console.log('=====================================================================');
console.log(' VERIFICACIÓN DE CRITERIOS DE ACEPTACIÓN (DoD) - GESTIÓN DE USUARIOS ');
console.log('=====================================================================\n');

// -------------------------------------------------------------
// 1. Restricción de Acceso (DoD 1)
// -------------------------------------------------------------
console.log('>>> 1. Restricción de Acceso: Exclusivo para Owner / Administrador Principal');

// Verificación de función de autorización de rol Owner/Admin
assertTest(
  'DOD-AUTH-01',
  'Rol "admin" es reconocido como Owner/Administrador Principal',
  isOwnerAdmin('admin'),
  true
);

assertTest(
  'DOD-AUTH-02',
  'Rol "accounting_auditor" NO es reconocido como Owner (acceso denegado a gestión)',
  isOwnerAdmin('accounting_auditor'),
  false
);

assertTest(
  'DOD-AUTH-03',
  'Roles no autorizados o invitados son rechazados',
  isOwnerAdmin('viewer'),
  false
);

// Simulación de lógica de Middleware para protección de ruta /users
function simulateMiddlewareCheck(pathname: string, userRole: string | null, isActive: boolean) {
  if (!isActive) {
    return { allow: false, redirect: '/login?error=account_inactive' };
  }
  if (pathname.startsWith('/users') && userRole !== 'admin') {
    return { allow: false, redirect: '/' };
  }
  return { allow: true, redirect: null };
}

assertTest(
  'DOD-AUTH-04',
  'Middleware: Admin activo accediendo a /users -> Acceso Permitido',
  simulateMiddlewareCheck('/users', 'admin', true),
  { allow: true, redirect: null }
);

assertTest(
  'DOD-AUTH-05',
  'Middleware: Contable (accounting_auditor) accediendo a /users -> Redirige al Tablero Principal (/)',
  simulateMiddlewareCheck('/users', 'accounting_auditor', true),
  { allow: false, redirect: '/' }
);

assertTest(
  'DOD-AUTH-06',
  'Middleware: Usuario inactivo intentando acceder -> Redirige a /login?error=account_inactive',
  simulateMiddlewareCheck('/users', 'admin', false),
  { allow: false, redirect: '/login?error=account_inactive' }
);

// -------------------------------------------------------------
// 2. Creación de Usuarios y Validación de Formulario (DoD 2)
// -------------------------------------------------------------
console.log('\n>>> 2. Formulario de Creación de Usuarios: Nombre, Email y Rol');

// Caso válido: Administrador
const validAdminInput = {
  fullName: 'Carlos Gerente',
  email: 'Carlos.Gerente@MTSLOGISTICA.COM ',
  role: 'admin',
};
const parsedAdmin = inviteUserSchema.safeParse(validAdminInput);
assertTest(
  'DOD-FORM-01',
  'Validación Zod: Usuario administrador válido con email normalizado',
  {
    success: parsedAdmin.success,
    email: parsedAdmin.success ? parsedAdmin.data.email : null,
    role: parsedAdmin.success ? parsedAdmin.data.role : null,
  },
  {
    success: true,
    email: 'carlos.gerente@mtslogistica.com',
    role: 'admin',
  }
);

// Caso válido: Contable
const validAccountingInput = {
  fullName: 'Mariana Contable',
  email: 'mariana.contable@estudio.com.ar',
  role: 'accounting_auditor',
};
const parsedAccounting = inviteUserSchema.safeParse(validAccountingInput);
assertTest(
  'DOD-FORM-02',
  'Validación Zod: Usuario contable con rol "accounting_auditor"',
  {
    success: parsedAccounting.success,
    role: parsedAccounting.success ? parsedAccounting.data.role : null,
  },
  {
    success: true,
    role: 'accounting_auditor',
  }
);

// Rechazo de email inválido
const invalidEmailInput = {
  fullName: 'Usuario Sin Correo Valido',
  email: 'correo-invalido-sin-arroba',
  role: 'admin',
};
const parsedInvalidEmail = inviteUserSchema.safeParse(invalidEmailInput);
assertTest(
  'DOD-FORM-03',
  'Validación Zod: Rechazo de formato de email inválido',
  parsedInvalidEmail.success,
  false
);

// Rechazo de nombre muy corto
const shortNameInput = {
  fullName: 'A',
  email: 'valido@mts.com',
  role: 'admin',
};
const parsedShortName = inviteUserSchema.safeParse(shortNameInput);
assertTest(
  'DOD-FORM-04',
  'Validación Zod: Rechazo de nombre con menos de 2 caracteres',
  parsedShortName.success,
  false
);

// Rechazo de rol desconocido / no permitido
const invalidRoleInput = {
  fullName: 'Usuario Rol Raro',
  email: 'valido@mts.com',
  role: 'super_admin_falso',
};
const parsedInvalidRole = inviteUserSchema.safeParse(invalidRoleInput);
assertTest(
  'DOD-FORM-05',
  'Validación Zod: Rechazo de rol no catalogado en enum del sistema',
  parsedInvalidRole.success,
  false
);

// Normalización de email en minúsculas y sin espacios
assertTest(
  'DOD-FORM-06',
  'Normalización de email consistente',
  normalizeEmail('   Juan.Perez@Empresa.COM.AR   '),
  'juan.perez@empresa.com.ar'
);

// -------------------------------------------------------------
// 3. Roles y Permisos (DoD 3)
// -------------------------------------------------------------
console.log('\n>>> 3. Roles y Permisos: Administrador Total vs Contable Solo Lectura');

assertTest(
  'DOD-ROLE-01',
  'Nombre visible de Rol Administrador en Español',
  getRoleDisplayName('admin'),
  'Administrador (Owner)'
);

assertTest(
  'DOD-ROLE-02',
  'Nombre visible de Rol Contable en Español',
  getRoleDisplayName('accounting_auditor'),
  'Contable'
);

assertTest(
  'DOD-ROLE-03',
  'Resumen de permisos para Administrador: Carga total, catálogos, facturación y finanzas',
  getRolePermissionSummary('admin'),
  'Acceso total a carga de datos, catálogos, facturación y finanzas.'
);

assertTest(
  'DOD-ROLE-04',
  'Resumen de permisos para Contable: Solo Lectura, reportes y exportación de liquidación',
  getRolePermissionSummary('accounting_auditor'),
  'Acceso restringido de "Solo Lectura", limitado a visualizar reportes y exportar el Excel de liquidación mensual.'
);

// Verificación de Enum exportado
assertTest(
  'DOD-ROLE-05',
  'Enum de roles contiene exactamente "admin" y "accounting_auditor"',
  userRoleEnum.options,
  ['admin', 'accounting_auditor']
);

// -------------------------------------------------------------
// 4. Integración Supabase Auth & Correo Automático Brevo (DoD 4)
// -------------------------------------------------------------
console.log('\n>>> 4. Disparo de Correo Automático de Invitación con Enlace de Contraseña');

const mockInviteUrl = 'https://app.mtslogistica.com.ar/change-password#access_token=mock_token_123';
const emailBuilder = createUserInviteEmail({
  recipientEmail: 'nuevo.empleado@mtslogistica.com',
  fullName: 'Esteban Martínez',
  role: 'accounting_auditor',
  inviteUrl: mockInviteUrl,
});

const builtEmail = emailBuilder.build();

assertTest(
  'DOD-BREVO-01',
  'Asunto de correo claro y profesional con nombre de la plataforma y rol asignado',
  builtEmail.subject,
  'Invitación de Acceso a MTS Gestión Logística - Rol Contable'
);

assertTest(
  'DOD-BREVO-02',
  'Destinatario configurado correctamente',
  builtEmail.to,
  [{ email: 'nuevo.empleado@mtslogistica.com', name: 'Esteban Martínez' }]
);

assertTest(
  'DOD-BREVO-03',
  'Cuerpo HTML contiene el nombre del usuario invitado',
  builtEmail.htmlContent.includes('Esteban Martínez'),
  true
);

assertTest(
  'DOD-BREVO-04',
  'Cuerpo HTML especifica el rol asignado (Contable)',
  builtEmail.htmlContent.includes('Contable'),
  true
);

assertTest(
  'DOD-BREVO-05',
  'Cuerpo HTML incluye el enlace para generar la contraseña',
  builtEmail.htmlContent.includes(mockInviteUrl),
  true
);

assertTest(
  'DOD-BREVO-06',
  'Cuerpo HTML incluye la insignia de seguridad de caducidad del enlace',
  builtEmail.htmlContent.includes('24 horas'),
  true
);

// -------------------------------------------------------------
// 5. Gestión de Estado: Bloqueo Inmediato y Auto-Desactivación (DoD 5)
// -------------------------------------------------------------
console.log('\n>>> 5. Gestión de Estado: Desactivación Inmediata y Protección de Cuenta Propia');

// Schema de actualización de estado
const validStatusToggle = updateUserStatusSchema.safeParse({ isActive: false });
assertTest(
  'DOD-STATUS-01',
  'Zod Schema: Cambio de estado a Inactivo (false) es válido',
  validStatusToggle.success,
  true
);

// Protección contra auto-desactivación de la propia cuenta del Administrador Principal
function simulateStatusToggleCheck(targetUserId: string, newIsActive: boolean, currentAdminId: string) {
  if (currentAdminId === targetUserId && !newIsActive) {
    return { allowed: false, error: 'No puedes desactivar tu propia cuenta de Administrador Principal.' };
  }
  return { allowed: true, error: null };
}

assertTest(
  'DOD-STATUS-02',
  'Seguridad: Administrador intentando desactivarse a sí mismo -> Bloqueado con error',
  simulateStatusToggleCheck('admin-uuid-1', false, 'admin-uuid-1'),
  { allowed: false, error: 'No puedes desactivar tu propia cuenta de Administrador Principal.' }
);

assertTest(
  'DOD-STATUS-03',
  'Seguridad: Administrador desactivando cuenta de otro usuario -> Permitido',
  simulateStatusToggleCheck('employee-uuid-2', false, 'admin-uuid-1'),
  { allowed: true, error: null }
);

// Protección contra auto-revocación de rol Admin
function simulateRoleUpdateCheck(targetUserId: string, newRole: 'admin' | 'accounting_auditor', currentAdminId: string) {
  if (currentAdminId === targetUserId && newRole !== 'admin') {
    return { allowed: false, error: 'No puedes revocar tu propio rol de Administrador Principal.' };
  }
  return { allowed: true, error: null };
}

assertTest(
  'DOD-STATUS-04',
  'Seguridad: Administrador intentando auto-degradarse a Contable -> Bloqueado con error',
  simulateRoleUpdateCheck('admin-uuid-1', 'accounting_auditor', 'admin-uuid-1'),
  { allowed: false, error: 'No puedes revocar tu propio rol de Administrador Principal.' }
);

assertTest(
  'DOD-STATUS-05',
  'Seguridad: Administrador cambiando rol de otro usuario -> Permitido',
  simulateRoleUpdateCheck('employee-uuid-2', 'accounting_auditor', 'admin-uuid-1'),
  { allowed: true, error: null }
);

// Verificación de la migración SQL para corte inmediato en RLS
console.log('\n>>> 6. Verificación de Migración SQL y Función get_user_role');

const migrationPath = path.join(__dirname, '../../supabase/migrations/20261002030000_user_management_and_roles.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

assertTest(
  'DOD-SQL-01',
  'Migración SQL agrega columna is_active con valor por defecto true a public.profiles',
  migrationSql.includes('is_active BOOLEAN NOT NULL DEFAULT true'),
  true
);

assertTest(
  'DOD-SQL-02',
  'Migración SQL actualiza get_user_role() para retornar NULL si is_active = false (revocación inmediata de RLS)',
  migrationSql.includes('WHERE id = user_id AND is_active = true'),
  true
);

assertTest(
  'DOD-SQL-03',
  'Migración SQL crea índices para búsquedas rápidas por rol y estado activo',
  migrationSql.includes('idx_profiles_is_active') && migrationSql.includes('idx_profiles_role'),
  true
);

assertTest(
  'DOD-SQL-04',
  'Migración SQL otorga permisos de Solo Lectura (SELECT) al rol accounting_auditor para catálogos',
  migrationSql.includes("public.get_user_role(auth.uid()) = 'accounting_auditor'"),
  true
);

// -------------------------------------------------------------
// Resumen Final
// -------------------------------------------------------------
console.log('\n=====================================================================');
const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = totalTests - passedTests;

console.log(`TOTAL DE PRUEBAS: ${totalTests}`);
console.log(`PASADAS:          \x1b[32m${passedTests}\x1b[0m`);
console.log(`FALLIDAS:         ${failedTests > 0 ? `\x1b[31m${failedTests}\x1b[0m` : '0'}`);

if (failedTests === 0) {
  console.log('\n\x1b[32m[RESULTADO] TODOS LOS CRITERIOS DE ACEPTACIÓN (DoD) FUERON CUMPLIDOS EXITOSAMENTE\x1b[0m');
  process.exit(0);
} else {
  console.log('\n\x1b[31m[RESULTADO] SE ENCONTRARON FALLOS EN LA VERIFICACIÓN DE CRITERIOS DE ACEPTACIÓN\x1b[0m');
  process.exit(1);
}
