/**
 * scripts/create-test-users.ts
 * 
 * Crea los usuarios de prueba en Supabase Auth usando service_role con email_confirm: true.
 * Esto evita el envío de correos de confirmación reales y auto-crea el perfil vía trigger.
 * 
 * Usuarios:
 * - zztest-admin@example.com (role: admin)
 * - zztest-auditor@example.com (role: accounting_auditor)
 * 
 * Ejecución: npx tsx scripts/create-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  {
    email: 'zztest-admin@example.com',
    password: 'ZZTestPass2026!',
    full_name: 'ZZTEST Administrador QA',
    role: 'admin',
  },
  {
    email: 'zztest-auditor@example.com',
    password: 'ZZTestPass2026!',
    full_name: 'ZZTEST Auditor Contable QA',
    role: 'accounting_auditor',
  },
];

export async function createTestUsers() {
  console.log('👤 Creando/verificando usuarios de prueba en Supabase Auth...');

  for (const user of TEST_USERS) {
    // 1. Buscar si ya existe el usuario
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('Error al listar usuarios:', listError.message);
      continue;
    }

    const existingUser = listData.users.find((u) => u.email === user.email);

    if (existingUser) {
      console.log(`  ✓ Usuario ${user.email} ya existe (ID: ${existingUser.id}). Actualizando metadata...`);
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: user.password,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
      });

      // Asegurar perfil
      await supabaseAdmin.from('profiles').upsert({
        id: existingUser.id,
        full_name: user.full_name,
        role: user.role as any,
      });
    } else {
      console.log(`  -> Creando usuario ${user.email} con email_confirm: true...`);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
      });

      if (createError) {
        console.error(`  ❌ Error al crear ${user.email}:`, createError.message);
      } else if (createData.user) {
        console.log(`  ✓ Usuario creado con éxito (ID: ${createData.user.id}).`);
        // Asegurar que profiles tenga el rol correcto
        await supabaseAdmin.from('profiles').upsert({
          id: createData.user.id,
          full_name: user.full_name,
          role: user.role as any,
        });
      }
    }
  }

  console.log('✅ Usuarios de prueba listos para autenticación en tests.');
}

if (require.main === module) {
  createTestUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error:', err);
      process.exit(1);
    });
}
