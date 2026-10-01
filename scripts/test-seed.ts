/**
 * scripts/test-seed.ts
 * 
 * Genera un dataset determinístico, idempotente y aislado para la ejecución
 * de pruebas de QA. Todo registro creado lleva el prefijo ZZTEST-.
 * 
 * Requisitos:
 * - Se ejecuta usando SUPABASE_SERVICE_ROLE_KEY para evitar bloqueos por RLS.
 * - Utiliza UUIDs fijos y cláusulas ON CONFLICT / validación de existencia para ser idempotente.
 * - Cubre las 4 estrategias de facturación (vessel, fiscal_yard, fixed_deposit, shared_expo, standard).
 * 
 * Ejecución: npx tsx scripts/test-seed.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de .env.test o .env
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

// UUIDs Determinísticos Fijos
export const SEED_IDS = {
  // Puestos
  POSITION_APUNTADOR: 'e1000000-0000-0000-0000-000000000001',
  POSITION_ENCARGADO: 'e1000000-0000-0000-0000-000000000002',
  POSITION_CHOFER: 'e1000000-0000-0000-0000-000000000003',

  // Lugares
  LOCATION_TZ: '11000000-0000-0000-0000-000000000001',
  LOCATION_DELTA_DOCK: '11000000-0000-0000-0000-000000000002',

  // Clientes
  CLIENT_CAT: 'c1000000-0000-0000-0000-000000000001',
  CLIENT_DELTA_DOCK: 'c1000000-0000-0000-0000-000000000002',
  CLIENT_COOPTACORD: 'c1000000-0000-0000-0000-000000000003',
  CLIENT_DANCHUK: 'c1000000-0000-0000-0000-000000000004',

  // Empleados
  EMP_JUAN: 'a1000000-0000-0000-0000-000000000001',
  EMP_CARLOS: 'a1000000-0000-0000-0000-000000000002',
  EMP_MARIO: 'a1000000-0000-0000-0000-000000000003',
  EMP_LUIS: 'a1000000-0000-0000-0000-000000000004',

  // Work Logs
  WORK_LOG_CAT_01: 'b1000000-0000-0000-0000-000000000001',
  WORK_LOG_CAT_02: 'b1000000-0000-0000-0000-000000000002',
  WORK_LOG_DELTA_01: 'b1000000-0000-0000-0000-000000000003',
  WORK_LOG_COOP_01: 'b1000000-0000-0000-0000-000000000004',

  // Proformas
  PROFORMA_DRAFT: 'f1000000-0000-0000-0000-000000000001',
  PROFORMA_SENT: 'f1000000-0000-0000-0000-000000000002',
  PROFORMA_APPROVED: 'f1000000-0000-0000-0000-000000000003',
  PROFORMA_INVOICED: 'f1000000-0000-0000-0000-000000000004',
  PROFORMA_PAID: 'f1000000-0000-0000-0000-000000000005',
};

export async function runTestSeed() {
  console.log('🌱 Iniciando carga de dataset de prueba determinístico (ZZTEST-)...');

  // 0. Obtener usuario admin o primer usuario para campos logged_by
  const { data: profiles } = await supabase.from('profiles').select('id, role').limit(5);
  const adminProfile = profiles?.find((p) => p.role === 'admin') || profiles?.[0];
  const loggedByUserId = adminProfile?.id || '00000000-0000-0000-0000-000000000000';

  // 1. Tipos de Hora (Hour Types)
  console.log('  -> Verificando tipos de hora...');
  const { data: hourTypes } = await supabase.from('hour_types').select('id, code');
  const regularHt = hourTypes?.find((h) => h.code === 'REGULAR');
  const ot50Ht = hourTypes?.find((h) => h.code === 'OVERTIME_50');
  const ot100Ht = hourTypes?.find((h) => h.code === 'OVERTIME_100');

  if (!regularHt || !ot50Ht || !ot100Ht) {
    console.log('     Insertando hour_types faltantes...');
    await supabase.from('hour_types').upsert(
      [
        { code: 'REGULAR', description: 'Hora Normal' },
        { code: 'OVERTIME_50', description: 'Hora Extra 50%' },
        { code: 'OVERTIME_100', description: 'Hora Extra 100%' },
      ],
      { onConflict: 'code' }
    );
  }

  // Refetch hour types con sus IDs
  const { data: finalHt } = await supabase.from('hour_types').select('id, code');
  const htRegId = finalHt!.find((h) => h.code === 'REGULAR')!.id;
  const ht50Id = finalHt!.find((h) => h.code === 'OVERTIME_50')!.id;
  const ht100Id = finalHt!.find((h) => h.code === 'OVERTIME_100')!.id;

  // 2. Puestos de Trabajo (Positions)
  console.log('  -> Insertando puestos de trabajo...');
  const positionsToUpsert = [
    {
      id: SEED_IDS.POSITION_APUNTADOR,
      name: 'ZZTEST-Apuntador General',
      requires_vehicle_bonus: false,
    },
    {
      id: SEED_IDS.POSITION_ENCARGADO,
      name: 'ZZTEST-Encargado de Turno',
      requires_vehicle_bonus: true,
    },
    {
      id: SEED_IDS.POSITION_CHOFER,
      name: 'ZZTEST-Chofer Logístico',
      requires_vehicle_bonus: false,
    },
  ];

  for (const pos of positionsToUpsert) {
    await supabase.from('positions').upsert(pos, { onConflict: 'id' });
  }

  // 3. Lugares de Trabajo (Locations)
  console.log('  -> Insertando lugares de trabajo...');
  const locationsToUpsert = [
    {
      id: SEED_IDS.LOCATION_TZ,
      code: 'ZZTEST-LOC-TZ',
      name: 'ZZTEST-Terminal Zárate Muelle',
      port_city: 'Zárate, Buenos Aires',
      status: 'active',
    },
    {
      id: SEED_IDS.LOCATION_DELTA_DOCK,
      code: 'ZZTEST-LOC-DD',
      name: 'ZZTEST-Delta Dock Silos',
      port_city: 'Lima, Buenos Aires',
      status: 'active',
    },
  ];

  for (const loc of locationsToUpsert) {
    await supabase.from('locations').upsert(loc, { onConflict: 'id' });
  }

  // 4. Clientes (Clients) - Cubriendo las 4 estrategias de facturación
  console.log('  -> Insertando clientes para las 4 estrategias...');
  const clientsToUpsert = [
    {
      id: SEED_IDS.CLIENT_CAT,
      company_name: 'ZZTEST-CAT Logística Automotriz SA',
      tax_id: '30-99999001-9',
      billing_email: 'zztest-cat-billing@example.com',
      phone_number: '+541199990001',
      payment_due_days: 15,
      is_active: true,
    },
    {
      id: SEED_IDS.CLIENT_DELTA_DOCK,
      company_name: 'ZZTEST-Delta Dock Depósitos SA',
      tax_id: '30-99999002-9',
      billing_email: 'zztest-deltadock-billing@example.com',
      phone_number: '+541199990002',
      payment_due_days: 30,
      is_active: true,
    },
    {
      id: SEED_IDS.CLIENT_COOPTACORD,
      company_name: 'ZZTEST-Cooptacord Operativa SA',
      tax_id: '30-99999003-9',
      billing_email: 'zztest-cooptacord-billing@example.com',
      phone_number: '+541199990003',
      payment_due_days: 15,
      is_active: true,
    },
    {
      id: SEED_IDS.CLIENT_DANCHUK,
      company_name: 'ZZTEST-Sergio Danchuk Portuarios SA',
      tax_id: '30-99999004-9',
      billing_email: 'zztest-danchuk-billing@example.com',
      phone_number: '+541199990004',
      payment_due_days: 7,
      is_active: true,
    },
  ];

  for (const client of clientsToUpsert) {
    await supabase.from('clients').upsert(client, { onConflict: 'id' });
  }

  // 5. Operaciones de Cliente (Client Operations)
  console.log('  -> Insertando operaciones y buques...');
  const operationsToUpsert = [
    {
      client_id: SEED_IDS.CLIENT_CAT,
      name: 'ZZTEST-BRASILIA TEST',
      operation_type: 'vessel',
      is_active: true,
    },
    {
      client_id: SEED_IDS.CLIENT_CAT,
      name: 'ZZTEST-PLAZOLETA FISCAL TEST',
      operation_type: 'yard',
      is_active: true,
    },
    {
      client_id: SEED_IDS.CLIENT_DELTA_DOCK,
      name: 'ZZTEST-DEPÓSITO NACIONAL TEST',
      operation_type: 'deposit',
      is_active: true,
    },
  ];

  for (const op of operationsToUpsert) {
    await supabase.from('client_operations').upsert(op, { onConflict: 'client_id,name' });
  }

  // 6. Tarifario Comercial por Cliente (client_position_rates)
  console.log('  -> Configurando tarifario comercial...');
  const ratesToUpsert = [
    // CAT - Apuntador
    { client_id: SEED_IDS.CLIENT_CAT, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: htRegId, hourly_rate: 16254.43, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_CAT, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: ht50Id, hourly_rate: 22919.57, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_CAT, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: ht100Id, hourly_rate: 29749.58, effective_from: '2026-09-01' },
    // CAT - Encargado
    { client_id: SEED_IDS.CLIENT_CAT, position_id: SEED_IDS.POSITION_ENCARGADO, hour_type_id: htRegId, hourly_rate: 22362.87, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_CAT, position_id: SEED_IDS.POSITION_ENCARGADO, hour_type_id: ht50Id, hourly_rate: 29082.92, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_CAT, position_id: SEED_IDS.POSITION_ENCARGADO, hour_type_id: ht100Id, hourly_rate: 37743.22, effective_from: '2026-09-01' },
    // Delta Dock - Apuntador
    { client_id: SEED_IDS.CLIENT_DELTA_DOCK, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: htRegId, hourly_rate: 31060.79, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_DELTA_DOCK, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: ht50Id, hourly_rate: 46591.18, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_DELTA_DOCK, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: ht100Id, hourly_rate: 62121.57, effective_from: '2026-09-01' },
    // Cooptacord - Apuntador
    { client_id: SEED_IDS.CLIENT_COOPTACORD, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: htRegId, hourly_rate: 31602.72, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_COOPTACORD, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: ht50Id, hourly_rate: 47404.08, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_COOPTACORD, position_id: SEED_IDS.POSITION_APUNTADOR, hour_type_id: ht100Id, hourly_rate: 63205.44, effective_from: '2026-09-01' },
  ];

  await supabase.from('client_position_rates').upsert(ratesToUpsert, {
    onConflict: 'client_id,position_id,hour_type_id,effective_from',
  });

  // 7. Tarifas de Servicios Suplementarios (client_service_rates)
  console.log('  -> Configurando tarifas de servicios especiales...');
  const serviceRatesToUpsert = [
    { client_id: SEED_IDS.CLIENT_CAT, service_code: 'VEHICLE_NORMAL', description: 'Vehículo hábil', rate_value: 2744.17, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_CAT, service_code: 'VEHICLE_OVERTIME', description: 'Vehículo inhábil', rate_value: 5488.11, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_CAT, service_code: 'SHUTTLE', description: 'Remis CAT', rate_value: 35594.34, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_CAT, service_code: 'PLUS_MARKUP', description: 'Markup Plus', rate_value: 0.52, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_DELTA_DOCK, service_code: 'FIXED_MONTHLY_DEPOSIT_NACIONAL', description: 'Abono Nacional', rate_value: 5466694.70, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_DELTA_DOCK, service_code: 'FIXED_MONTHLY_DEPOSIT_FISCAL', description: 'Abono Fiscal', rate_value: 5466694.70, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_DELTA_DOCK, service_code: 'SHUTTLE_TRAMO', description: 'Tramo Transporte DD', rate_value: 37249.77, effective_from: '2026-09-01' },
    { client_id: SEED_IDS.CLIENT_COOPTACORD, service_code: 'COPARTICIPATION_FACTOR', description: 'Factor Coparticipación', rate_value: 0.10, effective_from: '2026-09-01' },
  ];

  await supabase.from('client_service_rates').upsert(serviceRatesToUpsert, {
    onConflict: 'client_id,service_code,effective_from',
  });

  // 8. Personal Operativo (Employees)
  console.log('  -> Insertando personal operativo...');
  const employeesToUpsert = [
    {
      id: SEED_IDS.EMP_JUAN,
      national_id: '99000001',
      file_number: 'ZZ-001',
      tax_id: '20-99000001-9',
      full_name: 'ZZTEST-Operario Juan Pérez',
      default_position_id: SEED_IDS.POSITION_APUNTADOR,
      phone_number: '+541199000001',
      status: 'active',
    },
    {
      id: SEED_IDS.EMP_CARLOS,
      national_id: '99000002',
      file_number: 'ZZ-002',
      tax_id: '20-99000002-9',
      full_name: 'ZZTEST-Operario Carlos Gómez',
      default_position_id: SEED_IDS.POSITION_APUNTADOR,
      phone_number: '+541199000002',
      status: 'active',
    },
    {
      id: SEED_IDS.EMP_MARIO,
      national_id: '99000003',
      file_number: 'ZZ-003',
      tax_id: '20-99000003-9',
      full_name: 'ZZTEST-Encargado Mario Rossi',
      default_position_id: SEED_IDS.POSITION_ENCARGADO,
      phone_number: '+541199000003',
      status: 'active',
    },
    {
      id: SEED_IDS.EMP_LUIS,
      national_id: '99000004',
      file_number: 'ZZ-004',
      tax_id: '20-99000004-9',
      full_name: 'ZZTEST-Operario Luis Díaz',
      default_position_id: SEED_IDS.POSITION_APUNTADOR,
      phone_number: '+541199000004',
      status: 'active',
    },
  ];

  for (const emp of employeesToUpsert) {
    await supabase.from('employees').upsert(emp, { onConflict: 'id' });
  }

  // 9. Partes Diarios y Turnos Operativos (Daily Work Logs y Entries)
  console.log('  -> Insertando partes diarios y turnos operativos...');
  const workLogs = [
    {
      id: SEED_IDS.WORK_LOG_CAT_01,
      work_date: '2026-09-14',
      client_id: SEED_IDS.CLIENT_CAT,
      location_id: SEED_IDS.LOCATION_TZ,
      vessel_name: 'ZZTEST-BRASILIA TEST',
      vehicles_discharged: 1500,
      vehicles_loaded: 1000,
      vehicles_shifted: 0,
      total_vehicles_handled: 2500,
      is_export_day: false,
      logged_by: loggedByUserId,
    },
    {
      id: SEED_IDS.WORK_LOG_CAT_02,
      work_date: '2026-09-15',
      client_id: SEED_IDS.CLIENT_CAT,
      location_id: SEED_IDS.LOCATION_TZ,
      vessel_name: 'ZZTEST-BRASILIA TEST',
      vehicles_discharged: 505,
      vehicles_loaded: 831,
      vehicles_shifted: 0,
      total_vehicles_handled: 1336,
      is_export_day: false,
      logged_by: loggedByUserId,
    },
    {
      id: SEED_IDS.WORK_LOG_DELTA_01,
      work_date: '2026-09-10',
      client_id: SEED_IDS.CLIENT_DELTA_DOCK,
      location_id: SEED_IDS.LOCATION_DELTA_DOCK,
      total_vehicles_handled: 0,
      is_export_day: false,
      logged_by: loggedByUserId,
    },
  ];

  for (const wl of workLogs) {
    await supabase.from('daily_work_logs').upsert(wl, { onConflict: 'id' });
  }

  // Entradas de Personal en los Partes Diarios
  const staffEntries = [
    // Turno Juan Pérez en CAT - Aprobado, 8 hs normales
    {
      daily_work_log_id: SEED_IDS.WORK_LOG_CAT_01,
      employee_id: SEED_IDS.EMP_JUAN,
      position_id: SEED_IDS.POSITION_APUNTADOR,
      shift_start_date: '2026-09-14',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-09-14',
      shift_end_time: '16:00:00',
      regular_hours: 8.0,
      overtime_50_hours: 0.0,
      overtime_100_hours: 0.0,
      shuttles_count: 0,
      plus_delta_amount: 0,
      meal_allowance_count: 1,
      advance_payment_amount: 0,
      is_approved: true,
      approved_at: '2026-09-14T20:00:00Z',
    },
    // Turno Carlos Gómez en CAT - Aprobado, 10 hs (8 normales + 2 extras 50%)
    {
      daily_work_log_id: SEED_IDS.WORK_LOG_CAT_01,
      employee_id: SEED_IDS.EMP_CARLOS,
      position_id: SEED_IDS.POSITION_APUNTADOR,
      shift_start_date: '2026-09-14',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-09-14',
      shift_end_time: '18:00:00',
      regular_hours: 8.0,
      overtime_50_hours: 2.0,
      overtime_100_hours: 0.0,
      shuttles_count: 0,
      plus_delta_amount: 0,
      meal_allowance_count: 1,
      advance_payment_amount: 5000,
      is_approved: true,
      approved_at: '2026-09-14T20:00:00Z',
    },
    // Turno Encargado Mario Rossi en CAT - Aprobado, con 2 remises y plus
    {
      daily_work_log_id: SEED_IDS.WORK_LOG_CAT_01,
      employee_id: SEED_IDS.EMP_MARIO,
      position_id: SEED_IDS.POSITION_ENCARGADO,
      shift_start_date: '2026-09-14',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-09-14',
      shift_end_time: '18:00:00',
      regular_hours: 8.0,
      overtime_50_hours: 2.0,
      overtime_100_hours: 0.0,
      shuttles_count: 2,
      plus_delta_amount: 15000,
      meal_allowance_count: 1,
      advance_payment_amount: 0,
      is_approved: true,
      approved_at: '2026-09-14T20:00:00Z',
    },
    // Turno Luis Díaz en CAT - Pendiente de Aprobación (para probar filtros)
    {
      daily_work_log_id: SEED_IDS.WORK_LOG_CAT_02,
      employee_id: SEED_IDS.EMP_LUIS,
      position_id: SEED_IDS.POSITION_APUNTADOR,
      shift_start_date: '2026-09-15',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-09-15',
      shift_end_time: '16:00:00',
      regular_hours: 8.0,
      overtime_50_hours: 0.0,
      overtime_100_hours: 0.0,
      shuttles_count: 0,
      plus_delta_amount: 0,
      meal_allowance_count: 1,
      advance_payment_amount: 0,
      is_approved: false,
    },
  ];

  // Limpiar entries previas de estos logs antes de reinsertar para garantizar idempotencia
  for (const wl of workLogs) {
    await supabase.from('daily_staff_entries').delete().eq('daily_work_log_id', wl.id);
  }
  await supabase.from('daily_staff_entries').insert(staffEntries);

  // 10. Proformas en diversos estados
  console.log('  -> Insertando proformas en cada estado del ciclo de vida...');
  const proformas = [
    {
      id: SEED_IDS.PROFORMA_DRAFT,
      proforma_number: 'ZZTEST-PROF-2026-001',
      client_id: SEED_IDS.CLIENT_CAT,
      fortnight_period: '2026-09-Q1',
      concept_type: 'general_hours',
      status: 'draft',
      subtotal: 100000.0,
      total: 121000.0,
      issue_date: '2026-09-16',
      due_date: '2026-10-01',
    },
    {
      id: SEED_IDS.PROFORMA_SENT,
      proforma_number: 'ZZTEST-PROF-2026-002',
      client_id: SEED_IDS.CLIENT_CAT,
      fortnight_period: '2026-09-Q1',
      concept_type: 'general_hours',
      status: 'sent',
      subtotal: 200000.0,
      total: 242000.0,
      issue_date: '2026-09-16',
      due_date: '2026-10-01',
    },
    {
      id: SEED_IDS.PROFORMA_APPROVED,
      proforma_number: 'ZZTEST-PROF-2026-003',
      client_id: SEED_IDS.CLIENT_DELTA_DOCK,
      fortnight_period: '2026-09-Q1',
      concept_type: 'general_hours',
      status: 'approved',
      subtotal: 300000.0,
      total: 363000.0,
      issue_date: '2026-09-16',
      due_date: '2026-10-16',
    },
    {
      id: SEED_IDS.PROFORMA_INVOICED,
      proforma_number: 'ZZTEST-PROF-2026-004',
      client_id: SEED_IDS.CLIENT_COOPTACORD,
      fortnight_period: '2026-09-Q1',
      concept_type: 'export_tallymen',
      status: 'invoiced',
      subtotal: 150000.0,
      total: 181500.0,
      issue_date: '2026-09-16',
      due_date: '2026-10-01',
    },
    {
      id: SEED_IDS.PROFORMA_PAID,
      proforma_number: 'ZZTEST-PROF-2026-005',
      client_id: SEED_IDS.CLIENT_DANCHUK,
      fortnight_period: '2026-09-Q1',
      concept_type: 'general_hours',
      status: 'paid',
      subtotal: 80000.0,
      total: 96800.0,
      issue_date: '2026-09-16',
      due_date: '2026-09-23',
    },
  ];

  for (const prof of proformas) {
    await supabase.from('proformas').upsert(prof, { onConflict: 'id' });
  }

  // 11. Factura Fiscal para la proforma 'invoiced'
  console.log('  -> Insertando factura fiscal de prueba...');
  await supabase.from('tax_invoices').upsert(
    {
      proforma_id: SEED_IDS.PROFORMA_INVOICED,
      invoice_number: 'ZZTEST-FACT-A-0001-00000001',
      pdf_storage_path: 'invoices/zztest-factura-001.pdf',
      invoiced_amount: 181500.0,
      status: 'pending',
      invoice_date: '2026-09-17',
    },
    { onConflict: 'proforma_id' }
  );

  // 12. Movimientos de Flujo de Caja
  console.log('  -> Insertando movimientos de flujo de caja...');
  const cashMovements = [
    {
      movement_date: '2026-09-20',
      type: 'income',
      area: 'Cobros',
      detail: 'ZZTEST-Cobro Parcial Factura Cliente CAT',
      amount: 100000.0,
    },
    {
      movement_date: '2026-09-21',
      type: 'expense',
      area: 'Sueldos',
      detail: 'ZZTEST-Anticipos Quincenales Cuadrilla',
      amount: 35000.0,
    },
  ];

  // Limpiar movimientos zztest existentes con el mismo detalle
  for (const m of cashMovements) {
    await supabase.from('cash_movements').delete().eq('detail', m.detail);
    await supabase.from('cash_movements').insert(m);
  }

  console.log('✅ Dataset de prueba determinístico generado exitosamente con prefijo ZZTEST-.');
}

// Ejecutar si se invoca directamente
if (require.main === module) {
  runTestSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error ejecutando test-seed:', err);
      process.exit(1);
    });
}
