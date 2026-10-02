/**
 * scripts/seed-proformas-data.ts
 *
 * Carga completa de datos para la generación y verificación visual de todos
 * los modelos de proforma en MTS:
 * 1. Operativa Buque Automotores Ro-Ro (vessel) - CAT ARGENTINA SA
 * 2. Plazoleta Fiscal Quincenal Consolidada (fiscal_yard) - CAT ARGENTINA SA
 * 3. Abono Fijo Depósitos / Almacenes (fixed_deposit) - DELTA DOCK SA
 * 4. Horas Compartidas / Coparticipación 10% (shared_expo) - COOPTACORD
 * 5. Servicios Directos y Horas Operativas (standard) - SERGIO DANCHUK
 *
 * Además de precargar proformas en los diferentes estados (draft, sent, approved, invoiced, paid)
 * con sus visores completos, inserta todos los partes diarios (daily_work_logs) y
 * entradas de personal aprobadas (daily_staff_entries) tanto para Octubre 2026 (quincena actual)
 * como para Septiembre 2026, de modo que el slideover "Nueva Proforma" pueda calcular
 * y emitir en vivo cualquier modelo sin errores de datos faltantes.
 *
 * Ejecución: npx tsx --env-file=.env scripts/seed-proformas-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { calculateProforma } from '../src/lib/services/invoicing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Falta variable SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// IDs reales existentes en la base de datos
const CLIENTS = {
  CAT: 'e503bd31-cab5-42a5-bb95-5842f09a113d',
  DELTA_DOCK: '29c65acb-cf83-4e92-8819-29af65be56d0',
  COOPTACORD: '25befc93-0578-42aa-a615-3762fd93b2d4',
  DANCHUK: '87ece2e2-84ce-4440-b681-d3bafdf86501',
};

const POSITIONS = {
  ENCARGADO: '0e2c8293-7f2c-48b7-b00c-d38287e19961',
  APUNTADOR: 'e5c6122a-c7f7-4ef3-87af-7a51f5c9b8b9',
};

const EMPLOYEES = {
  BRITES_LUCAS: '7e617e17-5c74-40ad-b62d-2097d8fff07f', // Encargado
  BELO_BRUNO: 'e549d2a2-2a5f-48bc-8e49-b8b13c43fadb', // Apuntador
  SUAREZ_ROMINA: 'c54c93e6-0354-47ee-9de7-91da6e877a20', // Apuntador
  MORALES_ROSANA: '2c1fcc51-66df-4515-9540-fc8f31a45dd3', // Apuntador
  ARENA_CECILIA: '4be529cc-551e-4099-8255-998648884125', // Apuntador
};

const LOCATIONS = {
  MUELLE_NORTE: '2d11827e-a6b3-4fe4-8d62-16d99b2dcf98',
  FISCAL_SUR: '6b565e02-d5d0-40e0-a536-d72618621e70',
};

export async function seedProformasData() {
  console.log('🚀 Iniciando carga integral de datos para generación y visualización de proformas...');

  // 1. Obtener ID de usuario admin para logged_by y approved_by
  const { data: adminUsers } = await supabase.from('profiles').select('id, role');
  const adminId = adminUsers?.find((u) => u.role === 'admin')?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  // 2. Tipos de hora
  const { data: hourTypes } = await supabase.from('hour_types').select('id, code');
  const htReg = hourTypes?.find((h) => h.code === 'REGULAR')?.id;
  const ht50 = hourTypes?.find((h) => h.code === 'OVERTIME_50')?.id;
  const ht100 = hourTypes?.find((h) => h.code === 'OVERTIME_100')?.id;

  if (!htReg || !ht50 || !ht100) {
    throw new Error('No se encontraron hour_types REGULAR, OVERTIME_50, OVERTIME_100');
  }

  // 3. Actualizar / Asegurar Tarifario Comercial por Cliente (client_position_rates)
  console.log('  -> Configurando tarifario comercial por cliente...');
  const positionRatesToUpsert = [
    // CAT ARGENTINA SA
    { client_id: CLIENTS.CAT, position_id: POSITIONS.ENCARGADO, hour_type_id: htReg, hourly_rate: 38452.18, effective_from: '2026-09-01' },
    { client_id: CLIENTS.CAT, position_id: POSITIONS.ENCARGADO, hour_type_id: ht50, hourly_rate: 57678.27, effective_from: '2026-09-01' },
    { client_id: CLIENTS.CAT, position_id: POSITIONS.ENCARGADO, hour_type_id: ht100, hourly_rate: 76904.36, effective_from: '2026-09-01' },
    { client_id: CLIENTS.CAT, position_id: POSITIONS.APUNTADOR, hour_type_id: htReg, hourly_rate: 31602.72, effective_from: '2026-09-01' },
    { client_id: CLIENTS.CAT, position_id: POSITIONS.APUNTADOR, hour_type_id: ht50, hourly_rate: 47404.08, effective_from: '2026-09-01' },
    { client_id: CLIENTS.CAT, position_id: POSITIONS.APUNTADOR, hour_type_id: ht100, hourly_rate: 63205.44, effective_from: '2026-09-01' },

    // DELTA DOCK SA
    { client_id: CLIENTS.DELTA_DOCK, position_id: POSITIONS.ENCARGADO, hour_type_id: htReg, hourly_rate: 38452.18, effective_from: '2026-09-01' },
    { client_id: CLIENTS.DELTA_DOCK, position_id: POSITIONS.ENCARGADO, hour_type_id: ht50, hourly_rate: 57678.27, effective_from: '2026-09-01' },
    { client_id: CLIENTS.DELTA_DOCK, position_id: POSITIONS.ENCARGADO, hour_type_id: ht100, hourly_rate: 76904.36, effective_from: '2026-09-01' },
    { client_id: CLIENTS.DELTA_DOCK, position_id: POSITIONS.APUNTADOR, hour_type_id: htReg, hourly_rate: 31060.79, effective_from: '2026-09-01' },
    { client_id: CLIENTS.DELTA_DOCK, position_id: POSITIONS.APUNTADOR, hour_type_id: ht50, hourly_rate: 46591.18, effective_from: '2026-09-01' },
    { client_id: CLIENTS.DELTA_DOCK, position_id: POSITIONS.APUNTADOR, hour_type_id: ht100, hourly_rate: 62121.57, effective_from: '2026-09-01' },

    // COOPTACORD
    { client_id: CLIENTS.COOPTACORD, position_id: POSITIONS.APUNTADOR, hour_type_id: htReg, hourly_rate: 31602.72, effective_from: '2026-09-01' },
    { client_id: CLIENTS.COOPTACORD, position_id: POSITIONS.APUNTADOR, hour_type_id: ht50, hourly_rate: 47404.08, effective_from: '2026-09-01' },
    { client_id: CLIENTS.COOPTACORD, position_id: POSITIONS.APUNTADOR, hour_type_id: ht100, hourly_rate: 63205.44, effective_from: '2026-09-01' },

    // SERGIO DANCHUK
    { client_id: CLIENTS.DANCHUK, position_id: POSITIONS.APUNTADOR, hour_type_id: htReg, hourly_rate: 31602.72, effective_from: '2026-09-01' },
    { client_id: CLIENTS.DANCHUK, position_id: POSITIONS.APUNTADOR, hour_type_id: ht50, hourly_rate: 47404.08, effective_from: '2026-09-01' },
    { client_id: CLIENTS.DANCHUK, position_id: POSITIONS.APUNTADOR, hour_type_id: ht100, hourly_rate: 63205.44, effective_from: '2026-09-01' },
  ];

  for (const pr of positionRatesToUpsert) {
    await supabase.from('client_position_rates').upsert(pr, {
      onConflict: 'client_id,position_id,hour_type_id,effective_from',
    });
  }

  // 4. Tarifas de Servicios Especiales (client_service_rates)
  console.log('  -> Configurando tarifas suplementarias de servicios...');
  const serviceRatesToUpsert = [
    // CAT
    { client_id: CLIENTS.CAT, service_code: 'VEHICLE_NORMAL', description: 'Vehículo Operado en Horario Hábil', rate_value: 2744.17, effective_from: '2026-09-01', metadata: { category: 'vehicle' } },
    { client_id: CLIENTS.CAT, service_code: 'VEHICLE_OVERTIME', description: 'Vehículo Operado en Horario Inhábil (+100%)', rate_value: 5488.11, effective_from: '2026-09-01', metadata: { category: 'vehicle' } },
    { client_id: CLIENTS.CAT, service_code: 'SHUTTLE', description: 'Transporte Remis Delta Dock', rate_value: 35594.34, effective_from: '2026-09-01', metadata: { category: 'transport' } },
    { client_id: CLIENTS.CAT, service_code: 'PLUS_MARKUP', description: 'Coeficiente de Costos / Markup Plus', rate_value: 0.52, effective_from: '2026-09-01', metadata: { category: 'markup' } },

    // DELTA DOCK
    { client_id: CLIENTS.DELTA_DOCK, service_code: 'FIXED_MONTHLY_DEPOSIT_NACIONAL', description: 'Tarifa Mensual Bonificada Depósito Nacional', rate_value: 5466694.70, effective_from: '2026-09-01', metadata: { sector: 'nacional', category: 'fixed_fee' } },
    { client_id: CLIENTS.DELTA_DOCK, service_code: 'FIXED_MONTHLY_DEPOSIT_FISCAL', description: 'Tarifa Mensual Bonificada Depósito Fiscal', rate_value: 5466694.70, effective_from: '2026-09-01', metadata: { sector: 'fiscal', category: 'fixed_fee' } },
    { client_id: CLIENTS.DELTA_DOCK, service_code: 'SHUTTLE_TRAMO', description: 'Transporte Diario Personal (por tramo)', rate_value: 37249.77, effective_from: '2026-09-01', metadata: { category: 'transport' } },

    // COOPTACORD
    { client_id: CLIENTS.COOPTACORD, service_code: 'COPARTICIPATION_FACTOR', description: 'Factor de Coparticipación Plazoleta / Expo', rate_value: 0.10, effective_from: '2026-09-01', metadata: { category: 'split' } },
    { client_id: CLIENTS.COOPTACORD, service_code: 'SHUTTLE', description: 'Transporte Remis Delta Dock', rate_value: 35594.34, effective_from: '2026-09-01', metadata: { category: 'transport' } },
    { client_id: CLIENTS.COOPTACORD, service_code: 'MEAL', description: 'Vianda Personal Operativo', rate_value: 6545.18, effective_from: '2026-09-01', metadata: { category: 'meal' } },

    // SERGIO DANCHUK
    { client_id: CLIENTS.DANCHUK, service_code: 'MEAL', description: 'Vianda Personal Operativo', rate_value: 6545.18, effective_from: '2026-09-01', metadata: { category: 'meal' } },
    { client_id: CLIENTS.DANCHUK, service_code: 'SHUTTLE_CMP_TZ', description: 'Transporte Viajes Campana - Terminal Zárate', rate_value: 37685.28, effective_from: '2026-09-01', metadata: { route: 'CMP-TZ', category: 'transport' } },
    { client_id: CLIENTS.DANCHUK, service_code: 'SHUTTLE', description: 'Transporte Remis General', rate_value: 37685.28, effective_from: '2026-09-01', metadata: { category: 'transport' } },
  ];

  for (const sr of serviceRatesToUpsert) {
    await supabase.from('client_service_rates').upsert(sr, {
      onConflict: 'client_id,service_code,effective_from',
    });
  }

  // 5. Cargar Partes Diarios y Turnos Operativos Aprobados para Octubre 2026 y Septiembre 2026
  console.log('  -> Creando partes diarios y turnos aprobados para Octubre 2026 y Septiembre 2026...');

  const workLogsData = [
    // OCTUBRE 2026 (Quincena en curso 01-15 Octubre 2026)
    {
      id: 'd1000000-0000-0000-0000-000000000001',
      work_date: '2026-10-02',
      client_id: CLIENTS.CAT,
      location_id: LOCATIONS.MUELLE_NORTE,
      vessel_name: 'BRASILIA HWY',
      vehicles_discharged: 2005,
      vehicles_loaded: 1831,
      vehicles_shifted: 0,
      total_vehicles_handled: 3836,
      is_export_day: false,
      logged_by: adminId,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000002',
      work_date: '2026-10-05',
      client_id: CLIENTS.CAT,
      location_id: LOCATIONS.MUELLE_NORTE,
      vessel_name: null,
      vehicles_discharged: 0,
      vehicles_loaded: 0,
      vehicles_shifted: 0,
      total_vehicles_handled: 0,
      is_export_day: false,
      logged_by: adminId,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000003',
      work_date: '2026-10-06',
      client_id: CLIENTS.CAT,
      location_id: LOCATIONS.MUELLE_NORTE,
      vessel_name: null,
      vehicles_discharged: 0,
      vehicles_loaded: 0,
      vehicles_shifted: 0,
      total_vehicles_handled: 0,
      is_export_day: true, // Expo Day
      logged_by: adminId,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000004',
      work_date: '2026-10-07',
      client_id: CLIENTS.DELTA_DOCK,
      location_id: LOCATIONS.FISCAL_SUR,
      total_vehicles_handled: 0,
      is_export_day: false,
      logged_by: adminId,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000005',
      work_date: '2026-10-08',
      client_id: CLIENTS.COOPTACORD,
      location_id: LOCATIONS.MUELLE_NORTE,
      total_vehicles_handled: 0,
      is_export_day: true,
      logged_by: adminId,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000006',
      work_date: '2026-10-09',
      client_id: CLIENTS.DANCHUK,
      location_id: LOCATIONS.MUELLE_NORTE,
      total_vehicles_handled: 0,
      is_export_day: false,
      logged_by: adminId,
    },

    // SEPTIEMBRE 2026 (Quincena histórica 01-15 Septiembre 2026)
    {
      id: 'd1000000-0000-0000-0000-000000000010',
      work_date: '2026-09-14',
      client_id: CLIENTS.CAT,
      location_id: LOCATIONS.MUELLE_NORTE,
      vessel_name: 'BRASILIA HWY',
      vehicles_discharged: 1500,
      vehicles_loaded: 1000,
      vehicles_shifted: 0,
      total_vehicles_handled: 2500,
      is_export_day: false,
      logged_by: adminId,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000011',
      work_date: '2026-09-15',
      client_id: CLIENTS.CAT,
      location_id: LOCATIONS.MUELLE_NORTE,
      vessel_name: 'BRASILIA HWY',
      vehicles_discharged: 505,
      vehicles_loaded: 831,
      vehicles_shifted: 0,
      total_vehicles_handled: 1336,
      is_export_day: false,
      logged_by: adminId,
    },
  ];

  for (const wl of workLogsData) {
    await supabase.from('daily_work_logs').upsert(wl, { onConflict: 'id' });
  }

  // Turnos de personal aprobados
  const staffEntries = [
    // -------------------------------------------------------------
    // CAT - BUQUE BRASILIA HWY (Octubre 2026)
    // Encargado a Bordo
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000001',
      employee_id: EMPLOYEES.BRITES_LUCAS,
      position_id: POSITIONS.ENCARGADO,
      shift_start_date: '2026-10-02',
      shift_start_time: '07:00:00',
      shift_end_date: '2026-10-02',
      shift_end_time: '19:00:00',
      regular_hours: 27.0,
      overtime_50_hours: 18.5,
      overtime_100_hours: 17.0,
      shuttles_count: 2,
      plus_delta_amount: 313745.74,
      meal_allowance_count: 3,
      is_approved: true,
      approved_at: '2026-10-02T22:00:00Z',
      approved_by: adminId,
    },
    // Apuntador 1 - Belo Bruno
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000001',
      employee_id: EMPLOYEES.BELO_BRUNO,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-02',
      shift_start_time: '07:00:00',
      shift_end_date: '2026-10-02',
      shift_end_time: '19:00:00',
      regular_hours: 60.0,
      overtime_50_hours: 65.0,
      overtime_100_hours: 42.0,
      shuttles_count: 7,
      plus_delta_amount: 784364.35,
      meal_allowance_count: 3,
      is_approved: true,
      approved_at: '2026-10-02T22:00:00Z',
      approved_by: adminId,
    },
    // Apuntador 2 - Suarez Romina
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000001',
      employee_id: EMPLOYEES.SUAREZ_ROMINA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-02',
      shift_start_time: '07:00:00',
      shift_end_date: '2026-10-02',
      shift_end_time: '19:00:00',
      regular_hours: 60.0,
      overtime_50_hours: 62.5,
      overtime_100_hours: 42.0,
      shuttles_count: 7,
      plus_delta_amount: 784364.35,
      meal_allowance_count: 3,
      is_approved: true,
      approved_at: '2026-10-02T22:00:00Z',
      approved_by: adminId,
    },
    // Apuntador 3 - Morales Rosana
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000001',
      employee_id: EMPLOYEES.MORALES_ROSANA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-02',
      shift_start_time: '07:00:00',
      shift_end_date: '2026-10-02',
      shift_end_time: '19:00:00',
      regular_hours: 55.0,
      overtime_50_hours: 60.0,
      overtime_100_hours: 42.0,
      shuttles_count: 8,
      plus_delta_amount: 784364.35,
      meal_allowance_count: 3,
      is_approved: true,
      approved_at: '2026-10-02T22:00:00Z',
      approved_by: adminId,
    },
    // Apuntador 4 - Arena Cecilia
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000001',
      employee_id: EMPLOYEES.ARENA_CECILIA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-02',
      shift_start_time: '07:00:00',
      shift_end_date: '2026-10-02',
      shift_end_time: '19:00:00',
      regular_hours: 52.0,
      overtime_50_hours: 60.0,
      overtime_100_hours: 42.0,
      shuttles_count: 8,
      plus_delta_amount: 784364.35,
      meal_allowance_count: 3,
      is_approved: true,
      approved_at: '2026-10-02T22:00:00Z',
      approved_by: adminId,
    },

    // -------------------------------------------------------------
    // CAT - PLAZOLETA FISCAL (Octubre 2026)
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000002',
      employee_id: EMPLOYEES.BRITES_LUCAS,
      position_id: POSITIONS.ENCARGADO,
      shift_start_date: '2026-10-05',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-05',
      shift_end_time: '18:00:00',
      regular_hours: 80.0,
      overtime_50_hours: 18.0,
      overtime_100_hours: 0.0,
      shuttles_count: 6,
      plus_delta_amount: 0,
      meal_allowance_count: 2,
      is_approved: true,
      approved_at: '2026-10-05T20:00:00Z',
      approved_by: adminId,
    },
    // Apuntadores Plazoleta Fiscal (distribuidos en slots PF 01 a PF 04, total 1048 hs reg, 264 hs 50%, 50 remises)
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000002',
      employee_id: EMPLOYEES.BELO_BRUNO,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-05',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-05',
      shift_end_time: '18:00:00',
      regular_hours: 262.0,
      overtime_50_hours: 66.0,
      overtime_100_hours: 0.0,
      shuttles_count: 13,
      plus_delta_amount: 0,
      meal_allowance_count: 3,
      is_approved: true,
      approved_at: '2026-10-05T20:00:00Z',
      approved_by: adminId,
    },
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000002',
      employee_id: EMPLOYEES.SUAREZ_ROMINA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-05',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-05',
      shift_end_time: '18:00:00',
      regular_hours: 262.0,
      overtime_50_hours: 66.0,
      overtime_100_hours: 0.0,
      shuttles_count: 13,
      plus_delta_amount: 0,
      meal_allowance_count: 3,
      is_approved: true,
      approved_at: '2026-10-05T20:00:00Z',
      approved_by: adminId,
    },
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000002',
      employee_id: EMPLOYEES.MORALES_ROSANA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-05',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-05',
      shift_end_time: '18:00:00',
      regular_hours: 262.0,
      overtime_50_hours: 66.0,
      overtime_100_hours: 0.0,
      shuttles_count: 12,
      plus_delta_amount: 0,
      meal_allowance_count: 2,
      is_approved: true,
      approved_at: '2026-10-05T20:00:00Z',
      approved_by: adminId,
    },
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000002',
      employee_id: EMPLOYEES.ARENA_CECILIA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-05',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-05',
      shift_end_time: '18:00:00',
      regular_hours: 262.0,
      overtime_50_hours: 66.0,
      overtime_100_hours: 0.0,
      shuttles_count: 12,
      plus_delta_amount: 0,
      meal_allowance_count: 2,
      is_approved: true,
      approved_at: '2026-10-05T20:00:00Z',
      approved_by: adminId,
    },
    // Plazoleta - Expo Shift (176 hs reg, 38 hs ot50)
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000003',
      employee_id: EMPLOYEES.SUAREZ_ROMINA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-06',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-06',
      shift_end_time: '18:00:00',
      regular_hours: 176.0,
      overtime_50_hours: 38.0,
      overtime_100_hours: 0.0,
      shuttles_count: 0,
      plus_delta_amount: 0,
      meal_allowance_count: 2,
      is_approved: true,
      approved_at: '2026-10-06T20:00:00Z',
      approved_by: adminId,
    },

    // -------------------------------------------------------------
    // DELTA DOCK - DEPÓSITOS (Octubre 2026)
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000004',
      employee_id: EMPLOYEES.BELO_BRUNO,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-07',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-07',
      shift_end_time: '16:00:00',
      regular_hours: 80.0,
      overtime_50_hours: 0.0,
      overtime_100_hours: 0.0,
      shuttles_count: 10,
      plus_delta_amount: 0,
      meal_allowance_count: 5,
      is_approved: true,
      approved_at: '2026-10-07T20:00:00Z',
      approved_by: adminId,
    },

    // -------------------------------------------------------------
    // COOPTACORD - COPARTICIPACIÓN EXPO (Octubre 2026)
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000005',
      employee_id: EMPLOYEES.MORALES_ROSANA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-08',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-08',
      shift_end_time: '18:00:00',
      regular_hours: 176.0,
      overtime_50_hours: 38.0,
      overtime_100_hours: 0.0,
      shuttles_count: 4,
      plus_delta_amount: 0,
      meal_allowance_count: 10,
      is_approved: true,
      approved_at: '2026-10-08T20:00:00Z',
      approved_by: adminId,
    },

    // -------------------------------------------------------------
    // SERGIO DANCHUK - TERMINAL ZÁRATE CMP-TZ (Octubre 2026)
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000006',
      employee_id: EMPLOYEES.ARENA_CECILIA,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-10-09',
      shift_start_time: '08:00:00',
      shift_end_date: '2026-10-09',
      shift_end_time: '18:00:00',
      regular_hours: 24.0,
      overtime_50_hours: 8.0,
      overtime_100_hours: 0.0,
      shuttles_count: 4,
      plus_delta_amount: 0,
      meal_allowance_count: 4,
      is_approved: true,
      approved_at: '2026-10-09T20:00:00Z',
      approved_by: adminId,
    },

    // -------------------------------------------------------------
    // SEPTIEMBRE 2026 - BUQUE BRASILIA HWY
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000010',
      employee_id: EMPLOYEES.BRITES_LUCAS,
      position_id: POSITIONS.ENCARGADO,
      shift_start_date: '2026-09-14',
      shift_start_time: '07:00:00',
      shift_end_date: '2026-09-14',
      shift_end_time: '19:00:00',
      regular_hours: 27.0,
      overtime_50_hours: 18.5,
      overtime_100_hours: 17.0,
      shuttles_count: 2,
      plus_delta_amount: 313745.74,
      meal_allowance_count: 3,
      is_approved: true,
      approved_at: '2026-09-14T20:00:00Z',
      approved_by: adminId,
    },
    {
      daily_work_log_id: 'd1000000-0000-0000-0000-000000000010',
      employee_id: EMPLOYEES.BELO_BRUNO,
      position_id: POSITIONS.APUNTADOR,
      shift_start_date: '2026-09-14',
      shift_start_time: '07:00:00',
      shift_end_date: '2026-09-14',
      shift_end_time: '19:00:00',
      regular_hours: 227.0,
      overtime_50_hours: 247.5,
      overtime_100_hours: 168.0,
      shuttles_count: 28,
      plus_delta_amount: 3137457.40,
      meal_allowance_count: 10,
      is_approved: true,
      approved_at: '2026-09-14T20:00:00Z',
      approved_by: adminId,
    },
  ];

  // Limpiar entries de estos work logs e insertar
  for (const wl of workLogsData) {
    await supabase.from('daily_staff_entries').delete().eq('daily_work_log_id', wl.id);
  }
  await supabase.from('daily_staff_entries').insert(staffEntries);

  // 6. Generación Determinística de Proformas en todos los Modelos y Estados
  console.log('  -> Generando proformas con el motor de cálculo oficial para cada modelo...');

  // Definición de las proformas a generar
  const proformaConfigs = [
    {
      id: 'f1000000-0000-0000-0000-000000000001',
      proformaNumber: 'PRF-2026-10-CAT-001',
      clientId: CLIENTS.CAT,
      proformaType: 'vessel',
      vesselName: 'BRASILIA HWY',
      fromDate: '2026-10-01',
      toDate: '2026-10-15',
      period: '2026-10-Q1',
      conceptType: 'general_hours',
      status: 'approved', // Aprobada
      discountPercentage: 3.0,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000002',
      proformaNumber: 'PRF-2026-10-CAT-002',
      clientId: CLIENTS.CAT,
      proformaType: 'fiscal_yard',
      fromDate: '2026-10-01',
      toDate: '2026-10-15',
      period: '2026-10-Q1',
      conceptType: 'general_hours',
      status: 'draft', // Borrador
      discountPercentage: 3.0,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000003',
      proformaNumber: 'PRF-2026-10-DELTA-001',
      clientId: CLIENTS.DELTA_DOCK,
      proformaType: 'fixed_deposit',
      depositSector: 'both',
      fromDate: '2026-10-01',
      toDate: '2026-10-15',
      period: '2026-10-Q1',
      conceptType: 'general_hours',
      status: 'invoiced', // Facturada
      invoiceNumber: 'A-0001-00004589',
      invoiceDate: '2026-10-16',
      invoiceStatus: 'pending',
    },
    {
      id: 'f1000000-0000-0000-0000-000000000004',
      proformaNumber: 'PRF-2026-10-COOP-001',
      clientId: CLIENTS.COOPTACORD,
      proformaType: 'shared_expo',
      coparticipationFactor: 0.10,
      fromDate: '2026-10-01',
      toDate: '2026-10-15',
      period: '2026-10-Q1',
      conceptType: 'export_tallymen',
      status: 'paid', // Cobrada
      invoiceNumber: 'A-0001-00004590',
      invoiceDate: '2026-10-16',
      invoiceStatus: 'paid',
    },
    {
      id: 'f1000000-0000-0000-0000-000000000005',
      proformaNumber: 'PRF-2026-10-DANCHUK-001',
      clientId: CLIENTS.DANCHUK,
      proformaType: 'standard',
      fromDate: '2026-10-01',
      toDate: '2026-10-15',
      period: '2026-10-Q1',
      conceptType: 'general_hours',
      status: 'sent', // Enviada
      discountPercentage: 0,
    },
    // Histórica Septiembre (Buque Ro-Ro)
    {
      id: 'f1000000-0000-0000-0000-000000000010',
      proformaNumber: 'PRF-2026-09-CAT-001',
      clientId: CLIENTS.CAT,
      proformaType: 'vessel',
      vesselName: 'BRASILIA HWY',
      fromDate: '2026-09-13',
      toDate: '2026-09-15',
      period: '2026-09-Q1',
      conceptType: 'general_hours',
      status: 'invoiced',
      discountPercentage: 3.0,
      invoiceNumber: 'A-0001-00004580',
      invoiceDate: '2026-09-16',
      invoiceStatus: 'paid',
    },
  ];

  for (const cfg of proformaConfigs) {
    console.log(`     Calculando liquidación para ${cfg.proformaNumber} (${cfg.proformaType})...`);
    const calc = await calculateProforma({
      clientId: cfg.clientId,
      fromDate: cfg.fromDate,
      toDate: cfg.toDate,
      proformaType: cfg.proformaType,
      vesselName: cfg.vesselName,
      discountPercentage: cfg.discountPercentage,
      depositSector: cfg.depositSector as any,
      coparticipationFactor: cfg.coparticipationFactor,
    });

    const issueDate = cfg.fromDate;
    const dueDate = new Date(`${cfg.toDate}T12:00:00`);
    dueDate.setDate(dueDate.getDate() + 15);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const proformaRow = {
      id: cfg.id,
      proforma_number: cfg.proformaNumber,
      proforma_type: cfg.proformaType,
      client_id: cfg.clientId,
      fortnight_period: cfg.period,
      concept_type: cfg.conceptType as any,
      status: cfg.status as any,
      subtotal: calc.subtotal,
      total: calc.total,
      issue_date: issueDate,
      due_date: dueDateStr,
      vessel_name: cfg.vesselName || calc.vessel_name || null,
      operation_dates: calc.operation_dates || null,
      discount_percentage: calc.discount_percentage,
      discount_amount: calc.discount_amount,
      subtotal_operativa: calc.subtotal_operativa || 0,
      subtotal_encargado: calc.subtotal_encargado || 0,
      subtotal_compensacion: calc.subtotal_compensacion || 0,
      total_neto: calc.total_neto,
      tax_amount: calc.tax_amount,
      calculation_payload: calc.payload,
      notes: calc.notes,
    };

    // Upsert proforma
    await supabase.from('proformas').upsert(proformaRow, { onConflict: 'id' });

    // Insertar items de detalle
    await supabase.from('proforma_details').delete().eq('proforma_id', cfg.id);
    if (calc.items && calc.items.length > 0) {
      const details = calc.items.map((it) => ({
        proforma_id: cfg.id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
      }));
      await supabase.from('proforma_details').insert(details);
    }

    // Si tiene factura fiscal asociada
    if (cfg.invoiceNumber) {
      await supabase.from('tax_invoices').upsert(
        {
          proforma_id: cfg.id,
          invoice_number: cfg.invoiceNumber,
          pdf_storage_path: `invoices/${cfg.invoiceNumber}.pdf`,
          invoiced_amount: calc.total,
          status: cfg.invoiceStatus as any,
          invoice_date: cfg.invoiceDate,
        },
        { onConflict: 'proforma_id' }
      );
    }

    console.log(`     ✓ Proforma ${cfg.proformaNumber} generada: Neto $ ${calc.total_neto.toLocaleString('es-AR')} | Total $ ${calc.total.toLocaleString('es-AR')}`);
  }

  console.log('\n🎉 Carga de datos de facturación completada con éxito.');
  console.log('   Ahora puedes acceder a http://localhost:3000/invoicing para:');
  console.log('   - Ver las 6 proformas cargadas cubriendo los 5 modelos.');
  console.log('   - Abrir el modal de detalle y examinar cada visor específico.');
  console.log('   - Abrir "Nueva Proforma" para emitir proformas interactivamente.');
}

if (require.main === module) {
  seedProformasData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error en seedProformasData:', err);
      process.exit(1);
    });
}

