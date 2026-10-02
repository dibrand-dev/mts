/**
 * Test Suite: Verificación Automatizada del Control de Vencimientos y Cron de Cobranzas (SCRIPT)
 * Criterios de Aceptación (DoD):
 * 1. Ejecución Diaria: Cron Job configurado para las 00:00 hs (03:00 UTC).
 * 2. Lógica de Evaluación: Lectura de facturas "Pendiente" y cruce con días de vencimiento del cliente.
 * 3. Disparador de Correos (Brevo API):
 *    - -3 días: "Aviso de Próximo Vencimiento"
 *    - Día 0: "Vencimiento Hoy"
 *    - Vencida: "Aviso de Factura Vencida" con cadencia de repetición parametrizada (ej. cada 3 o 7 días).
 * 
 * Ejecución: npx tsx tests/scripts/test-invoice-reminders-cron.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  calculateInvoiceDueDate,
  calculateDaysDifference,
  evaluateInvoiceReminderStatus,
} from '../../src/lib/services/invoice-reminders';
import { createInvoiceReminderEmail } from '../../src/lib/brevo/templates';

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

async function runInvoiceRemindersTests() {
  console.log('=====================================================================');
  console.log(' VERIFICACIÓN DE CONTROL DE VENCIMIENTOS Y CRON DE COBRANZAS (DoD)   ');
  console.log('=====================================================================\n');

  console.log('>>> 1. Cálculo de Vencimiento: Fecha de Emisión + Días de Vencimiento de Cliente');

  // Caso: Factura emitida el 2026-10-01, cliente con 15 días (ej. DELTA DOCK SA)
  const due15 = calculateInvoiceDueDate('2026-10-01', 15);
  assertTest(
    'DOD-DUE-01',
    'Emisión 2026-10-01 + 15 días de cliente -> Vencimiento exacto 2026-10-16',
    due15,
    '2026-10-16'
  );

  // Caso: Factura emitida el 2026-10-01, cliente con 30 días (ej. CAT ARGENTINA SA)
  const due30 = calculateInvoiceDueDate('2026-10-01', 30);
  assertTest(
    'DOD-DUE-02',
    'Emisión 2026-10-01 + 30 días de cliente -> Vencimiento exacto 2026-10-31',
    due30,
    '2026-10-31'
  );

  // Caso: Factura emitida el 2026-10-01, cliente con 7 días (ej. COOPTACORD)
  const due7 = calculateInvoiceDueDate('2026-10-01', 7);
  assertTest(
    'DOD-DUE-03',
    'Emisión 2026-10-01 + 7 días de cliente -> Vencimiento exacto 2026-10-08',
    due7,
    '2026-10-08'
  );

  console.log('\n>>> 2. Disparador de Correos Brevo: Faltan 3 Días para Vencer');

  // Caso: Vence 2026-10-16, fecha de evaluación 2026-10-13 (-3 días)
  const evalMinus3 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-13',
    cadenceDays: 3,
  });

  assertTest(
    'DOD-REMINDER-01',
    'A falta de 3 días para vencer -> shouldSend = true, reminderType = upcoming_3_days',
    {
      shouldSend: evalMinus3.shouldSend,
      reminderType: evalMinus3.reminderType,
      daysDifference: evalMinus3.daysDifference,
    },
    {
      shouldSend: true,
      reminderType: 'upcoming_3_days',
      daysDifference: -3,
    }
  );

  // Caso: Días -4, -2, -1 NO deben disparar
  const evalMinus4 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-12',
    cadenceDays: 3,
  });
  assertTest(
    'DOD-REMINDER-02',
    'A falta de 4 días para vencer (-4) -> shouldSend = false',
    evalMinus4.shouldSend,
    false
  );

  const evalMinus2 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-14',
    cadenceDays: 3,
  });
  assertTest(
    'DOD-REMINDER-03',
    'A falta de 2 días para vencer (-2) -> shouldSend = false (ya se alertó a los -3 días)',
    evalMinus2.shouldSend,
    false
  );

  const evalMinus1 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-15',
    cadenceDays: 3,
  });
  assertTest(
    'DOD-REMINDER-04',
    'A falta de 1 día para vencer (-1) -> shouldSend = false',
    evalMinus1.shouldSend,
    false
  );

  console.log('\n>>> 3. Disparador de Correos Brevo: Vencimiento Hoy (Día 0)');

  // Caso: Vence 2026-10-16, fecha de evaluación 2026-10-16 (Día 0)
  const evalDay0 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-16',
    cadenceDays: 3,
  });

  assertTest(
    'DOD-REMINDER-05',
    'Día de vencimiento (Día 0) -> shouldSend = true, reminderType = due_today',
    {
      shouldSend: evalDay0.shouldSend,
      reminderType: evalDay0.reminderType,
      daysDifference: evalDay0.daysDifference,
      badgeText: evalDay0.badgeText,
    },
    {
      shouldSend: true,
      reminderType: 'due_today',
      daysDifference: 0,
      badgeText: 'VENCE HOY',
    }
  );

  console.log('\n>>> 4. Disparador de Correos Brevo: Factura Vencida con Cadencia Parametrizada');

  // Cadencia = 3 días (ej. días +3, +6, +9...)
  const evalOverduePlus1 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-17', // +1 día vencida
    cadenceDays: 3,
  });
  assertTest(
    'DOD-CADENCE-01',
    'Vencida hace 1 día (+1) con cadencia 3 -> shouldSend = false',
    evalOverduePlus1.shouldSend,
    false
  );

  const evalOverduePlus2 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-18', // +2 días vencida
    cadenceDays: 3,
  });
  assertTest(
    'DOD-CADENCE-02',
    'Vencida hace 2 días (+2) con cadencia 3 -> shouldSend = false',
    evalOverduePlus2.shouldSend,
    false
  );

  const evalOverduePlus3 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-19', // +3 días vencida (1er ciclo de cadencia)
    cadenceDays: 3,
  });
  assertTest(
    'DOD-CADENCE-03',
    'Vencida hace 3 días (+3) con cadencia 3 -> shouldSend = true, reminderType = overdue',
    {
      shouldSend: evalOverduePlus3.shouldSend,
      reminderType: evalOverduePlus3.reminderType,
      daysDifference: evalOverduePlus3.daysDifference,
    },
    {
      shouldSend: true,
      reminderType: 'overdue',
      daysDifference: 3,
    }
  );

  const evalOverduePlus4 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-20', // +4 días vencida
    cadenceDays: 3,
  });
  assertTest(
    'DOD-CADENCE-04',
    'Vencida hace 4 días (+4) con cadencia 3 -> shouldSend = false',
    evalOverduePlus4.shouldSend,
    false
  );

  const evalOverduePlus6 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-22', // +6 días vencida (2do ciclo de cadencia)
    cadenceDays: 3,
  });
  assertTest(
    'DOD-CADENCE-05',
    'Vencida hace 6 días (+6) con cadencia 3 -> shouldSend = true, reminderType = overdue',
    {
      shouldSend: evalOverduePlus6.shouldSend,
      reminderType: evalOverduePlus6.reminderType,
      daysDifference: 6,
    },
    {
      shouldSend: true,
      reminderType: 'overdue',
      daysDifference: 6,
    }
  );

  // Cadencia = 7 días (ej. días +7, +14, +21...)
  const evalCadence7Plus3 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-19', // +3 días vencida con cadencia 7
    cadenceDays: 7,
  });
  assertTest(
    'DOD-CADENCE-06',
    'Vencida hace 3 días (+3) con cadencia 7 -> shouldSend = false',
    evalCadence7Plus3.shouldSend,
    false
  );

  const evalCadence7Plus7 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-23', // +7 días vencida con cadencia 7
    cadenceDays: 7,
  });
  assertTest(
    'DOD-CADENCE-07',
    'Vencida hace 7 días (+7) con cadencia 7 -> shouldSend = true, reminderType = overdue',
    {
      shouldSend: evalCadence7Plus7.shouldSend,
      reminderType: evalCadence7Plus7.reminderType,
      daysDifference: 7,
    },
    {
      shouldSend: true,
      reminderType: 'overdue',
      daysDifference: 7,
    }
  );

  console.log('\n>>> 5. Protección de Idempotencia Diaria (Sin duplicación de emails)');

  // Caso: Aviso de -3 días ya enviado hoy
  const evalIdempotentMinus3 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-13',
    cadenceDays: 3,
    lastReminderSentDate: '2026-10-13',
    lastReminderType: 'upcoming_3_days',
  });
  assertTest(
    'DOD-IDEMPOTENCY-01',
    'Aviso -3 días ya despachado en el día -> shouldSend = false (evita spam al cliente)',
    evalIdempotentMinus3.shouldSend,
    false
  );

  // Caso: Aviso Día 0 ya enviado hoy
  const evalIdempotentDay0 = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-16',
    cadenceDays: 3,
    lastReminderSentDate: '2026-10-16',
    lastReminderType: 'due_today',
  });
  assertTest(
    'DOD-IDEMPOTENCY-02',
    'Aviso Día 0 ya despachado en el día -> shouldSend = false',
    evalIdempotentDay0.shouldSend,
    false
  );

  // Caso: Aviso Vencida ya enviado hoy
  const evalIdempotentOverdue = evaluateInvoiceReminderStatus({
    invoiceDate: '2026-10-01',
    paymentDueDays: 15,
    targetDate: '2026-10-19',
    cadenceDays: 3,
    lastReminderSentDate: '2026-10-19',
    lastReminderType: 'overdue',
  });
  assertTest(
    'DOD-IDEMPOTENCY-03',
    'Aviso vencida (+3) ya despachado en el día -> shouldSend = false',
    evalIdempotentOverdue.shouldSend,
    false
  );

  console.log('\n>>> 6. Integración con Plantillas Brevo EmailBuilder');

  const emailUpcoming = createInvoiceReminderEmail({
    clientName: 'DELTA DOCK SA',
    clientEmail: 'administracion@deltadock.com.ar',
    invoiceNumber: 'FC-A-0001-00000042',
    invoicedAmount: 5466694.70,
    dueDate: '16/10/2026',
    daysRemainingOrOverdue: -3,
  });
  const builtUpcoming = emailUpcoming.build();

  assertTest(
    'DOD-BREVO-01',
    'Plantilla Brevo para -3 días incluye preheader y asunto de recordatorio próximo',
    builtUpcoming.subject.includes('Recordatorio de Pago'),
    true
  );

  const emailDay0 = createInvoiceReminderEmail({
    clientName: 'DELTA DOCK SA',
    clientEmail: 'administracion@deltadock.com.ar',
    invoiceNumber: 'FC-A-0001-00000042',
    invoicedAmount: 5466694.70,
    dueDate: '16/10/2026',
    daysRemainingOrOverdue: 0,
  });
  const builtDay0 = emailDay0.build();

  assertTest(
    'DOD-BREVO-02',
    'Plantilla Brevo para Día 0 incluye Vencimiento Hoy en asunto y HTML',
    builtDay0.subject.includes('Factura con Vencimiento Hoy') && builtDay0.htmlContent.includes('VENCE HOY'),
    true
  );

  const emailOverdue = createInvoiceReminderEmail({
    clientName: 'DELTA DOCK SA',
    clientEmail: 'administracion@deltadock.com.ar',
    invoiceNumber: 'FC-A-0001-00000042',
    invoicedAmount: 5466694.70,
    dueDate: '16/10/2026',
    daysRemainingOrOverdue: 6,
  });
  const builtOverdue = emailOverdue.build();

  assertTest(
    'DOD-BREVO-03',
    'Plantilla Brevo para Factura Vencida incluye badge FACTURA VENCIDA (+6 DÍAS)',
    builtOverdue.subject.includes('Factura Vencida') && builtOverdue.htmlContent.includes('FACTURA VENCIDA (+6 DÍAS)'),
    true
  );

  console.log('\n>>> 7. Configuración de Cron Job Diaria (Vercel & Supabase)');

  // Verificación de vercel.json
  const vercelJsonPath = path.resolve(process.cwd(), 'vercel.json');
  const vercelExists = fs.existsSync(vercelJsonPath);
  assertTest('DOD-CONFIG-01', 'vercel.json existe en la raíz del repositorio', vercelExists, true);

  if (vercelExists) {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
    const cronEntry = vercelConfig.crons?.find((c: any) => c.path === '/api/cron/check-due-invoices');
    assertTest(
      'DOD-CONFIG-02',
      'vercel.json contiene cron para /api/cron/check-due-invoices con horario 03:00 UTC (00:00 hs ART)',
      cronEntry ? { path: cronEntry.path, schedule: cronEntry.schedule } : null,
      { path: '/api/cron/check-due-invoices', schedule: '0 3 * * *' }
    );
  }

  // Verificación de Supabase Edge Function
  const edgeFunctionPath = path.resolve(process.cwd(), 'supabase/functions/check-due-invoices/index.ts');
  const edgeFuncExists = fs.existsSync(edgeFunctionPath);
  assertTest('DOD-CONFIG-03', 'supabase/functions/check-due-invoices/index.ts existe para despliegue en Supabase', edgeFuncExists, true);

  // Resumen
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;

  console.log('\n=====================================================================');
  console.log(`TOTAL CRITERIOS DE ACEPTACIÓN VERIFICADOS: ${results.length}`);
  console.log(`\x1b[32mPASADOS: ${totalPassed}\x1b[0m | \x1b[31mFALLADOS: ${totalFailed}\x1b[0m`);
  console.log('=====================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runInvoiceRemindersTests();

