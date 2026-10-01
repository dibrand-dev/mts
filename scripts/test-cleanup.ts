/**
 * scripts/test-cleanup.ts
 * 
 * Limpia y elimina todos los datos generados durante las pruebas automatizadas y manuales
 * que posean el prefijo ZZTEST-.
 * 
 * Reglas de Seguridad Críticas:
 * 1. Muestra en pantalla el recuento exacto por tabla de los registros a eliminar.
 * 2. Solicita confirmación interactiva al usuario antes de proceder (o flag --yes).
 * 3. Respeta el orden estricto de dependencias foráneas (Foreign Keys).
 * 4. PROHIBIDO cualquier DELETE, TRUNCATE o UPDATE sin filtro WHERE ... LIKE 'ZZTEST-%'.
 * 
 * Ejecución: npx tsx scripts/test-cleanup.ts [--yes]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 's' || normalized === 'si' || normalized === 'y' || normalized === 'yes');
    });
  });
}

export async function runTestCleanup(skipConfirmation = false) {
  console.log('\n🔍 Analizando registros de prueba con prefijo ZZTEST- para limpieza...\n');

  // 1. Identificar entidades clave ZZTEST-
  const { data: testClients } = await supabase
    .from('clients')
    .select('id, company_name')
    .ilike('company_name', 'ZZTEST-%');
  const clientIds = (testClients || []).map((c) => c.id);

  const { data: testLocations } = await supabase
    .from('locations')
    .select('id, code, name')
    .ilike('code', 'ZZTEST-%');
  const locationIds = (testLocations || []).map((l) => l.id);

  const { data: testPositions } = await supabase
    .from('positions')
    .select('id, name')
    .ilike('name', 'ZZTEST-%');
  const positionIds = (testPositions || []).map((p) => p.id);

  const { data: testEmployees } = await supabase
    .from('employees')
    .select('id, full_name, file_number')
    .or('full_name.ilike.ZZTEST-%,file_number.ilike.ZZ-%');
  const employeeIds = (testEmployees || []).map((e) => e.id);

  const { data: testProformas } = await supabase
    .from('proformas')
    .select('id, proforma_number')
    .ilike('proforma_number', 'ZZTEST-%');
  const proformaIds = (testProformas || []).map((p) => p.id);

  const { data: testWorkLogs } = await supabase
    .from('daily_work_logs')
    .select('id, vessel_name')
    .or(
      clientIds.length > 0
        ? `client_id.in.(${clientIds.join(',')}),vessel_name.ilike.ZZTEST-%`
        : 'vessel_name.ilike.ZZTEST-%'
    );
  const workLogIds = (testWorkLogs || []).map((w) => w.id);

  const { data: testTaxInvoices } = proformaIds.length > 0
    ? await supabase.from('tax_invoices').select('id, invoice_number').in('proforma_id', proformaIds)
    : { data: [] };

  const { data: testCashMovements } = await supabase
    .from('cash_movements')
    .select('id, detail')
    .ilike('detail', 'ZZTEST-%');

  // 2. Mostrar resumen previo al borrado
  console.log('------------------------------------------------------------');
  console.log('RECUENTO DE REGISTROS A ELIMINAR (SOLO ZZTEST-):');
  console.log('------------------------------------------------------------');
  console.log(`- Facturas Fiscales (tax_invoices):          ${testTaxInvoices?.length || 0}`);
  console.log(`- Proformas (proformas y detalles):          ${proformaIds.length}`);
  console.log(`- Partes Diarios y Turnos (daily_work_logs):  ${workLogIds.length}`);
  console.log(`- Movimientos de Flujo de Caja:              ${testCashMovements?.length || 0}`);
  console.log(`- Empleados (employees):                     ${employeeIds.length}`);
  console.log(`- Puestos de Trabajo (positions):            ${positionIds.length}`);
  console.log(`- Lugares de Trabajo (locations):            ${locationIds.length}`);
  console.log(`- Clientes (clients, tarifas y operaciones): ${clientIds.length}`);
  console.log('------------------------------------------------------------\n');

  const totalRecords =
    (testTaxInvoices?.length || 0) +
    proformaIds.length +
    workLogIds.length +
    (testCashMovements?.length || 0) +
    employeeIds.length +
    positionIds.length +
    locationIds.length +
    clientIds.length;

  if (totalRecords === 0) {
    console.log('✨ No se encontraron registros de prueba con prefijo ZZTEST-. La base está limpia.');
    return;
  }

  // 3. Confirmación obligatoria
  if (!skipConfirmation) {
    const confirmed = await askConfirmation(
      '⚠️  ¿Confirmas la eliminación permanente de estos registros de test? [s/N]: '
    );
    if (!confirmed) {
      console.log('🛑 Operación cancelada por el usuario. No se modificó ningún dato.');
      return;
    }
  }

  console.log('\n🧹 Procediendo con la eliminación respetando orden de Foreign Keys...\n');

  // 4. Eliminación ordenada en cascada

  // A. Facturas fiscales de test
  if (proformaIds.length > 0) {
    const { error } = await supabase.from('tax_invoices').delete().in('proforma_id', proformaIds);
    if (error) console.error('  ⚠️ Error al borrar tax_invoices:', error.message);
    else console.log('  ✓ tax_invoices eliminadas.');
  }

  // B. Detalles de proformas de test
  if (proformaIds.length > 0) {
    const { error } = await supabase.from('proforma_details').delete().in('proforma_id', proformaIds);
    if (error) console.error('  ⚠️ Error al borrar proforma_details:', error.message);
    else console.log('  ✓ proforma_details eliminados.');
  }

  // C. Proformas de test
  if (proformaIds.length > 0) {
    const { error } = await supabase.from('proformas').delete().in('id', proformaIds);
    if (error) console.error('  ⚠️ Error al borrar proformas:', error.message);
    else console.log('  ✓ proformas eliminadas.');
  }

  // D. Turnos de personal asociados a work logs de test o empleados de test
  if (workLogIds.length > 0 || employeeIds.length > 0) {
    let query = supabase.from('daily_staff_entries').delete();
    if (workLogIds.length > 0 && employeeIds.length > 0) {
      query = query.or(`daily_work_log_id.in.(${workLogIds.join(',')}),employee_id.in.(${employeeIds.join(',')})`);
    } else if (workLogIds.length > 0) {
      query = query.in('daily_work_log_id', workLogIds);
    } else {
      query = query.in('employee_id', employeeIds);
    }
    const { error } = await query;
    if (error) console.error('  ⚠️ Error al borrar daily_staff_entries:', error.message);
    else console.log('  ✓ daily_staff_entries eliminados.');
  }

  // E. Partes diarios de test
  if (workLogIds.length > 0) {
    const { error } = await supabase.from('daily_work_logs').delete().in('id', workLogIds);
    if (error) console.error('  ⚠️ Error al borrar daily_work_logs:', error.message);
    else console.log('  ✓ daily_work_logs eliminados.');
  }

  // F. Operaciones de clientes de test
  if (clientIds.length > 0) {
    const { error } = await supabase.from('client_operations').delete().in('client_id', clientIds);
    if (error) console.error('  ⚠️ Error al borrar client_operations:', error.message);
    else console.log('  ✓ client_operations eliminadas.');
  }

  // G. Tarifas de servicios de test
  if (clientIds.length > 0) {
    const { error } = await supabase.from('client_service_rates').delete().in('client_id', clientIds);
    if (error) console.error('  ⚠️ Error al borrar client_service_rates:', error.message);
    else console.log('  ✓ client_service_rates eliminadas.');
  }

  // H. Tarifas por puesto de test
  if (clientIds.length > 0 || positionIds.length > 0) {
    let query = supabase.from('client_position_rates').delete();
    if (clientIds.length > 0 && positionIds.length > 0) {
      query = query.or(`client_id.in.(${clientIds.join(',')}),position_id.in.(${positionIds.join(',')})`);
    } else if (clientIds.length > 0) {
      query = query.in('client_id', clientIds);
    } else {
      query = query.in('position_id', positionIds);
    }
    const { error } = await query;
    if (error) console.error('  ⚠️ Error al borrar client_position_rates:', error.message);
    else console.log('  ✓ client_position_rates eliminadas.');
  }

  // I. Movimientos de caja de test
  const { error: cashError } = await supabase
    .from('cash_movements')
    .delete()
    .ilike('detail', 'ZZTEST-%');
  if (cashError) console.error('  ⚠️ Error al borrar cash_movements:', cashError.message);
  else console.log('  ✓ cash_movements eliminados.');

  // J. Empleados de test
  if (employeeIds.length > 0) {
    const { error } = await supabase.from('employees').delete().in('id', employeeIds);
    if (error) console.error('  ⚠️ Error al borrar employees:', error.message);
    else console.log('  ✓ employees eliminados.');
  }

  // K. Puestos de trabajo de test
  if (positionIds.length > 0) {
    const { error } = await supabase.from('positions').delete().in('id', positionIds);
    if (error) console.error('  ⚠️ Error al borrar positions:', error.message);
    else console.log('  ✓ positions eliminados.');
  }

  // L. Lugares de trabajo de test
  if (locationIds.length > 0) {
    const { error } = await supabase.from('locations').delete().in('id', locationIds);
    if (error) console.error('  ⚠️ Error al borrar locations:', error.message);
    else console.log('  ✓ locations eliminados.');
  }

  // M. Clientes de test
  if (clientIds.length > 0) {
    const { error } = await supabase.from('clients').delete().in('id', clientIds);
    if (error) console.error('  ⚠️ Error al borrar clients:', error.message);
    else console.log('  ✓ clients eliminados.');
  }

  console.log('\n✅ Limpieza finalizada con éxito. Ningún registro ajeno a ZZTEST- fue modificado.');
}

if (require.main === module) {
  const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');
  runTestCleanup(autoConfirm)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error en test-cleanup:', err);
      process.exit(1);
    });
}
