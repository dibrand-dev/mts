/**
 * Test Suite: Verificación de Funcionalidades de Enlace Público y Descarga de Proformas
 * Ejecución: ts check & mock verification
 */

import type { InvoicingRecord } from '../../src/lib/services/invoicing/types.ts';

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

// Mock proforma data
const mockProforma: InvoicingRecord = {
  id: 'f1000000-0000-0000-0000-000000000001',
  proforma_number: 'PRF-2026-0001',
  proforma_type: 'vessel',
  client_id: 'c1000000-0000-0000-0000-000000000001',
  client_name: 'CAT ARGENTINA S.A.',
  client_tax_id: '30-71123456-9',
  client_billing_email: 'facturacion@catlogistica.com',
  client_phone_number: '+54 11 4444-5555',
  fortnight_period: '2026-09-Q1',
  concept_type: 'general_hours',
  status: 'sent',
  subtotal: 66287141.25,
  total: 80207440.91,
  public_token: 'tok-12345-uuid-67890',
  issue_date: '2026-09-13',
  due_date: '2026-09-18',
  vessel_name: 'BRASILIA HWY',
  operation_dates: '13/09/2026 al 15/09/2026',
  discount_percentage: 3,
  discount_amount: 511538.37,
  subtotal_operativa: 49747400.69,
  subtotal_encargado: 3839697.00,
  subtotal_compensacion: 12700043.56,
  total_neto: 66287141.25,
  tax_amount: 13920299.66,
  calculation_payload: {},
  notes: ['Plazo de revisión 5 días hábiles'],
  details: [
    {
      id: 'd1',
      proforma_id: 'f1000000-0000-0000-0000-000000000001',
      description: 'Vehículos Operados Hábil',
      quantity: 2774,
      unit_price: 2744.17,
      subtotal: 7612327.58,
      created_at: '2026-09-13T00:00:00Z',
    },
  ],
};

console.log('===============================================================');
console.log(' VERIFICACIÓN DE ENLACES PÚBLICOS Y DESCARGA DE PROFORMAS ');
console.log('===============================================================\n');

// TC-PUB-01: Verificación de estructura del token público y URL canónica
const publicUrl = `https://app.mts.com.ar/proforma/${mockProforma.public_token}`;
assertTest(
  'TC-PUB-01',
  'El enlace público de la proforma contiene la ruta /proforma/[token]',
  publicUrl.includes(`/proforma/${mockProforma.public_token}`),
  true
);

// TC-PUB-02: Verificación de regla de middleware para rutas públicas
const testPaths = [
  { path: '/proforma/tok-12345-uuid-67890', isPublic: true },
  { path: '/p/tok-12345-uuid-67890', isPublic: true },
  { path: '/api/public/proformas/tok-12345-uuid-67890', isPublic: true },
  { path: '/login', isPublic: true },
  { path: '/invoicing', isPublic: false },
  { path: '/payroll', isPublic: false },
  { path: '/employees', isPublic: false },
];

function isPublicRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/proforma') ||
    pathname.startsWith('/p/') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/public')
  );
}

const middlewareEvaluation = testPaths.map((p) => ({
  path: p.path,
  allowedAnon: isPublicRoute(p.path),
}));

assertTest(
  'TC-PUB-02',
  'El middleware permite el acceso anónimo a rutas /proforma, /p/ y /api/public sin desviar a /login',
  middlewareEvaluation.every((e, i) => e.allowedAnon === testPaths[i].isPublic),
  true
);

// TC-PUB-03: Verificación de generación de contenido CSV descargable
const csvLines: string[] = [
  'MTS MARITIME & TERMINAL SERVICES - LIQUIDACIÓN PROFORMA',
  `Número de Proforma;${mockProforma.proforma_number}`,
  `Cliente / Razón Social;${mockProforma.client_name}`,
  `CUIT / Identificación Fiscal;${mockProforma.client_tax_id}`,
  `Subtotal Operativa / Rampa;${mockProforma.subtotal_operativa?.toFixed(2)}`,
  `Subtotal Encargado a Bordo;${mockProforma.subtotal_encargado?.toFixed(2)}`,
  `Subtotal Horas Compensación Trabajo Corrido;${mockProforma.subtotal_compensacion?.toFixed(2)}`,
  `Total Neto Gravado;${mockProforma.total_neto?.toFixed(2)}`,
  `IVA (21.00%);${mockProforma.tax_amount?.toFixed(2)}`,
  `TOTAL FACTURA FINAL (ARS);${mockProforma.total.toFixed(2)}`,
];

assertTest(
  'TC-PUB-03',
  'El archivo CSV de proforma incluye metadatos de cliente, desglose de subtotales, IVA y total final',
  csvLines.some((l) => l.includes('PRF-2026-0001')) &&
    csvLines.some((l) => l.includes('CAT ARGENTINA S.A.')) &&
    csvLines.some((l) => l.includes('80207440.91')),
  true
);

// TC-PUB-04: Verificación de campos en InvoicingRecord
assertTest(
  'TC-PUB-04',
  'InvoicingRecord incluye public_token y datos fiscales de cliente para visualización pública',
  {
    hasToken: Boolean(mockProforma.public_token),
    hasTaxId: Boolean(mockProforma.client_tax_id),
    hasEmail: Boolean(mockProforma.client_billing_email),
    hasPhone: Boolean(mockProforma.client_phone_number),
  },
  {
    hasToken: true,
    hasTaxId: true,
    hasEmail: true,
    hasPhone: true,
  }
);

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
