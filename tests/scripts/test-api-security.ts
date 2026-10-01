/**
 * Test Suite: Verificación de Seguridad de APIs y Mock de Notificaciones (SCRIPT)
 * Ejecución: npx tsx tests/scripts/test-api-security.ts
 */

import { sendBrevoEmail } from '../../src/lib/brevo/client';

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  expected: any;
  actual: any;
}

const results: TestResult[] = [];

function assertTest(id: string, description: string, actual: any, expected: any) {
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

async function runSecurityTests() {
  console.log('===============================================================');
  console.log(' INICIANDO VERIFICACIÓN DE SEGURIDAD Y MOCKS DE APIS ');
  console.log('===============================================================\n');

  // TC-SEC-02: Garantía de modo Simulado (Mock) de Brevo cuando BREVO_API_KEY=""
  process.env.BREVO_API_KEY = ''; // Asegurar explícitamente modo test
  const mockResult = await sendBrevoEmail({
    to: [{ email: 'zztest-recipient@example.com' }],
    subject: 'ZZTEST - Test Mock Brevo',
    htmlContent: '<p>Contenido de prueba</p>',
  });

  assertTest(
    'TC-SEC-02',
    'Brevo mock intercepta el envío sin API key devolviendo { success: true, mocked: true }',
    { success: mockResult.success, mocked: mockResult.mocked },
    { success: true, mocked: true }
  );

  // TC-SEC-01: Verificación de endpoint HTTP /api/mail/send sin credenciales (si el servidor está activo)
  const serverUrl = process.env.TEST_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${serverUrl}/api/mail/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'custom', to: 'zztest@example.com', subject: 'Test', message: 'Hello' }),
    });

    assertTest(
      'TC-SEC-01',
      `Llamada no autenticada a ${serverUrl}/api/mail/send debe retornar 401 Unauthorized`,
      res.status,
      401
    );
  } catch (err: any) {
    console.log(
      `\x1b[33m[SKIP]\x1b[0m TC-SEC-01: Servidor web en ${serverUrl} no disponible de forma síncrona (${err.message}). El test pasará en ejecución con servidor local activo.`
    );
  }

  // Resumen
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;

  console.log('\n---------------------------------------------------------------');
  console.log(`TOTAL CASOS EJECUTADOS: ${results.length}`);
  console.log(`\x1b[32mPASADOS: ${totalPassed}\x1b[0m | \x1b[31mFALLADOS: ${totalFailed}\x1b[0m`);
  console.log('---------------------------------------------------------------');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityTests();
