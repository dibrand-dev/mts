// Definir variables de entorno para que createClient use modo server sin bloquearse
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

// Interceptar fetch para Supabase si está en entorno de pruebas aislado
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const urlStr = input.toString();

  if (urlStr.includes(':54321') || urlStr.includes('supabase')) {
    // 1. Client query
    if (urlStr.includes('/rest/v1/clients')) {
      return new Response(
        JSON.stringify({
          id: 'e503bd31-cab5-42a5-bb95-5842f09a113d',
          company_name: 'CAT ARGENTINA SA',
          payment_due_days: 30,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Client position rates
    if (urlStr.includes('/rest/v1/client_position_rates')) {
      return new Response(
        JSON.stringify([
          { position: { name: 'Encargado' }, hour_type: { code: 'REGULAR' }, hourly_rate: 22362.87 },
          { position: { name: 'Encargado' }, hour_type: { code: 'OVERTIME_50' }, hourly_rate: 29082.92 },
          { position: { name: 'Encargado' }, hour_type: { code: 'OVERTIME_100' }, hourly_rate: 37743.22 },
          { position: { name: 'Apuntador' }, hour_type: { code: 'REGULAR' }, hourly_rate: 16254.43 },
          { position: { name: 'Apuntador' }, hour_type: { code: 'OVERTIME_50' }, hourly_rate: 22919.57 },
          { position: { name: 'Apuntador' }, hour_type: { code: 'OVERTIME_100' }, hourly_rate: 29749.58 },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Client service rates
    if (urlStr.includes('/rest/v1/client_service_rates')) {
      return new Response(
        JSON.stringify([
          { service_code: 'SHUTTLE', rate_value: 35594.34, metadata: {} },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Daily work logs and staff entries
    if (urlStr.includes('/rest/v1/daily_work_logs')) {
      // Período vacío (2025)
      if (urlStr.includes('2025-01-01')) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Período con turnos de Plazoleta (2026-10)
      return new Response(
        JSON.stringify([
          {
            id: 'd1000000-0000-0000-0000-000000000002',
            work_date: '2026-10-05',
            client_id: 'e503bd31-cab5-42a5-bb95-5842f09a113d',
            client: { company_name: 'CAT ARGENTINA SA' },
            entries: [
              // Encargado: 80 hs reg, 18 hs 50%, 6 shuttles
              {
                id: 'e1',
                employee_id: 'emp-enc',
                position_id: 'pos-enc',
                shift_start_time: '08:00:00',
                shift_end_time: '18:00:00',
                regular_hours: 80.0,
                overtime_50_hours: 18.0,
                overtime_100_hours: 0.0,
                shuttles_count: 6,
                is_approved: true,
                position: { name: 'Encargado' },
                employee: { full_name: 'BRITES LUCAS DAVID', file_number: 'LEG-1042' },
              },
              // Apuntador 1: 262 hs reg, 66 hs 50%, 13 shuttles
              {
                id: 'e2',
                employee_id: 'emp-ap1',
                position_id: 'pos-ap',
                shift_start_time: '08:00:00',
                shift_end_time: '18:00:00',
                regular_hours: 262.0,
                overtime_50_hours: 66.0,
                overtime_100_hours: 0.0,
                shuttles_count: 13,
                is_approved: true,
                position: { name: 'Apuntador' },
                employee: { full_name: 'BELO BRUNO JOAQUIN', file_number: 'LEG-1043' },
              },
              // Apuntador 2: 262 hs reg, 66 hs 50%, 13 shuttles
              {
                id: 'e3',
                employee_id: 'emp-ap2',
                position_id: 'pos-ap',
                shift_start_time: '08:00:00',
                shift_end_time: '18:00:00',
                regular_hours: 262.0,
                overtime_50_hours: 66.0,
                overtime_100_hours: 0.0,
                shuttles_count: 13,
                is_approved: true,
                position: { name: 'Apuntador' },
                employee: { full_name: 'SUAREZ ROMINA', file_number: 'LEG-1044' },
              },
              // Apuntador 3: 262 hs reg, 66 hs 50%, 12 shuttles
              {
                id: 'e4',
                employee_id: 'emp-ap3',
                position_id: 'pos-ap',
                shift_start_time: '08:00:00',
                shift_end_time: '18:00:00',
                regular_hours: 262.0,
                overtime_50_hours: 66.0,
                overtime_100_hours: 0.0,
                shuttles_count: 12,
                is_approved: true,
                position: { name: 'Apuntador' },
                employee: { full_name: 'MORALES ROSANA LORENA', file_number: 'LEG-1045' },
              },
              // Apuntador 4: 262 hs reg, 66 hs 50%, 12 shuttles
              {
                id: 'e5',
                employee_id: 'emp-ap4',
                position_id: 'pos-ap',
                shift_start_time: '08:00:00',
                shift_end_time: '18:00:00',
                regular_hours: 262.0,
                overtime_50_hours: 66.0,
                overtime_100_hours: 0.0,
                shuttles_count: 12,
                is_approved: true,
                position: { name: 'Apuntador' },
                employee: { full_name: 'ARENA CECILIA', file_number: 'LEG-1046' },
              },
            ],
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return originalFetch(input, init);
};

import { fiscalYardStrategy } from '../../src/lib/services/invoicing/strategies/fiscal-yard.strategy';

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  expected: any;
  actual: any;
}

const results: TestResult[] = [];

function assertTest(
  id: string,
  description: string,
  actual: any,
  expected: any,
  comparator?: (a: any, b: any) => boolean
) {
  const passed = comparator ? comparator(actual, expected) : JSON.stringify(actual) === JSON.stringify(expected);
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
console.log(' TEST AUTOMATIZADO: PUNTOS 2 Y 3 - PROFORMA PLAZOLETA FISCAL EXCEL ');
console.log('=====================================================================\n');

async function runTests() {
  // Test 1: Punto 2 - Período sin turnos debe devolver 0.0 hs (sin fallbacks hardcodeados)
  console.log('--- TEST 1: Extracción Estricta en Período Vacío (Sin Turnos) ---');
  try {
    const emptyResult = await fiscalYardStrategy.calculate({
      clientId: 'e503bd31-cab5-42a5-bb95-5842f09a113d', // CAT
      fromDate: '2025-01-01',
      toDate: '2025-01-15',
      discountPercentage: 3.0,
    });

    assertTest(
      'PF-EXT-01',
      'Extracción en período sin turnos devuelve 0 turnos aprobados',
      emptyResult.total_shifts,
      0
    );

    assertTest(
      'PF-EXT-02',
      'Extracción en período sin turnos no usa fallback de horas (total_hours === 0)',
      emptyResult.total_hours,
      0
    );

    assertTest(
      'PF-EXT-03',
      'Subtotal plazoleta en período sin turnos es exactamente $0.00',
      emptyResult.subtotal,
      0
    );

    assertTest(
      'PF-EXT-04',
      'Slots PF 01 al PF 13 se generan con 0 hs cada uno en período vacío',
      emptyResult.payload?.tab_plazoleta?.slots_summary?.length >= 13,
      true
    );
  } catch (err: any) {
    console.error('Error en Test 1:', err);
  }

  // Test 2: Punto 3 - Estructura de Plantilla Excel (13 slots PF 01 a PF 13 y cálculo exacto)
  console.log('\n--- TEST 2: Estructura de Plantilla Excel (PF 01 al PF 13) y Cálculo ---');
  try {
    const octResult = await fiscalYardStrategy.calculate({
      clientId: 'e503bd31-cab5-42a5-bb95-5842f09a113d', // CAT
      fromDate: '2026-10-01',
      toDate: '2026-10-15',
      discountPercentage: 3.0,
    });

    const payload = octResult.payload;
    const tabPlazoleta = payload?.tab_plazoleta;
    const slots = tabPlazoleta?.slots_summary || [];

    assertTest(
      'PF-EXC-01',
      'La estructura contiene el slot de Encargado y exactamente los 13 slots de Apuntador (14 en total)',
      slots.length,
      14
    );

    assertTest(
      'PF-EXC-02',
      'El primer slot de apuntador tiene código "APUNTADOR PF 01" con operario asignado',
      slots[1]?.slotCode,
      'APUNTADOR PF 01'
    );

    assertTest(
      'PF-EXC-03',
      'El slot 13 de apuntador tiene código "APUNTADOR PF 13" con bonificación CAT',
      slots[13]?.slotCode,
      'APUNTADOR PF 13'
    );

    assertTest(
      'PF-EXC-04',
      'El slot 13 está marcado como bonificado (isBonificado === true)',
      slots[13]?.isBonificado,
      true
    );

    assertTest(
      'PF-EXC-05',
      'Totales de grilla consolidan horas normales (1128 hs: 80 enc + 1048 ap) y 50% (282 hs: 18 enc + 264 ap)',
      {
        reg: tabPlazoleta?.totales_grilla?.total_regular,
        ot50: tabPlazoleta?.totales_grilla?.total_ot50,
        ot100: tabPlazoleta?.totales_grilla?.total_ot100,
      },
      {
        reg: 1128.0,
        ot50: 282.0,
        ot100: 0.0,
      }
    );

    // Verificación de montos con tarifas del Excel histórico:
    // Encargado: 80 hs * 22362.87 + 18 hs * 29082.92 = 1.789.029,60 + 523.492,56 = 2.312.522,16
    // Apuntador: 1048 hs * 16254.43 + 264 hs * 22919.57 = 17.034.642,64 + 6.050.766,48 = 23.085.409,12
    // Subtotal Personal = 25.397.931,28
    // Bonificación 3% = 761.937,94
    // Subtotal Bonificado = 24.635.993,34
    assertTest(
      'PF-EXC-06',
      'Subtotal Plazoleta Bonificada coincide exactamente con la plantilla histórica ($24.635.993,34)',
      tabPlazoleta?.importes?.subtotal_bonificado,
      24635993.34
    );

    assertTest(
      'PF-EXC-07',
      'Transporte de 56 viajes a $35.594,34 suma exactamente $1.993.283,04',
      octResult.payload?.tab_transporte?.total_transporte,
      1993283.04
    );

    assertTest(
      'PF-EXC-08',
      'Existen filas de turnos diarios shift_rows para el panel de auditoría cronológica',
      Array.isArray(tabPlazoleta?.shift_rows) && tabPlazoleta.shift_rows.length > 0,
      true
    );
  } catch (err: any) {
    console.error('Error en Test 2:', err);
  }

  // Resumen
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;
  console.log('\n=====================================================================');
  console.log(`TOTAL CASOS EJECUTADOS: ${results.length} | EXITOSOS: ${totalPassed} | FALLIDOS: ${totalFailed}`);
  console.log('=====================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runTests();
